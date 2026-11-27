import { useEffect, useRef } from "react";

/** Fixed cosmic starfield + horizon glow behind every non-landing page. */
export function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const css = getComputedStyle(document.documentElement);
    const starColors = css.getPropertyValue("--cosmic-stars").split(",").map((c) => c.trim()).filter(Boolean);
    const trail = css.getPropertyValue("--cosmic-trail").trim() || "255 255 255";
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0, height = 0, frame = 0, tick = 0;
    type Star = { x: number; y: number; size: number; base: number; speed: number; color: string; sparkle: boolean };
    type Shoot = { x: number; y: number; length: number; speed: number; angle: number; life: number };
    let stars: Star[] = [];
    const shooting: Shoot[] = [];
    let tx = 0, ty = 0, cx = 0, cy = 0;

    const init = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      stars = Array.from({ length: Math.floor((width * height) / 3200) }, () => {
        const sparkle = Math.random() < 0.08;
        return {
          x: Math.random() * width, y: Math.random() * height,
          size: sparkle ? Math.random() * 1.8 + 1.2 : Math.random() * 1.3 + 0.5,
          base: sparkle ? 0.6 + Math.random() * 0.4 : 0.2 + Math.random() * 0.7,
          speed: 0.008 + Math.random() * 0.02,
          color: starColors[Math.floor(Math.random() * starColors.length)] ?? "white",
          sparkle,
        };
      });
    };

    const draw = () => {
      tick++;
      cx += (tx - cx) * 0.05; cy += (ty - cy) * 0.05;
      ctx.clearRect(0, 0, width, height);
      stars.forEach((s, i) => {
        ctx.globalAlpha = Math.max(0.1, Math.min(1, s.base + Math.sin(tick * s.speed + i) * 0.35));
        ctx.fillStyle = s.color;
        const x = s.x + cx * s.size * 0.8, y = s.y + cy * s.size * 0.8;
        ctx.beginPath();
        if (s.sparkle) {
          const r = s.size * 2.2;
          ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.25, y - r * 0.25); ctx.lineTo(x + r, y);
          ctx.lineTo(x + r * 0.25, y + r * 0.25); ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.25, y + r * 0.25);
          ctx.lineTo(x - r, y); ctx.lineTo(x - r * 0.25, y - r * 0.25); ctx.closePath(); ctx.fill();
          ctx.beginPath(); ctx.arc(x, y, s.size * 0.8, 0, Math.PI * 2);
        } else ctx.arc(x, y, s.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      if (reduce) return;
      if (Math.random() < 0.012 && shooting.length < 2) {
        shooting.push({ x: Math.random() * width, y: Math.random() * height * 0.5, length: Math.random() * 80 + 40, speed: Math.random() * 9 + 7, angle: Math.PI / 4 + (Math.random() * 0.2 - 0.1), life: 1 });
      }
      for (let i = shooting.length - 1; i >= 0; i--) {
        const s = shooting[i];
        if (!s) continue;
        s.x += Math.cos(s.angle) * s.speed; s.y += Math.sin(s.angle) * s.speed; s.life -= 0.015;
        if (s.life <= 0 || s.x > width + 100 || s.y > height + 100) { shooting.splice(i, 1); continue; }
        ctx.strokeStyle = `rgb(${trail} / ${s.life * 0.8})`; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - Math.cos(s.angle) * s.length, s.y - Math.sin(s.angle) * s.length); ctx.stroke();
      }
      frame = requestAnimationFrame(draw);
    };

    const onResize = () => { init(); if (reduce) draw(); };
    const onMove = (e: MouseEvent) => { tx = (e.clientX - width / 2) * 0.03; ty = (e.clientY - height / 2) * 0.03; };
    init(); draw();
    window.addEventListener("resize", onResize);
    if (!reduce) window.addEventListener("mousemove", onMove);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", onResize); window.removeEventListener("mousemove", onMove); };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-(--cosmic-bg)">
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="absolute -bottom-48 left-1/2 h-[480px] w-[160vw] max-w-[1900px] -translate-x-1/2 sm:-bottom-56 sm:h-[550px] md:-bottom-64 md:h-[620px]">
        <div className="size-full rounded-[100%] blur-[32px]" style={{ background: "var(--cosmic-glow)" }} />
        <div className="absolute inset-0 rounded-[100%] opacity-25 mix-blend-screen blur-[48px]" style={{ background: "var(--cosmic-glow-soft)" }} />
      </div>
    </div>
  );
}
