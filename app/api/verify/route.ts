import { NextResponse } from 'next/server';
import otpStore from '@/lib/otpStore';

export const runtime = 'nodejs';

async function subscribeToKit(email: string): Promise<void> {
  const apiKey = process.env.KIT_API_KEY;
  if (!apiKey) return;

  await fetch('https://api.kit.com/v4/subscribers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ email_address: email, state: 'active' }),
  });

  const formId = process.env.KIT_FORM_ID;
  if (formId) {
    await fetch(`https://api.kit.com/v4/forms/${formId}/subscribers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ email_address: email }),
    });
  }
}

export async function POST(req: Request) {
  let body: { email?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? '';
  const code = body.code?.trim() ?? '';

  if (!email || !code) {
    return NextResponse.json({ error: 'Email and code are required.' }, { status: 400 });
  }

  const entry = otpStore.get(email);
  if (!entry) {
    return NextResponse.json({ error: 'No verification code found. Please request a new one.' }, { status: 400 });
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(email);
    return NextResponse.json({ error: 'Code expired. Please request a new one.' }, { status: 400 });
  }

  if (entry.attempts >= 3) {
    otpStore.delete(email);
    return NextResponse.json({ error: 'Too many attempts. Please request a new code.' }, { status: 429 });
  }

  if (code !== entry.code) {
    entry.attempts += 1;
    return NextResponse.json({ error: 'Invalid code. Please try again.' }, { status: 400 });
  }

  otpStore.delete(email);

  try {
    await subscribeToKit(email);
  } catch (e) {
    console.error('Kit subscription failed:', e);
    // Non-fatal — user still gets their report
  }

  return NextResponse.json({ success: true });
}
