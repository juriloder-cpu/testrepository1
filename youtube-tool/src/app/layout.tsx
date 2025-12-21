import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'YouTube Video Production Tool',
  description: 'AI-powered long-form video production tool',
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
