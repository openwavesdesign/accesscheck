import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { Resend } from 'resend';

export const runtime = 'nodejs';

interface CheckResult {
  id: string;
  name: string;
  status: 'pass' | 'warning' | 'fail';
  summary: string;
  detail: string;
}

interface TokenPayload {
  email: string;
  code: string;
  expiresAt: number;
  url?: string;
  grade?: string;
  score?: number;
  checks?: CheckResult[];
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

const GRADE_COLORS: Record<string, string> = {
  A: '#16a34a', B: '#65a30d', C: '#d97706', D: '#ea580c', F: '#dc2626',
};

const STATUS_COLORS: Record<string, string> = {
  pass: '#16a34a', warning: '#d97706', fail: '#dc2626',
};

const STATUS_LABELS: Record<string, string> = {
  pass: 'Pass', warning: 'Warning', fail: 'Fail',
};

function buildChecksTable(checks: CheckResult[]): string {
  if (!checks.length) return '';
  const rows = checks.map((c, i) => {
    const bg = i % 2 === 0 ? '#f8fafc' : '#ffffff';
    const statusColor = STATUS_COLORS[c.status] ?? '#475569';
    const statusLabel = STATUS_LABELS[c.status] ?? c.status;
    return `
      <tr>
        <td style="padding:12px;background:${bg};border-bottom:1px solid #e2e8f0;vertical-align:top;white-space:nowrap">
          <span style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:12px;font-weight:600;color:#fff;background:${statusColor}">${statusLabel}</span>
        </td>
        <td style="padding:12px;background:${bg};border-bottom:1px solid #e2e8f0;vertical-align:top">
          <strong style="color:#0f172a;font-size:14px">${c.name}</strong><br>
          <span style="color:#475569;font-size:13px">${c.summary}</span><br>
          <span style="color:#64748b;font-size:12px;font-style:italic">${c.detail}</span>
        </td>
      </tr>`;
  }).join('');
  return `
    <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;margin-top:12px">
      ${rows}
    </table>`;
}

async function sendOwnerNotification(
  email: string, url: string, grade: string, score: number, checks: CheckResult[]
): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  let hostname = url;
  try { hostname = new URL(url).hostname; } catch { /* use raw url */ }

  const gradeColor = GRADE_COLORS[grade] ?? '#475569';

  await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'AccessCheck <onboarding@resend.dev>',
    to: 'craig@openwavesdesign.com',
    subject: `New AccessCheck result — ${hostname}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h2 style="color:#0f4c8a;margin-bottom:4px">New AccessCheck Submission</h2>
        <p style="color:#94a3b8;font-size:13px;margin-top:0">${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
          <tr>
            <td style="padding:10px 12px;background:#f8fafc;color:#64748b;font-size:13px;font-weight:600;border-bottom:1px solid #e2e8f0;width:130px">Visitor Email</td>
            <td style="padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0">${email}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;background:#fff;color:#64748b;font-size:13px;font-weight:600;border-bottom:1px solid #e2e8f0">Website Audited</td>
            <td style="padding:10px 12px;background:#fff;border-bottom:1px solid #e2e8f0"><a href="${url}" style="color:#0f4c8a">${url}</a></td>
          </tr>
          <tr>
            <td style="padding:10px 12px;background:#f8fafc;color:#64748b;font-size:13px;font-weight:600">Grade</td>
            <td style="padding:10px 12px;background:#f8fafc">
              <span style="font-size:24px;font-weight:700;color:${gradeColor}">${grade}</span>
              <span style="color:#94a3b8;font-size:13px;margin-left:8px">(${score}/6 points)</span>
            </td>
          </tr>
        </table>
        <h3 style="color:#0f172a;font-size:15px;margin:24px 0 4px">Accessibility Checks</h3>
        ${buildChecksTable(checks)}
      </div>
    `,
  });
}

async function sendUserReport(
  email: string, url: string, grade: string, score: number, checks: CheckResult[]
): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  let hostname = url;
  try { hostname = new URL(url).hostname; } catch { /* use raw url */ }

  const gradeColor = GRADE_COLORS[grade] ?? '#475569';

  await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'AccessCheck <onboarding@resend.dev>',
    to: email,
    subject: `Your AccessCheck accessibility report for ${hostname}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h2 style="color:#0f4c8a;margin-bottom:4px">Your Accessibility Report</h2>
        <p style="color:#475569;font-size:14px;margin-top:0">Here's the full report for <a href="${url}" style="color:#0f4c8a">${url}</a></p>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 20px;margin:20px 0;display:inline-block">
          <span style="font-size:48px;font-weight:700;color:${gradeColor}">${grade}</span>
          <span style="color:#64748b;font-size:14px;margin-left:12px">${score}/6 points</span>
        </div>

        <h3 style="color:#0f172a;font-size:15px;margin:24px 0 4px">Full Accessibility Checks</h3>
        ${buildChecksTable(checks)}

        <div style="background:#0f4c8a;border-radius:12px;padding:20px 24px;margin-top:32px;color:#fff">
          <h3 style="margin:0 0 8px;font-size:16px">Need help fixing these issues?</h3>
          <p style="margin:0 0 16px;font-size:14px;color:#bfdbfe;line-height:1.5">
            Open Waves Design specializes in accessible, high-converting websites for small businesses.
            We'll handle the technical side so you can focus on running your business.
          </p>
          <a href="https://openwavesdesign.com/contact" style="display:inline-block;background:#fff;color:#0f4c8a;font-weight:600;font-size:14px;padding:10px 20px;border-radius:8px;text-decoration:none">Get a Free Consultation →</a>
          <p style="margin:16px 0 0;font-size:13px;color:#93c5fd">
            Or email Craig directly: <a href="mailto:craig@openwavesdesign.com" style="color:#fff">craig@openwavesdesign.com</a>
          </p>
        </div>

        <p style="color:#94a3b8;font-size:12px;margin-top:24px">
          This report was generated by <a href="https://accesscheck.openwavesdesign.com" style="color:#0f4c8a">AccessCheck</a> by Open Waves Design.
          Results are based on static HTML analysis — external CSS and JavaScript rendering are not checked.
        </p>
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

  const checks = payload.checks ?? [];
  const score = payload.score ?? 0;

  try {
    await sendOwnerNotification(payload.email, payload.url ?? '', payload.grade ?? '', score, checks);
  } catch (e) {
    console.error('Owner notification failed:', e);
  }

  try {
    await sendUserReport(payload.email, payload.url ?? '', payload.grade ?? '', score, checks);
  } catch (e) {
    console.error('User report email failed:', e);
  }

  return NextResponse.json({ success: true });
}
