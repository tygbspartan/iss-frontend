"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, X } from "lucide-react";
import type { UpcomingEvent } from "@/lib/admin/types";

// The opening sequence (on page load, and each time the button is clicked), then
// normal use:
//   button → the white arrow alone
//   pill   → it widens and "Upcoming Events" appears beside the arrow
//   card   → the same box keeps growing into the card's size, shape and colour,
//            and the card's contents fade in as it arrives
//   open   → the real card, swapped in invisibly (it looks identical)
//   closed → closed by the visitor: the arrow with its badge, bouncing
type Stage = "button" | "pill" | "card" | "open" | "closed";
const NEXT_STAGE: Partial<Record<Stage, { to: Stage; after: number }>> = {
  button: { to: "pill", after: 700 },
  pill: { to: "card", after: 1100 },
  card: { to: "open", after: 850 },
};

// After a click the pill only stays long enough to finish widening: the visitor
// has asked for the card, so a longer pause would feel like lag.
const PILL_AFTER_CLICK = 550;

const MORPH = "800ms cubic-bezier(0.65, 0, 0.35, 1)";

// What the button has to become to look exactly like the card. Taken from the
// card itself, so the two can't drift apart, on phones as well as desktop.
function morphTarget(card: HTMLElement): React.CSSProperties {
  const style = getComputedStyle(card);
  return {
    width: card.offsetWidth,
    height: card.offsetHeight,
    right: style.right,
    bottom: style.bottom,
    borderRadius: style.borderRadius,
    backgroundColor: style.backgroundColor,
    borderColor: style.borderTopColor,
    boxShadow: style.boxShadow,
    transition: ["width", "height", "right", "bottom", "border-radius", "background-color", "border-color", "box-shadow"]
      .map((property) => `${property} ${MORPH}`)
      .join(", "),
  };
}

// How far a phone's sheet must be dragged down (px) before letting go closes it.
const CLOSE_DISTANCE = 90;

// "2026-10-30" → "30 Oct 2026". Read as UTC so the date can't shift by a day.
const formatEventDate = (date: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );

