"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from "react";
import Image from "next/image";

// The four generation cards that close the About page's story, and the gold
// ribbon that sweeps behind them.
//
//   • GenerationDeck — desktop, inside the story's pinned stage: a face-down
//     deck rises in, deals out into a row, and the cards flip face-up one
//     after another; once face-up they float. Driven by the story's camera
//     timeline through `controlRef` (see StoryPath).
//   • GenerationGrid — phones (and reduced motion): the cards two by two in
//     the page, each flipping face-up as it scrolls into view.
//
// Each card's back is a gold line drawing of a lit stage (lighting truss,
// beams, an LED screen showing the ISS logo, speakers and a crowd). Its face
// has a big label with a gold numeral at the top, the person's name, role,
// company and generation in the middle, and the label again upside-down at
// the bottom. Sizes are in container units (cqw), so the same card works at
// any width.

export interface Generation {
  label: string; // the card's big label, e.g. "1st Gen"
  numeral: string; // gold mark beside it, e.g. "I"
  name: string;
  role: string;
  organisation: string;
  generation: string; // e.g. "First Generation"
}

/** Where the deck is in its sequence (desktop). */
export interface DeckState {
  show: number; // 0–1: the ribbon's layer showing (it then enters from the edge)
  deal: number; // 0–1: the deck rises in, then spreads into a row
  flip: number; // 0–flipSpan(cards): how far the cards' turning has got (see flipSpan)
  ribbon: number; // pixels scrolled since the ribbon started (0 = not started), which move it on
}

export interface DeckControl {
  update(state: DeckState): void;
}

// The screen space the deck uses (desktop): the words ("Powered By Three
// Generations", placed by StoryPath's camera), the cards in a row under them,
// and what follows the cards (a line of text and a button) — as one group,
// centred in the screen below the navbar, with the cards as large as fits.
const NAVBAR = 118;
const CARD_RATIO = 1.42; // height / width, like a playing card
const MAX_CARD = 300;
const WORDS = 40; // height of the words, as they appear at the top
const WORDS_GAP = 44; // between the words and the cards
const FOOTER_GAP = 40; // between the cards and what follows them
const FOOTER = 120; // height of what follows them
const MARGIN = 24; // the least space above and below the group

/** Where everything goes, for a screen of this size. */
export function deckLayout(width: number, height: number, cards: number) {
  const space = height - NAVBAR;
  const card = Math.min(
    MAX_CARD,
    (width * 0.9) / (cards + (cards - 1) * ROW_GAP),
    (space - 2 * MARGIN - WORDS - WORDS_GAP - FOOTER_GAP - FOOTER) / CARD_RATIO,
  );
  const cardH = card * CARD_RATIO;
  const group = WORDS + WORDS_GAP + cardH + FOOTER_GAP + FOOTER;
  const top = NAVBAR + Math.max(MARGIN, (space - group) / 2);
  return {
    card,
    cardH,
    wordsCentre: top + WORDS / 2, // where StoryPath puts the middle of the words
    cardsTop: top + WORDS + WORDS_GAP,
    footerTop: top + WORDS + WORDS_GAP + cardH + FOOTER_GAP,
  };
}
const ROW_GAP = 0.13; // gap between cards, as a share of a card's width
// Fanned in the deck, and settled (just off straight) in the row.
const DECK_TILT = [-7, -2.5, 2.5, 7];
const ROW_TILT = [-2, 1.5, -1.5, 2];

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const reducedMotion = () => window.matchMedia(REDUCED_MOTION).matches;
const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

// The cards turn one after another, overlapping: each starts once the one
// before it is 70% of the way round. (A turn eases in and out, so that's 64%
// of the way through its time.)
const TURN_STAGGER = 0.64;
/** How long the whole turning takes, in single-card turns (4 cards: about 2.9). */
export const flipSpan = (cards: number) => TURN_STAGGER * (cards - 1) + 1;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const smooth = (t: number) => t * t * (3 - 2 * t);

// ── The card ────────────────────────────────────────────────────────────────

