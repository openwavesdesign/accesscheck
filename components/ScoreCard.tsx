import type { CheckResult } from '@/lib/audit';
import CheckResultItem from './CheckResult';

interface ScoreCardProps {
  checks: CheckResult[];
  unlocked: boolean;
  onUnlockClick?: () => void;
}

export default function ScoreCard({ checks, unlocked, onUnlockClick }: ScoreCardProps) {
  const freeChecks = checks.slice(0, 3);
  const lockedChecks = checks.slice(3);

  return (
    <div className="space-y-3">
      {/* Free checks — always visible */}
      {freeChecks.map((check) => (
        <CheckResultItem key={check.id} check={check} />
      ))}

      {/* Locked checks */}
      {lockedChecks.length > 0 && (
        <div className="relative">
          {/* Blurred previews */}
          <div className={`space-y-3 transition-all duration-500 ${unlocked ? '' : 'blur-sm pointer-events-none select-none'}`}>
            {lockedChecks.map((check) => (
              <CheckResultItem key={check.id} check={check} />
            ))}
          </div>

          {/* Lock overlay */}
          {!unlocked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-[2px] rounded-xl">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-6 text-center max-w-xs mx-4">
                <div className="w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <p className="font-semibold text-slate-800 font-sans text-sm mb-1">
                  3 more checks available
                </p>
                <p className="text-slate-500 text-xs font-sans mb-4 leading-relaxed">
                  Enter your email below to unlock your full accessibility report.
                </p>
                {onUnlockClick && (
                  <button
                    onClick={onUnlockClick}
                    className="text-xs font-semibold text-brand underline underline-offset-2 hover:text-brand-light transition-colors"
                  >
                    Scroll to unlock
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
