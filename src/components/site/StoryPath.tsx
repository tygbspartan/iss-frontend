"use client";

import { useEffect, useRef, useState } from "react";

// The About page's story: a few blocks of text joined by one thick gold line
// that draws itself down the page as you scroll. When the line reaches a block
// that block "switches on":
//   • "spotlight": a warm stage spotlight fades in over it from above;
//   • "bulb": a bulb at the point where the line meets it lights up;
// and either way its text goes from dim to bright. Scrolling back up retracts
// the line and switches the blocks off again.
//
// Desktop (from 1024px): the first block is centred and the rest alternate
// left and right; the line winds between them through the middle of the page,
// passing behind the first block. Smaller screens: the blocks are stacked and
// the line runs straight down their left side.
//
// Visitors who ask for reduced motion get the finished picture: the line fully
// drawn and every block lit.

export interface StoryChapter {
  label: string; // small gold heading, e.g. "1960 · Voice of Radio"
  text: string;
  light: "spotlight" | "bulb";
}

interface Point {
  x: number;
  y: number;
}

interface Segment {
  d: string; // SVG path
  length: number;
  samples: { len: number; y: number; x: number }[]; // along the path, for working out how much to draw
}

// Where along the screen the line's tip sits: this far down the window.
const TIP_AT = 0.62;
const EASE = 0.14; // how quickly the drawn line catches up with the scroll position
const SIDE_GAP = 36; // desktop: how far beside a side block the line meets it
const LABEL_Y = 14; // the meeting point is level with the block's label
const NARROW_X = 13; // small screens: the line's distance from the left

const cubic = (a: Point, c1: Point, c2: Point, b: Point, t: number): Point => {
  const u = 1 - t;
  return {
    x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x,
    y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y,
  };
};

/** A straight or cubic segment, with points sampled along it. */
function segment(a: Point, b: Point, c1?: Point, c2?: Point): Segment {
  const STEPS = c1 ? 80 : 1;
  const samples = [{ len: 0, x: a.x, y: a.y }];
  let len = 0;
  let prev = a;
  for (let i = 1; i <= STEPS; i++) {
    const p = c1 && c2 ? cubic(a, c1, c2, b, i / STEPS) : b;
    len += Math.hypot(p.x - prev.x, p.y - prev.y);
    samples.push({ len, x: p.x, y: p.y });
    prev = p;
  }
  const d = c1 && c2 ? `M${a.x},${a.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${b.x},${b.y}` : `M${a.x},${a.y} L${b.x},${b.y}`;
  return { d, length: Math.max(len, 0.01), samples };
}

/** How far along a segment the tip is, given the tip's height. */
function drawnIn(seg: Segment, tipY: number): number {
  if (seg.samples[0].y > tipY) return 0;
  let reached = 0;
  for (let i = 1; i < seg.samples.length; i++) {
    const s = seg.samples[i];
    if (s.y > tipY) {
      // Part-way between the previous sample and this one.
      const p = seg.samples[i - 1];
      return p.len + ((tipY - p.y) / (s.y - p.y || 1)) * (s.len - p.len);
    }
    reached = s.len;
  }
  return reached;
}

/** The point at `len` along a segment. */
function pointAt(seg: Segment, len: number): Point {
  const s = seg.samples;
  for (let i = 1; i < s.length; i++) {
    if (s[i].len >= len) {
      const f = (len - s[i - 1].len) / (s[i].len - s[i - 1].len || 1);
      return { x: s[i - 1].x + (s[i].x - s[i - 1].x) * f, y: s[i - 1].y + (s[i].y - s[i - 1].y) * f };
    }
  }
  return s[s.length - 1];
}

// Desktop placement of each block: the first centred, then left, right, left…
const placement = (i: number) =>
  i === 0
    ? "lg:mx-auto lg:max-w-[780px] lg:text-center"
    : i % 2 === 1
      ? "lg:mr-auto lg:max-w-[min(480px,36%)]"
      : "lg:ml-auto lg:max-w-[min(480px,36%)]";

