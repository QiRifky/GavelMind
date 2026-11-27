import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export const BLUR_KEY = "gavelmind-card-blur-pct";
export const clampPct = (pct: number) => Math.min(100, Math.max(0, pct));
/** 0% = no blur (the level first-time visitors see), 50% = the designed glass blur, 100% = strong (2×). */
export const blurScale = (pct: number) => clampPct(pct) / 50;

/** Saved card-blur level, or null when this device has no choice yet. */
export function readBlurPct(): number | null {
  const raw = window.localStorage.getItem(BLUR_KEY);
  if (raw === null) return null;
  const v = Number(raw);
  return Number.isFinite(v) ? clampPct(v) : null;
}

/** Persist the chosen level the moment the slider moves so it never reverts. */
export function writeBlurPct(pct: number) {
  window.localStorage.setItem(BLUR_KEY, String(clampPct(pct)));
}

/** Paint the chosen level onto the glass utilities. */
export function applyBlur(pct: number) {
  document.documentElement.style.setProperty("--blur-scale", String(blurScale(pct)));
}

/** Display control: a volume-style slider for how strongly glass cards blur the background. */
export function BlurControl({ className }: { className?: string }) {
  // First visit shows 0% (fully clear) until the user picks a level.
  const [pct, setPct] = useState(0);
  // Show the saved level on mount. Only the user's own drag writes to storage,
  // so opening and closing the panel can never overwrite the saved choice.
  useEffect(() => {
    const saved = readBlurPct();
    if (saved !== null) {
      setPct(saved);
      applyBlur(saved);
    }
  }, []);
  const change = (v: number) => {
    const c = clampPct(v);
    setPct(c);
    writeBlurPct(c);
    applyBlur(c);
  };
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-3 text-xs font-medium text-muted-foreground">
        <label htmlFor="card-blur">Card blur</label>
        <span className="tabular-nums text-foreground">{pct}%</span>
      </div>
      <input id="card-blur" type="range" min={0} max={100} step={1} value={pct}
        onChange={(e) => change(Number(e.target.value))}
        aria-valuetext={`${pct}%`}
        className="w-full max-w-64 cursor-pointer accent-primary" />
      <div className="flex max-w-64 justify-between text-[11px] text-muted-foreground"><span>Clear</span><span>Strong</span></div>
    </div>
  );
}
