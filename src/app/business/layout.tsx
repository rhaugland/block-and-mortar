"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Logo } from "@/components/logo";

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const isAuth = pathname.includes("/login") || pathname.includes("/signup");

  const logout = () => {
    document.cookie = "bm_token=; path=/; max-age=0";
    router.push("/business/login");
  };

  if (isAuth) return <>{children}</>;

  return (
    <div className="min-h-screen bg-surface">
      <nav className="sticky top-0 z-50 border-b border-glass-border bg-glass backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo href="/business/dashboard" />
          <div className="flex items-center gap-5">
            <Link
              href="/business/dashboard"
              className={`text-[13px] font-medium transition-colors ${pathname === "/business/dashboard" ? "text-text-primary" : "text-text-secondary hover:text-text-primary"}`}
            >
              Dashboard
            </Link>
            <Link
              href="/business/dashboard/new-offer"
              className={`text-[13px] font-medium transition-colors ${pathname.includes("new-offer") ? "text-text-primary" : "text-text-secondary hover:text-text-primary"}`}
            >
              New Offer
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
    </div>
  );
}