export function StoryPath({ chapters }: { chapters: StoryChapter[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const blockRefs = useRef<(HTMLElement | null)[]>([]);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const tipRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<{ width: number; height: number; segments: Segment[]; joints: Point[] } | null>(null);
  const [lit, setLit] = useState(0); // how many blocks are switched on

  // Measure the blocks and lay the line out between them; again whenever any
  // of them changes size (fonts loading, window resized).
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const measure = () => {
      const box = wrap.getBoundingClientRect();
      const wide = window.matchMedia("(min-width: 1024px)").matches;
      const rects = blockRefs.current.map((el) => {
        const r = el!.getBoundingClientRect();
        return { left: r.left - box.left, right: r.right - box.left, top: r.top - box.top, bottom: r.bottom - box.top };
      });
      const centre = box.width / 2;

      // Where the line meets each block.
      const joints: Point[] = rects.map((r, i) =>
        !wide
          ? { x: NARROW_X, y: r.top + LABEL_Y }
          : i === 0
            ? { x: centre, y: r.top - 28 }
            : i % 2 === 1
              ? { x: r.right + SIDE_GAP, y: r.top + LABEL_Y }
              : { x: r.left - SIDE_GAP, y: r.top + LABEL_Y },
      );

      const segments: Segment[] = [];
      // Into the first block, from the top.
      segments.push(segment({ x: joints[0].x, y: 0 }, joints[0]));
      for (let i = 1; i < joints.length; i++) {
        const to = joints[i];
        if (!wide) {
          segments.push(segment(joints[i - 1], to));
          continue;
        }
        // Desktop: the line goes behind the first block and comes out below
        // it; from a side block it carries on from where it met it. Then it
        // sweeps across to the next block in a smooth S. Every curve leaves and
        // arrives heading straight down, so the line flows through each
        // meeting point without a corner.
        const from = i === 1 ? { x: centre, y: rects[0].bottom + 28 } : joints[i - 1];
        const drop = (to.y - from.y) * 0.55;
        segments.push(segment(from, to, { x: from.x, y: from.y + drop }, { x: to.x, y: to.y - drop }));
      }
      setLayout({ width: box.width, height: box.height, segments, joints });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(wrap);
    blockRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Draw the line to the scroll position, switching blocks on as it reaches them.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!layout || !wrap) return;
    const { segments } = layout;
    const total = segments.reduce((sum, s) => sum + s.length, 0);
    // Total length drawn by the time the line reaches each block.
    const reachAt = segments.map((_, i) => segments.slice(0, i + 1).reduce((sum, s) => sum + s.length, 0));

    const paint = (drawn: number) => {
      let left = drawn;
      segments.forEach((seg, i) => {
        const here = Math.max(0, Math.min(seg.length, left));
        left -= seg.length;
        const path = pathRefs.current[i];
        if (path) path.style.strokeDashoffset = `${seg.length - here}`;
      });
      // The glowing tip, at the end of what's drawn (hidden when nothing is, or all is).
      const tip = tipRef.current;
      if (tip) {
        let rest = drawn;
        let point: Point | null = null;
        for (const seg of segments) {
          if (rest <= seg.length) {
            point = pointAt(seg, rest);
            break;
          }
          rest -= seg.length;
        }
        const showing = drawn > 1 && drawn < total - 1 && point;
        tip.style.opacity = showing ? "1" : "0";
        if (point) tip.style.transform = `translate(${point.x}px, ${point.y}px)`;
      }
      setLit(reachAt.filter((at) => drawn >= at - 2).length);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      paint(total);
      return;
    }

    let drawn = 0;
    let frame = 0;
    const target = () => {
      const tipY = window.innerHeight * TIP_AT - wrap.getBoundingClientRect().top;
      let sum = 0;
      for (const seg of segments) {
        const part = drawnIn(seg, tipY);
        sum += part;
        if (part < seg.length - 0.01) break;
      }
      return sum;
    };
    const tick = () => {
      const goal = target();
      drawn += (goal - drawn) * EASE;
      if (Math.abs(goal - drawn) < 0.5) drawn = goal;
      paint(drawn);
      frame = drawn === goal ? 0 : requestAnimationFrame(tick);
    };
    const wake = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    drawn = target(); // start where the page already is (e.g. after a reload part-way down)
    paint(drawn);
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", wake);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", wake);
    };
  }, [layout]);

  return (
    // overflow-x-clip: the spotlights' beams are wider than the blocks, and
    // mustn't make the page scroll sideways on phones.
    <div ref={wrapRef} className="relative overflow-x-clip pt-24 pb-10 lg:pt-28 lg:pb-16">
      {/* The line: a faint track showing the whole route, and the gold line drawn over it. */}
      {layout && (
        <svg
          aria-hidden
          width={layout.width}
          height={layout.height}
          className="pointer-events-none absolute top-0 left-0 overflow-visible"
        >
          {layout.segments.map((seg, i) => (
            <path key={`track-${i}`} d={seg.d} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={4} strokeLinecap="round" />
          ))}
          {layout.segments.map((seg, i) => (
            <path
              key={`line-${i}`}
              ref={(el) => {
                pathRefs.current[i] = el;
              }}
              d={seg.d}
              pathLength={seg.length}
              fill="none"
              stroke="url(#story-gold)"
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray={seg.length}
              strokeDashoffset={seg.length}
              className="drop-shadow-[0_0_6px_rgba(231,158,63,0.7)]"
            />
          ))}
          <defs>
            <linearGradient id="story-gold" x1="0" y1="0" x2="0" y2={layout.height} gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#F2C987" />
              <stop offset="0.5" stopColor="#E79E3F" />
              <stop offset="1" stopColor="#C68535" />
            </linearGradient>
          </defs>
        </svg>
      )}

      {/* The tip of the line, glowing as it travels. */}
      <div
        ref={tipRef}
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 size-0 opacity-0 transition-opacity duration-300"
      >
        <span className="absolute size-3 -translate-1/2 rounded-full bg-[#FFF4E2] shadow-[0_0_10px_4px_rgba(255,226,180,0.9),0_0_28px_10px_rgba(231,158,63,0.5)]" />
      </div>

      {/* Where the line meets each block: a bulb that lights up, or (for the
          spotlight blocks) a small node that glows. */}
      {layout?.joints.map((joint, i) => {
        const on = i < lit;
        const bulb = chapters[i].light === "bulb";
        return (
          <div
            key={`joint-${i}`}
            aria-hidden
            className="pointer-events-none absolute top-0 left-0 size-0"
            style={{ transform: `translate(${joint.x}px, ${joint.y}px)` }}
          >
            {bulb ? (
              <>
                {/* Halo, then the bulb itself. */}
                <span
                  className={`absolute size-24 -translate-1/2 rounded-full bg-[radial-gradient(circle,rgba(242,201,135,0.45),rgba(231,158,63,0.12)_45%,transparent_70%)] transition-[opacity,scale] duration-700 ${
                    on ? "scale-100 opacity-100" : "scale-50 opacity-0"
                  }`}
                />
                <span
                  className={`absolute size-5 -translate-1/2 rounded-full border transition-[background-color,border-color,box-shadow] duration-500 ${
                    on
                      ? "border-[#FFF4E2] bg-[#FFE7B8] shadow-[0_0_14px_5px_rgba(255,226,180,0.85),0_0_44px_18px_rgba(231,158,63,0.45)]"
                      : "border-white/25 bg-[#1a1a1a]"
                  }`}
                />
              </>
            ) : (
              <span
                className={`absolute size-2.5 -translate-1/2 rounded-full transition-[background-color,box-shadow] duration-500 ${
                  on ? "bg-[#F2C987] shadow-[0_0_10px_4px_rgba(231,158,63,0.6)]" : "bg-white/20"
                }`}
              />
            )}
          </div>
        );
      })}

      <ol className="relative flex flex-col gap-24 pl-10 sm:gap-28 lg:gap-40 lg:pl-0">
        {chapters.map((chapter, i) => {
          const on = i < lit;
          return (
            <li
              key={chapter.label}
              ref={(el) => {
                blockRefs.current[i] = el;
              }}
              className={`relative isolate ${placement(i)}`}
            >
              {chapter.light === "spotlight" && (
                // The spotlight: a soft gold beam from above, and a pool of light behind the text.
                <span
                  aria-hidden
                  className={`pointer-events-none absolute inset-0 -z-10 transition-opacity duration-1000 ${on ? "opacity-100" : "opacity-0"}`}
                >
                  <span className="absolute -top-56 left-1/2 h-[calc(100%+16rem)] w-[110%] -translate-x-1/2 blur-2xl">
                    <span className="block size-full bg-[linear-gradient(to_bottom,rgba(231,158,63,0.42),rgba(231,158,63,0.12)_55%,rgba(231,158,63,0)_92%)] [clip-path:polygon(44%_0,56%_0,100%_100%,0_100%)]" />
                  </span>
                  <span className="absolute -inset-10 bg-[radial-gradient(ellipse_at_center,rgba(231,158,63,0.14),transparent_70%)]" />
                </span>
              )}
              <p
                className={`font-poppins text-xs tracking-[0.2em] uppercase transition-colors duration-700 sm:text-[13px] ${
                  on ? "text-[#E79E3F]" : "text-[#E79E3F]/35"
                }`}
              >
                {chapter.label}
              </p>
              <p
                className={`mt-4 font-poppins text-sm leading-[1.75] font-light transition-colors duration-700 sm:text-lg lg:text-xl ${
                  on ? "text-white" : "text-white/25"
                }`}
              >
                {chapter.text}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
