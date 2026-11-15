"use client";

import { useEffect, useState } from "react";

interface Props {
  apiPath: string;
}

export function MonthlyReportToggle({ apiPath }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [sampleSent, setSampleSent] = useState(false);

  useEffect(() => {
    fetch(apiPath)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setEnabled(d.enabled); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [apiPath]);

  const toggle = async () => {
    const turningOn = !enabled;
    setToggling(true);
    setSampleSent(false);
    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: turningOn }),
      });
      if (res.ok) {
        const d = await res.json();
        setEnabled(d.enabled);
        if (turningOn) {
          setSampleSent(true);
          setTimeout(() => setSampleSent(false), 5000);
        }
      }
    } catch {}
    setToggling(false);
  };

  if (!loaded) return null;

  return (
    <div className="rounded-2xl border border-glass-border bg-white/70 px-5 py-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[14px] font-medium text-text-primary">Monthly email report</p>
          <p className="mt-0.5 text-[12px] text-text-tertiary">
            {enabled
              ? "You\u2019ll receive a branded summary on the 1st of each month"
              : "Get a monthly performance summary delivered to your inbox"}
          </p>
        </div>
        <button
          onClick={toggle}
          disabled={toggling}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${enabled ? "bg-coral" : "bg-text-tertiary/30"} disabled:opacity-50`}
        >
          <div className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${enabled ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>
      {sampleSent && (
        <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-2.5 text-[13px] text-emerald-700">
          Sample report sent to your email — check your inbox for a preview.
        </p>
      )}
    </div>
  );
}
