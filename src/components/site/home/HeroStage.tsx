"use client";

import { useEffect, useRef } from "react";

// The hero's <section>, plus one job: as the page scrolls through the first
// screen it publishes the progress as a CSS variable, --p (0 at the top of the
// page → 1 once a full screen has been scrolled). The hero's layers read --p
// in their own styles to move at different speeds (the parallax). Visitors who
// ask for reduced motion keep --p at 0, so nothing drifts.
export function HeroStage({ className = "", children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const stage = ref.current;
    if (!stage || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const progress = Math.min(1, Math.max(0, window.scrollY / window.innerHeight));
      stage.style.setProperty("--p", progress.toFixed(4));
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
  }, []);

  return (
    <section ref={ref} className={`[--p:0] ${className}`}>
      {children}
    </section>
  );
}