function CardFace({ g }: { g: Generation }) {
  const row = "border-b border-dotted border-[#111]/25 py-[2.6cqw]";
  const corner = (
    <div className="flex items-start justify-between">
      <p className="text-[10.5cqw] leading-none font-medium tracking-tight uppercase">{g.label}</p>
      <span className="font-poppins text-[10cqw] leading-none font-semibold text-[#E79E3F]">{g.numeral}</span>
    </div>
  );
  return (
    <div className="absolute inset-0 flex flex-col rounded-[5cqw] bg-[#FFFCF2] p-[8cqw] text-[#111] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)] [backface-visibility:hidden]">
      {corner}
      <dl className="mt-[7cqw] flex-1 font-poppins text-[4.7cqw] leading-snug">
        <div className={row}>
          <dt className="sr-only">Name</dt>
          <dd className="font-semibold">{g.name}</dd>
        </div>
        <div className={row}>
          <dt className="sr-only">Role</dt>
          <dd>{g.role}</dd>
        </div>
        <div className={row}>
          <dt className="sr-only">Company</dt>
          <dd>{g.organisation}</dd>
        </div>
        <div className="py-[2.6cqw]">
          <dt className="sr-only">Generation</dt>
          <dd className="text-[#C68535]">{g.generation}</dd>
        </div>
      </dl>
      {/* The label again, upside-down at the bottom. */}
      <div aria-hidden className="rotate-180">
        {corner}
      </div>
    </div>
  );
}

// Stage lights along the truss: where each hangs, and where its beam lands on the stage.
const STAGE_LIGHTS = [
  { x: 24, aim: 44 },
  { x: 50, aim: 50 },
  { x: 76, aim: 56 },
];
const CROWD = [12, 19, 26, 33, 40, 47, 54, 61, 68, 75, 82, 89];

function CardBack() {
  const beam = useId(); // the beams' gradient (each card needs its own id)
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[5cqw] border border-[#E79E3F]/40 bg-[linear-gradient(to_bottom,#0d0d0d,#17130f)] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
      {/* A lit stage in gold line art: the truss with its lights and their
          beams, the LED screen (the ISS logo is placed on it below), speaker
          stacks either side, the stage, and the crowd in front. */}
      <svg aria-hidden viewBox="0 0 100 142" className="absolute inset-0 size-full" fill="none" stroke="#E79E3F" strokeWidth={0.5}>
        <defs>
          <linearGradient id={beam} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F2C987" stopOpacity={0.55} />
            <stop offset="1" stopColor="#E79E3F" stopOpacity={0} />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="92" height="134" rx="3" opacity={0.4} />
        {/* Beams, under everything else. */}
        {STAGE_LIGHTS.map(({ x, aim }) => (
          <path key={`beam-${x}`} d={`M${x - 1.6} 31 L${x + 1.6} 31 L${aim + 13} 104 L${aim - 13} 104 Z`} fill={`url(#${beam})`} stroke="none" />
        ))}
        {/* The truss: two rails with a zigzag between. */}
        <path d="M8 15 H92 M8 21 H92" />
        <path d={`M8 21 ${Array.from({ length: 14 }, (_, i) => `L${8 + (i + 0.5) * 6} 15 L${8 + (i + 1) * 6} 21`).join(" ")}`} opacity={0.7} />
        {/* The lights hanging from it. */}
        {STAGE_LIGHTS.map(({ x }) => (
          <g key={`light-${x}`}>
            <path d={`M${x} 21 V23`} />
            <rect x={x - 3.5} y="23" width="7" height="6" rx="1.6" fill="#1a1510" />
            <circle cx={x} cy="30" r="1.6" fill="#FFE7B8" stroke="none" />
          </g>
        ))}
        {/* The LED screen. */}
        <rect x="30" y="47" width="40" height="27" rx="1" fill="#14110d" />
        <path d="M30 50 H70 M30 71 H70" opacity={0.25} />
        {/* Speaker stacks. */}
        {[10, 78].map((x) => (
          <g key={`speakers-${x}`}>
            <rect x={x} y="64" width="12" height="18" rx="1" fill="#14110d" />
            <circle cx={x + 6} cy="70" r="3.2" />
            <circle cx={x + 6} cy="77.5" r="1.8" />
            <rect x={x} y="84" width="12" height="20" rx="1" fill="#14110d" />
            <circle cx={x + 6} cy="91" r="4" />
            <circle cx={x + 6} cy="99" r="2.2" />
          </g>
        ))}
        {/* The stage. */}
        <path d="M6 104 H94 L88 113 H12 Z" fill="#14110d" />
        <path d="M12 108.5 H88" opacity={0.35} />
        {/* The crowd: heads and shoulders, in two rows. */}
        {CROWD.map((x, i) => {
          const y = i % 2 ? 127 : 124;
          return (
            <g key={`fan-${x}`} opacity={0.75}>
              <circle cx={x} cy={y} r="2.3" />
              <path d={`M${x - 4} ${y + 9} Q${x - 4} ${y + 3.5} ${x} ${y + 3.5} Q${x + 4} ${y + 3.5} ${x + 4} ${y + 9}`} />
            </g>
          );
        })}
      </svg>
      {/* The ISS logo, on the LED screen. */}
      <Image
        src="/logo.png"
        alt=""
        width={145}
        height={61}
        className="absolute top-[42.6%] left-1/2 w-[30cqw] -translate-1/2"
      />
    </div>
  );
}

