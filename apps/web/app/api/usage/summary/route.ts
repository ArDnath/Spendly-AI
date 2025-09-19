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

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organizations: {
          include: {
            projects: {
              include: {
                apiProxyLogs: {
                  where: {
                    createdAt: {
                      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate usage summary
    let totalCost = 0;
    let totalTokens = 0;
    let totalRequests = 0;

    user.organizations.forEach(org => {
      org.projects.forEach(project => {
        project.apiProxyLogs.forEach(log => {
          totalCost += log.cost || 0;
          totalTokens += log.tokensUsed || 0;
          totalRequests += 1;
        });
      });
    });

    // Get current month data
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    const currentMonthLogs = await prisma.apiProxyLog.findMany({
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
          gte: currentMonthStart
        }
      }
    });

    const currentMonthCost = currentMonthLogs.reduce((sum, log) => sum + (log.cost || 0), 0);
    const currentMonthTokens = currentMonthLogs.reduce((sum, log) => sum + (log.tokensUsed || 0), 0);

    return NextResponse.json({
      totalCost,
      totalTokens,
      totalRequests,
      currentMonth: {
        cost: currentMonthCost,
        tokens: currentMonthTokens,
        requests: currentMonthLogs.length
      },
      period: '30 days'
    });

  } catch (error) {
    console.error('Usage summary error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
