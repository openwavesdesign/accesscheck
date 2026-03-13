import { NextResponse } from 'next/server';
import { runAudit, AuditError } from '@/lib/audit';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: Request) {
  let url: string;
  try {
    const body = await req.json();
    url = body?.url;
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return NextResponse.json({ error: 'A URL is required.' }, { status: 400 });
  }

  // Prepend https:// if no protocol provided
  const normalizedUrl = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;

  try {
    const result = await runAudit(normalizedUrl);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof AuditError) {
      const statusMap: Record<string, number> = {
        INVALID_URL: 400,
        TIMEOUT: 408,
        FETCH_FAILED: 502,
        PARSE_ERROR: 500,
      };
      return NextResponse.json(
        { error: e.message, code: e.code },
        { status: statusMap[e.code] ?? 500 }
      );
    }
    console.error('Unexpected audit error:', e);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
