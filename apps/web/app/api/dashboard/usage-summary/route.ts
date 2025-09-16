import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse } from '../../../../lib/auth-middleware';
import { createErrorResponse, createSuccessResponse } from '../../../../lib/validation';
import { prisma } from '@repo/db';

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const auth = await authenticateRequest(request);
    if (!auth) {
      return createAuthResponse(401, 'Unauthorized');
    }

    // Find user first to get the actual user ID
    const user = await prisma.user.findUnique({
      where: { email: auth.userEmail }
    });

    if (!user) {
      return createErrorResponse(404, 'User not found');
    }

    // Get current month's start and end dates
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Aggregate current month usage using new fields
    const usageSummary = await prisma.usage.aggregate({
      where: {
        apiKey: { userId: user.id },
        createdAt: { gte: currentMonthStart, lte: currentMonthEnd }
      },
      _sum: { tokens: true, cost: true, requests: true },
      _count: { id: true }
    });

    // Get the most expensive endpoint for the current month
    const mostExpensiveUsage = await prisma.usage.findFirst({
      where: {
        apiKey: { userId: user.id },
        createdAt: { gte: currentMonthStart, lte: currentMonthEnd }
      },
      orderBy: { cost: 'desc' },
      select: { endpoint: true, cost: true }
    });

    // Get usage data for the last 7 days for trend analysis
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentUsage = await prisma.usage.groupBy({
      by: ['createdAt'],
      where: { apiKey: { userId: user.id }, createdAt: { gte: sevenDaysAgo } },
      _sum: { cost: true, tokens: true },
      orderBy: { createdAt: 'asc' }
    });

    return createSuccessResponse({
      currentMonth: {
        totalCost: usageSummary._sum.cost || 0,
        totalTokens: usageSummary._sum.tokens || 0,
        totalRequests: usageSummary._sum.requests || 0,
        mostExpensiveEndpoint: mostExpensiveUsage?.endpoint || null,
        highestSingleCost: mostExpensiveUsage?.cost || 0
      },
      recentTrend: recentUsage.map((usage: any) => ({
        date: usage.createdAt,
        cost: usage._sum.cost || 0,
        tokens: usage._sum.tokens || 0
      })),
      period: {
        start: currentMonthStart,
        end: currentMonthEnd
      }
    });

  } catch (error) {
    console.error('Error fetching usage summary:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}
