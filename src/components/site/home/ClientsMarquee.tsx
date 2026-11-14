"use client";

import { useEffect, useRef } from "react";

export interface MarqueeClient {
  key: string;
  name: string;
  image: string;
}

const SPEED = 120; // px per second

function Cards({ clients, hidden = false }: { clients: MarqueeClient[]; hidden?: boolean }) {
  return (
    <ul className="flex" aria-hidden={hidden || undefined}>
      {clients.map((client) => (
        // Spacing is a right margin (not a flex gap) so the track is exactly
        // two equal halves and the loop lines up. Logos are greyscale until
        // their card is hovered, when the real colours show and the logo grows a little.
        //
        // Phones: cards are sized from the screen's width (29% each, 3% apart)
        // so three fit across at once, with the fourth just peeking in. The
        // logo and the name shrink to suit (see the img and p below).
        <li
          key={client.key}
          className="group mr-[3vw] flex h-[29vw] w-[29vw] shrink-0 flex-col items-center justify-center gap-1.5 rounded-lg border border-[#2B2B2B] bg-[#121212] px-2 sm:mr-5 sm:h-56 sm:w-56 sm:gap-5 sm:px-6 lg:mr-11 lg:h-72.5 lg:w-75"
        >
          {/* Plain <img>: logos come from the backend's storage host, which
              next/image would need configured as a remote pattern. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={client.image} alt="" loading="lazy" draggable={false} className="max-h-[13vw] max-w-[70%] object-contain grayscale transition duration-500 group-hover:scale-110 group-hover:grayscale-0 sm:max-h-24 lg:max-h-28" />
          <p className="line-clamp-2 text-center font-poppins text-xs leading-tight text-[#B5B8C4] sm:text-base lg:text-lg">{client.name}</p>
        </li>
      ))}
    </ul>
  );
}

// Endless row of client cards. It drifts, and follows the page scroll:
// scrolling down sends it left-to-right, scrolling up turns it round to
// right-to-left (it eases through the turn, and keeps that direction until the
// scroll direction changes again). It starts out left-to-right. It can also be grabbed and
// dragged either way (mouse or finger); let go and it glides on with the throw,
// then settles back to its drift. The cards are rendered twice and the
// position wraps after one copy's width, so there's no seam. For visitors who
// ask for reduced motion it stays still until dragged.
export function ClientsMarquee({ clients }: { clients: MarqueeClient[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const firstCopy = track?.firstElementChild;
    if (!track || !firstCopy) return;

    const speed = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : SPEED;
    let drift = speed; // px per second; positive = left-to-right
    let loopWidth = firstCopy.getBoundingClientRect().width;
    const observer = new ResizeObserver(() => {
      loopWidth = firstCopy.getBoundingClientRect().width;
    });
    observer.observe(firstCopy);

    let offset = 0; // current translateX, kept within (-loopWidth, 0]
    let velocity = drift; // px per second
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
      offset += dx;
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

    // Scroll direction sets the drift direction: down → left-to-right, up → right-to-left.
    let lastScrollY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y > lastScrollY) drift = speed;
      else if (y < lastScrollY) drift = -speed;
      lastScrollY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!drag) {
        // Ease towards the drift — from a throw, or through a change of direction.
        velocity += (drift - velocity) * Math.min(1, dt * 2);
        offset += velocity * dt;
      }
      if (loopWidth > 0) offset = (((offset % loopWidth) - loopWidth) % loopWidth);
      track.style.transform = `translate3d(${offset.toFixed(2)}px, 0, 0)`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      track.removeEventListener("pointerdown", onDown);
      track.removeEventListener("pointermove", onMove);
      track.removeEventListener("pointerup", onUp);
      track.removeEventListener("pointercancel", onUp);
    };
  }, []);

  return (
    <div className="mt-10 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] lg:mt-16">
      {/* touch-pan-y: a sideways swipe drags the row, an up/down swipe still scrolls the page. */}
      <div ref={trackRef} data-cursor="Drag me" className="flex w-max cursor-grab touch-pan-y select-none will-change-transform active:cursor-grabbing">
        <Cards clients={clients} />
        {/* Second copy, only there to make the loop seamless. */}
        <Cards clients={clients} hidden />
      </div>
    </div>
  );
}
