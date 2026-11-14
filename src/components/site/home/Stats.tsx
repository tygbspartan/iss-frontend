import { SectionHeader } from "../PageHeader";
import { CountUp } from "./CountUp";

// Shared card frame: rounded, hairline border.
const BOX = "rounded-2xl border border-white/12";

function Stat({ value, suffix, label, className = "" }: { value: number; suffix: string; label: string; className?: string }) {
  return (
    // Near-black card with a faint warm glow, like stage light catching haze.
    <li
      className={`flex flex-col items-center justify-center bg-[#0D0D0D] bg-[radial-gradient(ellipse_at_70%_35%,rgba(231,158,63,0.12),transparent_62%)] px-4 py-10 text-center lg:py-6 ${BOX} ${className}`}
    >
      <p className="text-[26px] leading-none font-semibold text-white sm:text-4xl lg:text-[44px]">
        <CountUp value={value} suffix={suffix} />
      </p>
      {/* Label with the site's gold gradient rule under it, as wide as the text. */}
      <p className="relative mt-3 w-fit pb-2 text-xs font-light sm:mt-4 sm:pb-2.5 sm:text-base text-neutral-200 after:absolute after:inset-x-0 after:bottom-0 after:h-[1.5px] after:bg-linear-to-r after:from-[#E79E3F] after:to-[#6D4819] lg:text-xl">
        {label}
      </p>
    </li>
  );
}

// "Why Choose Us?" — the numbers behind ISS Nepal. It's as tall as its content,
// with the same spacing above and below as the other home page sections.
// Desktop layout, left to right: an empty box, two stacked stats, one tall
// stat, an empty box. The two empty boxes are placeholders for content to come
// (photos in the design) and are hidden on tablets and phones.
export function Stats() {
  return (
    <section className="site-container py-14 lg:py-20">
      <SectionHeader
        label="Our Track Record"
        title="Why Choose Us?"
        intro="Decades on the road, hundreds of clients, and a crew trusted with some of Nepal’s biggest stages."
      />

      <ul className="mt-10 grid gap-4 sm:grid-cols-3 lg:mt-16 lg:h-105 lg:grid-cols-[2fr_2fr_1fr_1fr] lg:grid-rows-2 lg:gap-5">
        <li aria-hidden className={`hidden bg-black lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:block ${BOX}`} />
        <Stat value={25} suffix="+" label="Years of experience" className="lg:col-start-2 lg:row-start-1" />
        <Stat value={200} suffix="+" label="Clients served" className="lg:col-start-2 lg:row-start-2" />
        <Stat value={1000} suffix="+" label="Projects delivered" className="lg:col-start-3 lg:row-span-2 lg:row-start-1" />
        <li aria-hidden className={`hidden bg-black lg:col-start-4 lg:row-span-2 lg:row-start-1 lg:block ${BOX}`} />
      </ul>
    </section>
  );
}
