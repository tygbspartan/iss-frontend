"use client";

import { useEffect, useRef } from "react";

// How much taller than its frame the picture is drawn (1.5 = half as tall
// again). The extra is what there is to travel through: more = more movement.
const OVERSIZE = 1.5;

// A picture in a frame that's shorter than the picture itself. As the page
// scrolls the picture slides up inside the frame — showing its lower part
// first and its upper part by the time the frame leaves the top of the screen,
// like looking through a window while moving past it. Scrolling back reverses it.
//
// `className` styles the frame (size, corners, border). Visitors who ask for
// reduced motion get the picture still, centred in the frame.
export function ParallaxImage({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    const image = imageRef.current;
    if (!frame || !image || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const box = frame.getBoundingClientRect();
      // 0 when the frame's top edge is entering at the bottom of the screen,
      // 1 when its bottom edge is leaving at the top.
      const travelled = Math.min(1, Math.max(0, (window.innerHeight - box.top) / (window.innerHeight + box.height)));
      // The picture overhangs the frame by (OVERSIZE - 1) frame-heights in
      // total. Start with all of that hanging out below (picture's top level
      // with the frame's), end with all of it above.
      const overhang = (OVERSIZE - 1) * box.height;
      image.style.transform = `translate3d(0, ${(-travelled * overhang).toFixed(1)}px, 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div ref={frameRef} className={`relative overflow-hidden ${className}`}>
      {/* Plain <img>: images come from the backend's storage host, which
          next/image would need configured as a remote pattern. Until the
          script runs (and for reduced motion) it sits centred: -top-1/4 with
          150% height leaves a quarter of the frame's height above and below. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        fetchPriority="high"
        className="absolute inset-x-0 top-0 h-[150%] w-full object-cover will-change-transform motion-reduce:-top-1/4"
      />
    </div>
  );
}
