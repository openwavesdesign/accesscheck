import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';

interface TokenPayload {
  email: string;
  code: string;
  expiresAt: number;
}

function verifyToken(token: string): TokenPayload | null {
  const secret = process.env.OTP_SECRET ?? 'dev-secret-change-me';
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, sig] = parts;

  const expected = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    return JSON.parse(Buffer.from(data, 'base64url').toString()) as TokenPayload;
  } catch {
    return null;
  }
}

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
  let body: { token?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { token, code } = body;

  if (!token || !code) {
    return NextResponse.json({ error: 'Token and code are required.' }, { status: 400 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid or tampered token. Please request a new code.' }, { status: 400 });
  }

  if (Date.now() > payload.expiresAt) {
    return NextResponse.json({ error: 'Code expired. Please request a new one.' }, { status: 400 });
  }

  if (code.trim() !== payload.code) {
    return NextResponse.json({ error: 'Incorrect code. Please try again.' }, { status: 400 });
  }

  try {
    await subscribeToKit(payload.email);
  } catch (e) {
    console.error('Kit subscription failed:', e);
  }

  return NextResponse.json({ success: true });
}
