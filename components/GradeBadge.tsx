import { getGradeInfo } from '@/lib/grading';
import type { Grade } from '@/lib/grading';

interface GradeBadgeProps {
  grade: Grade;
  score: number;
}

export default function GradeBadge({ grade, score }: GradeBadgeProps) {
  const info = getGradeInfo(grade);

  return (
    <div className={`rounded-2xl border-2 ${info.borderColor} ${info.bgColor} p-8 text-center`}>
      <p className="text-sm font-semibold uppercase tracking-widest text-slate-500 mb-2 font-sans">
        Accessibility Score
      </p>
      <div className={`grade-text font-display font-bold leading-none ${info.color}`}>
        {grade}
      </div>
      <p className={`text-lg font-semibold mt-2 ${info.color} font-sans`}>
        {info.label}
      </p>
      <p className="text-slate-600 text-sm mt-1 font-sans">
        {score} of 6 checks passed
      </p>
      <p className="text-slate-700 text-sm mt-4 max-w-sm mx-auto font-sans leading-relaxed">
        {info.message}
      </p>
    </div>
  );
}
