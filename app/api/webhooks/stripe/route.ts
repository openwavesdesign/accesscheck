import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db, subscriptions } from '@/lib/db';
import { eq } from 'drizzle-orm';
import type Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  const subscription = event.data.object as Stripe.Subscription;

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const clerkUserId = subscription.metadata?.clerkUserId;
      if (!clerkUserId) break;

      const planId = subscription.items.data[0]?.price?.id === process.env.STRIPE_PRO_PRICE_ID
        ? 'pro'
        : 'starter';

      await db
        .insert(subscriptions)
        .values({
          clerkUserId,
          stripeCustomerId: subscription.customer as string,
          stripeSubscriptionId: subscription.id,
          status: subscription.status,
          planId,
          currentPeriodEnd: subscription.items.data[0]?.current_period_end
            ? new Date(subscription.items.data[0].current_period_end * 1000)
            : null,
        })
        .onConflictDoUpdate({
          target: subscriptions.clerkUserId,
          set: {
            stripeCustomerId: subscription.customer as string,
            stripeSubscriptionId: subscription.id,
            status: subscription.status,
            planId,
            currentPeriodEnd: subscription.items.data[0]?.current_period_end
            ? new Date(subscription.items.data[0].current_period_end * 1000)
            : null,
          },
        });
      break;
    }

    case 'customer.subscription.deleted': {
      await db
        .update(subscriptions)
        .set({ status: 'canceled', planId: null, currentPeriodEnd: null })
        .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
      break;
    }
  }

  return NextResponse.json({ received: true });
}
