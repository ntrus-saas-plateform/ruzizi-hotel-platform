import type { Metadata } from 'next';
import ClientLayout from './ClientLayout';
import './globals.css';

// Temporary fallback to system fonts due to Google Fonts connectivity issues
const geistSans = {
  variable: '--font-geist-sans',
};

const geistMono = {
  variable: '--font-geist-mono',
};

export const metadata: Metadata = {
  title: 'Ruzizi Hôtel',
  description: 'Plateforme de gestion complète pour la chaîne hôtelière Ruzizi Hôtel au Burundi. Réservations, gestion des établissements et services hôteliers.',
  keywords: ['hôtel', 'Burundi', 'Ruzizi', 'réservation', 'gestion hôtelière', 'hébergement', "appartement"],
  authors: [{ name: 'Ruzizi Hôtel' }],
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

export const viewport = {
  width: 'device-width',
  initialScale: 1,
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
