import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { Resend } from 'resend';

export const runtime = 'nodejs';

interface TokenPayload {
  email: string;
  code: string;
  expiresAt: number;
  url?: string;
  grade?: string;
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

async function sendOwnerNotification(email: string, url: string, grade: string): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  let hostname = url;
  try { hostname = new URL(url).hostname; } catch { /* use raw url */ }

  const gradeColors: Record<string, string> = {
    A: '#16a34a', B: '#65a30d', C: '#d97706', D: '#ea580c', F: '#dc2626',
  };
  const color = gradeColors[grade] ?? '#475569';

  await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'AccessCheck <onboarding@resend.dev>',
    to: 'craig@openwavesdesign.com',
    subject: `New AccessCheck result — ${hostname}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="color:#0f4c8a;margin-bottom:4px">New AccessCheck Submission</h2>
        <p style="color:#94a3b8;font-size:13px;margin-top:0">${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px">
          <tr>
            <td style="padding:10px 12px;background:#f8fafc;border-radius:8px 8px 0 0;color:#64748b;font-size:13px;font-weight:600;border-bottom:1px solid #e2e8f0">Visitor Email</td>
            <td style="padding:10px 12px;background:#f8fafc;border-radius:8px 8px 0 0;border-bottom:1px solid #e2e8f0">${email}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;background:#fff;color:#64748b;font-size:13px;font-weight:600;border-bottom:1px solid #e2e8f0">Website Audited</td>
            <td style="padding:10px 12px;background:#fff;border-bottom:1px solid #e2e8f0"><a href="${url}" style="color:#0f4c8a">${url}</a></td>
          </tr>
          <tr>
            <td style="padding:10px 12px;background:#f8fafc;border-radius:0 0 8px 8px;color:#64748b;font-size:13px;font-weight:600">Grade</td>
            <td style="padding:10px 12px;background:#f8fafc;border-radius:0 0 8px 8px">
              <span style="font-size:24px;font-weight:700;color:${color}">${grade}</span>
            </td>
          </tr>
        </table>
      </div>
    `,
  });
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
    body: JSON.stringify({
      email_address: email,
      state: 'active',
      ...(process.env.KIT_TAG_ID ? { tags: [{ id: Number(process.env.KIT_TAG_ID) }] } : {}),
    }),
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

  try {
    await sendOwnerNotification(payload.email, payload.url ?? '', payload.grade ?? '');
  } catch (e) {
    console.error('Owner notification failed:', e);
  }

  return NextResponse.json({ success: true });
}
