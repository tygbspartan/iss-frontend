"use client";

import { useEffect, useRef, useState } from "react";

// A small gold square that tails the mouse and doubles as a guide to what can
// be done:
//   • at rest it sits right on the tip of the pointer, and it follows with a
//     lag — move the mouse fast and it trails behind like a tail, then
//     catches up;
//   • over anything marked with `data-cursor="Word"` it drops below the
//     pointer and widens into a small tag with that word in it ("Drag",
//     "View", "Read"…);
//   • over a button with the site's spinning gold border it leaves the
//     pointer, goes to the part of the button's border where the mouse came
//     in and melts into it. The border stays plain white until then; the gold
//     then starts from that spot, sweeps round the border and carries on
//     spinning — so the spin reads as the follower setting off round the
//     button. On leaving, it re-forms on the border and returns to the pointer;
//   • over other links and buttons (nothing to explain) it opens out into a
//     see-through circle with a very light gold tint around the whole pointer;
//   • over form fields it disappears, so it doesn't get in the way of typing;
//   • when the mouse leaves the page it waits at the edge where the mouse
//     went out, and picks the mouse up again when it comes back.
// The normal mouse pointer is never hidden — the square is always behind it.
// To label an element, add the attribute to it — nothing else is needed:
//   <a data-cursor="View" …>
//
// Only for a real mouse: on touch screens there's no pointer to follow, and
// for visitors who ask for reduced motion it's left out altogether.

type Mode = "idle" | "link" | "label" | "blend" | "hidden";

const LINK_SELECTOR = "a, button, [role='tab'], summary, label";
const FIELD_SELECTOR = "input, textarea, select";
// Buttons with the spinning border are recognised by the class that gives
// them that border, so new ones are picked up without marking them.
const SPIN_SELECTOR = '[class~="hover:animate-border-spin"]';

const EASE = 0.11; // share of the remaining distance covered each frame — lower = longer tail
const BLEND_EASE = 0.3; // quicker, for going onto a button's border
const BLEND_AFTER_MS = 200; // time to reach the border before melting into it (and the gold starting)
const REVEAL_MS = 700; // time for the gold to sweep once round the border
const EDGE_INSET = 9; // how far in from the window's edge the square waits when the mouse leaves the page (keeps it fully visible)

// The buttons' border gradient reads three things this script sets on the button:
//   --spin-from: the angle (clockwise from the top) where the follower landed —
//     the gold starts from there;
//   --spin-reveal: how far round from that point the gold has got (0%–100%).
//     The rest of the border is covered in white. It starts at 0% — a plain
//     white border — and sweeps to 100% once the follower has landed;
//   animation-play-state: the spin is held "paused" until then, too.
// Without the follower (touch, reduced motion, keyboard) none are set, and the
// border is simply all gold, spinning from the top, as soon as it's hovered.
const holdButton = (button: HTMLElement, fromDegrees: number) => {
  button.style.setProperty("--spin-from", `${fromDegrees.toFixed(1)}deg`);
  button.style.setProperty("--spin-reveal", "0%");
  button.style.setProperty("animation-play-state", "paused");
};
const releaseButton = (button: HTMLElement) => {
  button.style.removeProperty("--spin-reveal");
  button.style.removeProperty("animation-play-state");
};

/**
 * Where a ray from the middle of a rounded rectangle, pointing `angle` radians
 * clockwise from straight up, crosses its edge. Returned relative to the middle.
 */
function pointOnBorder(width: number, height: number, radius: number, angle: number) {
  const halfW = width / 2;
  const halfH = height / 2;
  const r = Math.min(radius, halfW, halfH);
  const dx = Math.sin(angle);
  const dy = -Math.cos(angle);

  // Where the ray leaves the plain (square-cornered) rectangle.
  const scale = Math.min(dx !== 0 ? halfW / Math.abs(dx) : Infinity, dy !== 0 ? halfH / Math.abs(dy) : Infinity);
  let x = dx * scale;
  let y = dy * scale;

  // If that's inside a corner's cut-off area, use the corner's arc instead:
  // the far crossing of the ray with that corner's circle.
  const cornerX = halfW - r;
  const cornerY = halfH - r;
  if (r > 0 && Math.abs(x) > cornerX && Math.abs(y) > cornerY) {
    const cx = Math.sign(x) * cornerX;
    const cy = Math.sign(y) * cornerY;
    const along = dx * cx + dy * cy;
    const distance = along + Math.sqrt(Math.max(0, along * along - (cx * cx + cy * cy - r * r)));
    x = dx * distance;
    y = dy * distance;
  }
  return { x, y };
}

