import { auth } from '@clerk/nextjs/server';
import { db, scans, scanPages } from '@/lib/db';
import { and, eq, asc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import ScanDetail from './ScanDetail';

export default async function ScanPage({ params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) return null;

  const [scan] = await db
    .select()
    .from(scans)
    .where(and(eq(scans.id, params.id), eq(scans.clerkUserId, userId)))
    .limit(1);

  if (!scan) notFound();

  const pages = await db
    .select()
    .from(scanPages)
    .where(eq(scanPages.scanId, scan.id))
    .orderBy(asc(scanPages.crawledAt));

  return <ScanDetail scan={scan} initialPages={pages} />;
}
