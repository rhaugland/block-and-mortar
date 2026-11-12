import Link from "next/link";
import { Logo } from "@/components/logo";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Glass Nav */}
      <nav className="sticky top-0 z-50 border-b border-glass-border bg-glass backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo />
          <div className="flex items-center gap-6">
            <Link
              href="/business/login"
              className="text-[13px] font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              For Businesses
            </Link>
            <Link
              href="/property/login"
              className="text-[13px] font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              For Properties
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero — warm gradient */}
      <section className="relative overflow-hidden bg-gradient-to-b from-peach-soft via-sunflower-soft/40 to-surface">
        <div className="mx-auto max-w-3xl px-6 pb-24 pt-28 text-center">
          <h1 className="text-[52px] font-semibold leading-[1.08] tracking-[-0.03em] text-text-primary">
            Give prospective residents a reason to <span className="bg-gradient-to-r from-coral to-peach bg-clip-text text-transparent">walk the block</span>, not just scroll the listings.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-[19px] leading-relaxed text-text-secondary">
            Local businesses provide the deals. Apartment websites put them
            in front of future neighbors.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <Link
              href="/business/signup"
              className="rounded-full bg-coral px-7 py-3 text-[15px] font-medium text-white shadow-lg shadow-coral/25 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-coral/30 active:scale-[0.98]"
            >
              I own a business
            </Link>
            <Link
              href="/property/signup"
              className="rounded-full border border-glass-border bg-surface-raised px-7 py-3 text-[15px] font-medium text-text-primary shadow-sm transition-all hover:scale-[1.02] hover:shadow-md active:scale-[0.98]"
            >
              I manage apartments
            </Link>
          </div>
        </div>
        {/* Decorative dots */}
        <div className="absolute -left-4 top-20 h-24 w-24 rounded-full bg-coral/10 blur-2xl" />
        <div className="absolute -right-8 top-40 h-32 w-32 rounded-full bg-sunflower/15 blur-2xl" />
        <div className="absolute bottom-10 left-1/4 h-20 w-20 rounded-full bg-sky/10 blur-2xl" />
      </section>

      {/* Value props — side by side with colored accents */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-3xl border border-violet/15 bg-violet-soft/50 p-8">
              <h3 className="text-[24px] font-semibold tracking-[-0.02em] text-text-primary">
                For apartment communities
              </h3>
              <ul className="mt-6 space-y-4">
                <li className="flex gap-3 text-[15px] leading-relaxed text-text-secondary">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet/15 text-[11px] text-violet">&#10003;</span>
                  Widget installs in 30 seconds — one script tag
                </li>
                <li className="flex gap-3 text-[15px] leading-relaxed text-text-secondary">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet/15 text-[11px] text-violet">&#10003;</span>
                  Earn 25% of every click as passive revenue
                </li>
                <li className="flex gap-3 text-[15px] leading-relaxed text-text-secondary">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet/15 text-[11px] text-violet">&#10003;</span>
                  Give renters a reason to choose your location
                </li>
              </ul>
            </div>
            <div className="rounded-3xl border border-coral/15 bg-coral-soft/50 p-8">
              <h3 className="text-[24px] font-semibold tracking-[-0.02em] text-text-primary">
                For local businesses
              </h3>
              <ul className="mt-6 space-y-4">
                <li className="flex gap-3 text-[15px] leading-relaxed text-text-secondary">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-coral/15 text-[11px] text-coral">&#10003;</span>
                  Target renters within walking distance of your store
                </li>
                <li className="flex gap-3 text-[15px] leading-relaxed text-text-secondary">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-coral/15 text-[11px] text-coral">&#10003;</span>
                  Pay per click — not per impression. Start at $0.50
                </li>
                <li className="flex gap-3 text-[15px] leading-relaxed text-text-secondary">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-coral/15 text-[11px] text-coral">&#10003;</span>
                  Your first customers before they unpack the boxes
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA — gradient banner */}
      <section className="mx-6 mb-12 overflow-hidden rounded-3xl bg-gradient-to-r from-coral via-peach to-sunflower py-20 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-[36px] font-semibold tracking-[-0.02em] text-white">
            Ready to own your block?
          </h2>
          <p className="mt-3 text-[17px] text-white/80">
            Join the apartment communities and local businesses already
            bringing neighborhoods to life.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/business/signup"
              className="rounded-full bg-white px-7 py-3 text-[15px] font-semibold text-coral shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
            >
              Get started free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-glass-border py-8 text-center text-[13px] text-text-tertiary">
        &copy; 2026 Block &amp; Mortar
      </footer>
    </div>
  );
}
