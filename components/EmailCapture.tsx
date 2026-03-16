'use client';

import { useState, FormEvent } from 'react';

interface EmailCaptureProps {
  auditUrl: string;
  grade: string;
  onSuccess: () => void;
}

type FormState = 'idle' | 'loading' | 'success' | 'error';
type Step = 'email' | 'verify';

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(local.length - 2, 3))}@${domain}`;
}

export default function EmailCapture({ auditUrl, grade, onSuccess }: EmailCaptureProps) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [token, setToken] = useState('');
  const [step, setStep] = useState<Step>('email');
  const [state, setState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setState('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), url: auditUrl, grade }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Something went wrong. Please try again.');
        setState('error');
        return;
      }

      setState('idle');
      setToken(data.token ?? '');
      setStep('verify');
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.');
      setState('error');
    }
  }

  async function handleVerifySubmit(e: FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;

    setState('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, code: code.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Something went wrong. Please try again.');
        setState('error');
        return;
      }

      setState('success');
      onSuccess();
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.');
      setState('error');
    }
  }

  function handleResend() {
    setCode('');
    setToken('');
    setState('idle');
    setErrorMsg('');
    setStep('email');
  }

  if (state === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-semibold text-slate-800 font-sans mb-1">Your full report is unlocked!</p>
        <p className="text-slate-600 text-sm font-sans leading-relaxed">
          Check your inbox — and if you want help fixing these issues, we're here.
        </p>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
        <div className="text-center mb-5">
          <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="font-display text-xl text-slate-800 mb-1">Check Your Inbox</h2>
          <p className="text-slate-500 text-sm font-sans leading-relaxed">
            We sent a 6-digit code to <span className="font-medium text-slate-700">{maskEmail(email.trim())}</span>
          </p>
        </div>

        <form onSubmit={handleVerifySubmit} noValidate>
          <div className="flex flex-col sm:flex-row gap-2">
            <label htmlFor="otp-code" className="sr-only">
              Verification code
            </label>
            <input
              id="otp-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              required
              disabled={state === 'loading'}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-slate-800 text-sm font-sans placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed bg-white tracking-widest text-center font-mono"
            />
            <button
              type="submit"
              disabled={state === 'loading' || code.length < 6}
              className="px-6 py-3 bg-brand text-white font-semibold text-sm rounded-xl hover:bg-brand-light focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-sans whitespace-nowrap"
            >
              {state === 'loading' ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verifying…
                </span>
              ) : 'Verify & Unlock'}
            </button>
          </div>

          {state === 'error' && (
            <p className="mt-2 text-red-600 text-xs font-sans" role="alert">
              {errorMsg}
            </p>
          )}

          <p className="mt-3 text-slate-400 text-xs font-sans text-center leading-relaxed">
            Didn't receive it?{' '}
            <button
              type="button"
              onClick={handleResend}
              className="text-brand underline hover:no-underline focus:outline-none"
            >
              Resend code
            </button>
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
      <div className="text-center mb-5">
        <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="font-display text-xl text-slate-800 mb-1">Unlock Your Full Report</h2>
        <p className="text-slate-500 text-sm font-sans leading-relaxed">
          Enter your email to see all 6 accessibility checks, including the ones that could be putting you at legal risk.
        </p>
      </div>

      <form onSubmit={handleEmailSubmit} noValidate>
        <div className="flex flex-col sm:flex-row gap-2">
          <label htmlFor="email-capture" className="sr-only">
            Email address
          </label>
          <input
            id="email-capture"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@yourcompany.com"
            required
            disabled={state === 'loading'}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-slate-800 text-sm font-sans placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed bg-white"
          />
          <button
            type="submit"
            disabled={state === 'loading' || !email.trim()}
            className="px-6 py-3 bg-brand text-white font-semibold text-sm rounded-xl hover:bg-brand-light focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-sans whitespace-nowrap"
          >
            {state === 'loading' ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Sending…
              </span>
            ) : 'Send Code'}
          </button>
        </div>

        {state === 'error' && (
          <p className="mt-2 text-red-600 text-xs font-sans" role="alert">
            {errorMsg}
          </p>
        )}

        <p className="mt-3 text-slate-400 text-xs font-sans text-center leading-relaxed">
          We'll only email you about your results and accessibility tips. No spam, ever. Unsubscribe at any time.
        </p>
      </form>
    </div>
  );
}
