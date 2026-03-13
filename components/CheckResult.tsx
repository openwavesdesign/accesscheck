import type { CheckResult as CheckResultType } from '@/lib/audit';

interface CheckResultProps {
  check: CheckResultType;
  blurred?: boolean;
}

function StatusIcon({ status }: { status: CheckResultType['status'] }) {
  if (status === 'pass') {
    return (
      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
        <svg className="w-4 h-4 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  }
  if (status === 'warning') {
    return (
      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
        <svg className="w-4 h-4 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </span>
    );
  }
  return (
    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
      <svg className="w-4 h-4 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </span>
  );
}

function statusBorderClass(status: CheckResultType['status']) {
  if (status === 'pass') return 'border-l-4 border-l-green-500';
  if (status === 'warning') return 'border-l-4 border-l-amber-500';
  return 'border-l-4 border-l-red-500';
}

function statusLabel(status: CheckResultType['status']) {
  if (status === 'pass') return <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Pass</span>;
  if (status === 'warning') return <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Warning</span>;
  return <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">Fail</span>;
}

export default function CheckResult({ check, blurred = false }: CheckResultProps) {
  return (
    <div className={`relative bg-white rounded-xl shadow-sm border border-slate-200 ${statusBorderClass(check.status)} overflow-hidden`}>
      <div className={`p-5 ${blurred ? 'blur-sm select-none pointer-events-none' : ''}`}>
        <div className="flex items-start gap-3">
          <StatusIcon status={check.status} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-slate-800 font-sans text-sm">{check.name}</h3>
              {statusLabel(check.status)}
            </div>
            <p className="text-slate-500 text-xs mb-2 font-sans leading-relaxed">{check.summary}</p>
            <p className="text-slate-700 text-sm font-sans leading-relaxed">{check.detail}</p>
          </div>
        </div>
      </div>
      {blurred && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/10">
          {/* Overlay handled by parent ScoreCard */}
        </div>
      )}
    </div>
  );
}
