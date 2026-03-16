'use client';

import { useState } from 'react';

export default function ManageBillingButton({ customerId }: { customerId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await fetch('/api/stripe/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId }),
    });
    const { url } = await res.json();
    window.location.href = url;
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-sm font-semibold text-slate-600 border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors font-sans"
    >
      {loading ? 'Loading…' : 'Manage Billing'}
    </button>
  );
}
