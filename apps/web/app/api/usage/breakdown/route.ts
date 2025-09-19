import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@repo/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';
    
    // Calculate date range
    let startDate = new Date();
    switch (timeRange) {
      case '1d':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get usage logs for the time range
    const logs = await prisma.apiProxyLog.findMany({
      where: {
        project: {
          organization: {
            members: {
              some: {
                userId: user.id
              }
            }
          }
        },
        createdAt: {
          gte: startDate
        }
      },
      include: {
        project: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Group by date for time series
    const dailyBreakdown = logs.reduce((acc, log) => {
      const date = log.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          cost: 0,
          tokens: 0,
          requests: 0
        };
      }
      acc[date].cost += log.cost || 0;
      acc[date].tokens += log.tokensUsed || 0;
      acc[date].requests += 1;
      return acc;
    }, {} as Record<string, any>);

    // Group by project
    const projectBreakdown = logs.reduce((acc, log) => {
      const projectName = log.project.name;
      if (!acc[projectName]) {
        acc[projectName] = {
          project: projectName,
          cost: 0,
          tokens: 0,
          requests: 0
        };
      }
      acc[projectName].cost += log.cost || 0;
      acc[projectName].tokens += log.tokensUsed || 0;
      acc[projectName].requests += 1;
      return acc;
    }, {} as Record<string, any>);

    // Group by model/endpoint
    const modelBreakdown = logs.reduce((acc, log) => {
      const model = log.model || 'unknown';
      if (!acc[model]) {
        acc[model] = {
          model,
          cost: 0,
          tokens: 0,
          requests: 0
        };
      }
      acc[model].cost += log.cost || 0;
      acc[model].tokens += log.tokensUsed || 0;
      acc[model].requests += 1;
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      timeRange,
      totalLogs: logs.length,
      dailyBreakdown: Object.values(dailyBreakdown),
      projectBreakdown: Object.values(projectBreakdown),
      modelBreakdown: Object.values(modelBreakdown),
      summary: {
        totalCost: logs.reduce((sum, log) => sum + (log.cost || 0), 0),
        totalTokens: logs.reduce((sum, log) => sum + (log.tokensUsed || 0), 0),
        totalRequests: logs.length
      }
    });

  } catch (error) {
    console.error('Usage breakdown error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
