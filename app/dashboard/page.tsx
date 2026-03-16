import { auth } from '@clerk/nextjs/server';
import { db, scans } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { getUserPlan, checkScanLimit } from '@/lib/subscription';
import Link from 'next/link';

export default async function DashboardPage() {
  const { userId } = auth();
  if (!userId) return null;

  const [plan, scanLimit, userScans] = await Promise.all([
    getUserPlan(userId),
    checkScanLimit(userId),
    db
      .select()
      .from(scans)
      .where(eq(scans.clerkUserId, userId))
      .orderBy(desc(scans.createdAt))
      .limit(50),
  ]);

  const isPaid = plan !== 'free';

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm font-sans mt-1">
            {isPaid ? `${plan.charAt(0).toUpperCase() + plan.slice(1)} plan` : 'Free plan'} ·{' '}
            {isPaid && scanLimit.limit
              ? `${scanLimit.used} of ${scanLimit.limit} scans used this month`
              : isPaid
              ? 'Unlimited scans'
              : 'Upgrade to scan your full site'}
          </p>
        </div>
        {isPaid && (
          <Link
            href="/dashboard/new"
            className="bg-brand text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-brand-dark transition-colors font-sans text-sm"
          >
            + New Scan
          </Link>
        )}
      </div>

      {/* Upgrade CTA for free users */}
      {!isPaid && (
        <div className="bg-brand/5 border border-brand/20 rounded-2xl p-6 mb-8">
          <h2 className="font-display text-xl text-slate-800 mb-2">
            Scan Your Entire Website
          </h2>
          <p className="text-slate-600 text-sm font-sans mb-4 max-w-xl">
            Free scans cover one page at a time. Upgrade to crawl up to 50 pages from your base URL,
            track your site's accessibility score over time, and get notified when scans complete.
          </p>
          <div className="flex gap-3">
            <Link
              href="/dashboard/settings?upgrade=1"
              className="bg-brand text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-brand-dark transition-colors font-sans text-sm"
            >
              View Plans
            </Link>
            <Link
              href="/"
              className="text-slate-600 font-semibold px-5 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors font-sans text-sm"
            >
              Free Single-Page Scan
            </Link>
          </div>
        </div>
      )}

      {/* Scan limit warning */}
      {isPaid && scanLimit.limit && scanLimit.used >= scanLimit.limit && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 mb-6 font-sans text-sm">
          You've used all {scanLimit.limit} scans for this month.{' '}
          <Link href="/dashboard/settings" className="font-semibold underline">
            Upgrade to Pro
          </Link>{' '}
          for unlimited scans.
        </div>
      )}

      {/* Scan list */}
      {userScans.length === 0 ? (
        <div className="text-center py-20 text-slate-400 font-sans">
          <div className="text-4xl mb-3">🔍</div>
          <p className="font-semibold text-slate-600">No scans yet</p>
          <p className="text-sm mt-1">
            {isPaid ? (
              <>
                <Link href="/dashboard/new" className="text-brand hover:underline">
                  Start your first full-site scan
                </Link>
              </>
            ) : (
              'Upgrade to start scanning your full website.'
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {userScans.map((scan) => (
            <Link
              key={scan.id}
              href={`/dashboard/scan/${scan.id}`}
              className="block bg-white border border-slate-200 rounded-xl p-4 hover:border-brand/40 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800 text-sm font-sans truncate">
                    {scan.baseUrl}
                  </p>
                  <p className="text-slate-400 text-xs font-sans mt-0.5">
                    {new Date(scan.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {scan.status === 'complete' && ` · ${scan.pagesCrawled} pages`}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <StatusBadge status={scan.status} />
                  {scan.overallGrade && scan.status === 'complete' && (
                    <GradeChip grade={scan.overallGrade} />
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function GradeChip({ grade }: { grade: string }) {
  const colors: Record<string, string> = {
    A: 'bg-green-100 text-green-700',
    B: 'bg-lime-100 text-lime-700',
    C: 'bg-yellow-100 text-yellow-700',
    D: 'bg-orange-100 text-orange-700',
    F: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm ${colors[grade] ?? colors.F}`}>
      {grade}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-slate-100 text-slate-500',
    running: 'bg-blue-50 text-blue-600',
    complete: 'bg-green-50 text-green-700',
    failed: 'bg-red-50 text-red-600',
  };
  const labels: Record<string, string> = {
    pending: 'Queued',
    running: 'Running…',
    complete: 'Complete',
    failed: 'Failed',
  };
  return (
    <span className={`text-xs font-semibold font-sans px-2.5 py-1 rounded-full ${styles[status] ?? styles.pending}`}>
      {labels[status] ?? status}
    </span>
  );
}
