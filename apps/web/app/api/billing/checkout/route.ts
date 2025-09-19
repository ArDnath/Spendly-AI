import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { z } from 'zod';

const checkoutSchema = z.object({
  planId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { planId } = checkoutSchema.parse(body);

    // Mock checkout response for now
    const mockCheckoutUrl = `https://checkout.stripe.com/pay/cs_test_${Date.now()}`;
    
    return NextResponse.json({
      checkoutUrl: mockCheckoutUrl,
      sessionId: `cs_test_${Date.now()}`,
      planId: planId,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
    }
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
