"use client";

import { useEffect, useRef, useState } from "react";

const DURATION_MS = 1600;

// A number that counts up from 0 the first time it scrolls into view. The page
// is delivered with the final value in place (so it reads correctly without
// JavaScript and for search engines); visitors who ask for reduced motion just
// see that final value.
export function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const node = ref.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / DURATION_MS);
          // Ease out: fast at first, settling onto the final number.
          setShown(Math.round(value * (1 - Math.pow(1 - progress, 3))));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  return (
    // tabular-nums keeps the width steady while the digits change.
    <span ref={ref} className="tabular-nums">
      {shown}
      {suffix}
    </span>
  );
}
