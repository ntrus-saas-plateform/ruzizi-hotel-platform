import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import ClientLayout from './ClientLayout';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Ruzizi Hôtel - Plateforme de Gestion Hôtelière',
  description: 'Plateforme de gestion complète pour la chaîne hôtelière Ruzizi Hôtel au Burundi. Réservations, gestion des établissements et services hôteliers.',
  keywords: ['hôtel', 'Burundi', 'Ruzizi', 'réservation', 'gestion hôtelière', 'hébergement', "appartement"],
  authors: [{ name: 'Ruzizi Hôtel' }],
  viewport: 'width=device-width, initial-scale=1',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'Ruzizi Hôtel - Gestion Hôtelière',
    description: 'Plateforme moderne de gestion pour les hôtels Ruzizi au Burundi.',
    type: 'website',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ruzizi Hôtel',
    description: 'Gestion hôtelière au Burundi',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
