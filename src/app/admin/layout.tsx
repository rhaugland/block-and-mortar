"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

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
    { href: "/admin/dashboard/offers", label: "Offers" },
    { href: "/admin/dashboard/revenue", label: "Revenue" },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-8">
            <Link href="/admin/dashboard" className="text-[15px] font-bold tracking-tight text-white">
              B&M <span className="text-sky-400">Admin</span>
            </Link>
            <div className="flex items-center gap-1">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                    pathname === item.href
                      ? "bg-white/10 text-white"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <button
            onClick={logout}
            className="text-[13px] text-slate-500 transition-colors hover:text-slate-300"
          >
            Sign Out
          </button>
        </div>
      </nav>
      {children}
    </div>
  );
}
