import type { Metadata } from 'next';
import ClientLayout from './ClientLayout';
import JsonLd from '@/components/seo/JsonLd';
import './globals.css';

// Temporary fallback to system fonts due to Google Fonts connectivity issues
const geistSans = {
  variable: '--font-geist-sans',
};

const geistMono = {
  variable: '--font-geist-mono',
};

export const metadata: Metadata = {
  title: {
    default: 'Ruzizi Hôtel - Hébergement de Luxe au Burundi',
    template: '%s | Ruzizi Hôtel'
  },
  description: 'Découvrez l\'excellence de l\'hospitalité burundaise au Ruzizi Hôtel. Hébergement de luxe, chambres confortables, restaurant gastronomique et services premium à Bujumbura et dans tout le Burundi.',
  keywords: [
    'hôtel Burundi', 'Ruzizi Hôtel', 'hébergement Bujumbura', 'hôtel de luxe Burundi',
    'réservation hôtel Burundi', 'tourisme Burundi', 'hospitalité burundaise',
    'chambres luxueuses', 'restaurant Bujumbura', 'spa Burundi', 'événements Burundi',
    'conférences Bujumbura', 'vacances Burundi', 'voyage Burundi', 'hôtellerie Burundi'
  ],
  authors: [{ name: 'Ruzizi Hôtel', url: 'https://ruzizihotel.com' }],
  creator: 'Ruzizi Hôtel',
  publisher: 'Ruzizi Hôtel',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://ruzizihotel.com'),
  alternates: {
    canonical: '/',
    languages: {
      'fr-BI': '/',
      'en-US': '/en',
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'Ruzizi Hôtel - Hébergement de Luxe au Burundi',
    description: 'Découvrez l\'excellence de l\'hospitalité burundaise. Hébergement de luxe, chambres confortables et services premium au cœur du Burundi.',
    url: 'https://ruzizihotel.com',
    siteName: 'Ruzizi Hôtel',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Ruzizi Hôtel - Hébergement de luxe au Burundi',
      },
    ],
    locale: 'fr_BI',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ruzizi Hôtel - Hébergement de Luxe au Burundi',
    description: 'Découvrez l\'excellence de l\'hospitalité burundaise au Ruzizi Hôtel.',
    images: ['/twitter-image.jpg'],
    creator: '@RuziziHotel',
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'hospitality',
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
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    name: 'Ruzizi Hôtel',
    description: 'Hébergement de luxe au Burundi offrant une hospitalité exceptionnelle',
    url: 'https://ruzizihotel.com',
    logo: 'https://ruzizihotel.com/logo.png',
    image: 'https://ruzizihotel.com/og-image.jpg',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'BI',
      addressLocality: 'Bujumbura',
      addressRegion: 'Bujumbura Mairie',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: -3.3614,
      longitude: 29.3599,
    },
    telephone: '+257-XX-XX-XX-XX',
    email: 'contact@ruzizihotel.com',
    priceRange: '$$-$$$',
    starRating: {
      '@type': 'Rating',
      ratingValue: '4.8',
      bestRating: '5',
    },
    amenityFeature: [
      { '@type': 'LocationFeatureSpecification', name: 'WiFi gratuit' },
      { '@type': 'LocationFeatureSpecification', name: 'Piscine' },
      { '@type': 'LocationFeatureSpecification', name: 'Restaurant' },
      { '@type': 'LocationFeatureSpecification', name: 'Spa' },
      { '@type': 'LocationFeatureSpecification', name: 'Parking gratuit' },
      { '@type': 'LocationFeatureSpecification', name: 'Service en chambre 24h/24' },
      { '@type': 'LocationFeatureSpecification', name: 'Salle de conférence' },
    ],
    sameAs: [
      'https://www.facebook.com/RuziziHotel',
      'https://www.instagram.com/ruzizihotel',
      'https://www.twitter.com/RuziziHotel',
    ],
  };

  return (
    <html lang="fr">
      <head>
        <JsonLd data={organizationJsonLd} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
