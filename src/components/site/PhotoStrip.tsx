"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

export interface StripPhoto {
  src: string;
  alt: string;
  width: number;
  height: number;
}

// How far the strip slides for one "crossing" of the screen by scrolling, as a
// multiple of the screen's width. Bigger = faster.
const SCROLL_TRAVEL = 1.5;

// How steeply the row climbs from left to right: for every 100px further
// right a photo is, it sits 13px higher.
const SLOPE = 0.13;

// Every photo is this wide (and the same shape), narrower than the screen so
// one sits in the middle with its neighbours peeking in either side.
const PHOTO_SIZE = "aspect-550/290 w-[72vw] lg:w-[55vw]";

function Photos({ photos, startIndex, hidden = false }: { photos: StripPhoto[]; startIndex: number; hidden?: boolean }) {
  return (
    <ul className="flex items-center" aria-hidden={hidden || undefined}>
      {photos.map((photo, i) => (
        // Spacing is a right margin (not a flex gap) so the track is exactly
        // two equal halves and the loop lines up. Each photo is raised one
        // step (--rise) more than the one before it, making a staircase.
        <li
          key={i}
          style={{ translate: `0 calc(var(--rise) * ${-(startIndex + i)})` }}
          className={`${PHOTO_SIZE} mr-[3vw] shrink-0 overflow-hidden rounded-lg bg-neutral-900 lg:mr-[2.2vw] lg:rounded-xl`}
        >
          <Image
            src={photo.src}
            alt={hidden ? "" : photo.alt}
            width={photo.width}
            height={photo.height}
            sizes="(min-width: 64rem) 55vw, 72vw"
            draggable={false}
            className="size-full object-cover"
          />
        </li>
      ))}
    </ul>
  );
}

// A strip of photos, wider than the screen: one in the middle, one peeking in
// on each side. The row climbs steadily from left to right — whichever photo
// is on the left sits lowest and the one on the right highest — and stays on
// that same slope however it's moved. It moves in two ways:
//   • with the page: scrolling down slides it left → right (and back again
//     when you scroll up). At the top of the page the second photo is centred;
//   • by hand: it can be grabbed and dragged either way (mouse or finger), and
//     glides to a stop when let go.
// The photos are rendered twice and the position wraps after one set's width,
// so it loops endlessly in both directions with no seam. For visitors who ask
// for reduced motion it doesn't slide with the scroll, but can still be dragged.
//
// How the slope survives the loop: the photos form a fixed staircase inside
// the track (each one --rise higher than the last), and the whole track is
// lowered as it moves right by exactly the same slope, so a photo's height
// depends only on where it is across the screen.
export function PhotoStrip({ photos, className = "" }: { photos: StripPhoto[]; className?: string }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const firstSet = track?.firstElementChild as HTMLElement | null;
    if (!viewport || !track || !firstSet) return;

    const followScroll = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let loopWidth = 0; // width of one set of photos
    let firstCentre = 0; // centre of the first photo, measured from the track's left edge
    let centred = 0; // translateX that puts the starting photo in the middle of the screen

    const measure = () => {
      loopWidth = firstSet.getBoundingClientRect().width;
      const first = firstSet.children[0] as HTMLElement | undefined;
      const start = (firstSet.children[1] ?? first) as HTMLElement | undefined;
      firstCentre = (first?.offsetWidth ?? 0) / 2;
      centred = viewport.clientWidth / 2 - ((start?.offsetLeft ?? 0) + (start?.offsetWidth ?? 0) / 2);
      // One step of the staircase = the slope × the distance from one photo to the next.
      const pitch = firstSet.children.length > 0 ? loopWidth / firstSet.children.length : 0;
      track.style.setProperty("--rise", `${(SLOPE * pitch).toFixed(2)}px`);
    };
    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(firstSet);
    resizeObserver.observe(viewport);

    let dragged = 0; // how far the strip has been moved by hand, in total
    let velocity = 0; // px per second, from a throw
    let drag: { pointerId: number; lastX: number; lastTime: number } | null = null;

    const onDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      drag = { pointerId: event.pointerId, lastX: event.clientX, lastTime: event.timeStamp };
      velocity = 0;
      track.setPointerCapture(event.pointerId);
    };
    const onMove = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      const dx = event.clientX - drag.lastX;
      const dt = Math.max(1, event.timeStamp - drag.lastTime) / 1000;
      dragged += dx;
      // Smoothed speed of the hand, carried on as a throw when released.
      velocity = velocity * 0.7 + (dx / dt) * 0.3;
      drag.lastX = event.clientX;
      drag.lastTime = event.timeStamp;
    };
    const onUp = (event: PointerEvent) => {
      if (drag && event.pointerId === drag.pointerId) drag = null;
    };
    track.addEventListener("pointerdown", onDown);
    track.addEventListener("pointermove", onMove);
    track.addEventListener("pointerup", onUp);
    track.addEventListener("pointercancel", onUp);

    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      if (!drag && velocity !== 0) {
        // Glide on after a throw, slowing to a stop.
        dragged += velocity * dt;
        velocity *= Math.exp(-dt * 3);
        if (Math.abs(velocity) < 2) velocity = 0;
      }

      // Scrolling the page by one "crossing" (the screen's height plus the
      // strip's) slides the strip SCROLL_TRAVEL screen-widths. Measured from
      // the top of the page, so the strip starts centred.
      const crossing = window.innerHeight + viewport.clientHeight;
      const fromScroll = followScroll ? (window.scrollY / crossing) * SCROLL_TRAVEL * viewport.clientWidth : 0;

      let offset = centred + fromScroll + dragged;
      if (loopWidth > 0) offset = ((offset % loopWidth) - loopWidth) % loopWidth; // keep within (-loopWidth, 0]
      // Lower the track as it moves right, so photos keep to the slope.
      const lift = -SLOPE * (offset + firstCentre - viewport.clientWidth / 2);
      track.style.transform = `translate3d(${offset.toFixed(2)}px, ${lift.toFixed(2)}px, 0)`;
      frame = requestAnimationFrame(tick);
    };

    // Only run while the strip is on screen.
    const visibility = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(frame);
      if (entry.isIntersecting) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    });
    visibility.observe(viewport);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibility.disconnect();
      track.removeEventListener("pointerdown", onDown);
      track.removeEventListener("pointermove", onMove);
      track.removeEventListener("pointerup", onUp);
      track.removeEventListener("pointercancel", onUp);
    };
  }, []);

  return (
    <div ref={viewportRef} className={`overflow-hidden ${className}`}>
      {/* touch-pan-y: a sideways swipe drags the strip, an up/down swipe still
          scrolls the page. --rise here is only the starting value (script sets
          the exact one): the slope × the distance between photos. */}
      <div
        ref={trackRef}
        data-cursor="Drag me"
        className="flex w-max cursor-grab touch-pan-y select-none will-change-transform [--rise:9.75vw] active:cursor-grabbing lg:[--rise:7.44vw]"
      >
        <Photos photos={photos} startIndex={0} />
        {/* Second set, only there to make the loop seamless. */}
        <Photos photos={photos} startIndex={photos.length} hidden />
      </div>
    </div>
  );
}
