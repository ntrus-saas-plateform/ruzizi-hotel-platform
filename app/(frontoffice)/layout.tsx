import Navigation from '@/components/frontoffice/Navigation';
import Footer from '@/components/frontoffice/Footer';

export default function FrontOfficeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navigation />
      {/* Spacer for fixed navigation */}
      <div className="h-[120px]"></div>
      <main className="flex-1 relative">
        {children}
      </main>
      <Footer />
    </div>
  );
}