/**
 * One card: an outer box sized by its parent (and placed by the deck), a box
 * that floats once the card is face-up, and the card itself, which turns.
 */
function Card({
  g,
  flipped,
  flipRef,
  floatRef,
  tilt,
  floatDelay,
}: {
  g: Generation;
  flipped?: boolean; // grid: face-up or not (the deck turns its cards itself)
  flipRef?: (el: HTMLDivElement | null) => void;
  floatRef?: (el: HTMLDivElement | null) => void;
  tilt: number;
  floatDelay: number;
}) {
  return (
    <div
      ref={floatRef}
      className={`size-full ${flipped ? "animate-card-float motion-reduce:animate-none" : ""}`}
      style={{ ["--float-tilt" as string]: `${tilt}deg`, animationDelay: `${floatDelay}ms` }}
    >
      <div
        ref={flipRef}
        className={`relative size-full [transform-style:preserve-3d] ${flipRef ? "" : "transition-transform duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"}`}
        style={flipRef ? undefined : { transform: `rotateY(${flipped ? 0 : 180}deg)` }}
      >
        <CardFace g={g} />
        <CardBack />
      </div>
    </div>
  );
}

// ── The ribbon ──────────────────────────────────────────────────────────────

// Long, looping routes across a 1600 × 1000 picture, running off its edges so
// the ribbon sweeps in and out of view.
const RIBBONS = [
  {
    d: "M-400 760 C 120 260, 520 1180, 920 620 S 1520 -160, 1960 300 S 1380 1320, 760 940 S -260 180, 300 -260 S 1260 160, 2000 820 S 900 1400, 200 1160",
    width: 24,
    opacity: 0.95,
    speed: 2.2, // ribbon pixels per pixel scrolled
    drift: 70, // ribbon pixels per second, even when the page is still
  },
  {
    d: "M2000 120 C 1500 620, 1100 -120, 700 380 S 60 1240, -300 760 S 360 -200, 980 120 S 1760 1180, 1100 1300",
    width: 18,
    opacity: 0.55,
    speed: 3,
    drift: 110,
  },
];
const VISIBLE = 0.34; // share of each route showing at any time

/**
 * The gold ribbon: thick strokes travelling along long routes, in and out of
 * the picture. `shift()` (read every frame) is how far the visitor has
 * scrolled since the ribbon should start: while it's 0 nothing shows; from
 * then on each stroke enters from the edge of the picture (where its route
 * begins), moves on with the scroll, and also drifts on its own. Back to 0,
 * and it's gone again, ready to enter afresh.
 */
