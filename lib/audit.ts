import * as cheerio from 'cheerio';

export type CheckStatus = 'pass' | 'fail' | 'warning';

export interface CheckResult {
  id: string;
  name: string;
  status: CheckStatus;
  summary: string;
  detail: string;
}

export interface AuditResult {
  url: string;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  score: number;
  checks: CheckResult[];
  auditedAt: string;
}

export class AuditError extends Error {
  constructor(
    message: string,
    public readonly code: 'INVALID_URL' | 'TIMEOUT' | 'FETCH_FAILED' | 'PARSE_ERROR'
  ) {
    super(message);
    this.name = 'AuditError';
  }
}

// ─── Color contrast helpers ─────────────────────────────────────────────────

function parseColor(color: string): [number, number, number] | null {
  color = color.trim().toLowerCase();

  // hex #rrggbb or #rgb
  const hex6 = color.match(/^#([0-9a-f]{6})$/);
  if (hex6) {
    const v = parseInt(hex6[1], 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }
  const hex3 = color.match(/^#([0-9a-f]{3})$/);
  if (hex3) {
    const [r, g, b] = hex3[1].split('').map((c) => parseInt(c + c, 16));
    return [r, g, b];
  }

  // rgb(r, g, b)
  const rgb = color.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
  if (rgb) {
    return [parseInt(rgb[1]), parseInt(rgb[2]), parseInt(rgb[3])];
  }

  // Named colors — common bad ones
  const named: Record<string, [number, number, number]> = {
    white: [255, 255, 255],
    black: [0, 0, 0],
    red: [255, 0, 0],
    yellow: [255, 255, 0],
    lime: [0, 255, 0],
    gray: [128, 128, 128],
    grey: [128, 128, 128],
    silver: [192, 192, 192],
    lightgray: [211, 211, 211],
    lightgrey: [211, 211, 211],
    darkgray: [169, 169, 169],
    darkgrey: [169, 169, 169],
  };
  return named[color] ?? null;
}

function toLinear(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ─── Check 1: Alt Text ───────────────────────────────────────────────────────

function checkAltText($: cheerio.CheerioAPI): CheckResult {
  const imgs = $('img');
  const total = imgs.length;

  if (total === 0) {
    return {
      id: 'alt-text',
      name: 'Image Alt Text',
      status: 'pass',
      summary: 'Images need descriptive alt text so screen readers can convey them to blind users.',
      detail: 'No images found on this page.',
    };
  }

  const missing: string[] = [];
  imgs.each((_, el) => {
    const alt = $(el).attr('alt');
    // alt attribute completely missing (not just empty — empty is valid for decorative images)
    if (alt === undefined) {
      const src = $(el).attr('src') ?? 'unknown';
      missing.push(src.split('/').pop()?.split('?')[0] ?? 'unknown');
    }
  });

  const count = missing.length;

  if (count === 0) {
    return {
      id: 'alt-text',
      name: 'Image Alt Text',
      status: 'pass',
      summary: 'Images need descriptive alt text so screen readers can convey them to blind users.',
      detail: `All ${total} image${total !== 1 ? 's' : ''} have alt attributes.`,
    };
  }

  const status: CheckStatus = count <= 2 ? 'warning' : 'fail';
  return {
    id: 'alt-text',
    name: 'Image Alt Text',
    status,
    summary: 'Images need descriptive alt text so screen readers can convey them to blind users.',
    detail: `${count} of ${total} image${total !== 1 ? 's' : ''} ${count === 1 ? 'is' : 'are'} missing alt attributes.`,
  };
}

// ─── Check 2: Color Contrast ─────────────────────────────────────────────────

function checkColorContrast($: cheerio.CheerioAPI): CheckResult {
  const pairs: Array<{ fg: string; bg: string; ratio: number }> = [];
  let unchecked = 0;

  // Collect inline style color pairs
  $('[style]').each((_, el) => {
    const style = $(el).attr('style') ?? '';
    const fgMatch = style.match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
    const bgMatch = style.match(/(?:^|;)\s*background(?:-color)?\s*:\s*([^;]+)/i);

    if (fgMatch && bgMatch) {
      const fg = parseColor(fgMatch[1].trim());
      const bg = parseColor(bgMatch[1].trim());
      if (fg && bg) {
        const ratio = contrastRatio(relativeLuminance(...fg), relativeLuminance(...bg));
        pairs.push({ fg: fgMatch[1].trim(), bg: bgMatch[1].trim(), ratio });
      } else {
        unchecked++;
      }
    }
  });

  // Also scan <style> blocks for simple rules
  $('style').each((_, el) => {
    const css = $(el).html() ?? '';
    // Match simple selector blocks
    const blocks = css.matchAll(/\{([^}]+)\}/g);
    for (const block of blocks) {
      const decls = block[1];
      const fgMatch = decls.match(/(?:^|;)\s*color\s*:\s*([^;!\n]+)/i);
      const bgMatch = decls.match(/(?:^|;)\s*background(?:-color)?\s*:\s*([^;!\n]+)/i);
      if (fgMatch && bgMatch) {
        const fg = parseColor(fgMatch[1].trim());
        const bg = parseColor(bgMatch[1].trim());
        if (fg && bg) {
          const ratio = contrastRatio(relativeLuminance(...fg), relativeLuminance(...bg));
          pairs.push({ fg: fgMatch[1].trim(), bg: bgMatch[1].trim(), ratio });
        } else {
          unchecked++;
        }
      }
    }
  });

  if (pairs.length === 0) {
    const note = unchecked > 0
      ? `${unchecked} element${unchecked !== 1 ? 's' : ''} found but colors could not be parsed. External CSS is not checked.`
      : 'No inline color styles detected — external CSS could not be checked.';
    return {
      id: 'color-contrast',
      name: 'Color Contrast',
      status: 'warning',
      summary: 'Text must have sufficient contrast against its background to be readable by people with low vision.',
      detail: note,
    };
  }

  const failing = pairs.filter((p) => p.ratio < 4.5);
  if (failing.length === 0) {
    const suffix = unchecked > 0 ? ` (${unchecked} element${unchecked !== 1 ? 's' : ''} with unparseable colors skipped)` : '';
    return {
      id: 'color-contrast',
      name: 'Color Contrast',
      status: 'pass',
      summary: 'Text must have sufficient contrast against its background to be readable by people with low vision.',
      detail: `All ${pairs.length} detectable color pair${pairs.length !== 1 ? 's' : ''} meet the 4.5:1 WCAG AA ratio.${suffix}`,
    };
  }

  return {
    id: 'color-contrast',
    name: 'Color Contrast',
    status: 'fail',
    summary: 'Text must have sufficient contrast against its background to be readable by people with low vision.',
    detail: `${failing.length} of ${pairs.length} detectable color pair${pairs.length !== 1 ? 's' : ''} fail the 4.5:1 WCAG AA minimum contrast ratio.`,
  };
}

// ─── Check 3: Form Labels ────────────────────────────────────────────────────

function checkFormLabels($: cheerio.CheerioAPI): CheckResult {
  const EXCLUDED_TYPES = ['hidden', 'submit', 'button', 'reset', 'image'];

  const inputs = $('input, select, textarea').filter((_, el) => {
    const type = ($(el).attr('type') ?? 'text').toLowerCase();
    return !EXCLUDED_TYPES.includes(type);
  });

  const total = inputs.length;
  if (total === 0) {
    return {
      id: 'form-labels',
      name: 'Form Labels',
      status: 'pass',
      summary: 'Form fields need labels so assistive technology users know what to enter.',
      detail: 'No form inputs found on this page.',
    };
  }

  let unlabeled = 0;
  inputs.each((_, el) => {
    const $el = $(el);
    const id = $el.attr('id');
    const hasAriaLabel = $el.attr('aria-label') || $el.attr('aria-labelledby');
    const hasWrappingLabel = $el.closest('label').length > 0;
    const hasForLabel = id ? $(`label[for="${id}"]`).length > 0 : false;

    if (!hasAriaLabel && !hasWrappingLabel && !hasForLabel) {
      unlabeled++;
    }
  });

  if (unlabeled === 0) {
    return {
      id: 'form-labels',
      name: 'Form Labels',
      status: 'pass',
      summary: 'Form fields need labels so assistive technology users know what to enter.',
      detail: `All ${total} form input${total !== 1 ? 's' : ''} have associated labels.`,
    };
  }

  const status: CheckStatus = unlabeled < total ? 'warning' : 'fail';
  return {
    id: 'form-labels',
    name: 'Form Labels',
    status,
    summary: 'Form fields need labels so assistive technology users know what to enter.',
    detail: `${unlabeled} of ${total} form input${total !== 1 ? 's' : ''} ${unlabeled === 1 ? 'is' : 'are'} missing a label.`,
  };
}

// ─── Check 4: Heading Hierarchy ──────────────────────────────────────────────

function checkHeadingHierarchy($: cheerio.CheerioAPI): CheckResult {
  const headings: number[] = [];
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    headings.push(parseInt(el.tagName.replace('h', ''), 10));
  });

  if (headings.length === 0) {
    return {
      id: 'heading-hierarchy',
      name: 'Heading Hierarchy',
      status: 'fail',
      summary: 'Logical heading structure helps screen reader users navigate and understand page layout.',
      detail: 'No headings found on this page. Every page should have at least one h1.',
    };
  }

  const h1Count = headings.filter((h) => h === 1).length;
  const issues: string[] = [];

  if (h1Count === 0) issues.push('no h1 heading found');
  if (h1Count > 1) issues.push(`${h1Count} h1 headings found (should be exactly 1)`);

  // Check for skipped levels
  for (let i = 1; i < headings.length; i++) {
    const diff = headings[i] - headings[i - 1];
    if (diff > 1) {
      issues.push(`heading jumps from h${headings[i - 1]} to h${headings[i]}`);
    }
  }

  if (issues.length === 0) {
    return {
      id: 'heading-hierarchy',
      name: 'Heading Hierarchy',
      status: 'pass',
      summary: 'Logical heading structure helps screen reader users navigate and understand page layout.',
      detail: `Heading structure looks good: ${headings.map((h) => `h${h}`).join(' → ')}.`,
    };
  }

  const status: CheckStatus = h1Count === 0 ? 'fail' : 'warning';
  return {
    id: 'heading-hierarchy',
    name: 'Heading Hierarchy',
    status,
    summary: 'Logical heading structure helps screen reader users navigate and understand page layout.',
    detail: `Issues found: ${issues.join('; ')}.`,
  };
}

// ─── Check 5: Lang Attribute ─────────────────────────────────────────────────

function checkLangAttribute($: cheerio.CheerioAPI): CheckResult {
  const lang = $('html').attr('lang');

  if (lang && lang.trim().length > 0) {
    return {
      id: 'lang-attribute',
      name: 'Language Attribute',
      status: 'pass',
      summary: 'The page language attribute tells screen readers how to pronounce content correctly.',
      detail: `The <html> tag correctly declares lang="${lang}".`,
    };
  }

  return {
    id: 'lang-attribute',
    name: 'Language Attribute',
    status: 'fail',
    summary: 'The page language attribute tells screen readers how to pronounce content correctly.',
    detail: 'The <html> tag is missing a lang attribute (e.g., lang="en").',
  };
}

// ─── Check 6: Link Text Quality ──────────────────────────────────────────────

function checkLinkText($: cheerio.CheerioAPI): CheckResult {
  const VAGUE_PATTERNS = ['click here', 'read more', 'learn more', 'here', 'link', 'more', 'this', 'click'];

  const links = $('a[href]');
  const total = links.length;

  if (total === 0) {
    return {
      id: 'link-text',
      name: 'Link Text Quality',
      status: 'pass',
      summary: 'Descriptive link text helps screen reader users understand where links lead without reading surrounding context.',
      detail: 'No links found on this page.',
    };
  }

  const vagueLinks: string[] = [];
  links.each((_, el) => {
    const text = $(el).text().trim().toLowerCase();
    const ariaLabel = $(el).attr('aria-label');
    // If aria-label is present, that's used instead
    if (ariaLabel) return;
    if (!text || VAGUE_PATTERNS.includes(text)) {
      vagueLinks.push(text || '(empty)');
    }
  });

  const count = vagueLinks.length;
  if (count === 0) {
    return {
      id: 'link-text',
      name: 'Link Text Quality',
      status: 'pass',
      summary: 'Descriptive link text helps screen reader users understand where links lead without reading surrounding context.',
      detail: `All ${total} link${total !== 1 ? 's' : ''} have descriptive text.`,
    };
  }

  const status: CheckStatus = count <= 2 ? 'warning' : 'fail';
  return {
    id: 'link-text',
    name: 'Link Text Quality',
    status,
    summary: 'Descriptive link text helps screen reader users understand where links lead without reading surrounding context.',
    detail: `${count} of ${total} link${total !== 1 ? 's' : ''} use vague text like "${vagueLinks.slice(0, 3).join('", "')}".`,
  };
}

// ─── Main audit function ─────────────────────────────────────────────────────

export async function runAudit(rawUrl: string): Promise<AuditResult> {
  // Validate URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new AuditError('Only http and https URLs are supported.', 'INVALID_URL');
    }
  } catch (e) {
    if (e instanceof AuditError) throw e;
    throw new AuditError(`"${rawUrl}" is not a valid URL. Try including https://.`, 'INVALID_URL');
  }

  // Fetch HTML with timeout
  let html: string;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(parsedUrl.toString(), {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'AccessCheck/1.0 (ADA accessibility audit; +https://accesscheck.vercel.app)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    clearTimeout(timer);

    if (!res.ok) {
      throw new AuditError(
        `The server returned HTTP ${res.status}. The site may be blocking automated requests.`,
        'FETCH_FAILED'
      );
    }

    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      throw new AuditError('The URL does not appear to serve an HTML page.', 'FETCH_FAILED');
    }

    html = await res.text();
  } catch (e) {
    clearTimeout(timer);
    if (e instanceof AuditError) throw e;
    if (e instanceof Error && e.name === 'AbortError') {
      throw new AuditError('The request timed out after 10 seconds. The site may be slow or unreachable.', 'TIMEOUT');
    }
    throw new AuditError(
      `Could not reach "${parsedUrl.hostname}". Check that the URL is correct and the site is live.`,
      'FETCH_FAILED'
    );
  }

  // Parse and run checks
  let $: cheerio.CheerioAPI;
  try {
    $ = cheerio.load(html);
  } catch {
    throw new AuditError('Failed to parse the page HTML.', 'PARSE_ERROR');
  }

  const checks: CheckResult[] = [
    checkAltText($),
    checkColorContrast($),
    checkFormLabels($),
    checkHeadingHierarchy($),
    checkLangAttribute($),
    checkLinkText($),
  ];

  // Score: pass = 1 point, warning = 0.5 point, fail = 0
  const rawScore = checks.reduce((sum, c) => {
    if (c.status === 'pass') return sum + 1;
    if (c.status === 'warning') return sum + 0.5;
    return sum;
  }, 0);

  const score = Math.floor(rawScore);

  const gradeMap: Record<number, 'A' | 'B' | 'C' | 'D' | 'F'> = {
    6: 'A',
    5: 'B',
    4: 'C',
    3: 'D',
  };
  const grade = gradeMap[score] ?? 'F';

  return {
    url: parsedUrl.toString(),
    grade,
    score,
    checks,
    auditedAt: new Date().toISOString(),
  };
}
