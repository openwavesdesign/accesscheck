import { authMiddleware } from '@clerk/nextjs/server';

export default authMiddleware({
  // Routes that are accessible without authentication
  publicRoutes: [
    '/',
    '/results',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/audit(.*)',
    '/api/subscribe(.*)',
    '/api/verify(.*)',
    '/api/webhooks/stripe(.*)',
    '/api/inngest(.*)',
  ],
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
