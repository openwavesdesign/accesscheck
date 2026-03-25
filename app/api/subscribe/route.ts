import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import crypto from 'crypto';

export const runtime = 'nodejs';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function signToken(payload: object): string {
  const secret = process.env.OTP_SECRET ?? 'dev-secret-change-me';
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export async function POST(req: Request) {
  let body: { email?: string; url?: string; grade?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { email, url, grade } = body;
  const normalizedEmail = email?.trim().toLowerCase() ?? '';

  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
  }

  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  const token = signToken({ email: normalizedEmail, code, expiresAt, url: url ?? '', grade: grade ?? '' });

  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM ?? 'AccessCheck <onboarding@resend.dev>',
      to: normalizedEmail,
      subject: 'Your AccessCheck verification code',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#0f4c8a;margin-bottom:8px">Your verification code</h2>
          <p style="color:#475569;margin-bottom:24px">Enter this code to unlock your full accessibility report:</p>
          <div style="background:#f1f5f9;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
            <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#0f172a">${code}</span>
          </div>
          <p style="color:#94a3b8;font-size:14px">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
        </div>
      `,
    });
  } catch (e) {
    console.error('Failed to send OTP email:', e);
    return NextResponse.json({ error: 'Failed to send verification email. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, step: 'verify', token });
}
