import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Moon, Sun, Volume2, VolumeX } from "lucide-react";

/**
 * Full-screen cinematic hero with day/night footage and an optional ambient
 * soundscape. Audio is synthesized locally and starts only after a user click.
 */
export interface ElsewhereLink {
  label: string;
  href: string;
}

export interface ElsewhereHeroProps {
  daySrc?: string;
  nightSrc?: string;
  brand?: string;
  links?: ElsewhereLink[];
  navCta?: ElsewhereLink | false;
  headline?: string;
  subline?: string;
  primaryCta?: ElsewhereLink;
  listenLabel?: string;
  listenOffLabel?: string;
  soundHint?: string;
  signature?: { name: string; url: string } | false;
  objectPosition?: string;
  variant?: "hero" | "ambient";
  className?: string;
  style?: CSSProperties;
}

const DEFAULT_DAY =
  "https://cdn.21st.dev/assets/mirror/a6/a639af57ee941fdd518c604efb043501ad0e815dcce9f7efba850998bafa3453.mp4";
const DEFAULT_NIGHT =
  "https://cdn.21st.dev/assets/mirror/4b/4badf32b0bc920a2fd1b066182eee89e98d8615f680e01fb19ff62fb56e86872.mp4";
const DEFAULT_SIGNATURE = {
  name: "guglielmogiannattasio.exe",
  url: "https://www.guglielmogiannattasio.it",
};
const DEFAULT_LINKS: ElsewhereLink[] = [
  { label: "Soundscapes", href: "#soundscapes" },
  { label: "How it works", href: "#how" },
  { label: "Pricing", href: "#pricing" },
];

