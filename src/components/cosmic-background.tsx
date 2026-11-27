import { useEffect, useRef } from "react";

/** Fixed starfield + warm horizon glow behind every page. Static when reduced motion is preferred. */
export function CosmicBackground() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const colors = ["#ffffff", "#e0f2fe", "#fdf4ff", "#fbcfe8", "#bae6fd"];
    type Star = { x: number; y: number; s: number; o: number; t: number; c: string; sp: boolean };
    type Shot = { x: number; y: number; l: number; v: number; a: number; life: number };
    let w = 0, h = 0, stars: Star[] = [], shots: Shot[] = [], raf = 0, tick = 0;
    let mx = 0, my = 0, tx = 0, ty = 0;

    const init = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      stars = Array.from({ length: Math.floor((w * h) / 3200) }, () => {
        const sp = Math.random() < 0.08;
        return {
          x: Math.random() * w, y: Math.random() * h,
          s: sp ? Math.random() * 1.8 + 1.2 : Math.random() * 1.3 + 0.5,
          o: sp ? 0.6 + Math.random() * 0.4 : 0.2 + Math.random() * 0.7,
          t: 0.008 + Math.random() * 0.02,
          c: colors[Math.floor(Math.random() * colors.length)]!, sp,
        };
      });
    };

    const draw = () => {
      tick++;
      mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;
      ctx.clearRect(0, 0, w, h);
      stars.forEach((st, i) => {
        ctx.globalAlpha = Math.max(0.1, Math.min(1, st.o + (reduce ? 0 : Math.sin(tick * st.t + i) * 0.35)));
        ctx.fillStyle = st.c;
        const x = st.x + mx * st.s * 0.8, y = st.y + my * st.s * 0.8;
        ctx.beginPath();
        if (st.sp) {
          const s = st.s * 2.2;
          ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.25, y - s * 0.25); ctx.lineTo(x + s, y);
          ctx.lineTo(x + s * 0.25, y + s * 0.25); ctx.lineTo(x, y + s); ctx.lineTo(x - s * 0.25, y + s * 0.25);
          ctx.lineTo(x - s, y); ctx.lineTo(x - s * 0.25, y - s * 0.25); ctx.closePath(); ctx.fill();
          ctx.beginPath();
        }
        ctx.arc(x, y, st.sp ? st.s * 0.8 : st.s, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      if (reduce) return;
      if (Math.random() < 0.012 && shots.length < 2)
        shots.push({ x: Math.random() * w, y: Math.random() * h * 0.5, l: Math.random() * 80 + 40, v: Math.random() * 9 + 7, a: Math.PI / 4 + (Math.random() * 0.2 - 0.1), life: 1 });
      for (let i = shots.length - 1; i >= 0; i--) {
        const s = shots[i]!;
        s.x += Math.cos(s.a) * s.v; s.y += Math.sin(s.a) * s.v; s.life -= 0.015;
        if (s.life <= 0 || s.x > w + 100 || s.y > h + 100) { shots.splice(i, 1); continue; }
        ctx.strokeStyle = `rgba(255,255,255,${s.life * 0.8})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - Math.cos(s.a) * s.l, s.y - Math.sin(s.a) * s.l); ctx.stroke();
      }
      raf = requestAnimationFrame(draw);
    };

    const onResize = () => { init(); if (reduce) draw(); };
    const onMove = (e: MouseEvent) => { tx = (e.clientX - w / 2) * 0.03; ty = (e.clientY - h / 2) * 0.03; };
    const onVis = () => { cancelAnimationFrame(raf); if (!document.hidden) draw(); };
    init(); draw();
    window.addEventListener("resize", onResize);
    if (!reduce) window.addEventListener("mousemove", onMove);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <canvas ref={ref} className="absolute inset-0" />
      <div className="cosmic-horizon absolute inset-x-0 bottom-0 h-[55vh]" />
      <div className="cosmic-horizon-core absolute inset-x-0 bottom-0 h-[30vh]" />
    </div>
  );
}
