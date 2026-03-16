'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewScanPage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/crawl/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'scan_limit_reached') {
          setError(`You've used all ${data.limit} scans for this month. Upgrade to Pro for unlimited scans.`);
        } else {
          setError(data.error || 'Something went wrong. Please try again.');
        }
        return;
      }

      router.push(`/dashboard/scan/${data.scanId}`);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl text-slate-900 mb-2">New Site Scan</h1>
      <p className="text-slate-500 text-sm font-sans mb-8">
        Enter your website's base URL. We'll crawl up to 50 pages and run 6 accessibility checks on each.
      </p>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6">
        <label htmlFor="url" className="block text-sm font-semibold text-slate-700 font-sans mb-2">
          Website URL
        </label>
        <input
          id="url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://yourwebsite.com"
          required
          className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand mb-4"
        />

        {error && (
          <p className="text-red-600 text-sm font-sans mb-4 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !url}
          className="w-full bg-brand text-white font-semibold py-3 rounded-lg hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-sans"
        >
          {loading ? 'Starting scan…' : 'Start Full-Site Scan'}
        </button>
      </form>

      <p className="text-xs text-slate-400 font-sans mt-4 text-center">
        Static HTML only — JavaScript-rendered content is not checked. Results may take a minute for larger sites.
      </p>
    </div>
  );
}
