export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface GradeInfo {
  grade: Grade;
  label: string;
  color: string;        // Tailwind text color class
  bgColor: string;      // Tailwind bg color class
  borderColor: string;  // Tailwind border color class
  message: string;
}

export function calculateGrade(score: number): Grade {
  if (score >= 6) return 'A';
  if (score >= 5) return 'B';
  if (score >= 4) return 'C';
  if (score >= 3) return 'D';
  return 'F';
}

export function getGradeInfo(grade: Grade): GradeInfo {
  const map: Record<Grade, GradeInfo> = {
    A: {
      grade: 'A',
      label: 'Excellent',
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-300',
      message: 'Your site passes all detectable accessibility checks. Great work — keep it up as you add new content.',
    },
    B: {
      grade: 'B',
      label: 'Good',
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-300',
      message: 'Your site is mostly accessible with one minor issue to fix. A small improvement could get you to an A.',
    },
    C: {
      grade: 'C',
      label: 'Fair',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-300',
      message: 'Several accessibility issues were found. These could expose you to legal risk and frustrate users with disabilities.',
    },
    D: {
      grade: 'D',
      label: 'Poor',
      color: 'text-orange-700',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-300',
      message: 'Significant accessibility barriers exist. Your site may be difficult or impossible to use for people with disabilities.',
    },
    F: {
      grade: 'F',
      label: 'Critical',
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-300',
      message: 'Your site has serious accessibility problems. ADA lawsuits have been filed against sites with fewer issues than this.',
    },
  };
  return map[grade];
}
