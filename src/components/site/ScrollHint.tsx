"use client";

import { useEffect, useState } from "react";
import { ArrowDown } from "lucide-react";

const IDLE_MS = 7000; // how long without scrolling before the hint shows
const END_MARGIN = 200; // px from the bottom of the page where it's no longer offered

// A small "Scroll down" prompt with a bobbing arrow, at the bottom of the
// screen. It appears once the visitor has been idle (no scrolling, wheel,
// touch or keys) for a few seconds, and goes as soon as they scroll — then
// comes back after the same pause, until they reach the end of the page.
export function ScrollHint() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const atEnd = () =>
      window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - END_MARGIN;
    const restart = () => {
      setShown(false);
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!atEnd()) setShown(true);
      }, IDLE_MS);
    };
    const events = ["scroll", "wheel", "touchstart", "keydown"] as const;
    events.forEach((name) => window.addEventListener(name, restart, { passive: true }));
    timer = setTimeout(() => {
      if (!atEnd()) setShown(true);
    }, IDLE_MS);
    return () => {
      clearTimeout(timer);
      events.forEach((name) => window.removeEventListener(name, restart));
    };
  }, []);

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-x-0 bottom-6 z-30 flex justify-center transition-opacity duration-700 sm:bottom-8 ${
        shown ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* A soft dark pill behind it, so it stays readable over the page's text. */}
      <span className="flex flex-col items-center gap-1.5 rounded-full bg-[#111111]/75 px-5 py-2.5 backdrop-blur-sm">
      <span className="font-poppins text-[11px] tracking-[0.2em] text-neutral-400 uppercase sm:text-xs">Scroll down</span>
      <ArrowDown className="size-4 animate-soft-bounce text-neutral-400 motion-reduce:animate-none" strokeWidth={1.75} />
      </span>
    </div>
  );
}
