import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@repo/db';

interface DailyUsage {
  date: string;
  cost: number;
  tokens: number;
  requests: number;
}

/**
 * Calculate projected spend using smoothed formula:
 * projected = alpha * (last_7_day_avg * days_in_month) + (1-alpha) * linear_projection
 * where alpha ≈ 0.6
 */
function calculateProjectedSpend(dailyUsage: DailyUsage[], daysInMonth: number): {
  projectedSpend: number;
  dailyAverage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
} {
  if (dailyUsage.length === 0) {
    return { projectedSpend: 0, dailyAverage: 0, trend: 'stable', confidence: 0 };
  }

  const alpha = 0.6;
  const sortedUsage = dailyUsage.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Calculate 7-day average (or available days if less than 7)
  const last7Days = sortedUsage.slice(-7);
  const last7DayAvg = last7Days.reduce((sum, day) => sum + day.cost, 0) / last7Days.length;
  
  // Calculate linear projection based on trend
  let linearProjection = 0;
  if (sortedUsage.length >= 3) {
    const recentDays = sortedUsage.slice(-5); // Use last 5 days for trend
    const x = recentDays.map((_, i) => i);
    const y = recentDays.map(day => day.cost);
    
    // Simple linear regression
    const n = recentDays.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Project to end of month
    const currentDay = new Date().getDate();
    const avgDailyFromTrend = intercept + slope * (daysInMonth / 2); // Mid-month estimate
    linearProjection = avgDailyFromTrend * daysInMonth;
  } else {
    linearProjection = last7DayAvg * daysInMonth;
  }
  
  // Apply smoothing formula
  const projectedSpend = alpha * (last7DayAvg * daysInMonth) + (1 - alpha) * linearProjection;
  
  // Determine trend
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (sortedUsage.length >= 3) {
    const first3Avg = sortedUsage.slice(0, 3).reduce((sum, day) => sum + day.cost, 0) / 3;
    const last3Avg = sortedUsage.slice(-3).reduce((sum, day) => sum + day.cost, 0) / 3;
    
    if (last3Avg > first3Avg * 1.1) trend = 'increasing';
    else if (last3Avg < first3Avg * 0.9) trend = 'decreasing';
  }
  
  // Calculate confidence based on data consistency
  const variance = last7Days.reduce((sum, day) => sum + Math.pow(day.cost - last7DayAvg, 2), 0) / last7Days.length;
  const stdDev = Math.sqrt(variance);
  const confidence = Math.max(0, Math.min(1, 1 - (stdDev / (last7DayAvg + 0.01))));
  
  return {
    projectedSpend: Math.max(0, projectedSpend),
    dailyAverage: last7DayAvg,
    trend,
    confidence,
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const apiKeyId = searchParams.get('apiKeyId');
    const period = searchParams.get('period') || 'monthly';

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    let daysInPeriod: number;

    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        daysInPeriod = 1;
        break;
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        daysInPeriod = 7;
        break;
      case 'monthly':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        daysInPeriod = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        break;
    }

    // Build query conditions
    const whereClause: any = {
      apiKey: { userId: user.id },
      createdAt: { gte: startDate },
    };

    if (apiKeyId) {
      whereClause.apiKeyId = apiKeyId;
    }

    // Get usage data grouped by date
    const usageData = await prisma.usage.groupBy({
      by: ['date'],
      where: whereClause,
      _sum: {
        cost: true,
        totalTokens: true,
        requests: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Transform to daily usage format
    const dailyUsage: DailyUsage[] = usageData.map(item => ({
      date: item.date.toISOString().split('T')[0],
      cost: item._sum.cost || 0,
      tokens: item._sum.totalTokens || 0,
      requests: item._sum.requests || 0,
    }));

    // Calculate projections
    const projections = calculateProjectedSpend(dailyUsage, daysInPeriod);

    // Get current period totals
    const currentTotals = await prisma.usage.aggregate({
      where: whereClause,
      _sum: {
        cost: true,
        totalTokens: true,
        requests: true,
      },
    });

    // Calculate burn rate (cost per day)
    const daysSinceStart = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const currentBurnRate = (currentTotals._sum.cost || 0) / daysSinceStart;

    // Get provider breakdown
    const providerBreakdown = await prisma.usage.groupBy({
      by: ['provider', 'modelUsed'],
      where: whereClause,
      _sum: {
        cost: true,
        totalTokens: true,
        requests: true,
      },
      orderBy: {
        _sum: {
          cost: 'desc',
        },
      },
    });

    // Get most expensive endpoints
    const expensiveEndpoints = await prisma.usage.groupBy({
      by: ['endpoint', 'modelUsed'],
      where: whereClause,
      _sum: {
        cost: true,
        requests: true,
      },
      orderBy: {
        _sum: {
          cost: 'desc',
        },
      },
      take: 10,
    });

    return NextResponse.json({
      period: {
        type: period,
        start: startDate.toISOString(),
        end: now.toISOString(),
        daysInPeriod,
        daysSinceStart,
      },
      current: {
        totalCost: currentTotals._sum.cost || 0,
        totalTokens: currentTotals._sum.totalTokens || 0,
        totalRequests: currentTotals._sum.requests || 0,
        burnRate: currentBurnRate,
      },
      projections: {
        projectedSpend: projections.projectedSpend,
        dailyAverage: projections.dailyAverage,
        trend: projections.trend,
        confidence: projections.confidence,
        daysRemaining: Math.max(0, daysInPeriod - daysSinceStart),
      },
      dailyUsage,
      breakdown: {
        byProvider: providerBreakdown.map(item => ({
          provider: item.provider,
          model: item.modelUsed,
          cost: item._sum.cost || 0,
          tokens: item._sum.totalTokens || 0,
          requests: item._sum.requests || 0,
        })),
        byEndpoint: expensiveEndpoints.map(item => ({
          endpoint: item.endpoint,
          model: item.modelUsed,
          cost: item._sum.cost || 0,
          requests: item._sum.requests || 0,
        })),
      },
    });

  } catch (error) {
    console.error('Error fetching analytics projections:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
