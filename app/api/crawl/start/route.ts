import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, scans } from '@/lib/db';
import { inngest } from '@/lib/inngest/client';
import { checkScanLimit } from '@/lib/subscription';

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { url } = await req.json();
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'url is required' }, { status: 400 });
  }

  // Validate URL
  let baseUrl: string;
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
    baseUrl = parsed.toString();
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  // Check plan limits
  const limit = await checkScanLimit(userId);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: 'scan_limit_reached',
        used: limit.used,
        limit: limit.limit,
      },
      { status: 403 }
    );
  }

  // Create scan record
  const [scan] = await db
    .insert(scans)
    .values({ clerkUserId: userId, baseUrl, status: 'pending' })
    .returning();

  // Kick off Inngest crawl
  await inngest.send({ name: 'crawl/start', data: { scanId: scan.id, baseUrl } });

  return NextResponse.json({ scanId: scan.id });
}
