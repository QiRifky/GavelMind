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
  const motion = useRef({ blend: 0, velocity: 0, clock: 0 });

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
    let last = 0;
    let width = 0;
    const height = 22;
    const state = motion.current;
    const heights = new Float32Array(97);
    const tapers = new Float32Array(97);
    for (let i = 0; i <= 96; i++) {
      const u = (i / 96) * 2 - 1;
      tapers[i] = (1 - u * u) ** 2;
    }

    function settled() {
      return Math.abs(state.blend - (focused ? 1 : 0)) < 0.001 && Math.abs(state.velocity) < 0.001;
    }

    function paint(dt: number) {
      if (!ctx || !surface || width <= 0) return;
      const target = focused ? 1 : 0;
      if (reduced) {
        state.blend = target;
        state.velocity = 0;
      } else {
        // Exact critically damped spring with stiffness 64, damping 16, mass 1.
        const displacement = state.blend - target;
        const coefficient = state.velocity + 8 * displacement;
        const decay = Math.exp(-8 * dt);
        state.blend = target + (displacement + coefficient * dt) * decay;
        state.velocity = (state.velocity - 8 * coefficient * dt) * decay;
      }
      const blend = Math.min(1, Math.max(0, state.blend));
      const time = reduced ? 0.8 : state.clock;
      const span = width * (0.16 + blend * 0.44);
      const start = (width - span) / 2;
      const gradient = ctx.createLinearGradient(start, 0, start + span, 0);
      gradient.addColorStop(0, edge);
      gradient.addColorStop(0.22, core);
      gradient.addColorStop(0.5, tip);
      gradient.addColorStop(0.78, core);
      gradient.addColorStop(1, edge);
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = gradient;
      ctx.shadowBlur = 0;
      for (let i = 0; i <= 96; i++) {
        const u = (i / 96) * 2 - 1;
        const distance = Math.sqrt(u * u + 0.004);
        const bump = (cycles: number) => 0.5 + 0.5 * Math.cos(2 * Math.PI * cycles);
        const crests = 0.65 * bump(1.1 * distance + time * 0.55)
          + 0.25 * bump(2.3 * distance + time * 0.95 + 0.18 * u)
          + 0.1 * bump(3.8 * distance + time * 1.5 - 0.3 * u);
        heights[i] = blend * (tapers[i] ?? 0) * (0.8 + 5 * crests);
      }
      const base = height - 1;
      // Tapered filled ribbons retain the fine core and soft haze from the supplied design.
      function ribbon(half: number, opacity: number) {
        if (!ctx) return;
        ctx.globalAlpha = opacity * (0.42 + blend * 0.35);
        ctx.beginPath();
        for (let i = 0; i <= 96; i++) {
          const x = start + (i / 96) * span;
          const thickness = half * Math.sqrt(tapers[i] ?? 0);
          const y = base - (heights[i] ?? 0) - thickness;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        for (let i = 96; i >= 0; i--) {
          ctx.lineTo(start + (i / 96) * span,
            base - (heights[i] ?? 0) + half * Math.sqrt(tapers[i] ?? 0));
        }
        ctx.closePath();
        ctx.fill();
      }
      ribbon(5.5, 0.07);
      ribbon(2.2, 0.26);
      ribbon(0.85, 1);
    }

    function tick(now: number) {
      const dt = last ? Math.min(0.04, (now - last) / 1000) : 0;
      last = now;
      state.clock += dt;
      paint(dt);
      if (focused || !settled()) frame = requestAnimationFrame(tick);
    }
    function sync() {
      cancelAnimationFrame(frame);
      last = 0;
      paint(0);
      if ((focused || !settled()) && !reduced && visible && !document.hidden) frame = requestAnimationFrame(tick);
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