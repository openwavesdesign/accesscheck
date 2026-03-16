import * as cheerio from 'cheerio';

// File extensions that are definitely not HTML pages
const NON_HTML_EXTENSIONS = new Set([
  'pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico',
  'mp4', 'mp3', 'wav', 'ogg', 'webm',
  'zip', 'gz', 'tar', 'rar',
  'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'css', 'js', 'json', 'xml', 'rss', 'atom',
  'woff', 'woff2', 'ttf', 'eot',
]);

/**
 * Normalize a URL for deduplication: lowercase hostname, strip trailing slash,
 * strip hash fragment, strip common tracking query params.
 */
export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    // Strip fragment
    u.hash = '';
    // Remove common tracking params
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'].forEach(
      (p) => u.searchParams.delete(p)
    );
    // Lowercase hostname
    u.hostname = u.hostname.toLowerCase();
    // Strip trailing slash from pathname (except root)
    if (u.pathname.length > 1 && u.pathname.endsWith('/')) {
      u.pathname = u.pathname.slice(0, -1);
    }
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Returns true if the URL should be skipped (non-HTML, non-http(s), different domain).
 */
export function shouldSkipUrl(url: string, baseHostname: string): boolean {
  try {
    const u = new URL(url);
    // Only http/https
    if (!['http:', 'https:'].includes(u.protocol)) return true;
    // Must be same hostname
    if (u.hostname.toLowerCase() !== baseHostname.toLowerCase()) return true;
    // Skip non-HTML file extensions
    const lastSegment = u.pathname.split('/').pop() ?? '';
    const ext = lastSegment.split('.').pop()?.toLowerCase() ?? '';
    if (ext && NON_HTML_EXTENSIONS.has(ext)) return true;
    return false;
  } catch {
    return true;
  }
}

/**
 * Extract all same-domain links from HTML, normalized and deduplicated.
 * Returns at most `limit` URLs.
 */
export function extractLinks(html: string, baseUrl: string, limit = 50): string[] {
  const base = new URL(baseUrl);
  const baseHostname = base.hostname.toLowerCase();
  const seen = new Set<string>();
  const links: string[] = [];

  const $ = cheerio.load(html);
  $('a[href]').each((_, el) => {
    if (links.length >= limit) return false; // cheerio: return false to break

    const href = $(el).attr('href')!;
    // Resolve relative URLs
    let resolved: string;
    try {
      resolved = new URL(href, baseUrl).toString();
    } catch {
      return;
    }

    if (shouldSkipUrl(resolved, baseHostname)) return;

    const normalized = normalizeUrl(resolved);
    if (seen.has(normalized)) return;
    seen.add(normalized);
    links.push(normalized);
  });

  return links;
}

/**
 * Compute an overall site grade from an array of per-page grades.
 * Averages the numeric scores.
 */
export function computeOverallGrade(grades: string[]): string {
  if (grades.length === 0) return 'F';
  const gradeToScore: Record<string, number> = { A: 6, B: 5, C: 4, D: 3, F: 2 };
  const scoreToGrade: [number, string][] = [[5.5, 'A'], [4.5, 'B'], [3.5, 'C'], [2.5, 'D']];
  const avg = grades.reduce((sum, g) => sum + (gradeToScore[g] ?? 2), 0) / grades.length;
  for (const [threshold, grade] of scoreToGrade) {
    if (avg >= threshold) return grade;
  }
  return 'F';
}
