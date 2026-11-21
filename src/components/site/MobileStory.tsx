"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Card, CARD_PERSPECTIVE, DECK_TILT, flipSpan, Ribbon, TURN_STAGGER, type Generation } from "./GenerationCards";
import type { StoryChapter } from "./StoryPath";
import { familyTree, treeHeight, treeWidth, TREE_NARROW } from "./storyTree";

// The About page's story on phones and tablets (StoryPath shows it below
// 1024px, when motion is allowed). Two pinned screens:
//
//   • The story: a short gold line draws down and a bulb fades on, then one
//     block at a time, centred. Scrolling moves to the next: first its year
//     rolls over like an odometer (1960 → 1993), then its title, then its
//     text. Scrolling back rolls them the other way.
//   • The finale: the family tree fills and "Three" appears; then the tree
//     fades as "Powered By Three Generations" rises to the top, a big stacked
//     deck takes the middle of the screen, deals out into a 2 × 2 grid, and
//     the cards turn face-up (each starting when the one before is 30% over).
//     Scrolling back plays it in reverse.

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const smooth = (t: number) => t * t * (3 - 2 * t);
const easeOut = (t: number) => 1 - (1 - t) ** 3;

const isDigits = (v: string) => /^\d+$/.test(v);

// ── Rolling text ────────────────────────────────────────────────────────────

/** Digits that roll like an odometer: each column spins to its new digit. */
function Digits({ value }: { value: string }) {
  return (
    <span className="inline-flex">
      {value.split("").map((digit, i) => (
        <span key={i} className="inline-block h-[1.1em] overflow-hidden leading-[1.1]">
          <span
            className="block transition-transform duration-900 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ transform: `translateY(${-Number(digit) * 1.1}em)` }}
          >
            {"0123456789".split("").map((n) => (
              <span key={n} className="block h-[1.1em]">
                {n}
              </span>
            ))}
          </span>
        </span>
      ))}
    </span>
  );
}

interface RollItem {
  id: number;
  value: string;
  leaving: boolean;
}

/**
 * Text that rolls over when \`value\` changes: the old rolls out as the new
 * rolls in (\`direction\` 1: upwards, -1: downwards), \`delay\` ms after the
 * change. Numbers of the same length don't roll as a whole: their digits
 * spin instead (see Digits).
 */
function Roll({ value, direction, delay = 0, className = "" }: { value: string; direction: number; delay?: number; className?: string }) {
  const [items, setItems] = useState<RollItem[]>([{ id: 0, value, leaving: false }]);
  const shown = useRef(value);
  const nextId = useRef(1);

  useEffect(() => {
    if (value === shown.current) return;
    const before = shown.current;
    shown.current = value;
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(
      setTimeout(() => {
        if (isDigits(before) && isDigits(value) && before.length === value.length) {
          // Same item: its digits spin to the new number.
          setItems((list) => list.map((item, i) => (i === list.length - 1 ? { ...item, value } : item)));
          return;
        }
        const id = nextId.current++;
        setItems((list) => [...list.filter((item) => !item.leaving).map((item) => ({ ...item, leaving: true })), { id, value, leaving: false }]);
        timers.push(setTimeout(() => setItems((list) => list.filter((item) => !item.leaving)), 600));
      }, delay),
    );
    return () => timers.forEach(clearTimeout);
  }, [value, delay]);

  const up = direction >= 0;
  return (
    <span className={`grid overflow-hidden ${className}`}>
      {items.map((item) => (
        <span
          key={item.id}
          aria-hidden={item.leaving || undefined}
          // The new text waits until the old has rolled away, so they never overlap.
          style={!item.leaving && items.length > 1 ? { animationDelay: "300ms" } : undefined}
          className={`[grid-area:1/1] ${
            item.leaving
              ? up
                ? "animate-roll-up-out"
                : "animate-roll-down-out"
              : items.length > 1 || item.id > 0
                ? up
                  ? "animate-roll-up-in"
                  : "animate-roll-down-in"
                : ""
          }`}
        >
          {isDigits(item.value) ? <Digits value={item.value} /> : item.value}
        </span>
      ))}
    </span>
  );
}

// ── The story ───────────────────────────────────────────────────────────────

const STORY_PER_BLOCK = 0.75; // screens of scrolling per block

