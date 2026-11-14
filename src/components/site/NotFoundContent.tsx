import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PILL_BUTTON } from "./pill";

// The body of the 404 page, shared by both places a "not found" can come from
// (see app/not-found.tsx and app/(site)/not-found.tsx). Together with the
// navbar above it (80px, 118px on desktop) it fills exactly one screen, with
// the content centred; the footer starts below the fold.
export function NotFoundContent() {
  return (
    <section className="site-container flex min-h-[calc(100svh-80px)] flex-col items-center justify-center py-16 text-center lg:min-h-[calc(100svh-118px)]">
      <p aria-hidden className="text-[112px] leading-none font-light tracking-[-0.04em] text-white sm:text-[168px] lg:text-[208px]">
        4<span className="text-[#E79E3F]">0</span>4
      </p>
      <h1 className="mt-4 text-[26px] leading-[1.15] font-medium tracking-[-0.02em] text-white sm:text-4xl lg:text-5xl">
        This stage is empty
      </h1>
      <p className="mt-4 max-w-[520px] font-poppins text-xs leading-[1.61] text-[#9DA1B1] sm:text-lg">
        The page you’re looking for has moved, been taken down, or never made it to the line-up. Let’s get you back
        to the show.
      </p>
      <Link href="/" className={`mt-9 ${PILL_BUTTON}`}>
        Back to home
        <ArrowRight className="size-4" strokeWidth={2.5} aria-hidden />
      </Link>
    </section>
  );
}
