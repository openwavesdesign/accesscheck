import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

interface Signup {
  email: string;
  url: string;
  grade: string;
  timestamp: string;
}

const DATA_FILE = path.join(process.cwd(), 'data', 'signups.json');

async function readSignups(): Promise<Signup[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw) as Signup[];
  } catch {
    return [];
  }
}

async function writeSignups(signups: Signup[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(signups, null, 2), 'utf-8');
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  let body: { email?: string; url?: string; grade?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { email, url, grade } = body;

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
  }

  const signup: Signup = {
    email: email.trim().toLowerCase(),
    url: url ?? '',
    grade: grade ?? '',
    timestamp: new Date().toISOString(),
  };

  try {
    const existing = await readSignups();
    existing.push(signup);
    await writeSignups(existing);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Failed to save signup:', e);
    // Still return success — don't block the user from seeing results
    // due to a file system issue (e.g. Vercel read-only FS)
    return NextResponse.json({ success: true, warning: 'Email logged but could not be persisted.' });
  }
}
