"use client";

import { useEffect, useRef, useState } from "react";
import { RisingDots } from "./home/HeroEffects";

// A layer of rising sparkles that fills the screen behind a page's content
// and fades away as the page is scrolled:
//   • full strength at the top of the page;
//   • steadily fainter on the way down;
//   • gone by the time the element with id `endId` first comes into view at
//     the bottom of the screen — and from there on the animation is switched
//     off entirely, not just hidden.
//
// Put it inside a wrapper with the `relative isolate` classes: it sits behind
// that wrapper's content (-z-10) but in front of the page background.
// Decorative only: it never catches the mouse and is hidden from screen readers.
export function ScrollSparkles({ endId, density = 0.45 }: { endId: string; density?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    const layer = ref.current;
    if (!layer) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      // How far down the page the fade ends: the scroll position at which
      // `endId` first comes into view at the bottom of the screen.
      // (Without that element, fade over two screens.)
      const end = document.getElementById(endId);
      const endsAt = end
        ? end.getBoundingClientRect().top + window.scrollY - window.innerHeight
        : window.innerHeight * 2;
      const strength = endsAt > 0 ? Math.min(1, Math.max(0, 1 - window.scrollY / endsAt)) : 0;
      layer.style.opacity = strength.toFixed(3);
      setRunning(strength > 0);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [endId]);

  return (
    <div ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      {running && <RisingDots sparkle density={density} className="size-full" />}
    </div>
  );
}