function Ribbon({ shift, className = "" }: { shift: () => number; className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const shiftRef = useRef(shift);
  useEffect(() => {
    shiftRef.current = shift;
  }, [shift]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const lengths = pathRefs.current.map((p) => p?.getTotalLength() ?? 1);
    pathRefs.current.forEach((p, i) => {
      if (p) p.style.strokeDasharray = `${lengths[i] * VISIBLE} ${lengths[i]}`;
    });
    // `along`: how far each stroke's visible stretch has travelled along its
    // route. At 0 it sits just before the route's start (off the edge, unseen).
    const place = (along: number[]) =>
      pathRefs.current.forEach((p, i) => {
        if (p) p.style.strokeDashoffset = `${lengths[i] * VISIBLE - (along[i] % (lengths[i] * (1 + VISIBLE)))}`;
      });
    let startedAt: number | null = null; // when it started (seconds), for the drift
    const draw = (seconds: number) => {
      const s = shiftRef.current();
      if (s <= 0) startedAt = null;
      else startedAt ??= seconds;
      const drifted = startedAt === null ? 0 : seconds - startedAt;
      place(RIBBONS.map((r) => (s <= 0 ? 0 : s * r.speed + drifted * r.drift)));
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      place(lengths.map((length) => length * 0.6)); // a still picture, part-way along
      return;
    }
    // Runs only while the ribbon is on screen.
    let frame = 0;
    const loop = (now: number) => {
      draw(now / 1000);
      frame = requestAnimationFrame(loop);
    };
    const observer = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(frame);
      frame = entry.isIntersecting ? requestAnimationFrame(loop) : 0;
    });
    observer.observe(svg);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      aria-hidden
      viewBox="0 0 1600 1000"
      preserveAspectRatio="xMidYMid slice"
      className={`pointer-events-none ${className}`}
    >
      <defs>
        <linearGradient id="ribbon-gold" x1="0" y1="0" x2="1600" y2="1000" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#F2C987" />
          <stop offset="0.5" stopColor="#E79E3F" />
          <stop offset="1" stopColor="#C68535" />
        </linearGradient>
      </defs>
      {RIBBONS.map((r, i) => (
        <path
          key={i}
          ref={(el) => {
            pathRefs.current[i] = el;
          }}
          d={r.d}
          fill="none"
          stroke="url(#ribbon-gold)"
          strokeWidth={r.width}
          strokeLinecap="round"
          opacity={r.opacity}
        />
      ))}
    </svg>
  );
}

// ── Desktop: the deck, in the pinned stage ──────────────────────────────────

/**
 * Two layers for the story's pinned stage: the ribbon (to go behind the
 * story) and the cards (in front). Placed and played through `controlRef`.
 * `children` (e.g. a button) appear under the row once every card is face-up.
 */
