"use client";

import { useEffect, useState } from "react";

const IDLE_MS = 4000; // how long without scrolling before the hint shows
const END_MARGIN = 200; // px from the bottom of the page where it's no longer offered

// A small scroll prompt at the bottom of the screen: a mouse whose wheel
// slides up and down on desktops and laptops, and "SCROLL" over a double
// chevron on phones and tablets.
// It appears once the visitor has been idle (no scrolling, wheel,
// touch or keys) for a few seconds, and goes as soon as they scroll — then
// comes back after the same pause, until they reach the end of the page.
export function ScrollHint() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const atEnd = () =>
      window.scrollY + window.innerHeight >=
      document.documentElement.scrollHeight - END_MARGIN;
    const restart = () => {
      setShown(false);
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!atEnd()) setShown(true);
      }, IDLE_MS);
    };
    const events = ["scroll", "wheel", "touchstart", "keydown"] as const;
    events.forEach((name) =>
      window.addEventListener(name, restart, { passive: true }),
    );
    timer = setTimeout(() => {
      if (!atEnd()) setShown(true);
    }, IDLE_MS);
    return () => {
      clearTimeout(timer);
      events.forEach((name) => window.removeEventListener(name, restart));
    };
  }, []);

  // Mark the page while the hint shows, so anything sharing its spot (the
  // About story's progress dashes on phones) can step aside.
  useEffect(() => {
    const root = document.documentElement;
    root.toggleAttribute("data-scroll-hint", shown);
    return () => root.removeAttribute("data-scroll-hint");
  }, [shown]);

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-x-0 bottom-6 z-30 flex justify-center text-neutral-400 drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)] transition-opacity duration-700 sm:bottom-8 ${
        shown ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Phones and tablets: SCROLL over a double chevron. */}
      <span className="flex flex-col items-center lg:hidden">
        <span className="font-poppins text-[10px] font-bold tracking-[0.14em] uppercase">
          Scroll
        </span>
        <svg
          viewBox="0 0 24 20"
          className="-mt-px h-4 w-[18px] text-[#E79E3F]/85"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            d="M5 3l7 6 7-6"
            className="animate-chevron-pulse motion-reduce:animate-none"
          />
          <path
            d="M5 10l7 6 7-6"
            className="animate-chevron-pulse [animation-delay:200ms] motion-reduce:animate-none"
          />
        </svg>
      </span>
      {/* Desktops and laptops: a mouse with its wheel scrolling. */}
      <span className="hidden h-11 w-7 justify-center rounded-full border-2 border-current pt-2 lg:flex">
        <span className="h-2.5 w-1 animate-scroll-wheel rounded-full bg-[#E79E3F]/90 motion-reduce:animate-none" />
      </span>
    </div>
  );
}
