import { useEffect, useRef, useState, type ReactNode } from "react";
import { BorderBeam } from "@/components/ui/border-beam-search";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

export type BeamPhase = "idle" | "listening" | "thinking" | "speaking";

// Override the library's decorative colors, never its content or state logic.
const palette = `
[data-beam="{id}"]::after {
  background: linear-gradient(90deg, var(--beam-core), var(--beam-tip), var(--beam-core)) !important;
}
[data-beam="{id}"]::before {
  background: linear-gradient(0deg, var(--beam-wash), transparent 30px) !important;
  box-shadow: var(--beam-inset-shadow) !important;
}
[data-beam="{id}"] [data-beam-bloom] {
  background: linear-gradient(0deg, var(--beam-wash), transparent 32px) !important;
}
.handoff-beam[data-beam-resting="true"] [data-beam="{id}"],
.handoff-beam[data-beam-resting="true"] [data-beam="{id}"]::before,
.handoff-beam[data-beam-resting="true"] [data-beam="{id}"]::after,
.handoff-beam[data-beam-resting="true"] [data-beam="{id}"] [data-beam-bloom] {
  animation-play-state: paused !important;
}
.handoff-beam[data-beam-resting="true"] [data-beam="{id}"] {
  --beam-x-{id}: 0.5 !important;
  --beam-w-{id}: 1 !important;
  --beam-h-{id}: 0.8 !important;
  --beam-edge-{id}: 1 !important;
  --beam-opacity-{id}: 0.45 !important;
}
`;

/** Shared AI treatment: traveling border while working, quiet static glow otherwise. */
export function HandoffBeam({ phase, children, className, radius = 20, intensity = 1 }: {
  phase: BeamPhase;
  children: ReactNode;
  className?: string;
  radius?: number;
  reach?: number;
  intensity?: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry?.isIntersecting ?? false));
    const sync = () => setTabVisible(!document.hidden);
    observer.observe(element);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  const resting = phase === "idle" || reduced || !visible || !tabVisible;
  return (
    <div ref={host} data-beam-phase={phase} data-beam-resting={resting} className="handoff-beam">
      <BorderBeam size="line" colorVariant="sunset" theme="dark" staticColors duration={3.1}
        borderRadius={radius} strength={intensity} brightness={1.1} glowSize={0.7} css={palette}
        className={cn("min-w-0", className)}>
        {children}
      </BorderBeam>
    </div>
  );
}
