import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';

interface CheckSummary {
  id: string;
  status: string;
}

interface TokenPayload {
  email: string;
  code: string;
  expiresAt: number;
  url?: string;
  grade?: string;
  checks?: CheckSummary[];
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

const CHECK_ID_TO_PROPERTY: Record<string, string> = {
  'alt-text': 'accesscheck_alt_text',
  'color-contrast': 'accesscheck_color_contrast',
  'form-labels': 'accesscheck_form_labels',
  'heading-hierarchy': 'accesscheck_heading_hierarchy',
  'lang-attribute': 'accesscheck_lang_attribute',
  'link-text': 'accesscheck_link_text',
};

async function ensureHubSpotProperties(token: string): Promise<void> {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // Ensure property group exists
  try {
    await fetch('https://api.hubapi.com/crm/v3/properties/contacts/groups', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'accesscheck',
        label: 'AccessCheck Audit',
        displayOrder: 1,
      }),
    });
    // 409 = already exists — that's fine, ignore
  } catch {
    // Ignore network errors for property setup
  }

  const statusOptions = [
    { label: 'Pass', value: 'pass', hidden: false, displayOrder: 1 },
    { label: 'Warning', value: 'warning', hidden: false, displayOrder: 2 },
    { label: 'Fail', value: 'fail', hidden: false, displayOrder: 3 },
  ];

  const gradeOptions = ['A', 'B', 'C', 'D', 'F'].map((g, i) => ({
    label: g,
    value: g,
    hidden: false,
    displayOrder: i + 1,
  }));

  const propertyDefs = [
    {
      name: 'accesscheck_url',
      label: 'Audited URL',
      type: 'string',
      fieldType: 'text',
      groupName: 'accesscheck',
    },
    {
      name: 'accesscheck_overall_grade',
      label: 'Overall Grade',
      type: 'enumeration',
      fieldType: 'select',
      groupName: 'accesscheck',
      options: gradeOptions,
    },
    {
      name: 'accesscheck_alt_text',
      label: 'Alt Text',
      type: 'enumeration',
      fieldType: 'select',
      groupName: 'accesscheck',
      options: statusOptions,
    },
    {
      name: 'accesscheck_color_contrast',
      label: 'Color Contrast',
      type: 'enumeration',
      fieldType: 'select',
      groupName: 'accesscheck',
      options: statusOptions,
    },
    {
      name: 'accesscheck_form_labels',
      label: 'Form Labels',
      type: 'enumeration',
      fieldType: 'select',
      groupName: 'accesscheck',
      options: statusOptions,
    },
    {
      name: 'accesscheck_heading_hierarchy',
      label: 'Heading Hierarchy',
      type: 'enumeration',
      fieldType: 'select',
      groupName: 'accesscheck',
      options: statusOptions,
    },
    {
      name: 'accesscheck_lang_attribute',
      label: 'Language Attribute',
      type: 'enumeration',
      fieldType: 'select',
      groupName: 'accesscheck',
      options: statusOptions,
    },
    {
      name: 'accesscheck_link_text',
      label: 'Link Text Quality',
      type: 'enumeration',
      fieldType: 'select',
      groupName: 'accesscheck',
      options: statusOptions,
    },
    {
      name: 'accesscheck_audit_date',
      label: 'Audit Date',
      type: 'string',
      fieldType: 'text',
      groupName: 'accesscheck',
    },
  ];

  await Promise.all(
    propertyDefs.map(async (prop) => {
      try {
        await fetch('https://api.hubapi.com/crm/v3/properties/contacts', {
          method: 'POST',
          headers,
          body: JSON.stringify(prop),
        });
        // 409 = property already exists — that's fine
      } catch {
        // Ignore network errors for property setup
      }
    })
  );
}

async function addHubSpotContact(
  email: string,
  url?: string,
  grade?: string,
  checks?: CheckSummary[]
): Promise<void> {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!accessToken) return;

  await ensureHubSpotProperties(accessToken);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  };

  // Build properties object
  const properties: Record<string, string> = {
    email,
    accesscheck_audit_date: new Date().toISOString(),
  };
  if (url) properties.accesscheck_url = url;
  if (grade) properties.accesscheck_overall_grade = grade;
  if (checks) {
    for (const check of checks) {
      const propName = CHECK_ID_TO_PROPERTY[check.id];
      if (propName) properties[propName] = check.status;
    }
  }

  // Try PATCH (upsert by email) first
  const patchRes = await fetch(
    `https://api.hubapi.com/crm/v3/objects/contacts/${encodeURIComponent(email)}?idProperty=email`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ properties }),
    }
  );

  if (patchRes.ok || patchRes.status === 200) return;

  // If not found, create new contact
  if (patchRes.status === 404) {
    await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers,
      body: JSON.stringify({ properties }),
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
    await addHubSpotContact(payload.email, payload.url, payload.grade, payload.checks);
  } catch (e) {
    console.error('HubSpot contact creation failed:', e);
  }

  return NextResponse.json({ success: true });
}
