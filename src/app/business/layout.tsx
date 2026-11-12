"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/business/login", { method: "DELETE" }).catch(() => {});
    document.cookie = "bm_token=; path=/; max-age=0";
    router.push("/business/login");
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/business/dashboard" className="text-xl font-bold tracking-tight text-stone-900">
            Block &amp; Mortar <span className="text-sm font-normal text-stone-400">Business</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/business/dashboard" className="text-sm font-medium text-stone-600 hover:text-stone-900">
              Dashboard
            </Link>
            <Link href="/business/dashboard/new-offer" className="text-sm font-medium text-stone-600 hover:text-stone-900">
              New Offer
            </Link>
            <button onClick={logout} className="text-sm font-medium text-stone-400 hover:text-stone-600">
              Logout
            </button>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
