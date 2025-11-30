import Navigation from '@/components/frontoffice/Navigation';
import Footer from '@/components/frontoffice/Footer';

export default function FrontOfficeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Navigation bg={true} />
      <main className="bg-gradient-subtle">{children}</main>
      <Footer />
    </div>
  );
}
