import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createPortalSession } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { customerId } = await req.json();
  if (!customerId) {
    return NextResponse.json({ error: 'customerId is required' }, { status: 400 });
  }

  const returnUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;
  const url = await createPortalSession(customerId, returnUrl);
  return NextResponse.json({ url });
}
