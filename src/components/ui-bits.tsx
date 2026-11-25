import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Pill({ variant = "primary", className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "ink" }) {
  return (
    <button
      {...p}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        variant === "primary" && "bg-primary text-primary-foreground hover:brightness-105",
        variant === "outline" && "border border-border bg-secondary text-foreground hover:bg-card",
        variant === "ink" && "bg-foreground text-background hover:opacity-90",
        className,
      )}
    />
  );
}

export function PageHead({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <header className="mb-8">
      <p className="eyebrow flex items-center gap-2"><span className="size-1.5 rounded-full bg-primary" />{eyebrow}</p>
      <h1 className="mt-3 text-[clamp(2rem,1rem+2.6vw,3.2rem)] font-normal leading-[1.05] tracking-[-0.035em]">{title}</h1>
      {children && <div className="mt-3 max-w-2xl text-muted-foreground">{children}</div>}
    </header>
  );
}

export function AiNotice() {
  return (
    <div role="note" className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-accent px-4 py-3 text-sm text-accent-foreground">
      <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
      AI scores are suggestions to help you decide. The final decision is yours.
    </div>
  );
}

export function Badge({ tone, children }: { tone: "neutral" | "accent" | "good" | "bad"; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
      tone === "neutral" && "bg-muted text-muted-foreground",
      tone === "accent" && "bg-accent text-accent-foreground",
      tone === "good" && "bg-success/15 text-success",
      tone === "bad" && "bg-destructive/10 text-destructive")}>{children}</span>
  );
}