// How far a tag can reach from the pointer: its offset plus its largest size
// (`translate-x-2.5` + `max-w-40`, and `translate-y-5` + `h-5.5`, with a small margin).
const TAG_MAX_REACH_X = 174;
const TAG_MAX_REACH_Y = 46;

export function CursorFollower() {
  const ref = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [label, setLabel] = useState("");
  const [active, setActive] = useState(false); // becomes true once a real mouse has moved
  const [blended, setBlended] = useState(false); // has melted into a button's border
  // Near the screen's right or bottom edge the tag sits on the other side of the
  // pointer, so a long label isn't cut off.
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!finePointer.matches || reducedMotion.matches) return;

    const root = document.documentElement;
    let pointerX = -100;
    let pointerY = -100;
    let x = pointerX;
    let y = pointerY;
    let seen = false;
    let frame = 0;
    // The button whose border it has joined, if any: that button's corner
    // radius, the angle (radians, clockwise from the top) at which the mouse
    // came in, and when the gold began sweeping round (0 = not yet).
    let joined: { button: HTMLElement; radius: number; entry: number; revealFrom: number } | null = null;
    let blendTimer: ReturnType<typeof setTimeout> | undefined;

    /** The spot on a button's border in the direction `angle` from its middle, in screen coordinates. */
    const borderSpot = (button: HTMLElement, radius: number, angle: number) => {
      const rect = button.getBoundingClientRect();
      const point = pointOnBorder(rect.width, rect.height, radius, angle);
      return { x: rect.left + rect.width / 2 + point.x, y: rect.top + rect.height / 2 + point.y };
    };
    /** The direction from a button's middle to the pointer, as an angle clockwise from the top. */
    const angleToPointer = (button: HTMLElement) => {
      const rect = button.getBoundingClientRect();
      return Math.atan2(pointerX - (rect.left + rect.width / 2), -(pointerY - (rect.top + rect.height / 2)));
    };

    const tick = (now: number) => {
      let targetX = pointerX;
      let targetY = pointerY;
      let ease = EASE;
      let revealing = false;
      if (joined) {
        // Head for the spot on the border where the mouse came in, and stay there.
        ({ x: targetX, y: targetY } = borderSpot(joined.button, joined.radius, joined.entry));
        ease = BLEND_EASE;

        // Once landed, sweep the gold round the border from that spot.
        if (joined.revealFrom) {
          const done = Math.min(1, (now - joined.revealFrom) / REVEAL_MS);
          joined.button.style.setProperty("--spin-reveal", `${(done * 100).toFixed(1)}%`);
          revealing = done < 1;
        }
      }
      x += (targetX - x) * ease;
      y += (targetY - y) * ease;
      node.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      // Keep going while still catching up or sweeping; otherwise stop, and
      // the next mouse move restarts the loop.
      const moving = revealing || Math.abs(targetX - x) + Math.abs(targetY - y) > 0.1;
      frame = moving ? requestAnimationFrame(tick) : 0;
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!seen) {
        // First sighting: start at the pointer instead of flying in from the corner.
        seen = true;
        x = pointerX;
        y = pointerY;
        setActive(true);
      }

      const target = event.target instanceof Element ? event.target : null;
      const labelled = target?.closest<HTMLElement>("[data-cursor]");
      const button = labelled ? null : (target?.closest<HTMLElement>(SPIN_SELECTOR) ?? null);

      if (button) {
        if (joined?.button !== button) {
          if (joined) releaseButton(joined.button);
          const entered = {
            button,
            radius: Number.parseFloat(getComputedStyle(button).borderTopLeftRadius) || 0,
            entry: angleToPointer(button),
            revealFrom: 0,
          };
          joined = entered;
          // Plain white border, nothing moving, until the follower lands.
          holdButton(button, (entered.entry * 180) / Math.PI);

          setBlended(false);
          clearTimeout(blendTimer);
          blendTimer = setTimeout(() => {
            if (joined !== entered) return;
            // Landed: melt into the border, start the gold sweeping round from
            // here, and let it spin.
            setBlended(true);
            entered.revealFrom = performance.now();
            button.style.removeProperty("animation-play-state");
            if (!frame) frame = requestAnimationFrame(tick);
          }, BLEND_AFTER_MS);
        }
        setMode("blend");
      } else {
        if (joined) {
          // Leaving: put the border back to normal, and re-form on the border
          // at the spot nearest the pointer; the loop then carries the square
          // back to the pointer.
          releaseButton(joined.button);
          ({ x, y } = borderSpot(joined.button, joined.radius, angleToPointer(joined.button)));
          joined = null;
          clearTimeout(blendTimer);
          setBlended(false);
        }
        if (labelled?.dataset.cursor) {
          setLabel(labelled.dataset.cursor);
          setFlipX(pointerX + TAG_MAX_REACH_X > window.innerWidth);
          setFlipY(pointerY + TAG_MAX_REACH_Y > window.innerHeight);
          setMode("label");
        } else if (target?.closest(FIELD_SELECTOR)) {
          setMode("hidden");
        } else if (target?.closest(LINK_SELECTOR)) {
          setMode("link");
        } else {
          setMode("idle");
        }
      }

      if (!frame) frame = requestAnimationFrame(tick);
    };
    // The mouse has left the page (off the edge of the window, or up onto the
    // browser's toolbar): the square goes to the point on the edge where it
    // left and waits there, as a plain square, until the mouse comes back —
    // the next mouse move inside the page sets it following again.
    const onLeave = (event: PointerEvent) => {
      if (!seen || event.pointerType !== "mouse") return;
      if (joined) {
        releaseButton(joined.button);
        joined = null;
        clearTimeout(blendTimer);
        setBlended(false);
      }
      pointerX = Math.min(Math.max(event.clientX, EDGE_INSET), window.innerWidth - EDGE_INSET);
      pointerY = Math.min(Math.max(event.clientY, EDGE_INSET), window.innerHeight - EDGE_INSET);
      setMode("idle");
      if (!frame) frame = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(blendTimer);
      if (joined) releaseButton(joined.button);
      window.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  // For each state: where the shape sits relative to the point it's following,
  // its look, its height, the widest it may get, and its inner padding. The
  // width itself comes from the content (nothing, or the word), up to that limit.
  //   • plain square: solid gold, centred on the very tip of the pointer;
  //   • joining a button: the same small square, slightly smaller, centred on
  //     the button's border; `blended` then fades it out into the border;
  //   • link: a 48px see-through circle — a very light gold tint with a faint
  //     gold edge, no blur — centred a little below the tip so it surrounds
  //     the whole pointer, arrow or hand;
  //   • tag with a word: solid gold, dropped below the pointer (and a little
  //     right), so the pointer doesn't cover the word; to the left or above it
  //     instead when there's no room at the edge of the screen.
  const CENTRED = "-translate-x-1/2 -translate-y-1/2";
  const AROUND_POINTER = "translate-x-[calc(-50%+3px)] translate-y-[calc(-50%+8px)]";
  const BELOW = `${flipX ? "translate-x-[calc(-100%-10px)]" : "translate-x-2.5"} ${
    flipY ? "translate-y-[calc(-100%-8px)]" : "translate-y-5"
  }`;
  const SOLID = "rounded-[5px] border-transparent bg-[#E79E3F]";
  const TINTED = "rounded-[24px] border-[#E79E3F]/35 bg-[#E79E3F]/12";
  const shape = {
    idle: `${CENTRED} ${SOLID} h-3.5 min-w-3.5 max-w-3.5 px-0 opacity-100`,
    blend: `${CENTRED} ${SOLID} h-2.5 min-w-2.5 max-w-2.5 px-0 ${blended ? "opacity-0" : "opacity-100"}`,
    link: `${AROUND_POINTER} ${TINTED} h-12 min-w-12 max-w-12 px-0 opacity-100`,
    label: `${BELOW} ${SOLID} h-5.5 min-w-3.5 max-w-40 px-2 opacity-100`,
    hidden: `${CENTRED} ${SOLID} h-3.5 min-w-3.5 max-w-3.5 px-0 opacity-0`,
  }[mode];

  return (
    // Outer box: moved by the script so its top-left corner trails the point
    // being followed (the pointer's tip, or a point on a button's border).
    // Inner shape: placed around that corner as described above.
    <div
      ref={ref}
      aria-hidden
      className={`pointer-events-none fixed top-0 left-0 z-100 transition-opacity duration-300 will-change-transform ${
        active ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`flex items-center justify-center overflow-hidden border transition-[translate,height,min-width,max-width,padding,opacity,border-radius,background-color,border-color] duration-300 ease-out ${shape}`}
      >
        <span
          className={`font-poppins text-[10px] leading-none font-semibold tracking-[0.06em] whitespace-nowrap text-black uppercase transition-opacity duration-200 ${
            mode === "label" ? "opacity-100 delay-100" : "opacity-0"
          }`}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
