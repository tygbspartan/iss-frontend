"use client";

import { useEffect, useRef } from "react";

// Canvas animations for the home page hero. Both are decorative, sized by CSS
// (the canvas fills whatever box `className` gives it), and stand still for
// visitors who ask for reduced motion.

/** Sizes the canvas backing store to its CSS box × device pixel ratio. */
function fitCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width, height };
}

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

interface Dot {
  x: number;
  y: number;
  radius: number;
  speed: number; // px per second, upwards
  drift: number; // px per second, sideways
  alpha: number;
  phase: number; // twinkle offset
  rate: number; // twinkle speed
  gold: boolean; // sparkle only: tinted gold rather than white
  glint: boolean; // sparkle only: flashes a small four-point star at its brightest
}

/**
 * Soft dots drifting from the bottom of their box to the top, like dust in
 * stage light.
 *   • `density` scales how many there are (1 = the hero's amount).
 *   • `sparkle` makes them glitter: instead of a gentle pulse each dot flashes
 *     bright and fades right down at its own pace, a quarter of them are gold,
 *     and some throw a little star glint as they peak.
 */
export function RisingDots({
  className = "",
  density = 1,
  sparkle = false,
}: {
  className?: string;
  density?: number;
  sparkle?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const still = prefersReducedMotion();
    let width = 0;
    let height = 0;
    let dots: Dot[] = [];

    const spawn = (anywhere: boolean): Dot => ({
      x: Math.random() * width,
      y: anywhere ? Math.random() * height : height + 8,
      radius: 0.8 + Math.random() * 2.6,
      speed: 10 + Math.random() * 28,
      drift: (Math.random() - 0.5) * 8,
      alpha: sparkle ? 0.45 + Math.random() * 0.5 : 0.12 + Math.random() * 0.38,
      phase: Math.random() * Math.PI * 2,
      rate: sparkle ? 1.4 + Math.random() * 3.2 : 1.5,
      gold: sparkle && Math.random() < 0.25,
      glint: sparkle && Math.random() < 0.4,
    });

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      for (const dot of dots) {
        // Fade in near the bottom and out near the top.
        const edge = Math.min(1, dot.y / (height * 0.2), (height - dot.y) / (height * 0.12));
        // 0 → 1 → 0 over and over. Plain dots pulse gently around full
        // strength; sparkles spend most of the time dim and flash briefly.
        const wave = (Math.sin(time * dot.rate + dot.phase) + 1) / 2;
        const twinkle = sparkle ? 0.12 + 0.88 * wave ** 3 : 0.5 + 0.5 * wave;
        const colour = dot.gold ? "#E79E3F" : "#ffffff";
        ctx.globalAlpha = Math.max(0, dot.alpha * edge * twinkle);
        ctx.fillStyle = colour;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        ctx.fill();

        // The glint: a thin cross through the dot, growing as it peaks.
        if (dot.glint && wave > 0.7) {
          const reach = dot.radius * (2 + 6 * (wave - 0.7));
          ctx.strokeStyle = colour;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(dot.x - reach, dot.y);
          ctx.lineTo(dot.x + reach, dot.y);
          ctx.moveTo(dot.x, dot.y - reach);
          ctx.lineTo(dot.x, dot.y + reach);
          ctx.stroke();
        }
      }
    };

    const resize = () => {
      ({ width, height } = fitCanvas(canvas, ctx));
      const count = Math.max(8, Math.round(Math.min(90, Math.max(24, (width * height) / 22000)) * density));
      dots = Array.from({ length: count }, () => spawn(true));
      if (still) draw(0);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    if (still) return () => observer.disconnect();

    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      dots = dots.map((dot) =>
        dot.y < -8 ? spawn(false) : { ...dot, y: dot.y - dot.speed * dt, x: dot.x + dot.drift * dt },
      );
      draw(now / 1000);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [density, sparkle]);

  return <canvas ref={ref} aria-hidden className={`pointer-events-none ${className}`} />;
}

