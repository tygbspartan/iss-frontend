"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from "react";
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
// The cards are drawn like playing cards: a big label at the top, the details
// in the middle, and the label again upside-down at the bottom. Their sizes
// are in container units (cqw), so the same card works at any width.

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
  show: number; // 0–1: the ribbon (and the cards' layer) fading in
  deal: number; // 0–1: the deck rises in, then spreads into a row
  flip: number; // 0–cards: how many cards have turned face-up (fractional mid-turn)
  ribbon: number; // pixels scrolled through this part, which moves the ribbon on
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
      {/* The label again, upside-down, like the bottom corner of a playing card. */}
      <div aria-hidden className="rotate-180">
        {corner}
      </div>
    </div>
  );
}

function CardBack() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[5cqw] border border-[#E79E3F]/50 bg-[#121212] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
      {/* Gold line art, in the manner of a playing card's back. */}
      <svg aria-hidden viewBox="0 0 100 142" className="absolute inset-0 size-full" fill="none" stroke="#E79E3F" strokeWidth={0.5} opacity={0.85}>
        <rect x="5" y="5" width="90" height="132" rx="3" />
        <rect x="9" y="9" width="82" height="124" rx="2" />
        <rect x="20" y="28" width="60" height="86" />
        <path d="M20 28 L50 56 L80 28 M20 114 L50 86 L80 114" />
        <path d="M26 28 L50 50 L74 28 M26 114 L50 92 L74 114" opacity={0.6} />
        <path d="M50 44 L72 71 L50 98 L28 71 Z" />
        <path d="M14 71 L28 71 M72 71 L86 71" />
        <circle cx="50" cy="71" r="14" />
        <circle cx="50" cy="18" r="4" />
        <circle cx="50" cy="124" r="4" />
        <path d="M9 22 Q20 22 20 9 M91 22 Q80 22 80 9 M9 120 Q20 120 20 133 M91 120 Q80 120 80 133" />
        {[40, 50, 60, 82, 92, 102].map((y) => (
          <g key={y}>
            <circle cx="14" cy={y} r="1" />
            <circle cx="86" cy={y} r="1" />
          </g>
        ))}
      </svg>
      <Image
        src="/logo.png"
        alt=""
        width={145}
        height={61}
        className="absolute top-1/2 left-1/2 w-[19cqw] -translate-1/2"
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
    width: 34,
    opacity: 0.95,
    speed: 2.2, // ribbon pixels per pixel scrolled
    drift: 70, // ribbon pixels per second, even when the page is still
  },
  {
    d: "M2000 120 C 1500 620, 1100 -120, 700 380 S 60 1240, -300 760 S 360 -200, 980 120 S 1760 1180, 1100 1300",
    width: 26,
    opacity: 0.55,
    speed: 3,
    drift: 110,
  },
];
const VISIBLE = 0.34; // share of each route showing at any time

/**
 * The gold ribbon: thick strokes travelling along long routes, in and out of
 * the picture. `shift()` (read every frame) moves them on with the scroll;
 * they also drift slowly on their own.
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
    const draw = (seconds: number) => {
      const s = shiftRef.current();
      pathRefs.current.forEach((p, i) => {
        if (!p) return;
        const cycle = lengths[i] * (1 + VISIBLE);
        const along = (s * RIBBONS[i].speed + seconds * RIBBONS[i].drift) % cycle;
        p.style.strokeDashoffset = `${-along + lengths[i] * VISIBLE}`;
      });
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      draw(4); // a still picture
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

          // The turn: each card in its own stretch of `flip`, first card first.
          const turned = smooth(clamp01(flip - i));
          const flipper = flipRefs.current[i];
          if (flipper) flipper.style.transform = `rotateY(${(180 * (1 - turned)).toFixed(1)}deg)`;
          // Face-up: it starts to float.
          floatRefs.current[i]?.classList.toggle("animate-card-float", turned >= 1);
        });

        // Under the row, once the last card is nearly face-up: fades in, and
        // only then can it be clicked or reached with the keyboard.
        const footer = footerRef.current;
        if (footer) {
          const shown = clamp01((flip - (count - 0.4)) / 0.4);
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

  // The ribbon moves on as the section scrolls past.
  const shift = () => -(sectionRef.current?.getBoundingClientRect().top ?? 0);

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
