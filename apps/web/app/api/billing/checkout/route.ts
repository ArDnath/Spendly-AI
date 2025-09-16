import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse } from '../../../../lib/auth-middleware';
import { createErrorResponse, createSuccessResponse, validateRequestBody, billingCheckoutSchema } from '../../../../lib/validation';
import { prisma } from '@repo/db';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const PLAN_PRICES = {
  Pro: {
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    amount: 1500, // $15.00 in cents
  },
  Team: {
    priceId: process.env.STRIPE_TEAM_PRICE_ID!,
    amount: 4900, // $49.00 in cents
  }
};

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const auth = await authenticateRequest(request);
    if (!auth) {
      return createAuthResponse(401, 'Unauthorized');
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = validateRequestBody(billingCheckoutSchema, body);
    
    if (!validation.success) {
      return createErrorResponse(400, validation.error);
    }

    const { plan } = validation.data;

    // Find user first to get the actual user ID
    const user = await prisma.user.findUnique({
      where: { email: auth.userEmail }
    });

    if (!user) {
      return createErrorResponse(404, 'User not found');
    }

    // Get the plan configuration
    const planConfig = PLAN_PRICES[plan];
    if (!planConfig) {
      return createErrorResponse(400, 'Invalid plan selected');
    }

    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      payment_method_types: ['card'],
      line_items: [
        {
          price: planConfig.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?success=true&plan=${plan}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/dashboard?canceled=true`,
      metadata: {
        userId: user.id,
        plan: plan,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          plan: plan,
        },
      },
    });

    return createSuccessResponse({
      checkoutUrl: session.url,
      sessionId: session.id,
      plan: plan,
      amount: planConfig.amount
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}