function createAmbientEngine(ctx: AudioContext) {
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  const droneGain = ctx.createGain();
  droneGain.gain.value = 0.16;
  droneGain.connect(master);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 700;
  filter.connect(droneGain);

  const droneA = ctx.createOscillator();
  droneA.type = "sine";
  droneA.frequency.value = 110;
  const droneB = ctx.createOscillator();
  droneB.type = "sine";
  droneB.frequency.value = 110 * 1.008;
  droneA.connect(filter);
  droneB.connect(filter);

  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 0.045;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 260;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  droneA.start();
  droneB.start();
  lfo.start();

  const dayGain = ctx.createGain();
  dayGain.gain.value = 0;
  dayGain.connect(master);
  const nightGain = ctx.createGain();
  nightGain.gain.value = 0;
  nightGain.connect(master);

  const timers: ReturnType<typeof setTimeout>[] = [];
  const clearTimers = () => {
    timers.forEach(clearTimeout);
    timers.length = 0;
  };

  const distantGain = ctx.createGain();
  distantGain.gain.value = 0.34;
  distantGain.connect(master);
  const distantFilter = ctx.createBiquadFilter();
  distantFilter.type = "lowpass";
  distantFilter.frequency.value = 1300;
  distantFilter.connect(distantGain);

  function distantKeyClick(time: number) {
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = 280 + Math.random() * 160;
    osc.detune.value = (Math.random() - 0.5) * 120;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(0.55, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.13);
    osc.connect(gain);
    gain.connect(distantFilter);
    osc.start(time);
    osc.stop(time + 0.16);
  }

  function scheduleDistantTyping() {
    let time = 0;
    const count = 2 + Math.floor(Math.random() * 5);
    for (let index = 0; index < count; index += 1) {
      timers.push(setTimeout(() => distantKeyClick(ctx.currentTime), time));
      time += 110 + Math.random() * 170;
    }
    timers.push(setTimeout(scheduleDistantTyping, time + 700 + Math.random() * 1400));
  }

  function typingBlip(time: number) {
    const osc = ctx.createOscillator();
    osc.type = "square";
    const scale = [560, 620, 680, 760, 900];
    const base = scale[Math.floor(Math.random() * scale.length)] ?? 560;
    osc.frequency.value = Math.random() < 0.12 ? base * 2.6 : base;
    osc.detune.value = (Math.random() - 0.5) * 500;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(0.45, time + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    osc.connect(gain);
    gain.connect(dayGain);
    osc.start(time);
    osc.stop(time + 0.07);
  }

  function scheduleTyping() {
    let time = 0;
    const count = 3 + Math.floor(Math.random() * 6);
    for (let index = 0; index < count; index += 1) {
      timers.push(setTimeout(() => typingBlip(ctx.currentTime), time));
      time += 90 + Math.random() * 150;
    }
    timers.push(setTimeout(scheduleTyping, time + 900 + Math.random() * 1800));
  }

  function cicadaBurst() {
    const now = ctx.currentTime;
    const duration = 0.6 + Math.random() * 1.1;
    const carrier = ctx.createOscillator();
    carrier.type = "sawtooth";
    carrier.frequency.value = 4000 + Math.random() * 900;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = carrier.frequency.value;
    band.Q.value = 9;
    const amp = ctx.createGain();
    amp.gain.value = 0;
    const chop = ctx.createOscillator();
    chop.type = "sine";
    chop.frequency.value = 28 + Math.random() * 14;
    const chopDepth = ctx.createGain();
    chopDepth.gain.value = 0.28;
    const chopOffset = ctx.createConstantSource();
    chopOffset.offset.value = 0.28;
    chop.connect(chopDepth);
    chopDepth.connect(amp.gain);
    chopOffset.connect(amp.gain);
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(0.4, now + duration * 0.25);
    envelope.gain.linearRampToValueAtTime(0, now + duration);
    carrier.connect(band);
    band.connect(amp);
    amp.connect(envelope);
    envelope.connect(nightGain);
    carrier.start(now);
    chop.start(now);
    chopOffset.start(now);
    carrier.stop(now + duration);
    chop.stop(now + duration);
    chopOffset.stop(now + duration);
  }

  function scheduleCicadas() {
    cicadaBurst();
    if (Math.random() < 0.4) {
      timers.push(setTimeout(cicadaBurst, 180 + Math.random() * 260));
    }
    timers.push(setTimeout(scheduleCicadas, 700 + Math.random() * 1600));
  }

  scheduleTyping();
  scheduleCicadas();
  scheduleDistantTyping();

  return {
    setMuted(muted: boolean) {
      master.gain.linearRampToValueAtTime(muted ? 0 : 0.55, ctx.currentTime + 0.4);
    },
    setNight(isNight: boolean) {
      const time = ctx.currentTime;
      dayGain.gain.linearRampToValueAtTime(isNight ? 0 : 1, time + 0.8);
      nightGain.gain.linearRampToValueAtTime(isNight ? 1 : 0, time + 0.8);
    },
    dispose() {
      clearTimers();
      [droneA, droneB, lfo].forEach((oscillator) => {
        try {
          oscillator.stop();
        } catch {
          // Already stopped.
        }
      });
      master.disconnect();
    },
  };
}

export default function ElsewhereHero({
  daySrc = DEFAULT_DAY,
  nightSrc = DEFAULT_NIGHT,
  brand = "Elsewhere",
  links = DEFAULT_LINKS,
  navCta = { label: "Get the app", href: "#get" },
  headline = "Work from somewhere else.",
  subline = "Ambient soundscapes that follow the day — keys by morning, cicadas by night.",
  primaryCta = { label: "Start focusing", href: "#start" },
  listenLabel = "Listen",
  listenOffLabel = "Pause sound",
  soundHint = "Turn on the sound",
  signature = DEFAULT_SIGNATURE,
  objectPosition = "42% 50%",
  variant = "hero",
  className,
  style,
}: ElsewhereHeroProps) {
  const dayVideoRef = useRef<HTMLVideoElement>(null);
  const nightVideoRef = useRef<HTMLVideoElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const engineRef = useRef<ReturnType<typeof createAmbientEngine> | null>(null);
  const [isNight, setIsNight] = useState(false);
  const [muted, setMuted] = useState(true);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true));
    return () => {
      cancelAnimationFrame(frame);
      engineRef.current?.dispose();
      if (audioCtxRef.current) void audioCtxRef.current.close();
    };
  }, []);

  function toggleNight() {
    setIsNight((value) => {
      engineRef.current?.setNight(!value);
      return !value;
    });
  }

  function toggleMuted() {
    if (!audioCtxRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const engine = createAmbientEngine(ctx);
      engineRef.current = engine;
      engine.setNight(isNight);
      engine.setMuted(false);
      setMuted(false);
      return;
    }
    if (audioCtxRef.current.state === "suspended") void audioCtxRef.current.resume();
    setMuted((value) => {
      engineRef.current?.setMuted(!value);
      return !value;
    });
  }

  const rise = (index: number): CSSProperties => ({
    opacity: shown ? 1 : 0,
    transform: shown ? "none" : "translateY(14px)",
    transition: `opacity 1s ease ${0.15 + index * 0.12}s, transform 1s cubic-bezier(.2,.7,.2,1) ${0.15 + index * 0.12}s`,
  });

  const controls = (
    <div className={`ew-controls ${variant === "ambient" ? "elsewhere-ambient-controls" : ""}`}>
      <button
        type="button"
        onClick={toggleNight}
        aria-label={isNight ? "Switch to day" : "Switch to night"}
        aria-pressed={isNight}
        className="ew-icon-button"
      >
        {isNight ? <Moon size={18} strokeWidth={1.6} aria-hidden="true" /> : <Sun size={18} strokeWidth={1.6} aria-hidden="true" />}
      </button>
      <button
        type="button"
        onClick={toggleMuted}
        aria-label={muted ? "Unmute" : "Mute"}
        aria-pressed={!muted}
        className="ew-icon-button"
      >
        <SoundIcon muted={muted} size={18} />
      </button>
      {soundHint && muted && <span className="ew-hint" aria-hidden="true">← {soundHint}</span>}
    </div>
  );

  return (
    <>
    <section className={`elsewhere-hero ${variant === "ambient" ? "elsewhere-ambient" : ""} ${className ?? ""}`} aria-label={brand} style={style}>
      <style>{css}</style>
      <video
        ref={dayVideoRef}
        src={daySrc}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        className="ew-video"
        style={{ objectPosition, opacity: isNight ? 0 : 1 }}
      />
      <video
        ref={nightVideoRef}
        src={nightSrc}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        className="ew-video"
        style={{ objectPosition, opacity: isNight ? 1 : 0 }}
      />
      <div className="ew-overlay" aria-hidden="true" />

      {variant === "hero" && <>
      <header className="ew-nav" style={rise(0)}>
        <a href="#" className="ew-brand" aria-label="Back to top">
          {brand}
        </a>
        <nav aria-label={`${brand} introduction`} className="ew-links">
          {links.map((link) => (
            <a key={link.href + link.label} href={link.href} className="ew-link">
              {link.label}
            </a>
          ))}
        </nav>
        {navCta && (
          <a href={navCta.href} className="ew-glass ew-pill ew-small">
            {navCta.label}
          </a>
        )}
      </header>

      <div className="ew-copy">
        <p className="ew-eyebrow" style={rise(1)}>THE HACKATHON JUDGING WORKSPACE</p>
        <h1 className="ew-title" style={rise(2)}>{headline}</h1>
        <p className="ew-sub" style={rise(3)}>{subline}</p>
        <div className="ew-ctas" style={rise(4)}>
          <a href={primaryCta.href} className="ew-pill ew-primary">
            {primaryCta.label}
          </a>
          <button type="button" onClick={toggleMuted} aria-pressed={!muted} className="ew-glass ew-pill">
            <SoundIcon muted={muted} size={16} />
            {muted ? listenLabel : listenOffLabel}
          </button>
        </div>
        <p className="ew-demo" style={rise(5)}>Interactive demo · No sign-up · Sample data</p>
      </div>
      </>}

      {variant === "hero" && controls}

      {variant === "hero" && signature && (
        <span className="ew-signature">
          by <a href={signature.url} target="_blank" rel="noopener noreferrer">{signature.name}</a>
        </span>
      )}
    </section>
    {variant === "ambient" && controls}
    </>
  );
}

