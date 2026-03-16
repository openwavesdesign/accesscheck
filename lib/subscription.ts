import { db } from './db';
import { subscriptions, scans } from './db/schema';
import { eq, and, gte, count } from 'drizzle-orm';
import { PLANS, type PlanId } from './stripe';

export type UserPlan = 'free' | PlanId;

export async function getUserPlan(clerkUserId: string): Promise<UserPlan> {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.clerkUserId, clerkUserId))
    .limit(1);

  if (!sub || sub.status !== 'active' || !sub.planId) return 'free';
  return sub.planId as PlanId;
}

export async function getUserSubscription(clerkUserId: string) {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.clerkUserId, clerkUserId))
    .limit(1);
  return sub ?? null;
}

/** Returns { allowed: boolean, used: number, limit: number | null } */
export async function checkScanLimit(clerkUserId: string) {
  const plan = await getUserPlan(clerkUserId);

  if (plan === 'free') return { allowed: false, used: 0, limit: 0 };

  const planConfig = PLANS[plan];
  if (!planConfig.scansPerMonth) return { allowed: true, used: 0, limit: null };

  // Count scans in the current calendar month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [{ value }] = await db
    .select({ value: count() })
    .from(scans)
    .where(
      and(
        eq(scans.clerkUserId, clerkUserId),
        gte(scans.createdAt, startOfMonth)
      )
    );

  const used = Number(value);
  return {
    allowed: used < planConfig.scansPerMonth,
    used,
    limit: planConfig.scansPerMonth,
  };
}
