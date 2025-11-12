import Navigation from '@/components/frontoffice/Navigation';
import Footer from '@/components/frontoffice/Footer';

export default function FrontOfficeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navigation />
      <main className="flex-1 relative">
        {children}
      </main>
      <Footer />
    </div>
  );
}