function Story({ chapters }: { chapters: StoryChapter[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const [drawn, setDrawn] = useState(false); // the line has drawn down
  const [lit, setLit] = useState(false); // the bulb is on

  // The line draws down, then the bulb fades on.
  useEffect(() => {
    const draw = setTimeout(() => setDrawn(true), 250);
    const light = setTimeout(() => setLit(true), 1600);
    return () => {
      clearTimeout(draw);
      clearTimeout(light);
    };
  }, []);

  // Which block is showing: by how far the pinned screen has been scrolled.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    let frame = 0;
    const check = () => {
      frame = 0;
      const length = section.offsetHeight - window.innerHeight;
      const progress = clamp01(-section.getBoundingClientRect().top / length);
      const next = Math.min(chapters.length - 1, Math.floor(progress * chapters.length));
      setActive((current) => {
        if (next !== current) setDirection(next > current ? 1 : -1);
        return next;
      });
    };
    const wake = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", wake);
    wake();
    return () => {
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", wake);
      cancelAnimationFrame(frame);
    };
  }, [chapters.length]);

  const chapter = chapters[active];
  return (
    <section
      ref={sectionRef}
      aria-label="Our story"
      className="relative -mt-6"
      style={{ height: `${(1 + chapters.length * STORY_PER_BLOCK) * 100}svh` }}
    >
      {/* For screen readers: the whole story at once. */}
      <ol className="sr-only">
        {chapters.map((c) => (
          <li key={c.label}>
            <p>{c.label}</p>
            <p>{c.text}</p>
          </li>
        ))}
      </ol>

      <div aria-hidden className="sticky top-0 flex h-svh flex-col items-center px-6 pt-28 text-center">
        {/* The line drawing down, and the bulb it lights. */}
        <span
          className={`block h-16 w-[3px] origin-top rounded-full bg-linear-to-b from-[#F2C987]/60 to-[#E79E3F] transition-transform duration-[1300ms] ease-out ${
            drawn ? "scale-y-100" : "scale-y-0"
          }`}
        />
        <span className="relative -mt-0.5 size-5">
          <span
            className={`absolute top-1/2 left-1/2 size-24 -translate-1/2 rounded-full bg-[radial-gradient(circle,rgba(242,201,135,0.45),rgba(231,158,63,0.12)_45%,transparent_70%)] transition-[opacity,scale] duration-[1600ms] ease-out ${
              lit ? "scale-100 opacity-100" : "scale-50 opacity-0"
            }`}
          />
          <span
            className={`absolute inset-0 rounded-full border transition-[background-color,border-color,box-shadow] duration-[1400ms] ease-out ${
              lit
                ? "border-[#FFF4E2] bg-[#FFE7B8] shadow-[0_0_14px_5px_rgba(255,226,180,0.85),0_0_44px_18px_rgba(231,158,63,0.45)]"
                : "border-white/25 bg-[#1a1a1a]"
            }`}
          />
        </span>

        {/* One block at a time: the year, then the title, then the text roll over. */}
        <div className={`mt-10 flex w-full max-w-md flex-col items-center transition-opacity duration-1000 ${lit ? "opacity-100" : "opacity-25"}`}>
          <Roll value={chapter.time} direction={direction} className="text-[40px] leading-[1.1] font-medium tracking-tight text-[#E79E3F] sm:text-5xl" />
          <Roll
            value={chapter.title}
            direction={direction}
            delay={200}
            className="mt-3 font-poppins text-xs tracking-[0.2em] text-white uppercase sm:text-sm"
          />
          <Roll
            value={chapter.text}
            direction={direction}
            delay={400}
            className="mt-6 font-poppins text-sm leading-[1.75] font-light text-white/85 sm:text-base"
          />
        </div>

        {/* Where you are in the story — hidden while the idle scroll hint
            (ScrollHint) shows in the same spot. */}
        <div className="absolute bottom-10 flex gap-2 transition-opacity duration-700 in-data-[scroll-hint]:opacity-0">
          {chapters.map((c, i) => (
            <span key={c.label} className={`h-1 rounded-full transition-all duration-500 ${i === active ? "w-6 bg-[#E79E3F]" : "w-2 bg-white/20"}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ── The finale: the tree, then the cards ────────────────────────────────────

const FINALE_SCREENS = 6; // how tall the pinned finale is, in screens
// Its timeline, as shares of the scrolling through it:
const FILL_END = 0.2; // the tree fills
const RISE = [0.26, 0.38]; // the tree fades, the words rise to the top
const DECK = [0.34, 0.5]; // the deck rises into the middle, big
const DEAL = [0.52, 0.68]; // ...then deals out into a 2 × 2 grid
const TURN = [0.7, 0.9]; // the cards turn face-up
const SHOW_END = [0.9, 0.95]; // what follows the cards fades in

const WORDS_TOP = 96; // where the words end up (below the navbar)
const NAV_SPACE = 150; // the cards' area starts here
const FOOTER_SPACE = 130; // room under the cards for what follows them
const GAP = 12;
const CARD_RATIO = 1.42;
// The tree is the same at every screen size, so it's worked out once.
const TREE_W = treeWidth(TREE_NARROW);
const TREE_H = treeHeight(TREE_NARROW);
const TREE = familyTree({ x: TREE_W / 2 + 2, y: 2 }, TREE_NARROW);
const TREE_TOTAL = TREE.reduce((sum, level) => sum + level.length, 0);
const span = (range: number[], p: number) => clamp01((p - range[0]) / (range[1] - range[0]));

function Finale({ generations, children }: { generations: Generation[]; children?: ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<HTMLDivElement>(null);
  const treePathRefs = useRef<(SVGPathElement | null)[][]>([]);
  const wordsRef = useRef<HTMLDivElement>(null);
  const ribbonRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLUListElement>(null);
  const placeRefs = useRef<(HTMLLIElement | null)[]>([]);
  const flipRefs = useRef<(HTMLDivElement | null)[]>([]);
  const footerRef = useRef<HTMLDivElement>(null);
  const ribbonShift = useRef(0);
  const [three, setThree] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;
    let frame = 0;
    let threeShown = false;
    const count = generations.length;

    const update = () => {
      frame = 0;
      const W = stage.clientWidth;
      const H = stage.clientHeight;
      const length = section.offsetHeight - window.innerHeight;
      const scrolled = Math.max(0, Math.min(length, -section.getBoundingClientRect().top));
      const p = length > 0 ? scrolled / length : 0;

      // The tree fills, level by level.
      const fill = clamp01(p / FILL_END);
      let left = fill * TREE_TOTAL;
      TREE.forEach((level, i) => {
        const here = Math.max(0, Math.min(level.length, left));
        left -= level.length;
        treePathRefs.current[i]?.forEach((path) => path && (path.style.strokeDashoffset = `${level.length - here}`));
      });
      const full = fill >= 1;
      if (full !== threeShown) {
        threeShown = full;
        setThree(full);
      }

      // The tree fades and the words rise to the top.
      const rise = smooth(span(RISE, p));
      const treeTop = H * 0.3;
      const wordsStart = treeTop + TREE_H + 28;
      if (treeRef.current) {
        treeRef.current.style.top = `${treeTop}px`;
        treeRef.current.style.opacity = `${1 - clamp01(rise / 0.6)}`;
      }
      if (wordsRef.current) wordsRef.current.style.transform = `translateY(${(wordsStart + (WORDS_TOP - wordsStart) * rise).toFixed(1)}px)`;

      // The ribbon comes in once the tree has gone.
      if (ribbonRef.current) ribbonRef.current.style.opacity = rise >= 1 ? "1" : "0";
      ribbonShift.current = rise >= 1 ? Math.max(0, scrolled - RISE[1] * length) : 0;

      // The cards: a big stacked deck in the middle, then a 2 × 2 grid.
      const avail = H - NAV_SPACE - FOOTER_SPACE;
      const cw = Math.min((W - 40 - GAP) / 2, (avail - GAP) / 2 / CARD_RATIO);
      const ch = cw * CARD_RATIO;
      const gx = (W - (2 * cw + GAP)) / 2;
      const gy = NAV_SPACE + (avail - (2 * ch + GAP)) / 2;
      const bw = Math.min(W * 0.66, (avail * 0.96) / CARD_RATIO);
      const bh = bw * CARD_RATIO;
      const bx = (W - bw) / 2;
      const by = NAV_SPACE + (avail - bh) / 2;
      const deck = easeOut(span(DECK, p));
      const deal = smooth(span(DEAL, p));
      if (cardsRef.current) cardsRef.current.style.opacity = deck > 0 ? "1" : "0";
      const turning = span(TURN, p) * flipSpan(count);
      generations.forEach((_, i) => {
        const el = placeRefs.current[i];
        if (!el) return;
        const fromX = bx + (i - (count - 1) / 2) * 5;
        const fromY = by + (1 - deck) * H;
        const toX = gx + (i % 2) * (cw + GAP);
        const toY = gy + Math.floor(i / 2) * (ch + GAP);
        const w = bw + (cw - bw) * deal;
        const h = bh + (ch - bh) * deal;
        const tilt = DECK_TILT[i % DECK_TILT.length] * (1 - deal * 0.8);
        el.style.width = `${w.toFixed(1)}px`;
        el.style.height = `${h.toFixed(1)}px`;
        el.style.transform = `translate(${(fromX + (toX - fromX) * deal).toFixed(1)}px, ${(fromY + (toY - fromY) * deal).toFixed(1)}px) rotate(${tilt.toFixed(2)}deg)`;
        const turned = smooth(clamp01(turning - i * TURN_STAGGER));
        const flipper = flipRefs.current[i];
        if (flipper) flipper.style.transform = `perspective(${CARD_PERSPECTIVE}px) rotateY(${(180 * (1 - turned)).toFixed(1)}deg)`;
      });

      // What follows the cards (the team link).
      const footer = footerRef.current;
      if (footer) {
        const shown = span(SHOW_END, p);
        footer.style.top = `${(gy + 2 * ch + GAP + 28).toFixed(1)}px`;
        footer.style.opacity = `${shown}`;
        footer.inert = shown < 0.5;
      }
    };
    const wake = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", wake);
    wake();
    return () => {
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", wake);
      cancelAnimationFrame(frame);
    };
  }, [generations]);

  return (
    <section ref={sectionRef} aria-label="Three generations" className="relative" style={{ height: `${FINALE_SCREENS * 100}svh` }}>
      <div ref={stageRef} className="sticky top-0 isolate h-svh overflow-hidden">
        {/* The gold ribbon, behind everything, once the tree has gone. */}
        <div ref={ribbonRef} aria-hidden className="absolute inset-0 -z-10 opacity-0 transition-opacity duration-500">
          <Ribbon shift={() => ribbonShift.current} className="size-full" />
        </div>

        {/* The family tree: a grey outline, filling with gold. */}
        <div ref={treeRef} aria-hidden className="absolute inset-x-0 flex justify-center">
          <svg width={TREE_W + 4} height={TREE_H + 4} fill="none" strokeLinejoin="round">
            {TREE.flatMap((level, i) =>
              level.paths.map((d, j) => <path key={`track-${i}-${j}`} d={d} stroke="rgba(255,255,255,0.07)" strokeWidth={4} />),
            )}
            {TREE.map((level, i) =>
              level.paths.map((d, j) => (
                <path
                  key={`fill-${i}-${j}`}
                  ref={(el) => {
                    (treePathRefs.current[i] ??= [])[j] = el;
                  }}
                  d={d}
                  stroke="#E79E3F"
                  strokeWidth={4}
                  strokeDasharray={level.length}
                  strokeDashoffset={level.length}
                  className="drop-shadow-[0_0_5px_rgba(231,158,63,0.7)]"
                />
              )),
            )}
          </svg>
        </div>

        {/* The words: under the tree, then at the top of the screen. */}
        <div ref={wordsRef} className="absolute inset-x-0 top-0 px-4 text-center">
          <p className="text-xl font-medium text-white sm:text-2xl">
            Powered By{" "}
            <span className="inline-block text-[#E79E3F]">
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

        {/* The cards. */}
        <ul ref={cardsRef} aria-label="Three generations of ISS" className="absolute inset-0 opacity-0">
          {generations.map((g, i) => (
            <li
              key={g.name}
              ref={(el) => {
                placeRefs.current[i] = el;
              }}
              className="@container absolute top-0 left-0 will-change-transform"
              style={{ zIndex: generations.length - i }}
            >
              <Card
                g={g}
                tilt={0}
                floatDelay={i * 380}
                flipRef={(el) => {
                  flipRefs.current[i] = el;
                }}
              />
            </li>
          ))}
        </ul>

        {children && (
          <div ref={footerRef} inert className="absolute inset-x-0 flex justify-center px-4 opacity-0">
            {children}
          </div>
        )}
      </div>
    </section>
  );
}

export function MobileStory({
  chapters,
  generations,
  children,
}: {
  chapters: StoryChapter[];
  generations: Generation[];
  children?: ReactNode;
}) {
  return (
    <>
      <Story chapters={chapters} />
      <Finale generations={generations}>{children}</Finale>
    </>
  );
}
