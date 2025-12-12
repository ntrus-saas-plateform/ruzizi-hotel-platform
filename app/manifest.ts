import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ruzizi Hôtel - Hébergement de Luxe au Burundi',
    short_name: 'Ruzizi Hôtel',
    description: 'Découvrez l\'excellence de l\'hospitalité burundaise au Ruzizi Hôtel',
    start_url: '/',
    display: 'standalone',
    background_color: '#faf8f5',
    theme_color: '#d4af37',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        src: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    categories: ['hospitality', 'travel', 'business'],
    lang: 'fr-BI',
  }
}