import Link from "next/link";

export function Logo({ href = "/", size = "default" }: { href?: string; size?: "default" | "large" }) {
  const isLarge = size === "large";

  return (
    <Link href={href} className="flex items-center gap-2 group">
      {/* Colorful block mark */}
      <svg
        width={isLarge ? 32 : 24}
        height={isLarge ? 32 : 24}
        viewBox="0 0 32 32"
        fill="none"
        className="transition-transform group-hover:rotate-3"
      >
        {/* Bottom-left block */}
        <rect x="2" y="17" width="13" height="13" rx="3" fill="#ff6b5b" />
        {/* Bottom-right block */}
        <rect x="17" y="17" width="13" height="13" rx="3" fill="#fbbf24" />
        {/* Top-left block */}
        <rect x="2" y="2" width="13" height="13" rx="3" fill="#38bdf8" />
        {/* Top-right block */}
        <rect x="17" y="2" width="13" height="13" rx="3" fill="#34d399" />
      </svg>
      {/* Wordmark */}
      <span className={`font-semibold tracking-[-0.01em] ${isLarge ? "text-[22px]" : "text-[17px]"}`}>
        <span className="text-text-primary">Block</span>
        <span className="text-text-tertiary">&nbsp;&amp;&nbsp;</span>
        <span className="text-text-primary">Mortar</span>
      </span>
    </Link>
  );
}

export function LogoMark() {
  return (
    <svg width={24} height={24} viewBox="0 0 32 32" fill="none">
      <rect x="2" y="17" width="13" height="13" rx="3" fill="#ff6b5b" />
      <rect x="17" y="17" width="13" height="13" rx="3" fill="#fbbf24" />
      <rect x="2" y="2" width="13" height="13" rx="3" fill="#38bdf8" />
      <rect x="17" y="2" width="13" height="13" rx="3" fill="#34d399" />
    </svg>
  );
}
