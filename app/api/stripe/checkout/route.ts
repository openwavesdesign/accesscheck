import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createCheckoutSession, type PlanId } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { planId } = await req.json();
  if (!planId) {
    return NextResponse.json({ error: 'planId is required' }, { status: 400 });
  }

  const returnUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;
  const url = await createCheckoutSession(userId, planId as PlanId, returnUrl);
  return NextResponse.json({ url });
}
