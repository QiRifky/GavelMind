import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Accent = "orange" | "rust" | "green" | "amber";
export const ACCENTS: Record<Accent, string> = {
  orange: "var(--glow-orange)",
  rust: "var(--glow-ember)",
  green: "var(--glow-green)",
  amber: "var(--glow-amber)",
};

const GRID =
  "linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)";

/** Cursor position lives in CSS variables (--mx/--my) so moving never re-renders React. */
export function GlowCard({ accent, className, children, label }: { accent: Accent; className?: string; children: ReactNode; label: string }) {
  const ref = useRef<HTMLElement>(null);
  const rgb = ACCENTS[accent];
  const move = (x: number, y: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${x - r.left}px`);
    el.style.setProperty("--my", `${y - r.top}px`);
  };
  const on = () => ref.current?.setAttribute("data-active", "");
  const off = () => ref.current?.removeAttribute("data-active");
  const layer = "absolute transition-opacity duration-500 opacity-0 group-data-[active]:opacity-100 motion-reduce:transition-none";
  return (
    <section
      ref={ref}
      aria-label={label}
      style={{ ["--rgb" as string]: rgb, ["--mx" as string]: "50%", ["--my" as string]: "0px" }}
      onPointerMove={(e) => move(e.clientX, e.clientY)}
      onPointerEnter={on}
      onPointerLeave={(e) => { if (e.pointerType === "mouse") off(); }}
      onTouchStart={(e) => { const t = e.touches[0]; if (t) { move(t.clientX, t.clientY); on(); } }}
      onTouchMove={(e) => { const t = e.touches[0]; if (t) move(t.clientX, t.clientY); }}
      onTouchEnd={off}
      onFocus={(e) => {
        on();
        const r = ref.current?.getBoundingClientRect();
        const t = (e.target as HTMLElement).getBoundingClientRect();
        if (r) { ref.current?.style.setProperty("--mx", `${t.left - r.left + t.width / 2}px`); ref.current?.style.setProperty("--my", `${t.top - r.top + t.height / 2}px`); }
      }}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) off(); }}
      className={cn("group relative rounded-[calc(var(--radius)-2px)]", className)}
    >
      <div aria-hidden className="absolute inset-0 rounded-[calc(var(--radius)-2px)] bg-border shadow-[var(--shadow-tile)]" />
      <div aria-hidden className={cn(layer, "inset-0 rounded-[calc(var(--radius)-2px)]")}
        style={{ background: "radial-gradient(240px circle at var(--mx) var(--my), rgba(var(--rgb), 0.9), transparent 70%)" }} />
      <div aria-hidden className="absolute inset-px overflow-hidden rounded-[calc(var(--radius)-3px)] bg-card">
        <div className={cn(layer, "inset-0")}
          style={{ background: "radial-gradient(380px circle at var(--mx) var(--my), rgba(var(--rgb), 0.18), transparent 65%)" }} />
        <div className={cn(layer, "inset-0")}
          style={{
            backgroundImage: GRID,
            backgroundSize: "26px 26px",
            maskImage: "radial-gradient(220px circle at var(--mx) var(--my), black, transparent 75%)",
          }} />
      </div>
      <div className="relative z-10 flex h-full flex-col p-5 sm:p-6">{children}</div>
    </section>
  );
}

export function CardTitle({ children, right, accent }: { children: ReactNode; right?: ReactNode; accent: Accent }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
        <span className="size-1.5 rounded-full" style={{ background: `rgb(${ACCENTS[accent]})` }} />
        {children}
      </h3>
      {right}
    </div>
  );
}

export function CardState({ kind, children }: { kind: "loading" | "empty" | "error"; children?: ReactNode }) {
  if (kind === "loading")
    return (
      <div role="status" className="space-y-2" aria-label="Loading">
        <div className="h-3 w-2/3 animate-pulse rounded bg-foreground/10 motion-reduce:animate-none" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-foreground/10 motion-reduce:animate-none" />
      </div>
    );
  return <p className={cn("text-sm", kind === "error" ? "text-fail" : "text-muted-foreground")}>{children}</p>;
}