function SoundIcon({ muted, size }: { muted: boolean; size: number }) {
  const Icon = muted ? VolumeX : Volume2;
  return <Icon size={size} strokeWidth={1.6} aria-hidden="true" />;
}

const css = `
.elsewhere-hero{position:relative;height:100dvh;min-height:600px;width:100%;overflow:hidden;background:var(--page);font-family:var(--font-sans);color:var(--ink)}
.ew-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:opacity 1.2s ease}
.ew-overlay{position:absolute;inset:0;background:var(--hero-overlay);pointer-events:none}
.ew-nav{position:absolute;top:0;left:0;right:0;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:24px;padding:clamp(14px,3vh,24px) clamp(14px,3vw,28px)}
.ew-brand{font-weight:500;font-size:clamp(11px,1.6vw,13px);letter-spacing:.24em;text-transform:uppercase;color:var(--hero-text-soft);text-decoration:none}
.ew-links{display:flex;gap:clamp(18px,2.6vw,32px)}
.ew-link{position:relative;font-size:14px;color:var(--hero-text-soft);text-decoration:none;transition:color .3s}
.ew-link::after{content:"";position:absolute;left:0;right:0;bottom:-3px;height:1px;background:currentColor;transform:scaleX(0);transform-origin:left;transition:transform .4s cubic-bezier(.2,.7,.2,1)}
.ew-link:hover,.ew-link:focus-visible{color:var(--ink)}
.ew-link:hover::after,.ew-link:focus-visible::after{transform:scaleX(1)}
.ew-copy{position:absolute;left:0;right:0;top:clamp(96px,13vh,150px);z-index:2;display:flex;flex-direction:column;align-items:center;text-align:center;padding:0 20px}
.ew-eyebrow{margin:0 0 clamp(18px,2.8vh,28px);display:flex;align-items:center;gap:8px;font-size:11px;font-weight:500;letter-spacing:.12em;color:var(--ink)}
.ew-eyebrow::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--brand);box-shadow:0 0 16px var(--brand)}
.ew-title{margin:0;max-width:12ch;font-weight:500;font-size:clamp(44px,7.2vw,104px);line-height:.96;letter-spacing:-.04em;color:var(--ink);text-shadow:var(--hero-text-shadow);text-wrap:balance}
.ew-sub{margin:clamp(16px,2.2vh,22px) 0 0;max-width:44ch;font-size:clamp(15px,1.5vw,18px);line-height:1.5;color:var(--ink);text-shadow:var(--hero-text-shadow);text-wrap:pretty}
.ew-ctas{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-top:clamp(22px,3.4vh,32px)}
.ew-pill{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:46px;padding:0 22px;border-radius:999px;font:inherit;font-size:15px;font-weight:500;text-decoration:none;cursor:pointer;transition:transform .25s ease,background .3s ease,border-color .3s ease}
.ew-pill:active{transform:scale(.97)}
.ew-small{height:38px;padding:0 16px;font-size:13px}
.ew-primary{background:var(--brand);color:var(--primary-foreground);border:1px solid var(--brand)}
.ew-primary:hover{background:var(--accent-foreground);border-color:var(--accent-foreground)}
.ew-glass{color:var(--ink);border:1px solid var(--hero-glass-border);background:var(--hero-glass);backdrop-filter:blur(14px) saturate(150%);-webkit-backdrop-filter:blur(14px) saturate(150%)}
.ew-glass:hover{background:var(--hero-glass-hover);border-color:var(--hero-glass-border-hover)}
.ew-demo{margin:14px 0 0;font-size:12px;color:var(--hero-text-soft);text-shadow:var(--hero-text-shadow)}
.ew-controls{position:absolute;left:clamp(14px,3vw,28px);bottom:clamp(14px,3vh,28px);display:flex;align-items:center;gap:clamp(8px,1.5vw,12px);z-index:2}
.ew-icon-button{width:clamp(38px,6vw,44px);height:clamp(38px,6vw,44px);border-radius:50%;border:1px solid var(--hero-glass-border);background:var(--hero-glass);backdrop-filter:blur(14px) saturate(150%);-webkit-backdrop-filter:blur(14px) saturate(150%);display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;color:var(--ink);transition:background .3s ease,border-color .3s ease}
.ew-icon-button:hover{background:var(--hero-glass-hover);border-color:var(--hero-glass-border-hover)}
.ew-hint{font-size:13px;color:var(--hero-text-soft);white-space:nowrap;animation:ew-pulse 2.4s ease-in-out infinite;text-shadow:var(--hero-text-shadow)}
.ew-signature{position:absolute;right:clamp(12px,2.5vw,24px);bottom:clamp(10px,2vw,18px);font-weight:500;font-size:clamp(11px,1.4vw,13px);letter-spacing:.01em;color:var(--hero-text-muted);z-index:2}
.ew-signature a{color:inherit;text-decoration:none}
.elsewhere-ambient{position:fixed;inset:0;z-index:0;height:100dvh;min-height:0;pointer-events:none}
.elsewhere-ambient .ew-overlay{background:var(--hero-workspace-overlay)}
.elsewhere-ambient-controls{position:fixed;left:clamp(14px,3vw,28px);right:auto;z-index:40;pointer-events:auto}
.elsewhere-ambient-controls .ew-hint{display:none}
@keyframes ew-pulse{0%,100%{opacity:.45}50%{opacity:.9}}
.ew-brand:focus-visible,.ew-link:focus-visible,.ew-pill:focus-visible,.ew-icon-button:focus-visible,.ew-signature a:focus-visible{outline:2px solid var(--ink);outline-offset:3px}
@media (max-width:720px){.ew-links{display:none}.ew-hint{display:none}.elsewhere-hero{min-height:640px}.elsewhere-ambient{min-height:0}.ew-copy{top:104px}.ew-title{max-width:10ch}.ew-sub{max-width:32ch}.ew-brand{letter-spacing:.16em}.ew-signature{display:none}}
@media (max-width:390px){.ew-nav{gap:12px}.ew-small{padding:0 13px;font-size:12px}.ew-eyebrow{font-size:9px}.ew-ctas{gap:8px}.ew-pill{height:44px;padding:0 18px;font-size:14px}}
@media (prefers-reduced-motion:reduce){.ew-hint{animation:none}.ew-link::after,.ew-pill,.ew-icon-button,.ew-video{transition:none}.ew-nav,.ew-eyebrow,.ew-title,.ew-sub,.ew-ctas,.ew-demo{transition:none!important;transform:none!important}}
@media (prefers-reduced-transparency:reduce),(forced-colors:active){.ew-glass,.ew-icon-button{background:var(--surface);backdrop-filter:none;-webkit-backdrop-filter:none}}
`;
