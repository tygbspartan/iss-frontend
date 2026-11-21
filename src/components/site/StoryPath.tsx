"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { MobileStory } from "./MobileStory";
import { familyTree, treeHeight, treeWidth, TREE_NARROW, type TreeLevel } from "./storyTree";
import { deckLayout, flipSpan, GenerationDeck, GenerationGrid, type DeckControl, type Generation } from "./GenerationCards";

// The About page's story: a few blocks of text joined by one thick gold line.
// When the line reaches a block that block "switches on": a bulb lights up
// where the line meets it, a warm stage spotlight fades in over it from above,
// and its text goes from dim to bright.
//
// After the last block the line returns to the middle of the page and grows
// into a family tree — a trunk splitting into two, four, then eight — drawn
// in grey and filling with gold, level by level. Under it, "Powered By
// Generations" is already written, with room left for a word; once the tree
// is full, "Three" appears there in gold, letter by letter.
//
// Desktop (from 1024px): the first block is centred and the rest alternate
// left and right, far apart, with the line winding between them. The story is
// a pinned stage: it holds still on screen while you scroll, and scrolling
// moves a camera over it. The camera starts close on the first block; as you
// scroll on it pulls back (so the line can be seen winding across), travels
// to the next block, and closes in on it just as the line reaches it and it
// lights up — and so on, ending on the family tree. Scrolling on, the camera
// lifts the words to the top of the screen as the tree fades away; once it's
// gone a gold ribbon sweeps in from the edge, and a deck of cards rises in under the words,
// deals out into a row and turns face-up one card at a time: one for each
// generation (see GenerationCards). Then the page scrolls on.
//
// Smaller screens: no camera, and the line only at the top — a short drop
// from under the heading to a bulb over the first (centred) block, which
// lights it. The other blocks follow as plain text, each brightening as it
// scrolls up the screen; then the family tree fills as you scroll down it,
// and the generation cards follow, two by two, turning as they scroll in.
//
// Visitors who ask for reduced motion get the finished picture: no camera,
// the line and tree fully drawn, every block lit and "Three" shown.
// (The letters still fade in; that's a short fade, not motion.)

export interface StoryChapter {
  label: string; // small gold heading, e.g. "1960 · Voice of Radio"
  text: string;
  time: string; // phones: the year (or word) that rolls over, e.g. "1960"
  title: string; // phones: the heading under it, e.g. "Voice of Radio"
}

interface Point {
  x: number;
  y: number;
}

interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface Segment {
  d: string; // SVG path
  length: number;
  samples: { len: number; x: number; y: number }[]; // along the path
}

// ── Camera timeline (desktop), in screen heights of scrolling ────────────────
const LEAD_IN = 0.5; // the line draws into the first block
const HOLD = 0.55; // the camera rests on a block
const TRAVEL = 1.1; // the camera moves on to the next block (and finally to the tree)
const TREE_DRAW = 0.9; // the family tree fills up
const TREE_HOLD = 1; // "Three" is revealed, and the camera rests on the tree
const RISE = 0.9; // the words move up to the top of the screen; the tree fades away
const DEAL = 1; // the deck rises in under the words and deals out into a row
const FLIP_EACH = 0.5; // one card turning face-up (they overlap; see flipSpan)
const END_HOLD = 0.8; // the cards float, face-up
const TEXT_ZOOM = 1.15; // how large the words are once at the top
const ZOOM = 1.6; // how close the camera gets to a block (less if the block wouldn't fit)
const NAVBAR = 118; // the camera frames blocks in the screen below the navbar
const FIT = 0.86; // share of that space a framed block (or pair, pulled back) may fill

/** How tall the pinned stage is: one screen, plus the scrolling the camera moves through. */
const stageHeight = (blocks: number, cards: number) =>
  `${(1 + LEAD_IN + blocks * HOLD + blocks * TRAVEL + TREE_DRAW + TREE_HOLD + RISE + DEAL + flipSpan(cards) * FLIP_EACH + END_HOLD) * 100}svh`;

