import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Accent = "orange" | "rust" | "green" | "amber";
export const ACCENTS: Record<Accent, string> = {
  orange: "var(--glow-orange)",
  rust: "var(--glow-ember)",
  green: "var(--glow-green)",
  amber: "var(--glow-amber)",
};

/** Card surface: border ring, soft shadow, and a blurred panel. No mouse-following glow. */
export function GlowCard({ className, children, label }: { accent: Accent; className?: string; children: ReactNode; label: string }) {
  return (
    <section aria-label={label} className={cn("relative rounded-3xl", className)}>
      <div aria-hidden className="absolute inset-0 rounded-3xl bg-border shadow-[var(--shadow-tile)]" />
      <div aria-hidden className="absolute inset-px overflow-hidden rounded-[23px] bg-card/85 backdrop-blur-sm" />
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
