import type { ReactNode } from "react";

export interface BentoTile { label: string; value: ReactNode; hint?: string }
interface Props {
  hero: { badge: string; value: ReactNode; caption: string };
  trend: { label: string; value: ReactNode; bars: number[] };
  tiles: [BentoTile, BentoTile];
}

/** Compact stats bento adapted from the StatsBento reference: striped orange hero, micro-bar trend card, two small tiles. */
export function StatsBento({ hero, trend, tiles }: Props) {
  const max = Math.max(1, ...trend.bars);
  return (
    <div className="mb-4 grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-6">
      <div className="relative col-span-2 flex items-center justify-between gap-4 overflow-hidden rounded-card bg-primary px-6 py-4 text-primary-foreground">
        <div aria-hidden className="bento-stripes pointer-events-none absolute inset-0" />
        <div className="relative min-w-0">
          <span className="inline-block rounded-full bg-primary-foreground/10 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground/70">{hero.badge}</span>
          <p className="mt-1 truncate text-xs text-primary-foreground/70">{hero.caption}</p>
        </div>
        <p className="relative shrink-0 text-4xl tracking-tighter tabular-nums">{hero.value}</p>
      </div>
      <div className="col-span-2 flex items-center justify-between gap-4 rounded-card border border-border bg-card px-6 py-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{trend.label}</p>
          <p className="mt-1 text-2xl tabular-nums text-foreground">{trend.value}</p>
        </div>
        <div aria-hidden className="flex h-10 shrink-0 items-end gap-1">
          {(trend.bars.length ? trend.bars : [0]).map((h, i) => <div key={i} className="w-1.5 rounded-full bg-primary" style={{ height: `${Math.max(8, (h / max) * 100)}%`, opacity: h ? 1 : 0.3 }} />)}
        </div>
      </div>
      {tiles.map((t) => (
        <div key={t.label} className="flex flex-col justify-center rounded-card border border-border bg-card px-5 py-4 text-center">
          <p className="truncate text-xl tabular-nums text-foreground">{t.value}</p>
          <p className="truncate text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{t.label}</p>
        </div>
      ))}
    </div>
  );
}
