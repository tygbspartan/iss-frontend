import { SectionHeader } from "../PageHeader";
import { CountUp } from "./CountUp";
import { RisingDots } from "./HeroEffects";

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

// The quote card: why people choose ISS, in a few words, on a little stage of
// its own — two gold spotlight beams from the top corners, faint sound-wave
// rings, a warm glow, and the hero's drifting gold dust.
function QuoteCard({ className = "" }: { className?: string }) {
  return (
    <li className={`relative isolate flex flex-col justify-end overflow-hidden bg-[#0B0B0B] p-7 sm:p-9 lg:p-11 ${BOX} ${className}`}>
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        {/* Spotlight beams, crossing towards the words. */}
        <span className="absolute -top-10 -left-16 h-[140%] w-[70%] origin-top-left rotate-[-18deg] bg-[linear-gradient(to_bottom,rgba(231,158,63,0.32),rgba(231,158,63,0.08)_55%,transparent_85%)] blur-2xl [clip-path:polygon(42%_0,58%_0,100%_100%,0_100%)]" />
        <span className="absolute -top-10 -right-16 h-[140%] w-[70%] origin-top-right rotate-[18deg] bg-[linear-gradient(to_bottom,rgba(231,158,63,0.26),rgba(231,158,63,0.06)_55%,transparent_85%)] blur-2xl [clip-path:polygon(42%_0,58%_0,100%_100%,0_100%)]" />
        {/* Sound-wave rings spreading from the bottom right. */}
        <span className="absolute -right-24 -bottom-24 size-[560px] rounded-full bg-[repeating-radial-gradient(circle,transparent_0,transparent_26px,rgba(231,158,63,0.09)_27px,transparent_28px)] [mask-image:radial-gradient(circle,black,transparent_70%)]" />
        {/* Warm glow behind the words. */}
        <span className="absolute inset-x-0 bottom-0 h-2/3 bg-[radial-gradient(ellipse_at_30%_100%,rgba(231,158,63,0.18),transparent_65%)]" />
        <RisingDots className="absolute inset-0 size-full" density={0.45} sparkle />
      </div>

      <span aria-hidden className="font-poppins text-[64px] leading-[0.6] text-[#E79E3F] sm:text-[84px]">
        &ldquo;
      </span>
      <blockquote className="mt-4 text-lg leading-snug font-light text-white sm:text-2xl lg:text-[26px] lg:leading-[1.35]">
        Since 1960, three generations of our family have stood behind the sound. Every show we take on is a promise
        kept: that every voice is <span className="text-[#E79E3F]">heard</span>, and every moment is{" "}
        <span className="text-[#E79E3F]">felt</span>.
      </blockquote>
      <p className="mt-6 flex items-center gap-3 font-poppins text-xs tracking-[0.18em] text-[#9DA1B1] uppercase sm:text-sm">
        <span aria-hidden className="h-px w-8 bg-linear-to-r from-[#E79E3F] to-[#6D4819]" />
        International Sound Service
      </p>
    </li>
  );
}

// "Why Choose Us?" — the numbers behind ISS Nepal, beside a quote that says it
// in words. It's as tall as its content, with the same spacing above and below
// as the other home page sections. Desktop, left to right: the quote (wide),
// two stacked stats, one tall stat. Phones and tablets: the quote, then the
// stats in a row (tablets) or stacked (phones).
export function Stats() {
  return (
    <section className="site-container py-14 lg:py-20">
      <SectionHeader
        label="Our Track Record"
        title="Why Choose Us?"
        intro="Decades on the road, hundreds of clients, and a crew trusted with some of Nepal’s biggest stages."
      />

      <ul className="mt-10 grid gap-4 sm:grid-cols-3 lg:mt-16 lg:h-105 lg:grid-cols-[2.6fr_1.7fr_1fr] lg:grid-rows-2 lg:gap-5">
        <QuoteCard className="sm:col-span-3 lg:col-span-1 lg:col-start-1 lg:row-span-2 lg:row-start-1" />
        <Stat value={25} suffix="+" label="Years of experience" className="lg:col-start-2 lg:row-start-1" />
        <Stat value={200} suffix="+" label="Clients served" className="lg:col-start-2 lg:row-start-2" />
        <Stat value={1000} suffix="+" label="Projects delivered" className="lg:col-start-3 lg:row-span-2 lg:row-start-1" />
      </ul>
    </section>
  );
}
