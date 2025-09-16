import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse } from '../../../../lib/auth-middleware';
import { createErrorResponse, createSuccessResponse } from '../../../../lib/validation';
import { prisma } from '../../../../lib/prisma';

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
    const whereClause: any = {
      userId: user.id,
      createdAt: {
        gte: startDate
      }
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
        tokens: true,
        requests: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Get provider breakdown
    const providerBreakdown = await prisma.usage.groupBy({
      by: ['provider'],
      where: whereClause,
      _sum: {
        cost: true,
        tokens: true,
        requests: true
      },
      orderBy: {
        _sum: {
          cost: 'desc'
        }
      }
    });

    // Get endpoint breakdown
    const endpointBreakdown = await prisma.usage.groupBy({
      by: ['endpoint'],
      where: whereClause,
      _sum: {
        cost: true,
        tokens: true,
        requests: true
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
      _sum: {
        cost: true,
        tokens: true,
        requests: true
      }
    });

    // Calculate trends (compare with previous period)
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - periodDays);
    
    const previousTotals = await prisma.usage.aggregate({
      where: {
        ...whereClause,
        createdAt: {
          gte: previousPeriodStart,
          lt: startDate
        }
      },
      _sum: {
        cost: true,
        tokens: true,
        requests: true
      }
    });

    const currentCost = totals._sum.cost || 0;
    const previousCost = previousTotals._sum.cost || 0;
    const costTrend = previousCost > 0 ? ((currentCost - previousCost) / previousCost) * 100 : 0;

    const currentTokens = totals._sum.tokens || 0;
    const previousTokens = previousTotals._sum.tokens || 0;
    const tokenTrend = previousTokens > 0 ? ((currentTokens - previousTokens) / previousTokens) * 100 : 0;

    const currentRequests = totals._sum.requests || 0;
    const previousRequests = previousTotals._sum.requests || 0;
    const requestTrend = previousRequests > 0 ? ((currentRequests - previousRequests) / previousRequests) * 100 : 0;

    // Format daily usage data for charts
    const formattedDailyUsage = dailyUsage.map((day: any) => ({
      date: day.createdAt.toISOString().split('T')[0],
      cost: Number(day._sum.cost || 0),
      tokens: Number(day._sum.tokens || 0),
      requests: Number(day._sum.requests || 0)
    }));

    // Format provider breakdown
    const formattedProviderBreakdown = providerBreakdown.map((provider: any) => ({
      provider: provider.provider,
      cost: Number(provider._sum.cost || 0),
      tokens: Number(provider._sum.tokens || 0),
      requests: Number(provider._sum.requests || 0),
      percentage: currentCost > 0 ? ((Number(provider._sum.cost || 0) / currentCost) * 100) : 0
    }));

    // Format endpoint breakdown
    const formattedEndpointBreakdown = endpointBreakdown.map((endpoint: any) => ({
      endpoint: endpoint.endpoint,
      cost: Number(endpoint._sum.cost || 0),
      tokens: Number(endpoint._sum.tokens || 0),
      requests: Number(endpoint._sum.requests || 0)
    }));

    const analyticsData = {
      period: periodDays,
      totals: {
        cost: currentCost,
        tokens: currentTokens,
        requests: currentRequests,
        averageCostPerRequest: currentRequests > 0 ? currentCost / currentRequests : 0
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
