import { inngest } from './client';
import { db, scans, scanPages } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { runAudit } from '@/lib/audit';
import { extractLinks, computeOverallGrade } from '@/lib/crawler';

const MAX_PAGES = 50;

export const crawlSite = inngest.createFunction(
  { id: 'crawl-site', triggers: [{ event: 'crawl/start' }], concurrency: { limit: 10 } },
  async ({ event, step }: { event: { data: { scanId: string; baseUrl: string } }; step: any }) => {
    const { scanId, baseUrl } = event.data;

    // Step 1: Fetch base URL and discover links
    const urlsToCrawl = await step.run('discover-links', async () => {
      await db.update(scans).set({ status: 'running' }).where(eq(scans.id, scanId));

      // Fetch the base page HTML to extract links
      const res = await fetch(baseUrl, {
        headers: {
          'User-Agent': 'AccessCheck/1.0 (ADA accessibility audit; +https://accesscheck.vercel.app)',
          'Accept': 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) throw new Error(`Base URL returned HTTP ${res.status}`);
      const html = await res.text();
      const links = extractLinks(html, baseUrl, MAX_PAGES - 1);
      // Always include the base URL itself as the first page
      const allUrls = [baseUrl, ...links.filter((u) => u !== baseUrl)].slice(0, MAX_PAGES);

      await db.update(scans).set({ pagesTotal: allUrls.length }).where(eq(scans.id, scanId));
      return allUrls;
    });

    // Step 2: Audit each page as a separate step (fan-out)
    const results: Array<{ url: string; grade: string; score: number }> = [];

    for (let i = 0; i < urlsToCrawl.length; i++) {
      const url = urlsToCrawl[i];
      const result = await step.run(`audit-page-${i}`, async () => {
        try {
          const audit = await runAudit(url);

          await db.insert(scanPages).values({
            scanId,
            url: audit.url,
            grade: audit.grade,
            score: audit.score,
            checks: audit.checks,
          });

          await db
            .update(scans)
            .set({ pagesCrawled: i + 1 })
            .where(eq(scans.id, scanId));

          return { url: audit.url, grade: audit.grade, score: audit.score };
        } catch {
          // Don't fail the whole crawl if one page fails
          await db
            .update(scans)
            .set({ pagesCrawled: i + 1 })
            .where(eq(scans.id, scanId));
          return null;
        }
      });

      if (result) results.push(result);
    }

    // Step 3: Finalize
    await step.run('finalize', async () => {
      const overallGrade = computeOverallGrade(results.map((r) => r.grade));
      await db
        .update(scans)
        .set({
          status: 'complete',
          overallGrade,
          completedAt: new Date(),
        })
        .where(eq(scans.id, scanId));
    });

    return { scanId, pagesAudited: results.length };
  }
);