// Upcoming events on the home page, bottom right. When the page loads the white
// arrow button appears, widens into a pill with the words "Upcoming Events" and
// opens into the card (visitors who ask for reduced motion go straight to the
// card). Closing it leaves the arrow with a count badge, gently bouncing, which
// plays the same sequence again. On phones the card is a full-width sheet at the
// bottom, which closes with the cross or by dragging it down. Several events: swipe the picture, or use the
// arrows on it.
export function UpcomingEvents({ events }: { events: UpcomingEvent[] }) {
  const [stage, setStage] = useState<Stage>("button");
  const open = stage === "card" || stage === "open";
  const inPill = stage === "pill" || stage === "card";
  const [morph, setMorph] = useState<React.CSSProperties>();
  // Set by the visitor's own actions, so the opening sequence never moves focus.
  const movedByVisitor = useRef(false);
  const clicked = useRef(false);
  const [index, setIndex] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const drag = useRef<{ startY: number; dragging: boolean; pointerId: number } | null>(null);

  const toggle = (next: Stage) => {
    movedByVisitor.current = true;
    setStage(next);
  };

  // Step through the opening sequence.
  useEffect(() => {
    const step = NEXT_STAGE[stage];
    if (!step) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(
      () => {
        if (step.to === "card" && sheetRef.current) setMorph(morphTarget(sheetRef.current));
        setStage(reduced ? "open" : step.to);
      },
      reduced ? 0 : stage === "pill" && clicked.current ? PILL_AFTER_CLICK : step.after,
    );
    return () => clearTimeout(timer);
  }, [stage]);

  useEffect(() => {
    // Keyboard users stay in place: focus moves to whichever control just appeared.
    if (movedByVisitor.current) {
      movedByVisitor.current = false;
      (open ? closeRef : openerRef).current?.focus({ preventScroll: true });
    }

    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") toggle("closed");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const goTo = (next: number) => {
    const track = trackRef.current;
    if (track) track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
  };

  // ── Phones: drag the sheet down. The picture only claims sideways swipes
  // (touch-pan-x), so a downward drag works from anywhere on the sheet.
  const setDrag = (px: number | null) => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    if (px === null) {
      sheet.style.removeProperty("--drag");
      sheet.style.removeProperty("transition");
    } else {
      sheet.style.setProperty("--drag", `${px}px`);
      sheet.style.transition = "none"; // follow the finger exactly
    }
  };
  const onPointerDown = (e: React.PointerEvent) => {
    if (!window.matchMedia("(max-width: 639px)").matches) return;
    drag.current = { startY: e.clientY, dragging: false, pointerId: e.pointerId };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const distance = e.clientY - d.startY;
    if (!d.dragging) {
      // A small threshold, so a tap on the cross or an arrow still counts as a tap.
      if (distance < 8) return;
      d.dragging = true;
      sheetRef.current?.setPointerCapture(d.pointerId);
    }
    setDrag(Math.max(0, distance));
  };
  const onPointerEnd = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d?.dragging) return;
    setDrag(null);
    if (e.type === "pointerup" && e.clientY - d.startY > CLOSE_DISTANCE) toggle("closed");
  };

  const event = events[index] ?? events[0];

  return (
    <>
      {/* The white arrow, with how many events there are; a pill with the words
          during the opening sequence. */}
      <button
        ref={openerRef}
        type="button"
        onClick={() => {
          clicked.current = true;
          if (stage === "closed") return toggle("pill");
          // Clicked mid-sequence: grow into the card now.
          if (sheetRef.current) setMorph(morphTarget(sheetRef.current));
          toggle("card");
        }}
        inert={open}
        aria-label={`Show upcoming events (${events.length})`}
        data-cursor="Upcoming events"
        style={stage === "card" ? morph : undefined}
        className={`fixed right-4 bottom-4 z-30 flex h-12 cursor-pointer items-center justify-center rounded-3xl border border-white bg-white text-black shadow-lg shadow-black/40 outline-offset-4 transition-[width,opacity,scale,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-2 focus-visible:outline-white sm:right-6 sm:bottom-6 ${
          inPill ? "w-46" : "w-12"
        } ${
          // Once the real card is in place the button disappears at once, unseen.
          stage === "open" ? "pointer-events-none opacity-0 transition-none!" : stage === "card" ? "pointer-events-none" : "opacity-100"
        } ${stage === "closed" ? "animate-soft-bounce" : ""}`}
      >
        <ArrowLeft
          className={`size-5 shrink-0 transition-opacity duration-200 ${stage === "card" ? "opacity-0" : "opacity-100"}`}
          strokeWidth={2.5}
          aria-hidden
        />
        <span
          aria-hidden
          className={`overflow-hidden text-sm font-semibold whitespace-nowrap transition-[max-width,margin,opacity] duration-500 ${
            stage === "card" ? "ml-2 max-w-32 opacity-0 duration-200!" : inPill ? "ml-2 max-w-32 opacity-100" : "max-w-0 opacity-0"
          }`}
        >
          Upcoming Events
        </span>
        <span
          aria-hidden
          className={`absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E79E3F] px-1 text-[11px] leading-none font-semibold text-black transition-opacity duration-300 ${
            inPill ? "opacity-0" : "opacity-100"
          }`}
        >
          {events.length}
        </span>
      </button>

      {/* Phones: full width at the bottom. Desktop: a card in the corner. While
          opening it waits invisibly in its final place as the button grows into
          it, so only its contents appear to fade in. */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-label="Upcoming events"
        inert={!open}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        // Waiting: goes to its place at once, unseen (no sliding or fading on the way).
        style={
          stage === "card"
            ? { transition: "opacity 300ms linear 500ms" }
            : stage === "button" || stage === "pill"
              ? { transition: "none" }
              : undefined
        }
        className={`fixed inset-x-0 bottom-0 z-30 touch-none rounded-t-3xl border border-white/10 bg-[#141414] px-4 pb-5 shadow-2xl shadow-black/60 transition-[transform,scale,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[400px] sm:origin-bottom-right sm:touch-auto sm:rounded-3xl sm:px-5 sm:pt-4 ${
          open
            ? "opacity-100 max-sm:[transform:translateY(var(--drag,0px))] sm:scale-100"
            : stage === "closed"
              ? "pointer-events-none max-sm:[transform:translateY(100%)] sm:scale-0 sm:opacity-0"
              : "pointer-events-none opacity-0 max-sm:[transform:translateY(var(--drag,0px))] sm:scale-100"
        }`}
      >
        {/* Drag handle (phones). */}
        <div aria-hidden className="flex justify-center pt-2.5 pb-2 sm:hidden">
          <span className="h-1 w-10 rounded-full bg-white/25" />
        </div>

        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-white sm:text-lg">
            Upcoming Events
            {events.length > 1 && (
              <span className="ml-1.5 font-normal text-[#9DA1B1]">
                ({index + 1}/{events.length})
              </span>
            )}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={() => toggle("closed")}
            aria-label="Close upcoming events"
            className="-mr-1 cursor-pointer rounded-full p-1 text-[#9DA1B1] outline-offset-2 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-white"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="relative mt-3">
          {/* Native scroll-snap: swiping (and trackpads) just work. */}
          <ul
            ref={trackRef}
            onScroll={(e) => {
              const el = e.currentTarget;
              setIndex(Math.round(el.scrollLeft / el.clientWidth));
            }}
            className="flex touch-pan-x snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-2xl [scrollbar-width:none]"
          >
            {events.map((item, i) => (
              <li key={item.id} className="aspect-16/9 w-full shrink-0 snap-center bg-neutral-900">
                {/* Plain <img>: images come from the backend's storage host, which
                    next/image would need configured as a remote pattern. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt=""
                  draggable={false}
                  loading={i === 0 ? "eager" : "lazy"}
                  className="size-full object-cover"
                />
              </li>
            ))}
          </ul>

          {/* Both arrows whenever there's more than one event; past either end they wrap round. */}
          {events.length > 1 && (
            <>
              <SlideArrow side="left" onClick={() => goTo((index - 1 + events.length) % events.length)} />
              <SlideArrow side="right" onClick={() => goTo((index + 1) % events.length)} />
            </>
          )}
        </div>

        <p className="mt-3 text-xs text-[#9DA1B1] sm:text-sm">{formatEventDate(event.eventDate)}</p>
        <p aria-live="polite" className="mt-1 line-clamp-2 text-base font-semibold text-white sm:text-xl">
          {event.name}
        </p>
      </div>
    </>
  );
}

function SlideArrow({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous event" : "Next event"}
      data-cursor={side === "left" ? "Previous event" : "Next event"}
      className={`absolute top-1/2 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-neutral-500/35 text-white outline-offset-2 backdrop-blur-md transition-colors hover:bg-neutral-500/55 focus-visible:outline-2 focus-visible:outline-white ${
        side === "left" ? "left-2.5" : "right-2.5"
      }`}
    >
      <Icon className="size-4" strokeWidth={2.5} aria-hidden />
    </button>
  );
}