// ── Line drawing (small screens) ────────────────────────────────────────────
const TIP_AT = 0.62; // the line's tip sits this far down the window
const EASE = 0.14; // how quickly what's drawn (and the camera) catch up with the scroll

// ── Line layout ─────────────────────────────────────────────────────────────
const SIDE_GAP = 36; // desktop: how far beside a side block the line meets it
const LABEL_Y = 14; // the meeting point is level with the block's label

// Desktop with motion allowed: the pinned camera version.
const PINNED_QUERY = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";
const subscribePinned = (onChange: () => void) => {
  const query = window.matchMedia(PINNED_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
// Phones and tablets with motion allowed: the one-block-at-a-time version (MobileStory).
const MOBILE_QUERY = "(max-width: 1023.98px) and (prefers-reduced-motion: no-preference)";
const subscribeMobile = (onChange: () => void) => {
  const query = window.matchMedia(MOBILE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

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

/** A smooth S from `from` to `to`, leaving and arriving heading straight down. */
const sCurve = (from: Point, to: Point) => {
  const drop = (to.y - from.y) * 0.55;
  return segment(from, to, { x: from.x, y: from.y + drop }, { x: to.x, y: to.y - drop });
};

/** How far along a segment the tip is, given the tip's height. */
function drawnIn(seg: Segment, tipY: number): number {
  if (seg.samples[0].y > tipY) return 0;
  let reached = 0;
  for (let i = 1; i < seg.samples.length; i++) {
    const s = seg.samples[i];
    if (s.y > tipY) {
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

const smooth = (t: number) => t * t * (3 - 2 * t);

// Desktop placement of each block: the first centred, then left, right, left…
const placement = (i: number) =>
  i === 0
    ? "mx-auto max-w-[780px] text-center"
    : i % 2 === 1
      ? "lg:mr-auto lg:max-w-[min(480px,36%)]"
      : "lg:ml-auto lg:max-w-[min(480px,36%)]";

/** A bulb at a point on the line: dark until `on`, then lit with a soft halo. */
function Bulb({ at, on }: { at: Point; on: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute top-0 left-0 size-0" style={{ transform: `translate(${at.x}px, ${at.y}px)` }}>
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
    </div>
  );
}

export function StoryPath({
  chapters,
  generations,
  children,
}: {
  chapters: StoryChapter[];
  generations: Generation[];
  children?: ReactNode; // shown under the generation cards (e.g. a link to the team)
}) {
  const pinned = useSyncExternalStore(subscribePinned, () => window.matchMedia(PINNED_QUERY).matches, () => false);
  const mobile = useSyncExternalStore(subscribeMobile, () => window.matchMedia(MOBILE_QUERY).matches, () => false);
  const stageRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const blockRefs = useRef<(HTMLElement | null)[]>([]);
  const finaleRef = useRef<HTMLDivElement>(null);
  const treeSpaceRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<HTMLParagraphElement>(null);
  // The tree's parts, faded out together once the words move up (desktop).
  const treeFadeRefs = useRef<(SVGGElement | HTMLDivElement | null)[]>([]);
  const deckRef = useRef<DeckControl | null>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const treeRefs = useRef<(SVGPathElement | null)[][]>([]);
  const tipRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<{
    width: number;
    height: number;
    segments: Segment[]; // segments[i] ends at block i; the last one ends at the tree
    joints: Point[];
    blocks: Box[];
    tree: TreeLevel[];
    treeTop: number;
    treeSize: number;
    finale: Box;
    words: Box;
    narrow: boolean; // small screens: the line only at the top (see above)
  } | null>(null);
  const [lit, setLit] = useState(0); // how many blocks are switched on
  const [treeLit, setTreeLit] = useState(false); // the line has reached the top of the tree
  const [three, setThree] = useState(false); // the tree is full and "Three" is showing

  // Measure the blocks and lay the line out between them; again whenever any
  // of them changes size (fonts loading, window resized). Positions are taken
  // from the layout (offsets), so the camera's zoom doesn't affect them.
  useEffect(() => {
    const canvas = canvasRef.current;
    const finaleEl = finaleRef.current;
    const treeSpace = treeSpaceRef.current;
    const wordsEl = wordsRef.current;
    if (!canvas || !finaleEl || !treeSpace || !wordsEl) return;
    const measure = () => {
      // Not while the phone version (MobileStory) is showing instead.
      if (!canvas.isConnected || blockRefs.current.some((el) => !el)) return;
      const wide = window.matchMedia("(min-width: 1024px)").matches;
      const boxOf = (el: HTMLElement, parent: HTMLElement | null): Box => {
        const left = (parent?.offsetLeft ?? 0) + el.offsetLeft;
        const top = (parent?.offsetTop ?? 0) + el.offsetTop;
        return { left, right: left + el.offsetWidth, top, bottom: top + el.offsetHeight };
      };
      // Blocks sit in the <ol>; the tree's space sits in the finale; both are in the canvas.
      const blocks = blockRefs.current.map((el) => boxOf(el!, el!.offsetParent as HTMLElement));
      const finale = boxOf(finaleEl, null);
      const words = boxOf(wordsEl, finaleEl);
      const centre = canvas.offsetWidth / 2;
      const treeSize = wide ? 1 : TREE_NARROW;
      const treeTop = finale.top + treeSpace.offsetTop;

      // Where the line meets each block (small screens: only the first, above it).
      const joints: Point[] = (wide ? blocks : blocks.slice(0, 1)).map((r, i) =>
        i === 0
          ? { x: centre, y: r.top - 28 }
          : i % 2 === 1
            ? { x: r.right + SIDE_GAP, y: r.top + LABEL_Y }
            : { x: r.left - SIDE_GAP, y: r.top + LABEL_Y },
      );

      // Into the first block, from the top.
      const segments: Segment[] = [segment({ x: joints[0].x, y: 0 }, joints[0])];
      if (wide) {
        // The line goes behind the first block and comes out below it; from a
        // side block it carries on from where it met it, sweeping across to
        // the next in a smooth S. Finally back to the middle, to the top of
        // the tree's trunk.
        for (let i = 1; i < joints.length; i++) {
          segments.push(sCurve(i === 1 ? { x: centre, y: blocks[0].bottom + 28 } : joints[i - 1], joints[i]));
        }
        segments.push(sCurve(joints[joints.length - 1], { x: centre, y: treeTop }));
      }

      setLayout({
        width: canvas.offsetWidth,
        height: canvas.offsetHeight,
        segments,
        joints,
        blocks,
        tree: familyTree({ x: centre, y: treeTop }, treeSize),
        treeTop,
        treeSize,
        finale,
        words,
        narrow: !wide,
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    observer.observe(finaleEl);
    blockRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [pinned, mobile]);

  // Draw the line and tree (and, on desktop, move the camera) with the scroll.
  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!layout || !canvas || !stage) return;
    const { segments, blocks, tree } = layout;
    const lineTotal = segments.reduce((sum, s) => sum + s.length, 0);
    const treeTotal = tree.reduce((sum, level) => sum + level.length, 0);
    const total = lineTotal + treeTotal;
    // Total length drawn by the time the line reaches each block (and the tree).
    const reachAt = segments.map((_, i) => segments.slice(0, i + 1).reduce((sum, s) => sum + s.length, 0));

    const paint = (drawn: number) => {
      let left = drawn;
      segments.forEach((seg, i) => {
        const here = Math.max(0, Math.min(seg.length, left));
        left -= seg.length;
        const path = pathRefs.current[i];
        if (path) path.style.strokeDashoffset = `${seg.length - here}`;
      });
      // The tree fills level by level, every branch of a level at once.
      tree.forEach((level, i) => {
        const here = Math.max(0, Math.min(level.length, left));
        left -= level.length;
        treeRefs.current[i]?.forEach((path) => {
          if (path) path.style.strokeDashoffset = `${level.length - here}`;
        });
      });
      // The glowing tip, at the end of the line (not in the tree, which has many ends).
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
        tip.style.opacity = drawn > 1 && drawn < lineTotal - 1 && point ? "1" : "0";
        if (point) tip.style.transform = `translate(${point.x}px, ${point.y}px)`;
      }
      setLit(reachAt.slice(0, blocks.length).filter((at) => drawn >= at - 2).length);
      setTreeLit(drawn >= lineTotal - 2);
      setThree(drawn >= total - 2);
    };

    // Reduced motion: everything drawn and lit, no camera.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      canvas.style.transform = "";
      paint(total);
      setLit(blocks.length); // the narrow layout lights blocks by scrolling, not the line
      return;
    }

    let frame = 0;

    // ── Small screens: the line's tip follows a point on the screen. ──
    if (!pinned) {
      canvas.style.transform = "";
      const height = treeHeight(layout.treeSize);
      const target = () => {
        const tipY = window.innerHeight * TIP_AT - canvas.getBoundingClientRect().top;
        let sum = 0;
        for (const seg of segments) {
          const part = drawnIn(seg, tipY);
          sum += part;
          if (part < seg.length - 0.01) return sum;
        }
        // The line is complete: the tree fills as the tip passes down it.
        return sum + treeTotal * Math.max(0, Math.min(1, (tipY - layout.treeTop) / height));
      };
      // Narrow layout: the line only reaches the first block; the others
      // switch on as they pass the same height on the screen.
      const relight = (drawn: number) => {
        if (!layout.narrow || drawn < reachAt[0] - 2) return;
        const tipY = window.innerHeight * TIP_AT - canvas.getBoundingClientRect().top;
        setLit(1 + blocks.slice(1).filter((b) => b.top + LABEL_Y <= tipY).length);
      };
      let drawn = target();
      paint(drawn);
      relight(drawn);
      const tick = () => {
        const goal = target();
        drawn += (goal - drawn) * EASE;
        if (Math.abs(goal - drawn) < 0.5) drawn = goal;
        paint(drawn);
        relight(drawn);
        frame = drawn === goal ? 0 : requestAnimationFrame(tick);
      };
      const wake = () => {
        if (!frame) frame = requestAnimationFrame(tick);
      };
      window.addEventListener("scroll", wake, { passive: true });
      window.addEventListener("resize", wake);
      return () => {
        cancelAnimationFrame(frame);
        window.removeEventListener("scroll", wake);
        window.removeEventListener("resize", wake);
      };
    }

    // ── Desktop: the pinned stage and its camera. ──
    // The camera's stops: each block, then the tree with its words.
    const stops = [...blocks, layout.finale];
    const view = () => {
      const height = window.innerHeight;
      return {
        width: stage.clientWidth,
        height: height - NAVBAR,
        centreX: stage.clientWidth / 2,
        centreY: NAVBAR + (height - NAVBAR) / 2,
        screen: height,
      };
    };
    type View = ReturnType<typeof view>;
    const fitScale = (box: Box, v: View) =>
      Math.min((v.width * FIT) / (box.right - box.left), (v.height * FIT) / (box.bottom - box.top));
    // A "shot": the point the camera centres on, and how close it is.
    const shotOf = (box: Box, v: View) => ({
      x: (box.left + box.right) / 2,
      y: (box.top + box.bottom) / 2,
      scale: Math.min(ZOOM, fitScale(box, v)),
    });

    type Shot = { x: number; y: number; scale: number; screenY?: number };
    const between = (a: Shot, b: Shot, t: number, v: View): Shot => ({
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      scale: Math.exp(Math.log(a.scale) + (Math.log(b.scale) - Math.log(a.scale)) * t),
      screenY: (a.screenY ?? v.centreY) + ((b.screenY ?? v.centreY) - (a.screenY ?? v.centreY)) * t,
    });
    const still = { rise: 0, deal: 0, flip: 0, ribbon: 0 };

    /** Camera, line and cards at `progress` (pixels scrolled into the stage). */
    const at = (progress: number, v: View): { shot: Shot; drawn: number; rise: number; deal: number; flip: number; ribbon: number } => {
      const unit = v.screen;
      const shots = stops.map((box) => shotOf(box, v));
      if (progress < LEAD_IN * unit) return { ...still, shot: shots[0], drawn: reachAt[0] * (progress / (LEAD_IN * unit)) };
      let rest = progress - LEAD_IN * unit;
      for (let i = 0; i < stops.length; i++) {
        if (i === stops.length - 1) {
          // On the tree: it fills, then everything rests with "Three" showing.
          if (rest < (TREE_DRAW + TREE_HOLD) * unit) {
            const fill = Math.min(1, rest / (TREE_DRAW * unit));
            return { ...still, shot: shots[i], drawn: lineTotal + treeTotal * smooth(fill) };
          }
          // Then the words rise to the top as the tree fades, and the cards follow.
          rest -= (TREE_DRAW + TREE_HOLD) * unit;
          const { words } = layout;
          const wordsShot = { x: (words.left + words.right) / 2, y: (words.top + words.bottom) / 2, scale: TEXT_ZOOM, screenY: deckLayout(v.width, v.screen, generations.length).wordsCentre };
          const rise = smooth(Math.min(1, rest / (RISE * unit)));
          const after = rest - RISE * unit;
          return {
            shot: between(shots[i], wordsShot, rise, v),
            drawn: total,
            rise,
            deal: Math.max(0, Math.min(1, after / (DEAL * unit))),
            flip: Math.max(0, Math.min(flipSpan(generations.length), (after - DEAL * unit) / (FLIP_EACH * unit))),
            // The ribbon starts only once the rise is done (the tree gone, the words in place).
            ribbon: Math.max(0, after),
          };
        }
        if (rest < HOLD * unit) return { ...still, shot: shots[i], drawn: reachAt[i] };
        rest -= HOLD * unit;
        if (rest < TRAVEL * unit) {
          const t = smooth(rest / (TRAVEL * unit));
          const from = shots[i];
          const to = shots[i + 1];
          // Pulled back halfway: far enough to frame both stops together.
          const pair = {
            left: Math.min(stops[i].left, stops[i + 1].left),
            right: Math.max(stops[i].right, stops[i + 1].right),
            top: Math.min(stops[i].top, stops[i + 1].top),
            bottom: Math.max(stops[i].bottom, stops[i + 1].bottom),
          };
          const wideShot = Math.min(1, fitScale(pair, v));
          const direct = Math.exp(Math.log(from.scale) + (Math.log(to.scale) - Math.log(from.scale)) * t);
          const dip = wideShot / Math.min(from.scale, to.scale);
          const scale = direct * (1 - (1 - Math.min(1, dip)) * Math.sin(Math.PI * t));
          return {
            ...still,
            shot: { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t, scale },
            drawn: reachAt[i] + (reachAt[i + 1] - reachAt[i]) * t,
          };
        }
        rest -= TRAVEL * unit;
      }
      return { ...still, shot: shots[shots.length - 1], drawn: total };
    };

    const place = (progress: number) => {
      const v = view();
      const { shot, drawn, rise, deal, flip, ribbon } = at(progress, v);
      // Put the shot's centre point in the middle of the view (or where the
      // shot says), at its scale.
      const x = v.centreX - canvas.offsetLeft - shot.x * shot.scale;
      const y = (shot.screenY ?? v.centreY) - shot.y * shot.scale;
      canvas.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${shot.scale.toFixed(4)})`;
      paint(drawn);
      // The tree fades away in the first part of the rise; the deck takes over.
      const treeOpacity = `${1 - Math.min(1, rise / 0.6)}`;
      treeFadeRefs.current.forEach((el) => el && (el.style.opacity = treeOpacity));
      deckRef.current?.update({ show: ribbon > 0 ? 1 : 0, deal, flip, ribbon });
    };

    const target = () => {
      const scrolled = -stage.getBoundingClientRect().top;
      const length = stage.offsetHeight - window.innerHeight;
      return Math.max(0, Math.min(length, scrolled));
    };
    let progress = target();
    place(progress);
    const tick = () => {
      const goal = target();
      progress += (goal - progress) * EASE;
      if (Math.abs(goal - progress) < 0.5) progress = goal;
      place(progress);
      frame = progress === goal ? 0 : requestAnimationFrame(tick);
    };
    const wake = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", wake);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", wake);
    };
  }, [layout, pinned, generations.length]);

  const treeSize = layout?.treeSize ?? 1;

  const story = (
    <>
      {/* The line and the tree: faint tracks showing the whole route, and gold drawn over them. */}
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
          {/* The tree's grey outline: there from the start, the same as the line's track. */}
          <g
            ref={(el) => {
              treeFadeRefs.current[0] = el;
            }}
          >
            {layout.tree.flatMap((level, i) =>
              level.paths.map((d, j) => (
                <path key={`tree-track-${i}-${j}`} d={d} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={4} strokeLinejoin="round" />
              )),
            )}
          </g>
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
          <g
            ref={(el) => {
              treeFadeRefs.current[1] = el;
            }}
          >
            {layout.tree.map((level, i) =>
              level.paths.map((d, j) => (
                <path
                  key={`tree-${i}-${j}`}
                  ref={(el) => {
                    (treeRefs.current[i] ??= [])[j] = el;
                  }}
                  d={d}
                  pathLength={level.length}
                  fill="none"
                  stroke="#E79E3F"
                  strokeWidth={4}
                  strokeLinejoin="round"
                  strokeDasharray={level.length}
                  strokeDashoffset={level.length}
                  className="drop-shadow-[0_0_5px_rgba(231,158,63,0.7)]"
                />
              )),
            )}
          </g>
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
      <div ref={tipRef} aria-hidden className="pointer-events-none absolute top-0 left-0 size-0 opacity-0 transition-opacity duration-300">
        <span className="absolute size-3 -translate-1/2 rounded-full bg-[#FFF4E2] shadow-[0_0_10px_4px_rgba(255,226,180,0.9),0_0_28px_10px_rgba(231,158,63,0.5)]" />
      </div>

      {/* Where the line meets each block, and the top of the tree: a bulb that lights up. */}
      {layout?.joints.map((joint, i) => <Bulb key={`joint-${i}`} at={joint} on={i < lit} />)}
      {layout && !layout.narrow && (
        <div
          ref={(el) => {
            treeFadeRefs.current[2] = el;
          }}
        >
          <Bulb at={{ x: layout.width / 2, y: layout.treeTop }} on={treeLit} />
        </div>
      )}

      {/* Desktop: the blocks are far apart, so the camera has a long way to travel between them. */}
      <ol className="relative flex flex-col gap-12 sm:gap-16 lg:gap-[420px]">
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
              {/* The spotlight (desktop): a soft gold beam from above, and a pool of light behind the text. */}
              <span
                aria-hidden
                className={`pointer-events-none absolute inset-0 -z-10 transition-opacity duration-1000 max-lg:hidden ${on ? "opacity-100" : "opacity-0"}`}
              >
                <span className="absolute -top-56 left-1/2 h-[calc(100%+16rem)] w-[110%] -translate-x-1/2 blur-2xl">
                  <span className="block size-full bg-[linear-gradient(to_bottom,rgba(231,158,63,0.42),rgba(231,158,63,0.12)_55%,rgba(231,158,63,0)_92%)] [clip-path:polygon(44%_0,56%_0,100%_100%,0_100%)]" />
                </span>
                <span className="absolute -inset-10 bg-[radial-gradient(ellipse_at_center,rgba(231,158,63,0.14),transparent_70%)]" />
              </span>
              <p
                className={`font-poppins text-xs tracking-[0.2em] uppercase transition-colors duration-700 sm:text-[13px] ${
                  on ? "text-[#E79E3F]" : "text-[#E79E3F]/35"
                }`}
              >
                {chapter.label}
              </p>
              <p
                className={`mt-3 font-poppins text-xs leading-[1.75] font-light transition-colors duration-700 sm:mt-4 sm:text-lg lg:text-xl ${
                  on ? "text-white" : "text-white/25"
                }`}
              >
                {chapter.text}
              </p>
            </li>
          );
        })}
      </ol>

      {/* The finale: room for the family tree (drawn in the line's SVG above),
          and the words under it, "Three" revealed once the tree is full. */}
      <div ref={finaleRef} className="relative mx-auto mt-28 w-fit text-center lg:mt-[420px]">
        <div
          ref={treeSpaceRef}
          aria-hidden
          className="mx-auto"
          style={{ width: treeWidth(treeSize), height: treeHeight(treeSize) }}
        />
        <p ref={wordsRef} className="mt-8 text-lg font-medium text-white sm:text-2xl lg:mt-10 lg:text-[28px]">
          Powered By{" "}
          <span className="relative inline-block text-[#E79E3F]">
            {/* Letter by letter: each fades in out of a gold blur, a beat after the last. */}
            {"Three".split("").map((letter, i) => (
              <span
                key={i}
                className={`inline-block transition-[opacity,filter,translate] duration-700 ease-out ${
                  three ? "translate-y-0 opacity-100 blur-0 [text-shadow:0_0_14px_rgba(231,158,63,0.8)]" : "translate-y-1 opacity-0 blur-sm"
                }`}
                style={{ transitionDelay: three ? `${i * 90}ms` : "0ms" }}
              >
                {letter}
              </span>
            ))}
          </span>{" "}
          Generations
        </p>
      </div>

      {/* Phones (and reduced motion): the generation cards follow in the page. */}
      {!pinned && <GenerationGrid generations={generations}>{children}</GenerationGrid>}
    </>
  );

  // Desktop: a tall section whose screen-sized inner box stays pinned while
  // the camera moves over the story inside it. Phones and tablets: the
  // one-block-at-a-time version. Reduced motion: the story in the page as
  // normal. (The spotlights reach a little past the content, so the
  // page using this must clip sideways overflow.)
  return pinned ? (
    <section ref={stageRef} aria-label="Our story" className="relative" style={{ height: stageHeight(chapters.length, generations.length) }}>
      <div className="sticky top-0 isolate h-svh overflow-hidden">
        {/* The gold ribbon (behind the story) and the generation cards (in front of it). */}
        <GenerationDeck
          generations={generations}
          controlRef={deckRef}
          ribbonClassName="absolute inset-0 z-0"
          cardsClassName="absolute inset-0 z-20"
        >
          {children}
        </GenerationDeck>
        <div
          ref={canvasRef}
          className={`site-container absolute inset-x-0 top-0 z-10 origin-top-left pt-28 pb-16 transition-opacity duration-500 ${
            layout ? "opacity-100" : "opacity-0"
          }`}
        >
          {story}
        </div>
      </div>
    </section>
  ) : mobile ? (
    <MobileStory chapters={chapters} generations={generations}>
      {children}
    </MobileStory>
  ) : (
    <section ref={stageRef} aria-label="Our story" className="site-container">
      <div ref={canvasRef} className="relative pt-24 pb-16 lg:pt-28 lg:pb-16">
        {story}
      </div>
    </section>
  );
}
