import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI WhatsApp Bot',
  description: 'AI-powered WhatsApp bot using Vercel AI SDK'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
