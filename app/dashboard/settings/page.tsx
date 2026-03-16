import { auth } from '@clerk/nextjs/server';
import { getUserPlan, getUserSubscription, checkScanLimit } from '@/lib/subscription';
import { PLANS } from '@/lib/stripe';
import Link from 'next/link';
import UpgradeButton from './UpgradeButton';
import ManageBillingButton from './ManageBillingButton';

export default async function SettingsPage() {
  const { userId } = auth();
  if (!userId) return null;

  const [plan, subscription, scanLimit] = await Promise.all([
    getUserPlan(userId),
    getUserSubscription(userId),
    checkScanLimit(userId),
  ]);

  const isPaid = plan !== 'free';

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl text-slate-900 mb-8">Settings</h1>

      {/* Current Plan */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
        <h2 className="font-semibold text-slate-800 font-sans mb-4">Current Plan</h2>

        {isPaid ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-display text-xl text-slate-900">
                  {PLANS[plan as keyof typeof PLANS].name} — ${PLANS[plan as keyof typeof PLANS].price}/month
                </p>
                <p className="text-slate-500 text-sm font-sans mt-1">
                  Status:{' '}
                  <span className={subscription?.status === 'active' ? 'text-green-600 font-semibold' : 'text-amber-600 font-semibold'}>
                    {subscription?.status ?? 'active'}
                  </span>
                  {subscription?.currentPeriodEnd && (
                    <> · Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</>
                  )}
                </p>
              </div>
            </div>
            {scanLimit.limit && (
              <div className="bg-slate-50 rounded-xl p-4 mb-4">
                <p className="text-sm font-sans text-slate-600">
                  Scans this month:{' '}
                  <span className="font-semibold text-slate-800">{scanLimit.used} / {scanLimit.limit}</span>
                </p>
                <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2">
                  <div
                    className="h-1.5 bg-brand rounded-full"
                    style={{ width: `${Math.min(100, (scanLimit.used / scanLimit.limit) * 100)}%` }}
                  />
                </div>
              </div>
            )}
            {subscription?.stripeCustomerId && (
              <ManageBillingButton customerId={subscription.stripeCustomerId} />
            )}
          </div>
        ) : (
          <div>
            <p className="text-slate-600 font-sans text-sm mb-6">
              You're on the free plan. Upgrade to unlock full-site crawls, scan history, and more.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Starter */}
              <div className="border border-slate-200 rounded-xl p-5">
                <p className="font-display text-lg text-slate-900 mb-1">Starter</p>
                <p className="text-2xl font-bold text-slate-900 font-sans mb-3">
                  $19<span className="text-sm font-normal text-slate-500">/mo</span>
                </p>
                <ul className="text-sm text-slate-600 font-sans space-y-1.5 mb-5">
                  <li>✓ Full-site crawl (50 pages)</li>
                  <li>✓ 5 scans/month</li>
                  <li>✓ 30-day scan history</li>
                </ul>
                <UpgradeButton planId="starter" />
              </div>

              {/* Pro */}
              <div className="border-2 border-brand rounded-xl p-5 relative">
                <span className="absolute -top-3 left-4 bg-brand text-white text-xs font-semibold px-3 py-0.5 rounded-full font-sans">
                  Most Popular
                </span>
                <p className="font-display text-lg text-slate-900 mb-1">Pro</p>
                <p className="text-2xl font-bold text-slate-900 font-sans mb-3">
                  $49<span className="text-sm font-normal text-slate-500">/mo</span>
                </p>
                <ul className="text-sm text-slate-600 font-sans space-y-1.5 mb-5">
                  <li>✓ Full-site crawl (50 pages)</li>
                  <li>✓ Unlimited scans</li>
                  <li>✓ Full scan history</li>
                  <li>✓ Scan-complete emails</li>
                </ul>
                <UpgradeButton planId="pro" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="text-sm text-slate-400 font-sans">
        Questions?{' '}
        <a href="mailto:support@accesscheck.io" className="text-brand hover:underline">
          Contact support
        </a>
      </div>
    </div>
  );
}
