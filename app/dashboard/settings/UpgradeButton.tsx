'use client';

import { useState } from 'react';
import type { PlanId } from '@/lib/stripe';

export default function UpgradeButton({ planId }: { planId: PlanId }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId }),
    });
    const { url } = await res.json();
    window.location.href = url;
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="w-full bg-brand text-white font-semibold py-2.5 rounded-lg hover:bg-brand-dark disabled:opacity-50 transition-colors font-sans text-sm"
    >
      {loading ? 'Loading…' : 'Upgrade'}
    </button>
  );
}
