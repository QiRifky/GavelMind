"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

/** Bottom-edge ribbon adapted from Handoff Beam for text input, without audio simulation. */
export function InputHandoffBeam({ children, className }: { children: ReactNode; className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [focused, setFocused] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const element = host.current;
    const surface = canvas.current;
    if (!element || !surface) return;
    const ctx = surface.getContext("2d");
    if (!ctx) return;
    const tokens = getComputedStyle(element);
    const core = tokens.getPropertyValue("--beam-core").trim();
    const tip = tokens.getPropertyValue("--beam-tip").trim();
    const edge = tokens.getPropertyValue("--beam-edge").trim();
    let frame = 0;
    let visible = false;
    let clock = 0;
    let last = 0;
    let width = 0;
    const height = 22;
    let blend = focused ? 1 : 0;

    function paint(dt: number) {
      if (!ctx || !surface || width <= 0) return;
      blend += ((focused ? 1 : 0) - blend) * (1 - Math.exp(-dt * 9));
      const time = reduced ? 0.8 : clock;
      const span = width * (0.16 + blend * 0.44);
      const start = (width - span) / 2;
      const gradient = ctx.createLinearGradient(start, 0, start + span, 0);
      gradient.addColorStop(0, edge);
      gradient.addColorStop(0.22, core);
      gradient.addColorStop(0.5, tip);
      gradient.addColorStop(0.78, core);
      gradient.addColorStop(1, edge);
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = gradient;
      ctx.shadowColor = core;
      ctx.shadowBlur = 9;
      ctx.globalAlpha = 0.45 + blend * 0.4;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      for (let i = 0; i <= 96; i++) {
        const u = (i / 96) * 2 - 1;
        const taper = (1 - u * u) ** 2;
        const crest = (0.5 + 0.5 * Math.cos(2 * Math.PI * (1.1 * Math.sqrt(u * u + 0.004) + time * 0.55)));
        const y = height - 1.5 - blend * taper * (1.5 + 7 * crest);
        const x = start + (i / 96) * span;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    function tick(now: number) {
      const dt = last ? Math.min(0.04, (now - last) / 1000) : 0;
      last = now;
      clock += dt;
      paint(dt);
      frame = requestAnimationFrame(tick);
    }
    function sync() {
      cancelAnimationFrame(frame);
      last = 0;
      paint(0);
      if (focused && !reduced && visible && !document.hidden) frame = requestAnimationFrame(tick);
    }
    const resize = new ResizeObserver(() => {
      width = element.clientWidth;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      surface.width = Math.max(1, Math.round(width * dpr));
      surface.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
  }, [focused, reduced]);

  return (
    <div ref={host} className={cn("relative min-w-0 overflow-hidden rounded-2xl", className)}
      data-input-beam={focused ? "listening" : "idle"}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      {children}
      <canvas ref={canvas} aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[22px] w-full" />
    </div>
  );
}