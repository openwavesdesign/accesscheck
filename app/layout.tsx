import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://accesscheck.vercel.app'),
  title: 'AccessCheck — Free ADA Accessibility Audit Tool',
  description:
    'Find out if your website is ADA accessible in 30 seconds. Get a free instant accessibility scorecard and avoid costly lawsuits.',
  keywords: ['ADA compliance', 'accessibility audit', 'WCAG', 'web accessibility', 'ADA lawsuit'],
  authors: [{ name: 'Open Waves Design', url: 'https://openwave.design' }],
  openGraph: {
    title: 'AccessCheck — Free ADA Accessibility Audit Tool',
    description:
      'Is your website accessible? Find out in 30 seconds with a free instant ADA accessibility scorecard.',
    url: 'https://accesscheck.vercel.app',
    siteName: 'AccessCheck',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AccessCheck — Free ADA Accessibility Audit Tool',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AccessCheck — Free ADA Accessibility Audit',
    description: 'Is your website ADA compliant? Find out in 30 seconds — free.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
