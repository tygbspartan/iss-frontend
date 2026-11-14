"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface TestimonialItem {
  id: string;
  name: string;
  company: string;
  testimony: string;
  image: string;
}

const FADE_MS = 300;

// Cards shown at once: 3 on desktop, 2 on tablets, 1 on phones (the same
// breakpoints as the grid below). Read from the browser so paging by "a
// screenful" stays right when the window is resized; the server assumes desktop.
const subscribeToResize = (onChange: () => void) => {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
};
const getPerPage = () =>
  window.matchMedia("(min-width: 64rem)").matches
    ? 3
    : window.matchMedia("(min-width: 40rem)").matches
      ? 2
      : 1;

// Same hover as the site's pill buttons: the border becomes a spinning gold gradient.
const ARROW =
  "flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/40 text-white outline-offset-4 transition-colors hover:animate-border-spin hover:border-transparent hover:[background:var(--site-gradient)_fixed_padding-box,conic-gradient(from_var(--spin-from,0deg),transparent_var(--spin-reveal,100%),#FFFFFF_0)_border-box,conic-gradient(from_calc(var(--border-angle)_+_var(--spin-from,0deg)),#E79E3F,#C68535,#6D4819,#B8A58C,#FFFFFF,#F2C987,#E79E3F)_border-box] focus-visible:outline-2 focus-visible:outline-white motion-reduce:hover:animate-none lg:size-12";

// Testimonials a screenful at a time. The arrows fade the current cards out,
// swap in the next (or previous) set, and fade those in; it wraps round at
// either end. With only one screenful there are no arrows.
export function TestimonialCarousel({
  testimonials,
}: {
  testimonials: TestimonialItem[];
}) {
  const perPage = useSyncExternalStore(subscribeToResize, getPerPage, () => 3);
  const [page, setPage] = useState(0);
  const [visible, setVisible] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const pageCount = Math.ceil(testimonials.length / perPage);
  const current = page % pageCount; // stays valid if the cards-per-page changes
  const pages = Array.from({ length: pageCount }, (_, i) =>
    testimonials.slice(i * perPage, i * perPage + perPage),
  );

  const go = (step: 1 | -1) => {
    if (!visible) return; // mid-fade
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    setVisible(false);
    timer.current = setTimeout(
      () => {
        setPage((current + step + pageCount) % pageCount);
        setVisible(true);
      },
      reduced ? 0 : FADE_MS,
    );
  };

  const arrows = pageCount > 1;

  return (
    <div className={`relative mt-10 lg:mt-16 ${arrows ? "lg:px-20" : ""}`}>
      {/* Every screenful is laid out in the same grid cell, on top of one
          another, with only the current one visible. The cell is therefore as
          tall as the tallest screenful, and every card stretches to that — so
          all cards are the same height, whichever screenful is showing, and
          nothing below jumps when the arrows are used. */}
      <div aria-live="polite" className="grid">
        {pages.map((items, index) => {
          const isCurrent = index === current;
          return (
            <ul
              key={index}
              inert={!isCurrent}
              aria-hidden={!isCurrent || undefined}
              className={`col-start-1 row-start-1 grid gap-6 transition-opacity duration-300 ease-out motion-reduce:transition-none sm:grid-cols-2 lg:grid-cols-3 lg:gap-8 xl:gap-12 ${
                isCurrent && visible ? "opacity-100" : "opacity-0"
              } ${isCurrent ? "" : "invisible"}`}
            >
              {items.map((testimonial) => (
                // On desktop the middle card of the three sits slightly larger.
                <li
                  key={testimonial.id}
                  className="lg:[&:nth-child(3n+2)]:scale-105"
                >
                  <figure className="flex h-full flex-col justify-between gap-8 rounded-2xl bg-linear-to-br from-[#1F1F1F] to-[#2E2E2E] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)] sm:p-8">
                    <blockquote className="font-poppins text-xs leading-[1.5] font-normal text-neutral-200 sm:text-lg xl:text-xl">
                      “ {testimonial.testimony} ”
                    </blockquote>
                    <figcaption className="flex items-center gap-4">
                      {/* Plain <img>: photos come from the backend's storage host, which
                    next/image would need configured as a remote pattern. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={testimonial.image}
                        alt=""
                        loading="lazy"
                        className="size-12 shrink-0 rounded-full object-cover sm:size-14"
                      />
                      <div className="min-w-0 font-poppins">
                        <p className="truncate text-sm font-semibold text-white sm:text-xl">
                          {testimonial.name}
                        </p>
                        <p className="truncate text-xs text-[#9DA1B1] sm:text-base">
                          {testimonial.company}
                        </p>
                      </div>
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          );
        })}
      </div>

      {/* Arrows: either side of the cards on desktop, in a row underneath on smaller screens. */}
      {arrows && (
        <div className="mt-8 flex items-center justify-center gap-4 lg:mt-0">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous testimonials"
            className={`${ARROW} lg:absolute lg:top-1/2 lg:left-0 lg:-translate-y-1/2`}
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <p
            className="text-xs text-[#9DA1B1] tabular-nums sm:text-sm lg:hidden"
            aria-hidden
          >
            {current + 1} / {pageCount}
          </p>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next testimonials"
            className={`${ARROW} lg:absolute lg:top-1/2 lg:right-0 lg:-translate-y-1/2`}
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
