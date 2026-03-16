import { UserButton } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/ac-icon.svg" alt="AccessCheck" width={28} height={28} />
            <span className="font-display text-lg text-slate-800">AccessCheck</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/new"
              className="bg-brand text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-brand-dark transition-colors font-sans"
            >
              New Scan
            </Link>
            <Link href="/dashboard/settings" className="text-sm text-slate-500 hover:text-slate-700 font-sans">
              Settings
            </Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
