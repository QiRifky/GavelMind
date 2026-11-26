import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * BenchMatrix — compares many columns (e.g. AI models) across grouped rows.
 * Themed with app tokens only (no hex). Best value per row is bold on a plate;
 * hovering a row dims others, hovering a cell highlights its column.
 */
export type BenchMatrixModel = { id: string; label: string; vendor?: string; hero?: boolean };
export type BenchMatrixRow = { bench: string; note?: string; values: (number | null)[]; decimals?: number };
export type BenchMatrixGroup = { label: string; rows: BenchMatrixRow[] };

const MOTION_CSS = `
.vbm-row { transition: opacity .2s ease; }
.vbm-body:hover .vbm-row:not(:hover) { opacity: .45; }
.vbm-cell { transition: background-color .15s ease; }
.vbm-enter .vbm-row { animation: vbm-in .5s cubic-bezier(.2,.7,.3,1) both; animation-delay: var(--vbm-d, 0ms); }
@keyframes vbm-in { from { opacity: 0; transform: translateY(6px); } }
@media (prefers-reduced-motion: reduce) {
  .vbm-row, .vbm-cell { transition: none !important; }
  .vbm-enter .vbm-row { animation: none !important; }
  .vbm-body:hover .vbm-row:not(:hover) { opacity: 1; }
}`;

export function BenchMatrix({ models, groups, meta, footnote, decimals = 1, benchColLabel = "benchmark" }: {
  models: BenchMatrixModel[]; groups: BenchMatrixGroup[]; meta?: string; footnote?: string; decimals?: number; benchColLabel?: string;
}) {
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const [entered, setEntered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") { setEntered(true); return; }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setEntered(true); io.disconnect(); } }, { threshold: 0.15 });
    io.observe(node);
    return () => io.disconnect();
  }, []);
  const heroIndex = models.findIndex((m) => m.hero);
  const cellCls = (col: number, best: boolean) =>
    hoverCol === col ? "bg-secondary" : col === heroIndex ? "bg-primary/10" : best ? "bg-muted" : "";
  let rowIndex = 0;
  return (
    <div ref={ref} className={entered ? "vbm-enter" : ""}>
      <style>{MOTION_CSS}</style>
      {meta ? <p className="mb-2.5 text-right text-xs text-muted-foreground">{meta}</p> : null}
      <div className="overflow-hidden rounded-card border border-border bg-well text-foreground">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse tabular-nums" onMouseLeave={() => setHoverCol(null)}>
            <thead>
              <tr className="border-b border-border">
                <th colSpan={2} className="px-4 py-3 text-left font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{benchColLabel}</th>
                {models.map((m, col) => (
                  <th key={m.id} onMouseEnter={() => setHoverCol(col)} className={cn("vbm-cell px-3 py-3 text-center align-top", cellCls(col, false))}>
                    <span className={cn("block text-[13px] font-semibold leading-tight", col === heroIndex && "text-primary")}>{m.label}</span>
                    {m.vendor ? <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">{m.vendor}</span> : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="vbm-body">
              {groups.map((g) => g.rows.map((row, r) => {
                const i = rowIndex++;
                const nums = row.values.filter((v): v is number => v !== null);
                const best = nums.length > 1 ? Math.max(...nums) : null;
                const dec = row.decimals ?? decimals;
                return (
                  <tr key={g.label + row.bench} className={cn("vbm-row border-t", r === 0 ? "border-border" : "border-border/50")} style={{ ["--vbm-d" as string]: `${i * 45}ms` }}>
                    {r === 0 ? (
                      <td rowSpan={g.rows.length} className="w-[40px] border-r border-border/50 px-2 text-center">
                        <span className="inline-block rotate-180 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-primary" style={{ writingMode: "vertical-rl" }}>{g.label}</span>
                      </td>
                    ) : null}
                    <td className="min-w-[170px] px-4 py-3">
                      <span className="block text-[13.5px] font-semibold leading-tight">{row.bench}</span>
                      {row.note ? <span className="mt-0.5 block text-[11.5px] leading-snug text-muted-foreground">{row.note}</span> : null}
                    </td>
                    {models.map((m, col) => {
                      const v = row.values[col] ?? null;
                      const isBest = v !== null && best !== null && v === best;
                      return (
                        <td key={m.id} onMouseEnter={() => setHoverCol(col)} className={cn("vbm-cell px-3 py-3 text-center font-mono text-sm", cellCls(col, isBest), isBest ? "font-bold text-foreground" : v === null ? "text-muted-foreground" : "text-foreground/75", col === heroIndex && v !== null && "text-primary")}>
                          {v === null ? "—" : v.toFixed(dec)}
                        </td>
                      );
                    })}
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
      {footnote ? <p className="mt-3 text-xs leading-5 text-muted-foreground">{footnote}</p> : null}
    </div>
  );
}
