"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { SupportWidget } from "@/components/support-widget";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const isAuth = pathname.includes("/login");
  if (isAuth) return <>{children}</>;

  const logout = () => {
    document.cookie = "bm_token=; path=/; max-age=0";
    router.push("/admin/login");
  };

  const nav = [
    { href: "/admin/dashboard", label: "Overview" },
    { href: "/admin/dashboard/properties", label: "Properties" },
    { href: "/admin/dashboard/businesses", label: "Businesses" },
    { href: "/admin/dashboard/revenue", label: "Revenue" },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-peach-soft/60 via-sunflower-soft/20 to-surface">
      <div className="pointer-events-none fixed -left-10 top-32 h-40 w-40 rounded-full bg-coral/8 blur-3xl" />
      <div className="pointer-events-none fixed -right-10 top-64 h-48 w-48 rounded-full bg-sunflower/10 blur-3xl" />

      <nav className="sticky top-0 z-50 border-b border-glass-border bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <Logo href="/admin/dashboard" />
              <span className="rounded-full bg-coral/10 px-2 py-0.5 text-[11px] font-semibold text-coral">Admin</span>
            </div>
            <div className="flex items-center gap-1">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                    pathname === item.href
                      ? "bg-coral/10 text-coral"
                      : "text-text-secondary hover:bg-white/60 hover:text-text-primary"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <button
            onClick={logout}
            className="text-[13px] font-medium text-text-tertiary transition-colors hover:text-text-secondary"
          >
            Sign Out
          </button>
        </div>
      </nav>
      {children}
      <SupportWidget />
    </div>
  );
}
