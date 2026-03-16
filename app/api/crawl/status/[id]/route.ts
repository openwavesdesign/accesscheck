import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, scans } from '@/lib/db';
import { and, eq } from 'drizzle-orm';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [scan] = await db
    .select()
    .from(scans)
    .where(and(eq(scans.id, params.id), eq(scans.clerkUserId, userId)))
    .limit(1);

  if (!scan) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({
    status: scan.status,
    pagesTotal: scan.pagesTotal,
    pagesCrawled: scan.pagesCrawled,
    overallGrade: scan.overallGrade,
  });
}
