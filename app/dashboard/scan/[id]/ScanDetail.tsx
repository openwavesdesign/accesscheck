'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { CheckResult } from '@/lib/audit';

type Scan = {
  id: string;
  baseUrl: string;
  status: string;
  pagesTotal: number;
  pagesCrawled: number;
  overallGrade: string | null;
  createdAt: Date;
  completedAt: Date | null;
};

type ScanPage = {
  id: string;
  url: string;
  grade: string;
  score: number;
  checks: unknown;
};

const GRADE_COLORS: Record<string, string> = {
  A: 'bg-green-100 text-green-700 border-green-200',
  B: 'bg-lime-100 text-lime-700 border-lime-200',
  C: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  D: 'bg-orange-100 text-orange-700 border-orange-200',
  F: 'bg-red-100 text-red-700 border-red-200',
};

const STATUS_COLORS: Record<string, string> = {
  pass: 'text-pass',
  warning: 'text-warn',
  fail: 'text-fail',
};

const STATUS_ICONS: Record<string, string> = {
  pass: '✓',
  warning: '⚠',
  fail: '✗',
};

export default function ScanDetail({
  scan: initialScan,
  initialPages,
}: {
  scan: Scan;
  initialPages: ScanPage[];
}) {
  const [scan, setScan] = useState(initialScan);
  const [pages, setPages] = useState(initialPages);
  const [expandedPage, setExpandedPage] = useState<string | null>(null);

  const isRunning = scan.status === 'pending' || scan.status === 'running';

  // Poll for progress while scan is running
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/crawl/status/${scan.id}`);
        if (!res.ok) return;
        const data = await res.json();
        setScan((prev) => ({ ...prev, ...data }));
        if (data.status === 'complete' || data.status === 'failed') {
          clearInterval(interval);
          // Reload the page to get the full results
          window.location.reload();
        }
      } catch {
        // ignore network errors during polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isRunning, scan.id]);

  const progress = scan.pagesTotal > 0 ? (scan.pagesCrawled / scan.pagesTotal) * 100 : 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-slate-400 hover:text-slate-600 font-sans mb-3 inline-block">
          ← Back to dashboard
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl text-slate-900 break-all">{scan.baseUrl}</h1>
            <p className="text-slate-400 text-sm font-sans mt-1">
              {new Date(scan.createdAt).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
          {scan.overallGrade && (
            <div className={`flex-shrink-0 w-16 h-16 rounded-2xl border-2 flex items-center justify-center font-display text-3xl font-bold ${GRADE_COLORS[scan.overallGrade] ?? GRADE_COLORS.F}`}>
              {scan.overallGrade}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar (while running) */}
      {isRunning && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-slate-700 font-sans">Scanning your site…</p>
            <p className="text-slate-400 text-sm font-sans">
              {scan.pagesCrawled} / {scan.pagesTotal || '?'} pages
            </p>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-2 bg-brand rounded-full transition-all duration-500"
              style={{ width: `${scan.pagesTotal ? progress : 10}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 font-sans mt-3">
            This may take a minute. You can leave this page and come back — your results will be saved.
          </p>
        </div>
      )}

      {/* Failed state */}
      {scan.status === 'failed' && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
          <p className="font-semibold text-red-700 font-sans">Scan failed</p>
          <p className="text-red-600 text-sm font-sans mt-1">
            We couldn't reach your site or an unexpected error occurred.{' '}
            <Link href="/dashboard/new" className="underline">Try again.</Link>
          </p>
        </div>
      )}

      {/* Results */}
      {pages.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display text-xl text-slate-800 mb-4">
            {scan.pagesCrawled} {scan.pagesCrawled === 1 ? 'Page' : 'Pages'} Audited
          </h2>
          {pages.map((page) => {
            const checks = page.checks as CheckResult[];
            const isExpanded = expandedPage === page.id;
            return (
              <div key={page.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedPage(isExpanded ? null : page.id)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-700 font-sans truncate">{page.url}</p>
                    <p className="text-xs text-slate-400 font-sans mt-0.5">
                      {page.score} of 6 checks passed
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`w-8 h-8 rounded-full border flex items-center justify-center font-display font-bold text-sm ${GRADE_COLORS[page.grade] ?? GRADE_COLORS.F}`}>
                      {page.grade}
                    </span>
                    <svg
                      className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 divide-y divide-slate-100">
                    {checks.map((check) => (
                      <div key={check.id} className="px-5 py-3 flex gap-3">
                        <span className={`font-bold text-sm flex-shrink-0 w-4 ${STATUS_COLORS[check.status] ?? ''}`}>
                          {STATUS_ICONS[check.status]}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-700 font-sans">{check.name}</p>
                          <p className="text-xs text-slate-500 font-sans mt-0.5">{check.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
