import type { Metadata } from 'next';
import  './globals.css';

export const metadata: Metadata = {
  title: 'Rak_Maina ❤️',
  description: 'Bloom & Love 🌸',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}