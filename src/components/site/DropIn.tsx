"use client";

import { Children, useEffect, useRef, useState } from "react";

const STAGGER_MS = 140; // delay between one item starting to drop and the next

// A row whose items drop into place one at a time, left to right, the first
// time the row scrolls into view: each starts a little above its spot and
// invisible, then falls in with a slight bounce as it lands.
//
// Each item is wrapped in its own element that does the dropping, so the
// items' own hover effects and animations are left alone. Extra props (role,
// aria-label…) go on the row itself. Visitors who ask for reduced motion see
// the items simply appear.
export function DropIn({
  className = "",
  children,
  ...rest
}: { className?: string; children: React.ReactNode } & Omit<React.ComponentProps<"div">, "className" | "children">) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        observer.disconnect();
      },
      { threshold: 0.5 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} {...rest}>
      {Children.map(children, (child, i) => (
        <span
          role="presentation"
          style={{ transitionDelay: shown ? `${i * STAGGER_MS}ms` : undefined }}
          className={`inline-flex shrink-0 transition duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none ${
            shown ? "translate-y-0 opacity-100" : "-translate-y-6 opacity-0"
          }`}
        >
          {child}
        </span>
      ))}
    </div>
  );
}
