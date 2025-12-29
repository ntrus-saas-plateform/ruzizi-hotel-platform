"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface HrLayoutProps {
  children: React.ReactNode;
}

const hrNavigation = [
  {
    label: "Employés",
    href: "/admin/hr/employees",
  },
  {
    label: "Présence",
    href: "/admin/hr/attendance",
  },
  {
    label: "Congés",
    href: "/admin/hr/leave",
  },
  {
    label: "Paie",
    href: "/admin/hr/payroll",
  },
  {
    label: "Rémunération",
    href: "/admin/hr/compensation",
  },
  {
    label: "Recrutement",
    href: "/admin/hr/recruitment",
  },
  {
    label: "Analytics RH",
    href: "/admin/hr/analytics",
  },
];

export default function HrLayout({ children }: HrLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-luxury-dark">Ressources Humaines</h1>
            <p className="text-luxury-text mt-2">
              Centralisez la gestion des employés, congés, paie et activités RH.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <nav className="flex flex-wrap gap-2 px-4 py-3 md:px-6 md:py-4">
            {hrNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    "px-3 py-1.5 rounded-full text-sm font-medium transition-colors " +
                    (isActive
                      ? "bg-luxury-gold text-luxury-dark shadow-sm"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100")
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
}
