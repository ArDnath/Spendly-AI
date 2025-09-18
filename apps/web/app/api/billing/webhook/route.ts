import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { prisma } from '@repo/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Store processed events to prevent duplicate processing
const processedEvents = new Set<string>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const sig = headersList.get('stripe-signature');

    if (!sig) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Prevent duplicate processing
    if (processedEvents.has(event.id)) {
      console.log(`Event ${event.id} already processed, skipping`);
      return NextResponse.json({ received: true });
    }

    console.log(`Processing Stripe event: ${event.type} (${event.id})`);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark event as processed
    processedEvents.add(event.id);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    if (!session.customer || !session.client_reference_id) {
      console.error('Missing customer or client_reference_id in checkout session');
      return;
    }

    const userId = session.client_reference_id;
    const customerId = session.customer as string;

    // Update user with Stripe customer ID
    await prisma.user.update({
      where: { id: userId },
      data: {
        stripeCustomerId: customerId,
      },
    });

    console.log(`Updated user ${userId} with Stripe customer ID ${customerId}`);
  } catch (error) {
    console.error('Error handling checkout completed:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    
    // Find user by Stripe customer ID
    const user = await prisma.user.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      console.error(`User not found for Stripe customer ${customerId}`);
      return;
    }

    // Determine subscription plan based on price ID
    let subscriptionPlan = 'Free';
    const priceId = subscription.items.data[0]?.price.id;
    
    switch (priceId) {
      case process.env.STRIPE_PRO_PRICE_ID:
        subscriptionPlan = 'Pro';
        break;
      case process.env.STRIPE_TEAM_PRICE_ID:
        subscriptionPlan = 'Team';
        break;
      case process.env.STRIPE_ADVANCED_PRICE_ID:
        subscriptionPlan = 'Advanced';
        break;
    }

    // Update user subscription
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionPlan,
        subscriptionEnd: new Date((subscription as any).current_period_end * 1000),
        stripeSubscriptionId: subscription.id,
      },
    });

    console.log(`Updated user ${user.id} subscription to ${subscriptionPlan}`);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    
    const user = await prisma.user.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      console.error(`User not found for Stripe customer ${customerId}`);
      return;
    }

    // Downgrade to free plan
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionPlan: 'Free',
        subscriptionEnd: new Date(),
        stripeSubscriptionId: null,
      },
    });

    console.log(`Downgraded user ${user.id} to Free plan`);
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const customerId = invoice.customer as string;
    
    const user = await prisma.user.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      console.error(`User not found for Stripe customer ${customerId}`);
      return;
    }

    // Create billing record
    const invoiceDate = new Date(invoice.created * 1000);
    const amount = invoice.amount_paid / 100; // Convert from cents

    await prisma.billingRecord.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: invoiceDate,
        },
      },
      update: {
        totalCost: amount,
        stripeInvoiceId: invoice.id,
        reconciled: true,
      },
      create: {
        userId: user.id,
        date: invoiceDate,
        totalCost: amount,
        stripeInvoiceId: invoice.id,
        reconciled: true,
      },
    });

    console.log(`Created billing record for user ${user.id}, amount: $${amount}`);
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const customerId = invoice.customer as string;
    
    const user = await prisma.user.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      console.error(`User not found for Stripe customer ${customerId}`);
      return;
    }

    // TODO: Implement payment failure handling
    // - Send notification to user
    // - Potentially suspend service after grace period
    // - Log the failure for admin review

    console.log(`Payment failed for user ${user.id}, invoice: ${invoice.id}`);
  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
  }
}
