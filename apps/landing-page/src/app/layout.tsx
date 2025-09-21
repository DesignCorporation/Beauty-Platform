import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Beauty Platform | Система управления салоном красоты',
  description: 'Полная CRM система для салонов красоты. Управление записями, клиентами, мастерами и финансами. Начните 14-дневный бесплатный период прямо сейчас.',
  keywords: 'CRM салон красоты, система записи клиентов, управление салоном, автоматизация салона красоты',
  authors: [{ name: 'Design Corporation', url: 'https://designcorp.eu' }],
  creator: 'Design Corporation',
  publisher: 'Design Corporation',
  metadataBase: new URL('https://beauty.designcorp.eu'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: 'https://beauty.designcorp.eu',
    title: 'Beauty Platform | Система управления салоном красоты',
    description: 'Полная CRM система для салонов красоты. Управление записями, клиентами, мастерами и финансами.',
    siteName: 'Beauty Platform',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
