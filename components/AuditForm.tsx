'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function AuditForm() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const trimmed = url.trim();
    if (!trimmed) {
      setError('Please enter your website URL.');
      return;
    }

    // Basic sanity check — must have at least a dot
    const testUrl = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
      new URL(testUrl);
    } catch {
      setError('That doesn\'t look like a valid URL. Try something like https://yoursite.com');
      return;
    }

    router.push(`/results?url=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full max-w-xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-2 shadow-lg rounded-2xl overflow-hidden sm:shadow-none sm:overflow-visible">
        <label htmlFor="audit-url" className="sr-only">
          Your website URL
        </label>
        <input
          id="audit-url"
          type="url"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError(''); }}
          placeholder="https://yourwebsite.com"
          className="flex-1 px-5 py-4 text-slate-800 text-base font-sans border border-slate-300 sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent placeholder:text-slate-400 bg-white"
          autoComplete="url"
          spellCheck={false}
        />
        <button
          type="submit"
          className="px-7 py-4 bg-brand text-white font-semibold text-base rounded-xl hover:bg-brand-light focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 transition-colors font-sans whitespace-nowrap"
        >
          Run Free Audit
        </button>
      </div>
      {error && (
        <p className="mt-2 text-red-600 text-sm font-sans text-center" role="alert">
          {error}
        </p>
      )}
      <p className="mt-3 text-slate-400 text-xs font-sans text-center">
        No account required. Results in under 30 seconds.
      </p>
    </form>
  );
}