export function GenerationDeck({
  generations,
  controlRef,
  ribbonClassName,
  cardsClassName,
  children,
}: {
  generations: Generation[];
  controlRef: RefObject<DeckControl | null>;
  ribbonClassName: string;
  cardsClassName: string;
  children?: ReactNode;
}) {
  const ribbonLayerRef = useRef<HTMLDivElement>(null);
  const cardsLayerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const placeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const flipRefs = useRef<(HTMLDivElement | null)[]>([]);
  const floatRefs = useRef<(HTMLDivElement | null)[]>([]);
  const ribbonShift = useRef(0);

  useEffect(() => {
    controlRef.current = {
      update({ show, deal, flip, ribbon }) {
        ribbonShift.current = ribbon;
        const ribbonLayer = ribbonLayerRef.current;
        const layer = cardsLayerRef.current;
        if (!ribbonLayer || !layer) return;
        ribbonLayer.style.opacity = `${show}`;
        layer.style.opacity = `${clamp01(deal / 0.15)}`;

        // Card size and place: as large as fits (in a row, under the words).
        const width = layer.clientWidth;
        const height = layer.clientHeight;
        const count = generations.length;
        const { card, cardH, cardsTop, footerTop } = deckLayout(width, height, count);
        const rowWidth = count * card + (count - 1) * card * ROW_GAP;

        // The deal: rise in from below as a deck (first 30%), then spread out.
        const rise = smooth(clamp01(deal / 0.3));
        const spread = smooth(clamp01((deal - 0.3) / 0.7));
        generations.forEach((_, i) => {
          const el = placeRefs.current[i];
          if (!el) return;
          const deckX = (width - card) / 2 + (i - (count - 1) / 2) * 5;
          const rowX = (width - rowWidth) / 2 + i * card * (1 + ROW_GAP);
          const x = deckX + (rowX - deckX) * spread;
          const y = cardsTop + (1 - rise) * height * 0.6;
          const tilt = DECK_TILT[i % DECK_TILT.length] + (ROW_TILT[i % ROW_TILT.length] - DECK_TILT[i % DECK_TILT.length]) * spread;
          el.style.width = `${card}px`;
          el.style.height = `${cardH}px`;
          el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${tilt.toFixed(2)}deg)`;

          // The turn: first card first, each starting when the one before is 70% open.
          const turned = smooth(clamp01(flip - i * TURN_STAGGER));
          const flipper = flipRefs.current[i];
          if (flipper) flipper.style.transform = `rotateY(${(180 * (1 - turned)).toFixed(1)}deg)`;
          // Face-up: it starts to float.
          floatRefs.current[i]?.classList.toggle("animate-card-float", turned >= 1);
        });

        // Under the row, once the last card is nearly face-up: fades in, and
        // only then can it be clicked or reached with the keyboard.
        const footer = footerRef.current;
        if (footer) {
          const shown = clamp01((flip - (flipSpan(count) - 0.4)) / 0.4);
          footer.style.top = `${footerTop.toFixed(1)}px`;
          footer.style.opacity = `${shown}`;
          footer.inert = shown < 0.5;
        }
      },
    };
    return () => {
      controlRef.current = null;
    };
  }, [controlRef, generations]);

  const shift = () => ribbonShift.current;

  return (
    <>
      <div ref={ribbonLayerRef} aria-hidden className={`opacity-0 ${ribbonClassName}`}>
        <Ribbon shift={shift} className="size-full" />
      </div>
      <div ref={cardsLayerRef} className={`pointer-events-none opacity-0 [perspective:1600px] ${cardsClassName}`}>
        <ul aria-label="Three generations of ISS">
          {generations.map((g, i) => (
            <li
              key={g.name}
              ref={(el) => {
                placeRefs.current[i] = el as HTMLDivElement | null;
              }}
              className="@container absolute top-0 left-0 will-change-transform"
              style={{ zIndex: generations.length - i }}
            >
              <Card
                g={g}
                tilt={ROW_TILT[i % ROW_TILT.length] / 2}
                floatDelay={i * 380}
                flipRef={(el) => {
                  flipRefs.current[i] = el;
                }}
                floatRef={(el) => {
                  floatRefs.current[i] = el;
                }}
              />
            </li>
          ))}
        </ul>
        {children && (
          <div ref={footerRef} inert className="pointer-events-auto absolute inset-x-0 flex justify-center opacity-0">
            {children}
          </div>
        )}
      </div>
    </>
  );
}

// ── Phones (and reduced motion): the grid ───────────────────────────────────

/**
 * The cards two by two in the page, each turning face-up as it scrolls into
 * view; `children` (e.g. a button) follow under them.
 */
export function GenerationGrid({ generations, children }: { generations: Generation[]; children?: ReactNode }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [flipped, setFlipped] = useState<boolean[]>(() => generations.map(() => false));
  // Reduced motion: every card is simply face-up.
  const still = useSyncExternalStore(subscribeReducedMotion, reducedMotion, () => false);

  // A card turns once its top is three quarters of the way up the screen —
  // which also catches cards already scrolled past (e.g. after jumping down
  // the page). Checked on scroll, until every card has turned.
  useEffect(() => {
    if (reducedMotion()) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const turned = generations.map(() => false);
    let frame = 0;
    const check = () => {
      frame = 0;
      cardRefs.current.forEach((el, i) => {
        if (!el || turned[i] || el.getBoundingClientRect().top > window.innerHeight * 0.75) return;
        turned[i] = true;
        // The second card of a row turns a moment after the first.
        timers.push(setTimeout(() => setFlipped((prev) => prev.map((v, j) => (j === i ? true : v))), (i % 2) * 220));
      });
      if (turned.every(Boolean)) window.removeEventListener("scroll", wake);
    };
    const wake = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    window.addEventListener("scroll", wake, { passive: true });
    wake();
    return () => {
      window.removeEventListener("scroll", wake);
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
    };
  }, [generations]);

  // The ribbon starts as the section comes into view, and moves on as it scrolls past.
  const shift = () => Math.max(0, window.innerHeight * 0.85 - (sectionRef.current?.getBoundingClientRect().top ?? Infinity));

  return (
    <div ref={sectionRef} className="relative isolate mt-14 py-10">
      <Ribbon shift={shift} className="absolute -inset-x-5 inset-y-0 -z-10 h-full w-[calc(100%+2.5rem)] opacity-90" />
      <ul aria-label="Three generations of ISS" className="mx-auto grid max-w-[600px] grid-cols-2 gap-3 [perspective:1200px] sm:gap-5">
        {generations.map((g, i) => (
          <li
            key={g.name}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className="@container aspect-[100/142]"
          >
            <Card g={g} flipped={still || flipped[i]} tilt={ROW_TILT[i % ROW_TILT.length] / 2} floatDelay={i * 380} />
          </li>
        ))}
      </ul>
      {children && <div className="mt-10 flex justify-center">{children}</div>}
    </div>
  );
}
