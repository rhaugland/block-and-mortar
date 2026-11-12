import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Glass Nav */}
      <nav className="sticky top-0 z-50 border-b border-glass-border bg-glass backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-[17px] font-semibold tracking-[-0.01em] text-text-primary">
            Block &amp; Mortar
          </span>
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

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pb-20 pt-28 text-center">
        <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-accent">
          Hyperlocal advertising
        </p>
        <h1 className="mt-4 text-[52px] font-semibold leading-[1.05] tracking-[-0.03em] text-text-primary">
          Your apartment sells the space.
          <br />
          <span className="text-text-secondary">We sell the neighborhood.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-[19px] leading-relaxed text-text-secondary">
          When someone browses an apartment online, they see deals from nearby
          restaurants, gyms, and shops. The neighborhood sells itself.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3">
          <Link
            href="/business/signup"
            className="rounded-full bg-text-primary px-7 py-3 text-[15px] font-medium text-white transition-all hover:scale-[1.02] hover:bg-black active:scale-[0.98]"
          >
            I own a business
          </Link>
          <Link
            href="/property/signup"
            className="rounded-full border border-glass-border bg-surface-raised px-7 py-3 text-[15px] font-medium text-text-primary shadow-xs transition-all hover:scale-[1.02] hover:bg-white active:scale-[0.98]"
          >
            I manage apartments
          </Link>
        </div>
      </section>

      {/* How it works — three columns */}
      <section className="border-t border-glass-border bg-surface-raised py-24">
        <div className="mx-auto max-w-5xl px-6">
          <p className="text-center text-[13px] font-medium uppercase tracking-[0.08em] text-accent">
            How it works
          </p>
          <h2 className="mt-3 text-center text-[36px] font-semibold tracking-[-0.02em] text-text-primary">
            Three steps. Zero complexity.
          </h2>
          <div className="mt-16 grid gap-12 md:grid-cols-3">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-subtle text-[20px]">
                &#128187;
              </div>
              <h3 className="mt-5 text-[17px] font-semibold text-text-primary">
                Apartment adds one line of code
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-text-secondary">
                Copy a script tag into your website. A &ldquo;Neighborhood
                Perks&rdquo; widget appears for every visitor — no design work needed.
              </p>
            </div>
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-subtle text-[20px]">
                &#127828;
              </div>
              <h3 className="mt-5 text-[17px] font-semibold text-text-primary">
                Local businesses post deals
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-text-secondary">
                Set a radius around your store, write an offer, set a budget.
                You only pay when someone taps &ldquo;Get This Perk.&rdquo;
              </p>
            </div>
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-subtle text-[20px]">
                &#127968;
              </div>
              <h3 className="mt-5 text-[17px] font-semibold text-text-primary">
                Renters discover the block
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-text-secondary">
                Someone browsing your apartment sees &ldquo;20% off brunch down
                the street&rdquo; — and suddenly the neighborhood is the amenity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="border-t border-glass-border py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-16 md:grid-cols-2">
            <div>
              <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-accent">
                For apartment communities
              </p>
              <h3 className="mt-3 text-[28px] font-semibold leading-tight tracking-[-0.02em] text-text-primary">
                Turn your neighborhood into a selling point
              </h3>
              <ul className="mt-6 space-y-4">
                <li className="flex gap-3 text-[15px] leading-relaxed text-text-secondary">
                  <span className="mt-0.5 text-accent">&#10003;</span>
                  Widget installs in 30 seconds — one script tag
                </li>
                <li className="flex gap-3 text-[15px] leading-relaxed text-text-secondary">
                  <span className="mt-0.5 text-accent">&#10003;</span>
                  Earn 25% of every click as passive revenue
                </li>
                <li className="flex gap-3 text-[15px] leading-relaxed text-text-secondary">
                  <span className="mt-0.5 text-accent">&#10003;</span>
                  Give renters a reason to choose your location
                </li>
              </ul>
            </div>
            <div>
              <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-accent">
                For local businesses
              </p>
              <h3 className="mt-3 text-[28px] font-semibold leading-tight tracking-[-0.02em] text-text-primary">
                Reach people before they even move in
              </h3>
              <ul className="mt-6 space-y-4">
                <li className="flex gap-3 text-[15px] leading-relaxed text-text-secondary">
                  <span className="mt-0.5 text-accent">&#10003;</span>
                  Target renters within walking distance of your store
                </li>
                <li className="flex gap-3 text-[15px] leading-relaxed text-text-secondary">
                  <span className="mt-0.5 text-accent">&#10003;</span>
                  Pay per click — not per impression. Start at $0.50
                </li>
                <li className="flex gap-3 text-[15px] leading-relaxed text-text-secondary">
                  <span className="mt-0.5 text-accent">&#10003;</span>
                  Your first customers before they unpack the boxes
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-glass-border bg-surface-raised py-24 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-[36px] font-semibold tracking-[-0.02em] text-text-primary">
            Ready to own your block?
          </h2>
          <p className="mt-3 text-[17px] text-text-secondary">
            Join the apartment communities and local businesses already using
            Block &amp; Mortar.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/business/signup"
              className="rounded-full bg-text-primary px-7 py-3 text-[15px] font-medium text-white transition-all hover:scale-[1.02] hover:bg-black active:scale-[0.98]"
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
