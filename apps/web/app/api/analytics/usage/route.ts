import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse } from '../../../../lib/auth-middleware';
import { createErrorResponse, createSuccessResponse } from '../../../../lib/validation';
import { prisma } from '@repo/db';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return createAuthResponse(401, 'Unauthorized');
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const apiKeyId = searchParams.get('apiKeyId'); // optional filter by API key

    const user = await prisma.user.findUnique({
      where: { email: auth.userEmail }
    });

    if (!user) {
      return createErrorResponse(404, 'User not found');
    }

    const periodDays = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Build where clause for filtering
    // Filter usages via ApiKey relation (since Usage belongs to ApiKey)
    const whereClause: any = {
      apiKey: { userId: user.id },
      createdAt: { gte: startDate }
    };

    if (apiKeyId) {
      whereClause.apiKeyId = apiKeyId;
    }

    // Get usage data grouped by date
    const dailyUsage = await prisma.usage.groupBy({
      by: ['createdAt'],
      where: whereClause,
      _sum: {
        cost: true,
        totalTokens: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Get provider breakdown via ApiKey relation
    const providerBreakdown = await prisma.apiKey.findMany({
      where: {
        userId: user.id,
        usageRecords: {
          some: {
            createdAt: { gte: startDate }
          }
        }
      },
      include: {
        usageRecords: {
          where: {
            createdAt: { gte: startDate }
          },
          select: {
            cost: true,
            totalTokens: true
          }
        }
      }
    });

    // Get endpoint breakdown
    const endpointBreakdown = await prisma.usage.groupBy({
      by: ['mostExpensiveEndpoint'],
      where: whereClause,
      _sum: {
        cost: true,
        totalTokens: true
      },
      orderBy: {
        _sum: {
          cost: 'desc'
        }
      },
      take: 10 // Top 10 endpoints
    });

    // Calculate totals
    const totals = await prisma.usage.aggregate({
      where: whereClause,
      _sum: { cost: true, totalTokens: true }
    });

    // Calculate trends (compare with previous period)
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - periodDays);
    
    const previousTotals = await prisma.usage.aggregate({
      where: {
        apiKey: { userId: user.id },
        createdAt: { gte: previousPeriodStart, lt: startDate },
        ...(apiKeyId ? { apiKeyId } : {})
      },
      _sum: { cost: true, totalTokens: true }
    });

    const currentCost = totals._sum.cost || 0;
    const previousCost = previousTotals._sum.cost || 0;
    const costTrend = previousCost > 0 ? ((currentCost - previousCost) / previousCost) * 100 : 0;

    const currentTokens = totals._sum.totalTokens || 0;
    const previousTokens = previousTotals._sum.totalTokens || 0;
    const tokenTrend = previousTokens > 0 ? ((currentTokens - previousTokens) / previousTokens) * 100 : 0;

    // Since we don't have a requests field, we'll use count of records
    const currentRequestsCount = await prisma.usage.count({ where: whereClause });
    const previousRequestsCount = await prisma.usage.count({
      where: {
        apiKey: { userId: user.id },
        createdAt: { gte: previousPeriodStart, lt: startDate },
        ...(apiKeyId ? { apiKeyId } : {})
      }
    });
    const requestTrend = previousRequestsCount > 0 ? ((currentRequestsCount - previousRequestsCount) / previousRequestsCount) * 100 : 0;

    // Format daily usage data for charts
    const formattedDailyUsage = dailyUsage.map((day: any) => ({
      date: day.createdAt.toISOString().split('T')[0],
      cost: Number(day._sum.cost || 0),
      tokens: Number(day._sum.totalTokens || 0),
      requests: 1 // Each record represents one request
    }));

    // Format provider breakdown
    const providerSummary = new Map();
    providerBreakdown.forEach((apiKey: any) => {
      const provider = apiKey.provider;
      const totalCost = apiKey.usageRecords.reduce((sum: number, usage: any) => sum + (usage.cost || 0), 0);
      const totalTokens = apiKey.usageRecords.reduce((sum: number, usage: any) => sum + (usage.totalTokens || 0), 0);
      const requests = apiKey.usageRecords.length;
      
      if (providerSummary.has(provider)) {
        const existing = providerSummary.get(provider);
        providerSummary.set(provider, {
          provider,
          cost: existing.cost + totalCost,
          tokens: existing.tokens + totalTokens,
          requests: existing.requests + requests
        });
      } else {
        providerSummary.set(provider, {
          provider,
          cost: totalCost,
          tokens: totalTokens,
          requests
        });
      }
    });
    
    const formattedProviderBreakdown = Array.from(providerSummary.values()).map((provider: any) => ({
      ...provider,
      percentage: currentCost > 0 ? ((provider.cost / currentCost) * 100) : 0
    }));

    // Format endpoint breakdown
    const formattedEndpointBreakdown = endpointBreakdown.map((endpoint: any) => ({
      endpoint: endpoint.mostExpensiveEndpoint,
      cost: Number(endpoint._sum.cost || 0),
      tokens: Number(endpoint._sum.totalTokens || 0),
      requests: 1 // Each record represents one request
    }));

    const analyticsData = {
      period: periodDays,
      totals: {
        cost: currentCost,
        tokens: currentTokens,
        requests: currentRequestsCount,
        averageCostPerRequest: currentRequestsCount > 0 ? currentCost / currentRequestsCount : 0
      },
      trends: {
        costTrend: Math.round(costTrend * 100) / 100,
        tokenTrend: Math.round(tokenTrend * 100) / 100,
        requestTrend: Math.round(requestTrend * 100) / 100
      },
      dailyUsage: formattedDailyUsage,
      providerBreakdown: formattedProviderBreakdown,
      endpointBreakdown: formattedEndpointBreakdown
    };

    return createSuccessResponse(analyticsData);
  } catch (error) {
    console.error('Error fetching usage analytics:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}
