import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

/**
 * GET /api/billing/subscription - Get user's subscription details
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock subscription data for now
    const subscription = {
      id: 'sub_1234567890',
      status: 'active',
      plan: {
        id: 'free',
        name: 'Free Plan',
        price: 0,
        currency: 'usd',
        interval: 'month'
      },
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      usage: {
        apiKeys: 1,
        monthlyTracking: 20,
        historyDays: 7
      },
      limits: {
        apiKeys: 1,
        monthlyTracking: 20,
        historyDays: 7
      }
    };

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
