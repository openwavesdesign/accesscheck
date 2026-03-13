'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import GradeBadge from '@/components/GradeBadge';
import ScoreCard from '@/components/ScoreCard';
import EmailCapture from '@/components/EmailCapture';
import type { AuditResult } from '@/lib/audit';

type PageState = 'loading' | 'error' | 'result';

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawUrl = searchParams.get('url') ?? '';

  const [state, setState] = useState<PageState>('loading');
  const [result, setResult] = useState<AuditResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const emailSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rawUrl) {
      router.replace('/');
      return;
    }

    async function runAudit() {
      setState('loading');
      try {
        const res = await fetch('/api/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: rawUrl }),
        });

        const data = await res.json();

        if (!res.ok) {
          setErrorMsg(data.error ?? 'Something went wrong. Please try again.');
          setState('error');
          return;
        }

        setResult(data as AuditResult);
        setState('result');
      } catch {
        setErrorMsg('Could not connect to the audit service. Please check your connection and try again.');
        setState('error');
      }
    }

    runAudit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawUrl]);

  function scrollToEmail() {
    emailSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Loading state
  if (state === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
        <div className="text-center max-w-sm">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
            <div className="absolute inset-0 rounded-full border-4 border-brand border-t-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-6 h-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h1 className="font-display text-2xl text-slate-800 mb-2">Auditing Your Site</h1>
          <p className="text-slate-500 text-sm font-sans leading-relaxed">
            Analyzing{' '}
            <span className="font-medium text-slate-700 break-all">
              {rawUrl}
            </span>
            {' '}against 6 accessibility checks…
          </p>
          <div className="mt-6 flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 bg-brand rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (state === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="font-display text-2xl text-slate-800 mb-3">Audit Failed</h1>
          <p className="text-slate-600 font-sans text-sm leading-relaxed mb-6">
            {errorMsg}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-brand text-white font-semibold text-sm rounded-xl hover:bg-brand-light transition-colors font-sans"
            >
              Try a Different URL
            </button>
            <Link
              href="/"
              className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-200 transition-colors font-sans text-center"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Result state
  if (!result) return null;

  const displayUrl = (() => {
    try { return new URL(result.url).hostname; } catch { return result.url; }
  })();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 bg-brand rounded-md flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="font-display text-lg text-slate-800">AccessCheck</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-slate-500 hover:text-brand transition-colors font-sans flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Audit another site
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Site being audited */}
        <div className="text-center">
          <p className="text-slate-500 text-sm font-sans mb-1">Accessibility report for</p>
          <p className="font-semibold text-slate-800 font-sans text-base break-all">{displayUrl}</p>
          <p className="text-slate-400 text-xs font-sans mt-1">
            Audited {new Date(result.auditedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>

        {/* Grade badge */}
        <GradeBadge grade={result.grade} score={result.score} />

        {/* Scorecard */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-slate-800">Accessibility Checks</h2>
            {!unlocked && (
              <span className="text-xs text-slate-400 font-sans">
                3 of 6 checks shown
              </span>
            )}
          </div>
          <ScoreCard
            checks={result.checks}
            unlocked={unlocked}
            onUnlockClick={scrollToEmail}
          />
        </div>

        {/* Email capture — shown until unlocked */}
        {!unlocked && (
          <div ref={emailSectionRef}>
            <EmailCapture
              auditUrl={result.url}
              grade={result.grade}
              onSuccess={() => setUnlocked(true)}
            />
          </div>
        )}

        {/* CTA */}
        <div className="bg-brand rounded-2xl p-8 text-center text-white">
          <h2 className="font-display text-2xl mb-3">
            Want Help Fixing These Issues?
          </h2>
          <p className="text-blue-100 text-sm font-sans leading-relaxed mb-6 max-w-md mx-auto">
            Open Waves Design specializes in accessible, high-converting websites for small businesses. We'll handle the technical side so you can focus on running your business.
          </p>
          <a
            href="https://openwavesdesign.com/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-3 bg-white text-brand font-semibold text-sm rounded-xl hover:bg-blue-50 transition-colors font-sans"
          >
            Get a Free Consultation →
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 px-4 sm:px-6 mt-10">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-400 font-sans">
          <span>
            Built by{' '}
            <a
              href="https://openwavesdesign.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:text-brand-light transition-colors font-medium"
            >
              Open Waves Design
            </a>
          </span>
          <span className="text-xs text-center">
            Results are based on static HTML analysis. External CSS and JavaScript rendering are not checked.
          </span>
        </div>
      </footer>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
