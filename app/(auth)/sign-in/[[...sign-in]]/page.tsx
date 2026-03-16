import { SignIn } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="border-b border-slate-100 bg-white">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/ac-icon.svg" alt="AccessCheck" width={28} height={28} />
            <span className="font-display text-lg text-slate-800">AccessCheck</span>
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        <SignIn />
      </main>
    </div>
  );
}
