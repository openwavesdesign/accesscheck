import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const PLANS = {
  starter: {
    name: 'Starter',
    priceId: process.env.STRIPE_STARTER_PRICE_ID!,
    price: 19,
    scansPerMonth: 5,
    maxPages: 50,
  },
  pro: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    price: 49,
    scansPerMonth: null, // unlimited
    maxPages: 50,
  },
} as const;

export type PlanId = keyof typeof PLANS;

export async function createCheckoutSession(
  clerkUserId: string,
  planId: PlanId,
  returnUrl: string
): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: PLANS[planId].priceId, quantity: 1 }],
    success_url: `${returnUrl}/dashboard?upgraded=1`,
    cancel_url: `${returnUrl}/dashboard/settings`,
    metadata: { clerkUserId, planId },
  });
  return session.url!;
}

export async function createPortalSession(
  stripeCustomerId: string,
  returnUrl: string
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${returnUrl}/dashboard/settings`,
  });
  return session.url;
}
