"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CornerDownRight } from "lucide-react";

export interface ServiceItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  image: string;
}

// The services section body. On desktop the section heading and the list of
// services (left) are pinned to the screen as ONE block while the services'
// images and descriptions scroll past on the right; once the last service has
// scrolled up level with the list, the whole block lets go together and the
// page carries on. Whichever service is in view on the right is highlighted
// on the left; clicking a name on the left scrolls to it.
//
// How the pinning is laid out: a two-column grid in which the pinned block
// spans both columns and the right-hand column overlaps it in the same row,
// starting below the heading. The heading is 238px tall (lg:h-59.5) — 118px
// sitting behind the see-through navbar, so scrolled-away images are hidden
// there too, plus 120px for the heading itself — and has the page's own
// background, fixed to the viewport. The list and the first service start
// 40px below that (238 + 40 = 278px: lg:pt-69.5 and lg:scroll-mt-69.5).
//
// So services don't appear and disappear at a hard edge, the right-hand
// column has a soft fade at both ends of its visible area: one just under the
// heading and one along the bottom of the screen. Each is a strip of the
// page's own background, lightly blurring what's behind it and fading out
// towards the middle. The grid clips anything outside itself (lg:overflow-clip)
// so the bottom fade vanishes with the section instead of covering the next one.
const FADE =
  "pointer-events-none absolute right-0 hidden bg-[image:var(--site-gradient)] bg-fixed backdrop-blur-[3px] lg:left-[calc((100%-3rem)*2/5+3rem)] lg:block xl:left-[calc((100%-5rem)*2/5+5rem)]";
export function ServiceScroller({ services, header }: { services: ServiceItem[]; header: React.ReactNode }) {
  const [activeId, setActiveId] = useState(services[0]?.id);
  const itemRefs = useRef(new Map<string, HTMLElement>());

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      // Active = the last service whose top has passed a line a bit below the
      // middle of the screen, i.e. the one filling most of the view.
      const line = window.innerHeight * 0.55;
      let current = services[0]?.id;
      for (const service of services) {
        const top = itemRefs.current.get(service.id)?.getBoundingClientRect().top;
        if (top !== undefined && top <= line) current = service.id;
      }
      setActiveId(current);
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
  }, [services]);

  const scrollTo = (id: string) => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    itemRefs.current.get(id)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  };

  return (
    // The negative margin takes back most of the heading's navbar padding while
    // it isn't pinned (kept under the section above's bottom padding, so the
    // heading's background never covers content).
    <div className="lg:-mt-20 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-x-12 lg:overflow-clip xl:gap-x-20">
      {/* Pinned block: heading + list. It lies over the right column, so it
          ignores the mouse except on the heading and the list themselves. */}
      <div className="lg:pointer-events-none lg:sticky lg:top-0 lg:z-10 lg:col-span-2 lg:col-start-1 lg:row-start-1 lg:self-start">
        <div className="pt-4 pb-10 lg:pointer-events-auto lg:flex lg:h-59.5 lg:flex-col lg:justify-start lg:bg-[image:var(--site-gradient)] lg:bg-fixed lg:pt-29.5 lg:pb-0">
          {header}
        </div>

        {/* Fades over the right-hand column: under the heading, and along the bottom of the screen. */}
        <div aria-hidden className={`${FADE} top-59.5 h-14 [mask-image:linear-gradient(to_bottom,black,transparent)]`} />
        <div
          aria-hidden
          className={`${FADE} top-[calc(100svh-7rem)] h-28 [mask-image:linear-gradient(to_top,black,transparent)]`}
        />

        {/* Desktop only: on smaller screens each service shows its own title
            instead. As wide as the grid's left column (2 of 5 parts, less the gap). */}
        <nav
          aria-label="Services"
          className="hidden lg:pointer-events-auto lg:block lg:w-[calc((100%-3rem)*2/5)] lg:pt-10 xl:w-[calc((100%-5rem)*2/5)]"
        >
          <ul className="space-y-5 xl:space-y-6">
            {services.map((service) => {
              const active = service.id === activeId;
              return (
                <li key={service.id}>
                  <button
                    type="button"
                    onClick={() => scrollTo(service.id)}
                    aria-current={active ? "true" : undefined}
                    className={`flex w-full cursor-pointer items-center gap-4 text-left text-[22px] leading-[1.3] capitalize outline-offset-4 transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-white xl:text-[26px] ${
                      active ? "text-white" : "text-[#4D4D4D] hover:text-[#9DA1B1]"
                    }`}
                  >
                    <CornerDownRight
                      aria-hidden
                      strokeWidth={1.5}
                      className={`size-6 shrink-0 text-[#9DA1B1] transition duration-300 ${
                        active ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"
                      }`}
                    />
                    {service.title}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className="space-y-14 lg:col-start-2 lg:row-start-1 lg:space-y-16 lg:pt-69.5">
        {services.map((service) => (
          <article
            key={service.id}
            ref={(node) => {
              if (node) itemRefs.current.set(service.id, node);
              else itemRefs.current.delete(service.id);
            }}
            className="scroll-mt-24 lg:scroll-mt-69.5"
          >
            <h3 className="mb-3 text-base font-medium text-white capitalize sm:mb-4 sm:text-2xl lg:sr-only">{service.title}</h3>
            {/* The image opens the service's own page (the cursor says "Explore"). */}
            <Link
              href={`/services/${service.slug}`}
              data-cursor="Explore"
              aria-label={`${service.title}: explore this service`}
              className="group block aspect-972/368 overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 outline-offset-4 focus-visible:outline-2 focus-visible:outline-white"
            >
              {/* Plain <img>: images come from the backend's storage host, which
                  next/image would need configured as a remote pattern. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={service.image}
                alt=""
                loading="lazy"
                className="size-full object-cover transition duration-500 group-hover:scale-105"
              />
            </Link>
            <p className="mt-3 line-clamp-3 font-poppins text-xs leading-[1.6] font-light tracking-[0.015em] text-[#9DA1B1] sm:text-base lg:mt-4 xl:text-lg">
              {service.description}
            </p>
            <Link
              href={`/projects?service=${encodeURIComponent(service.slug)}`}
              className="group mt-3 inline-flex items-center gap-2 text-xs font-medium sm:gap-3 sm:text-base text-white outline-offset-4 transition-colors hover:text-[#E79E3F] focus-visible:outline-2 focus-visible:outline-white sm:text-lg"
            >
              View projects
              <span className="sr-only"> for {service.title}</span>
              <ArrowRight className="size-3.5 sm:size-4.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
