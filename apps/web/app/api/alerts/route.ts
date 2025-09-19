import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

/**
 * GET /api/alerts - Get user's alert rules
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock response for now
    const alerts = [
      {
        id: '1',
        name: 'High Usage Alert',
        type: 'usage_threshold',
        threshold: 1000,
        enabled: true,
        channels: ['email']
      }
    ];

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/alerts - Create new alert rule
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Basic validation
    if (!body.name || !body.type || !body.threshold) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Mock response for now
    const newAlert = {
      id: Date.now().toString(),
      ...body,
      enabled: true,
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({ alert: newAlert }, { status: 201 });
  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
