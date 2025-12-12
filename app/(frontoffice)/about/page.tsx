import { Metadata } from 'next';
import AboutPageClient from './AboutPageClient';

export const metadata: Metadata = {
  title: 'À Propos | Ruzizi Hôtel',
  description: 'Découvrez l\'histoire du Ruzizi Hôtel, notre engagement envers l\'excellence de l\'hospitalité burundaise et nos valeurs. Plus de 10 ans d\'expérience dans l\'hôtellerie de luxe.',
  keywords: [
    'à propos Ruzizi Hôtel',
    'histoire hôtel Burundi',
    'hospitalité burundaise',
    'hôtellerie de luxe',
    'valeurs Ruzizi Hôtel',
    'équipe hôtel Burundi'
  ],
  openGraph: {
    title: 'À Propos | Ruzizi Hôtel',
    description: 'Découvrez l\'histoire et les valeurs du Ruzizi Hôtel, symbole de l\'hospitalité burundaise.',
    type: 'website',
  },
};

export default function AboutPage() {
  return <AboutPageClient />;
}

