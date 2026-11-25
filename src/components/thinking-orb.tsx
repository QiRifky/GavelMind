import { useEffect, useRef, useState, type FormEvent } from "react";

type Phase = "idle" | "think" | "answered";
const LABELS = ["Reading repo", "Checking evidence", "Analyzing", "Composing"];

/** Pill input that morphs into a dotted thinking orb, then unfolds into an answer card. */
export function ThinkingOrb({ onAsk, placeholder = "Ask about this project…" }: { onAsk: (q: string) => string; placeholder?: string }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [value, setValue] = useState("");
  const [answer, setAnswer] = useState("");
  const [label, setLabel] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (phase !== "think") return;
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const color = getComputedStyle(el).color;
    const dots: [number, number, number][] = [];
    for (let k = 0; k < 14; k++) {
      const y = 1 - ((k + 0.5) / 14) * 2, r = Math.sqrt(1 - y * y), m = Math.max(4, Math.round(26 * r));
      for (let j = 0; j < m; j++) { const a = (j / m) * Math.PI * 2 + k * 0.35; dots.push([Math.cos(a) * r, y, Math.sin(a) * r]); }
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const t0 = performance.now();
    const draw = (now: number) => {
      const t = reduce ? 0 : (now - t0) / 1000, R = 52, c = 66;
      ctx.clearRect(0, 0, 132, 132);
      ctx.fillStyle = color;
      for (const [x, y, z] of dots) {
        const a = t * 0.9, xr = x * Math.cos(a) + z * Math.sin(a), zr = -x * Math.sin(a) + z * Math.cos(a);
        const pulse = 1 + 0.06 * Math.sin(t * 3 + y * 4);
        ctx.globalAlpha = 0.2 + 0.8 * ((zr + 1) / 2);
        ctx.beginPath();
        ctx.arc(c + xr * R * pulse, c + y * R * pulse, 1 + zr * 0.8 + 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    const lt = setInterval(() => setLabel((l) => (l + 1) % LABELS.length), 650);
    return () => { cancelAnimationFrame(raf); clearInterval(lt); };
  }, [phase]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    setLabel(0);
    setPhase("think");
    const a = onAsk(q);
    setTimeout(() => { setAnswer(a); setPhase("answered"); }, 2400);
  }

  return (
    <div className="relative flex min-h-[220px] flex-col items-center justify-center gap-4">
      {phase === "idle" && (
        <form onSubmit={submit} className="orb-in flex h-14 w-full max-w-xl items-center gap-2 rounded-full border border-border bg-well pl-5 pr-2 shadow-glass focus-within:border-primary/60">
          <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-primary" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2" />
          </svg>
          <input value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} aria-label="Ask the copilot"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-hidden" />
          <button type="submit" disabled={!value.trim()} aria-label="Send"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition disabled:opacity-40 focus-visible:ring-3 focus-visible:ring-ring">
            →
          </button>
        </form>
      )}
      {phase === "think" && (
        <div className="orb-in flex flex-col items-center gap-3" role="status" aria-live="polite">
          <div className="relative grid size-[132px] place-items-center">
            <div className="absolute inset-2 rounded-full bg-primary/15 blur-2xl" />
            <canvas ref={canvas} width={132} height={132} className="relative text-primary" />
          </div>
          <span key={label} className="orb-shimmer orb-in text-sm font-medium">{LABELS[label]}…</span>
        </div>
      )}
      {phase === "answered" && (
        <div className="orb-in w-full max-w-md rounded-2xl border border-primary/30 bg-well p-5 shadow-glass" role="group" aria-label="Answer">
          <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
            <i className="size-1.5 rounded-full bg-primary" />Copilot · reference only
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground">
            {answer.split(" ").map((w, i) => <span key={i} className="orb-word" style={{ animationDelay: `${i * 30}ms` }}>{w} </span>)}
          </p>
          <button type="button" onClick={() => { setValue(""); setPhase("idle"); }}
            className="mt-4 rounded-full border border-border px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring">
            New question
          </button>
        </div>
      )}
    </div>
  );
}
