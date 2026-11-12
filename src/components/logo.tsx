import Link from "next/link";

export function Logo({ href = "/", size = "default" }: { href?: string; size?: "default" | "large" }) {
  const isLarge = size === "large";
  const h = isLarge ? 28 : 22;
  const w = isLarge ? 30 : 24;

  return (
    <Link href={href} className="flex items-center gap-2.5 group">
      {/* Little storefront row — warm neighborhood mark */}
      <svg
        width={w}
        height={h}
        viewBox="0 0 30 28"
        fill="none"
        className="transition-transform group-hover:-translate-y-0.5"
      >
        {/* Ground */}
        <rect x="0" y="25" width="30" height="3" rx="1.5" fill="#fbbf24" opacity="0.4" />
        {/* Left building — coral */}
        <rect x="1" y="10" width="8" height="15" rx="2" fill="#ff6b5b" />
        <rect x="3" y="13" width="2" height="2.5" rx="0.5" fill="white" opacity="0.6" />
        <rect x="3" y="17.5" width="2" height="2.5" rx="0.5" fill="white" opacity="0.6" />
        {/* Middle building — peach/sunflower, tallest */}
        <rect x="11" y="3" width="8" height="22" rx="2" fill="#fb923c" />
        <rect x="13" y="6" width="2" height="2.5" rx="0.5" fill="white" opacity="0.6" />
        <rect x="17" y="6" width="2" height="2.5" rx="0.5" fill="white" opacity="0.6" />
        <rect x="13" y="11" width="2" height="2.5" rx="0.5" fill="white" opacity="0.6" />
        <rect x="17" y="11" width="2" height="2.5" rx="0.5" fill="white" opacity="0.6" />
        <rect x="14" y="19" width="2.5" height="6" rx="0.5" fill="#fbbf24" opacity="0.7" />
        {/* Right building — warm red */}
        <rect x="21" y="13" width="8" height="12" rx="2" fill="#ff6b5b" opacity="0.75" />
        <rect x="23" y="15.5" width="2" height="2.5" rx="0.5" fill="white" opacity="0.6" />
        <rect x="26" y="15.5" width="2" height="2.5" rx="0.5" fill="white" opacity="0.6" />
        <rect x="24" y="20" width="3" height="5" rx="0.5" fill="#fbbf24" opacity="0.6" />
      </svg>
      {/* Wordmark */}
      <span className={`font-semibold tracking-[-0.02em] ${isLarge ? "text-[22px]" : "text-[17px]"}`}>
        <span className="bg-gradient-to-r from-coral to-peach bg-clip-text text-transparent">Block</span>
        <span className="text-text-tertiary">&nbsp;&amp;&nbsp;</span>
        <span className="text-text-primary">Mortar</span>
      </span>
    </Link>
  );
}
