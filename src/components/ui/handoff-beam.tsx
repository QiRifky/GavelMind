import { useEffect, useRef, type ReactNode } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

export type BeamPhase = "idle" | "listening" | "thinking" | "speaking";

/** Self-contained adaptation of Handoff Beam: a decorative, token-colored canvas ribbon. */
export function HandoffBeam({ phase, children, className, radius = 20, reach = 28, intensity = 1 }: {
  phase: BeamPhase;
  children: ReactNode;
  className?: string;
  radius?: number;
  reach?: number;
  intensity?: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const element = host.current;
    const surface = canvas.current;
    const context = surface?.getContext("2d");
    if (!element || !surface || !context) return;
    let frame = 0;
    let visible = true;
    let width = 0;
    let height = 0;
    let clock = 0;
    let previous = 0;
    const styles = getComputedStyle(element);
    const edge = styles.getPropertyValue("--beam-edge").trim();
    const core = styles.getPropertyValue("--beam-core").trim();
    const tip = styles.getPropertyValue("--beam-tip").trim();
    const animated = phase !== "idle" && !reduced;

    const paint = () => {
      if (width <= 0 || height <= 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      const span = width * (phase === "idle" ? 0.38 : 0.78);
      const start = (width - span) / 2;
      const base = height - 2;
      const gradient = context.createLinearGradient(start, base, start + span, base);
      gradient.addColorStop(0, edge);
      gradient.addColorStop(0.35, core);
      gradient.addColorStop(0.5, tip);
      gradient.addColorStop(0.65, core);
      gradient.addColorStop(1, edge);
      context.strokeStyle = gradient;
      context.shadowColor = core;
      const shimmer = reduced ? 0 : Math.sin(clock * 1.4);
      for (let layer = 0; layer < 3; layer++) {
        context.beginPath();
        for (let i = 0; i <= 96; i++) {
          const u = (i / 96) * 2 - 1;
          const taper = (1 - u * u) ** 2;
          const wave = phase === "thinking"
            ? 0.12 + 0.6 * Math.exp(-(((u - shimmer) / 0.3) ** 2))
            : phase === "idle" ? 0.04
            : 0.22 + 0.16 * Math.sin(Math.abs(u) * 8 + clock * (phase === "listening" ? 2 : -2));
          const x = start + (i / 96) * span;
          const y = base - height * 0.65 * taper * wave;
          if (i === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.globalAlpha = Math.min(1, intensity) * (layer === 2 ? 0.9 : layer === 1 ? 0.25 : 0.1);
        context.lineWidth = layer === 2 ? 1.3 : layer === 1 ? 4 : 9;
        context.shadowBlur = layer === 2 ? 6 : 16;
        context.stroke();
      }
      context.globalAlpha = 1;
      context.shadowBlur = 0;
    };
    const tick = (now: number) => {
      if (previous) clock += Math.min((now - previous) / 1000, 0.05);
      previous = now;
      paint();
      frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      previous = 0;
      paint();
      if (animated && visible && !document.hidden) frame = requestAnimationFrame(tick);
    };
    const resize = new ResizeObserver(() => {
      width = element.clientWidth;
      height = Math.min(reach, element.clientHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      surface.width = Math.round(width * dpr);
      surface.height = Math.round(height * dpr);
      surface.style.height = `${height}px`;
      sync();
    });
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      sync();
    });
    resize.observe(element);
    intersection.observe(element);
    document.addEventListener("visibilitychange", sync);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [phase, reach, intensity, reduced]);

  return <div ref={host} data-beam-phase={phase} className={cn("handoff-beam", className)} style={{ borderRadius: radius }}>
    {children}
    <canvas ref={canvas} className="handoff-beam-canvas" aria-hidden="true" />
  </div>;
}