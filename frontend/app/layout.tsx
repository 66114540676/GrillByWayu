import type { Metadata } from 'next';
import { IBM_Plex_Sans_Thai, Mitr } from 'next/font/google';
import './globals.css';

const mitr = Mitr({ subsets: ['thai', 'latin'], weight: ['400', '500', '600'], variable: '--font-mitr' });
const plex = IBM_Plex_Sans_Thai({ subsets: ['thai', 'latin'], weight: ['400', '500', '600'], variable: '--font-plex' });

export const metadata: Metadata = {
  title: 'GrillByWayu — หมูกระทะตามใจคุณ',
  description: 'สั่งหมูกระทะ เลือกเนื้อ ผัก เส้น และน้ำจิ้มได้เอง',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${mitr.variable} ${plex.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
