"use client";

import { useEffect, useRef } from "react";

const MISSION =
  "To deliver world-class live experiences by blending technical precision with creative innovation. ISS is committed to providing seamless event production, high-fidelity sound, and immersive lighting through a dedicated team of experts and a relentless focus on reliability, ensuring every project—from local corporate gatherings to international tours—is executed with flawless detail.";

const VISION =
  "Our vision is to become the global benchmark for excellence in event production and technical management. We aspire to redefine the landscape of live entertainment by consistently elevating the standards of sound, lighting, and logistical execution. By fostering a culture of innovation and professional ethics, ISS seeks to be the first-choice partner for the world’s most ambitious artists and corporate leaders.";

const BAR_GAP = 31;
const PEAK_HEIGHT = 70; // height of the swell's tallest bar
const PEAK_SPREAD = 26; // how far the swell reaches either side, px
const GOLD = [231, 158, 63];
const GREY = [72, 72, 72];
const WHITE = [255, 255, 255];

const mix = (from: number[], to: number[], amount: number) =>
  `rgb(${from.map((channel, i) => Math.round(channel + (to[i] - channel) * amount)).join(",")})`;

// "Our Mission" / "Our Vision". The section is 2.4 screens tall with a pinned
// (sticky) screen inside it, so the view holds still while you scroll through.
// How far you've scrolled through it is published as --p (0 → 1) and drives:
//   • the text: Mission fades out before the halfway point, Vision fades in after;
//   • the sound bar at the bottom: a swell travels left → right with --p, and
//     the dots it has passed turn from grey to white (gold at the swell).
// For visitors who ask for reduced motion the swell doesn't flicker; everything
// else only moves when they scroll.
export function MissionVision() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!section || !canvas || !ctx) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let progress = 0;
    let swellX = 0; // smoothed position of the swell

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = "round";
    };

    const readScroll = () => {
      const box = section.getBoundingClientRect();
      const distance = box.height - window.innerHeight;
      progress = distance > 0 ? Math.min(1, Math.max(0, -box.top / distance)) : 0;
      section.style.setProperty("--p", progress.toFixed(4));
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      const barWidth = width < 480 ? 6 : 8;
      ctx.lineWidth = barWidth;
      const count = Math.floor((width - barWidth) / BAR_GAP) + 1;
      const offset = (width - (count - 1) * BAR_GAP) / 2;
      const mid = height / 2;
      for (let i = 0; i < count; i++) {
        const x = offset + i * BAR_GAP;
        const distance = x - swellX;
        const lift = Math.exp(-(distance * distance) / (2 * PEAK_SPREAD * PEAK_SPREAD));
        const flicker = still ? 1 : 0.8 + 0.2 * Math.sin(time * 8 + i * 1.7);
        const barHeight = Math.min(height - barWidth, 0.5 + PEAK_HEIGHT * lift * flicker);
        // Passed dots are white, the rest grey; the swell itself glows gold.
        ctx.strokeStyle = mix(x <= swellX ? WHITE : GREY, GOLD, lift * 0.85);
        ctx.beginPath();
        ctx.moveTo(x, mid - barHeight / 2);
        ctx.lineTo(x, mid + barHeight / 2);
        ctx.stroke();
      }
    };

    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      readScroll();
      // The swell runs the full length of the bar; ease towards it so it glides.
      const inset = BAR_GAP / 2;
      const target = inset + progress * (width - inset * 2);
      swellX += (target - swellX) * Math.min(1, dt * 10);
      draw(now / 1000);
      frame = requestAnimationFrame(tick);
    };

    resize();
    readScroll();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    // Only animate while the section is on screen.
    const visibility = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(frame);
      if (entry.isIntersecting) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    });
    visibility.observe(section);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibility.disconnect();
    };
  }, []);

  const block = "col-start-1 row-start-1 flex flex-col items-center text-center will-change-[opacity,transform]";
  const heading = "font-poppins text-[26px] leading-[1.1] font-light text-white sm:text-6xl lg:text-[80px]";
  const body = "mt-5 max-w-[720px] font-poppins text-xs leading-[1.6] font-light text-neutral-200 sm:mt-8 sm:text-lg lg:mt-12 lg:text-xl";

  return (
    <section ref={sectionRef} className="relative h-[240svh] [--p:0]">
      <div className="sticky top-0 flex h-svh flex-col items-center justify-center overflow-hidden px-5 pt-20 pb-40 lg:pt-29.5 lg:pb-48">
        {/* Both blocks share one grid cell, so they sit exactly on top of each other. */}
        <div className="grid">
          <div
            className={`${block} [opacity:clamp(0,calc((0.46_-_var(--p))_/_0.12),1)] [transform:translateY(calc(clamp(0,calc((var(--p)_-_0.34)_/_0.12),1)_*_-24px))]`}
          >
            <h2 className={heading}>Our Mission</h2>
            <p className={body}>{MISSION}</p>
          </div>
          <div
            className={`${block} [opacity:clamp(0,calc((var(--p)_-_0.54)_/_0.12),1)] [transform:translateY(calc((1_-_clamp(0,calc((var(--p)_-_0.54)_/_0.12),1))_*_24px))]`}
          >
            <h2 className={heading}>Our Vision</h2>
            <p className={body}>{VISION}</p>
          </div>
        </div>

        {/* The sound bar: its width here sets how many dots it has. */}
        <canvas
          ref={canvasRef}
          aria-hidden
          className="pointer-events-none absolute bottom-[9%] left-1/2 h-24 w-[min(868px,88vw)] -translate-x-1/2"
        />
      </div>
    </section>
  );
}
