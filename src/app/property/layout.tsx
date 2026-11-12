"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { SupportWidget } from "@/components/support-widget";

export default function PropertyLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const isAuth = pathname.includes("/login") || pathname.includes("/signup");

  const logout = () => {
    document.cookie = "bm_token=; path=/; max-age=0";
    router.push("/property/login");
  };

  if (isAuth) return <>{children}</>;

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-peach-soft/60 via-sunflower-soft/20 to-surface">
      {/* Decorative blurs */}
      <div className="pointer-events-none fixed -left-10 top-32 h-40 w-40 rounded-full bg-coral/8 blur-3xl" />
      <div className="pointer-events-none fixed -right-10 top-64 h-48 w-48 rounded-full bg-sunflower/10 blur-3xl" />

      <nav className="sticky top-0 z-50 border-b border-glass-border bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo href="/property/dashboard" />
          <div className="flex items-center gap-5">
            <Link
              href="/property/dashboard"
              className={`text-[13px] font-medium transition-colors ${pathname === "/property/dashboard" ? "text-coral" : "text-text-secondary hover:text-text-primary"}`}
            >
              Dashboard
            </Link>
            <button
              onClick={logout}
              className="text-[13px] font-medium text-text-tertiary transition-colors hover:text-text-secondary"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>
      {children}
      <SupportWidget />
    </div>
  );
}
