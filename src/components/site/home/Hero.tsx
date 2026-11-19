import Image from "next/image";
import Link from "next/link";
import { SERVICES_HREF } from "@/lib/site";
import { PILL_BUTTON } from "../pill";
import { RisingDots, SoundWave, StageLights } from "./HeroEffects";
import { HeroStage } from "./HeroStage";

// Home page hero: a full-screen stage. It stays pinned to the screen while the
// rest of the page slides up over it (see the home page for that half), and as
// that happens its layers drift apart: --p, set by HeroStage, runs from 0 to 1
// over the first screen of scrolling. The headline rises, shrinks and fades;
// the crowd photo sinks and grows; the whole stage dims.
//
// The top padding is the navbar's height: the hero sits underneath the
// (see-through) navbar so the backdrop starts at the very top of the page.
export function Hero() {
  return (
    <HeroStage className="sticky top-0 isolate flex h-svh flex-col items-center justify-center overflow-hidden px-5 pt-20 pb-36 lg:pt-29.5 lg:pb-40">
      {/* Crowd photo along the bottom only, fading out towards the top. The
          box sets the size (and carries the parallax and fade); the photo
          just fills it. */}
      <div className="absolute inset-x-0 bottom-0 -z-30 h-[62%] origin-bottom [transform:translateY(calc(var(--p)_*_70px))_scale(calc(1_+_var(--p)_*_0.12))] opacity-70 [mask-image:linear-gradient(to_bottom,transparent,black_45%)] will-change-transform">
        <Image src="/hero-crowd.png" alt="" fill preload sizes="100vw" className="object-cover" />
      </div>

      {/* Two gold stage lights that follow the cursor. */}
      <StageLights className="absolute inset-0 -z-20" />

      <RisingDots className="absolute inset-0 -z-10 size-full" />

      <div className="flex [transform:translateY(calc(var(--p)_*_-140px))_scale(calc(1_-_var(--p)_*_0.1))] flex-col items-center [opacity:calc(1_-_var(--p)_*_1.6)] will-change-transform">
        <h1 className="text-center text-[34px] leading-[1.12] font-light text-white sm:text-6xl lg:text-[76px]">
          Your Vision, Our
          <br />
          <span className="text-[#E79E3F]">Creation</span>.
        </h1>
        <p className="mt-5 max-w-[720px] text-center text-xs text-[#9DA1B1] sm:text-xl lg:mt-6 lg:text-[22px]">
          Strategy, creativity, and digital experiences built to leave a mark.
        </p>
        <Link href={SERVICES_HREF} className={`mt-6 font-semibold! sm:mt-8 sm:px-6! sm:py-3! sm:text-[15px]! ${PILL_BUTTON}`}>
          Explore Our Services
        </Link>
      </div>

      <SoundWave className="absolute inset-x-0 bottom-3 h-24 w-full [opacity:calc(1_-_var(--p)_*_2.5)] lg:bottom-4" />

      {/* Dims the whole stage as the next section covers it. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-10 bg-black [opacity:calc(var(--p)_*_0.65)]" />
    </HeroStage>
  );
}
