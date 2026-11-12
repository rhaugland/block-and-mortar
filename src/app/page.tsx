import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Nav */}
      <nav className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold tracking-tight text-stone-900">
            Block &amp; Mortar
          </span>
          <div className="flex gap-4">
            <Link
              href="/business/login"
              className="text-sm font-medium text-stone-600 hover:text-stone-900"
            >
              For Businesses
            </Link>
            <Link
              href="/property/login"
              className="text-sm font-medium text-stone-600 hover:text-stone-900"
            >
              For Properties
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-stone-900">
          Sell the neighborhood,
          <br />
          <span className="text-amber-600">not just the apartment.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-stone-600">
          Block &amp; Mortar lets apartment communities showcase local business
          perks to prospective renters — and lets businesses reach people who
          are about to move in.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/business/signup"
            className="rounded-lg bg-amber-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-amber-700"
          >
            List Your Business
          </Link>
          <Link
            href="/property/signup"
            className="rounded-lg border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-700 shadow-sm hover:bg-stone-50"
          >
            Add Your Property
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-stone-200 bg-white py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-bold text-stone-900">
            How it works
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-lg font-bold text-amber-700">
                1
              </div>
              <h3 className="mt-4 text-lg font-semibold text-stone-900">
                Property embeds widget
              </h3>
              <p className="mt-2 text-sm text-stone-600">
                Drop a single script tag on your apartment website. A
                &ldquo;Neighborhood Perks&rdquo; panel appears automatically.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-lg font-bold text-amber-700">
                2
              </div>
              <h3 className="mt-4 text-lg font-semibold text-stone-900">
                Businesses create offers
              </h3>
              <p className="mt-2 text-sm text-stone-600">
                Local restaurants, gyms, and shops set a radius, budget, and
                coupon. They only pay when renters click.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-lg font-bold text-amber-700">
                3
              </div>
              <h3 className="mt-4 text-lg font-semibold text-stone-900">
                Renters discover the neighborhood
              </h3>
              <p className="mt-2 text-sm text-stone-600">
                Prospective residents browsing your apartment see nearby deals —
                and picture themselves living there.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 py-8 text-center text-sm text-stone-500">
        &copy; 2026 Block &amp; Mortar. All rights reserved.
      </footer>
    </div>
  );
}
