import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import "./globals.css";
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Wingle Mingle',
  description: 'Connect and discover new people with Wingle Mingle',
  icons: {
    icon: [
      { url: '/favicon-96x96.png', type: 'image/png', sizes: '96x96' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' }
    ],
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    title: 'WM',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <head>
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
