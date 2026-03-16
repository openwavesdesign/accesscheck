import AuditForm from '@/components/AuditForm';
import Image from 'next/image';
import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';

export default async function HomePage() {
  const { userId } = auth();
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/ac-icon.svg" alt="AccessCheck" width={28} height={28} priority />
            <span className="font-display text-lg text-slate-800">AccessCheck</span>
          </div>
          <div className="flex items-center gap-4">
            {userId ? (
              <Link
                href="/dashboard"
                className="text-sm font-semibold text-brand hover:text-brand-dark transition-colors font-sans"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="text-sm text-slate-500 hover:text-slate-800 transition-colors font-sans"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="text-sm font-semibold bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand-dark transition-colors font-sans"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-slate-50 to-white pt-16 pb-20 px-4 sm:px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 font-sans">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              ADA lawsuits against websites are up 300% since 2018
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-slate-900 leading-tight mb-5">
              Is Your Website Accessible?{' '}
              <span className="text-brand">Find Out in 30 Seconds.</span>
            </h1>

            <p className="text-slate-600 text-lg sm:text-xl font-sans leading-relaxed mb-10 max-w-2xl mx-auto">
              ADA compliance lawsuits against small businesses are at an all-time high — and most owners don't know their site is at risk.
              Enter your URL for a free accessibility scan and get your full report delivered straight to your inbox.
            </p>

            <AuditForm />
          </div>
        </section>

        {/* Trust section */}
        <section className="py-16 px-4 sm:px-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display text-2xl sm:text-3xl text-slate-800 text-center mb-10">
              Why Accessibility Matters for Your Business
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pillar 1 */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </div>
                <h3 className="font-display text-lg text-slate-800 mb-2">Legal Risk</h3>
                <p className="text-slate-600 text-sm font-sans leading-relaxed">
                  Over 4,000 ADA website lawsuits are filed every year — and courts have consistently ruled that websites must be accessible. Settlement costs average $25,000–$100,000.
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="font-display text-lg text-slate-800 mb-2">Lost Customers</h3>
                <p className="text-slate-600 text-sm font-sans leading-relaxed">
                  1 in 4 Americans lives with a disability. If your site isn't accessible, you're turning away customers with $490 billion in annual spending power.
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="font-display text-lg text-slate-800 mb-2">SEO Benefits</h3>
                <p className="text-slate-600 text-sm font-sans leading-relaxed">
                  Accessibility improvements — alt text, semantic headings, descriptive links — directly improve how Google understands and ranks your site.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 px-4 sm:px-6 bg-slate-50 border-t border-slate-100">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-2xl sm:text-3xl text-slate-800 mb-10">
              How It Works
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              {[
                { step: '1', title: 'Enter your URL', desc: 'Paste your website address in the form above. No password or account needed.' },
                { step: '2', title: 'We analyze your page', desc: 'Our tool checks that specific page against 6 key WCAG accessibility criteria in seconds. (One page per scan.)' },
                { step: '3', title: 'Get your scorecard', desc: 'Receive a letter grade and plain-English explanation of any issues found.' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center font-semibold text-sm font-sans">
                    {step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 font-sans text-sm mb-1">{title}</h3>
                    <p className="text-slate-500 text-sm font-sans leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-400 font-sans">
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
            {' '}· Accessible websites for small businesses
          </span>
          <span className="text-xs">
            Results are based on static HTML analysis and may not reflect all accessibility issues.
          </span>
        </div>
      </footer>
    </div>
  );
}
