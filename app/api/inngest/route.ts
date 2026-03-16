import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { crawlSite } from '@/lib/inngest/crawl';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [crawlSite],
});
