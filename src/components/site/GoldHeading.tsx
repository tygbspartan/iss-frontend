"use client";

import { useLayoutEffect, useRef, useState } from "react";

// Heading with the gold gradient rule under its LAST line only, as wide as that
// line's text (e.g. "Founders And / Partners" is underlined under "Partners").
// CSS can't size a border to the last line of wrapped text, so it's measured.
export function GoldHeading({
  as: Tag = "h2",
  id,
  className = "",
  children,
}: {
  as?: "h1" | "h2" | "h3";
  id?: string;
  className?: string;
  children: string;
}) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [rule, setRule] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const text = textRef.current;
    if (!text) return;
    const measure = () => {
      // One rect per line fragment of the inline span; the last is the last line.
      const rects = text.getClientRects();
      const last = rects[rects.length - 1];
      const box = text.parentElement!.getBoundingClientRect();
      if (last) setRule({ left: last.left - box.left, width: last.width });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(text.parentElement!);
    document.fonts?.ready.then(measure);
    return () => observer.disconnect();
  }, [children]);

  return (
    <Tag id={id} className={`relative h-fit pb-2 ${className}`}>
      <span ref={textRef}>{children}</span>
      <span
        aria-hidden
        className="absolute bottom-0 h-[1.5px] bg-linear-to-r from-[#E79E3F] to-[#6D4819] transition-opacity"
        style={rule ? { left: rule.left, width: rule.width } : { opacity: 0 }}
      />
    </Tag>
  );
}
