import { ArrowUpRight } from "lucide-react";

// The circled ↗ on cards. Put it inside an element with the `group` class: when
// that element is hovered the arrow turns to point right and the circle's
// border becomes the spinning gold gradient (as on the site's pill buttons).
// It is smaller on phones (20px), where cards sit two across.
export function ArrowCircle({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#9DA1B1] sm:size-7 sm:border-2 text-[#9DA1B1] transition-colors group-hover:animate-border-spin group-hover:border-transparent group-hover:text-white group-hover:[background:var(--site-gradient)_fixed_padding-box,conic-gradient(from_calc(var(--border-angle)_+_var(--spin-from,0deg)),#E79E3F,#C68535,#6D4819,#B8A58C,#FFFFFF,#F2C987,#E79E3F)_border-box] motion-reduce:group-hover:animate-none lg:size-7.5 ${className}`}
    >
      <ArrowUpRight
        className="size-3.5 transition-transform duration-300 group-hover:rotate-45 sm:size-5"
        strokeWidth={1.75}
      />
    </span>
  );
}