const BAR_GAP = 23;
const BAR_WIDTH = 3;
const DOT_HEIGHT = 0.5; // a round-capped line this short reads as a dot
const PILL_HEIGHT = 11;
const PEAK_HEIGHT = 58; // extra height right under the cursor
const PEAK_SPREAD = 42; // how far the swell reaches either side, px

// Fixed pattern of dots and short pills, like the resting line of an audio track.
const isPill = (index: number) => (((index * 37 + 11) % 7) + 7) % 7 < 2;

/**
 * A line of dots and bars along the bottom of the hero that swells like a sound
 * wave under the cursor. With no mouse (touch screens, or before it moves) the
 * swell sweeps slowly from side to side on its own.
 */
export function SoundWave({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const still = prefersReducedMotion();
    let width = 0;
    let height = 0;
    let pointerX: number | null = null; // null → idle sweep
    let swellX = 0; // smoothed position of the swell
    let started = false;

    const draw = (time: number, swell: number) => {
      ctx.clearRect(0, 0, width, height);
      const mid = height / 2;
      const count = Math.ceil(width / BAR_GAP) + 1;
      const offset = (width - (count - 1) * BAR_GAP) / 2;
      for (let i = 0; i < count; i++) {
        const x = offset + i * BAR_GAP;
        const pill = isPill(i);
        const distance = x - swellX;
        const lift = Math.exp(-(distance * distance) / (2 * PEAK_SPREAD * PEAK_SPREAD));
        // The swell flickers bar by bar, like levels on a meter.
        const flicker = 0.72 + 0.28 * Math.sin(time * 9 + i * 1.7);
        const breathing = pill ? 1.5 * Math.sin(time * 2 + i * 0.6) : 0;
        const barHeight = Math.min(
          height - BAR_WIDTH,
          (pill ? PILL_HEIGHT : DOT_HEIGHT) + breathing + swell * PEAK_HEIGHT * lift * flicker,
        );
        // Colour: white along the resting line, shading to gold (#E79E3F)
        // through the swell — strongest right under the cursor, fading out
        // bar by bar either side.
        const gold = Math.min(1, swell * Math.pow(lift, 0.7));
        ctx.strokeStyle = `rgba(${Math.round(255 - 24 * gold)}, ${Math.round(255 - 97 * gold)}, ${Math.round(255 - 192 * gold)}, ${(0.75 + 0.25 * gold).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(x, mid - barHeight / 2);
        ctx.lineTo(x, mid + barHeight / 2);
        ctx.stroke();
      }
    };

    const resize = () => {
      ({ width, height } = fitCanvas(canvas, ctx));
      ctx.lineWidth = BAR_WIDTH;
      ctx.lineCap = "round";
      if (!started) swellX = width / 2;
      if (still) draw(0, 0);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    if (still) return () => observer.disconnect();

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pointerX = event.clientX - canvas.getBoundingClientRect().left;
    };
    const onLeave = () => {
      pointerX = null;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    let frame = 0;
    let last = performance.now();
    let swell = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const time = now / 1000;
      started = true;

      const idle = pointerX === null;
      const targetX = idle ? width / 2 + Math.sin(time * 0.5) * width * 0.35 : pointerX!;
      // Ease towards the target so the swell trails the cursor a little.
      swellX += (targetX - swellX) * Math.min(1, dt * (idle ? 3 : 12));
      swell += ((idle ? 0.55 : 1) - swell) * Math.min(1, dt * 4);

      draw(time, swell);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className={`pointer-events-none ${className}`} />;
}

const LIGHTS = [
  { at: 0.2, rest: -16 }, // left lamp: fraction of the hero's width, resting angle
  { at: 0.8, rest: 16 },
];
const MAX_TILT = 62; // degrees either side of straight down
const DRIFT = 36; // how far (px) a light slides sideways towards where it's aiming, at full tilt

/**
 * Two stage lights at the very top of the page, each throwing a soft gold beam.
 * A light is drawn as a spotlight seen from below: an oval lens with a bright
 * flare and haze streaming out along its beam. Lens, flare and beam turn
 * together to point at the cursor, and the light drifts a little towards the
 * side it's aiming at — so it reads as a spotlight swivelling to follow you.
 * With no mouse they sway gently, crossing over the middle of the stage.
 */
export function StageLights({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    const beams = Array.from(root.querySelectorAll<HTMLElement>("[data-beam]"));
    // Where each lamp hangs (its pivot), measured from the top of the hero.
    const pivots = Array.from(root.querySelectorAll<HTMLElement>("[data-lamp]"));

    let pointer: { x: number; y: number } | null = null; // null → idle sway
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const box = root.getBoundingClientRect();
      pointer = { x: event.clientX - box.left, y: event.clientY - box.top };
    };
    const onLeave = () => {
      pointer = null;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    const angles = LIGHTS.map((light) => light.rest);
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const width = root.clientWidth;
      LIGHTS.forEach((light, i) => {
        let target = light.rest + Math.sin(now / 1000 / 2.4 + i * 1.9) * 9;
        if (pointer) {
          // Angle from the lamp (hanging straight down = 0°) to the cursor.
          const dx = pointer.x - light.at * width;
          const dy = Math.max(40, pointer.y - (pivots[i]?.offsetTop ?? 0));
          target = Math.max(-MAX_TILT, Math.min(MAX_TILT, (-Math.atan2(dx, dy) * 180) / Math.PI));
        }
        // Ease towards the target: lamps are heavy, they don't snap.
        angles[i] += (target - angles[i]) * Math.min(1, dt * 3.5);
        beams[i].style.rotate = `${angles[i].toFixed(2)}deg`;
        // The light also drifts a little towards where it's aiming (up to
        // ±DRIFT px at full tilt), like a moving head swinging on its mount.
        pivots[i].style.translate = `${((-angles[i] / MAX_TILT) * DRIFT).toFixed(1)}px 0`;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden className={`pointer-events-none overflow-hidden ${className}`}>
      {LIGHTS.map((light) => (
        // The light's position: a zero-size box right at the top of the page
        // (24px down, so the whole glow shows; the navbar is see-through over
        // the hero). Everything is placed around this point.
        <div
          key={light.at}
          data-lamp
          style={{ left: `${light.at * 100}%` }}
          className="absolute top-6 size-0"
        >
          {/* The moving head: this zero-size box is what rotates, about the
              light, carrying the beam and the light's glow with it — so the
              light itself turns to face where it's pointing, like a spotlight
              swivelling, rather than being a fixed round dot. */}
          <div data-beam style={{ rotate: `${light.rest}deg` }} className="absolute top-0 left-0 size-0 will-change-transform">
            {/* The beam: starts at the light, narrow, and spreads and fades
                downwards. Outer box blurs, inner box is the cone (a filter is
                applied before a clip, so they can't share a box). */}
            <div className="absolute top-0 left-0 h-[115svh] w-[max(34vmin,240px)] -translate-x-1/2 blur-2xl">
              <div className="size-full bg-[linear-gradient(to_bottom,rgba(231,158,63,0.55),rgba(231,158,63,0.16)_40%,rgba(231,158,63,0)_88%)] [clip-path:polygon(45%_0,55%_0,100%_100%,0_100%)]" />
            </div>
            {/* Bloom: a wide oval haze stretched out along the beam, strongest
                just in front of the light. */}
            <span className="absolute top-8 left-0 h-44 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(231,158,63,0.32),rgba(231,158,63,0.1)_45%,rgba(231,158,63,0)_70%)] blur-lg" />
            {/* Flare: a bright streak shooting out of the lens along the beam. */}
            <span className="absolute top-0 left-0 h-32 w-5 -translate-x-1/2 rounded-full bg-[linear-gradient(to_bottom,rgba(255,240,214,0.85),rgba(242,201,135,0.35)_35%,rgba(231,158,63,0)_100%)] blur-[6px]" />
            {/* Lens: an oval seen side-on, across the beam, glowing. */}
            <span className="absolute top-0 left-0 h-3 w-10 -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-[#FFF4E2] shadow-[0_0_12px_5px_rgba(255,226,180,0.8),0_0_30px_12px_rgba(231,158,63,0.45)]" />
          </div>
        </div>
      ))}
    </div>
  );
}
