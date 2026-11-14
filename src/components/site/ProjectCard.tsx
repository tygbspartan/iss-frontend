import Link from "next/link";
import { ArrowCircle } from "./ArrowCircle";

/** Grid the cards sit in: 1 column on phones, 2 on tablets, 3 on desktop. */
export const PROJECT_GRID = "grid gap-x-7.5 gap-y-8 sm:grid-cols-2 sm:gap-y-10.5 lg:grid-cols-3 lg:gap-y-12.5";

// Service filter pill ("Weddings", "Corporate Events"…): the home page's tabs
// and the Projects page's filter links. Same hover as the site's pill buttons —
// the border becomes a spinning gold gradient.
export const FILTER_PILL =
  "shrink-0 cursor-pointer rounded-[99px] border px-3 py-1 font-poppins text-xs outline-offset-4 sm:px-4 sm:py-1.5 sm:text-sm transition-colors hover:animate-border-spin hover:border-transparent hover:text-white hover:[background:var(--site-gradient)_fixed_padding-box,conic-gradient(from_var(--spin-from,0deg),transparent_var(--spin-reveal,100%),#FFFFFF_0)_border-box,conic-gradient(from_calc(var(--border-angle)_+_var(--spin-from,0deg)),#E79E3F,#C68535,#6D4819,#B8A58C,#FFFFFF,#F2C987,#E79E3F)_border-box] focus-visible:outline-2 focus-visible:outline-white motion-reduce:hover:animate-none";
export const FILTER_PILL_ON = "border-white text-white";
export const FILTER_PILL_OFF = "border-transparent bg-white/8 text-[#9DA1B1]";
/** Row the pills sit in: scrolls sideways on phones, wraps and centres above that. */
export const FILTER_ROW =
  "-mx-5 flex gap-2.5 overflow-x-auto px-5 py-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0";

// One project: photo with its title underneath, and optionally a two-line
// description. With `href` the whole card is a link and shows the circled
// arrow (image zooms, arrow turns, on hover); without it, it's a plain card.
export function ProjectCard({
  title,
  image,
  href,
  description,
}: {
  title: string;
  image: string;
  href?: string;
  description?: string;
}) {
  const card = (
    <>
      <div className="aspect-537/298 overflow-hidden rounded-md border border-white/10 bg-neutral-900">
        {/* Plain <img>: images come from the backend's storage host, which
            next/image would need configured as a remote pattern. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt=""
          loading="lazy"
          className="size-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      {/* Phones (one card per row): the title is 14px and the
          description 12px, the same as the team cards. */}
      <div className="mt-2 flex items-center justify-between gap-2 sm:mt-4 sm:gap-4">
        <h3 className="truncate font-poppins text-sm leading-5 font-normal text-white sm:text-lg sm:leading-7">{title}</h3>
        {href && <ArrowCircle />}
      </div>
      {description && (
        <p className="mt-1 line-clamp-2 text-xs leading-normal text-[#9DA1B1] sm:mt-1.5 sm:text-sm sm:leading-[1.7]">{description}</p>
      )}
    </>
  );

  return href ? (
    <Link
      href={href}
      data-cursor="View"
      className="group block rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
    >
      {card}
    </Link>
  ) : (
    <div className="group">{card}</div>
  );
}
