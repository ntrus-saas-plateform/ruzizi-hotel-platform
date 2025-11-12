'use client';

import { useRouter, usePathname } from 'next/navigation';
import NotificationBell from '@/components/backoffice/NotificationBell';

export default function BackOfficeLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Établissements', href: '/establishments', icon: '🏨' },
    { name: 'Hébergements', href: '/accommodations', icon: '🛏️' },
    { name: 'Réservations', href: '/bookings', icon: '📅' },
    { name: 'Walk-in', href: '/bookings/walkin', icon: '🚶' },
    { name: 'Factures', href: '/invoices', icon: '💰' },
    { name: 'Clients', href: '/clients', icon: '👥' },
    { name: 'Dépenses', href: '/expenses', icon: '💸' },
    { name: 'Analytics', href: '/analytics', icon: '📈' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-blue-600">Ruzizi Hôtel</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationBell />
              <button
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-900"
              >
                Voir le site
              </button>
              <button
                onClick={() => {
                  // Logout logic here
                  router.push('/auth/login');
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-screen">
          <nav className="mt-5 px-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <button
                  key={item.name}
                  onClick={() => router.push(item.href)}
                  className={`w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md mb-1 ${
                    isActive
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-3 text-xl">{item.icon}</span>
                  {item.name}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
