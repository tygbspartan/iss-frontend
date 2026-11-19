"use client";

import { usePathname } from "next/navigation";
import { StageLights } from "./home/HeroEffects";

// The hero's two stage lights, as a background for every page: fixed to the
// screen (they stay at the top as you scroll, still following the cursor),
// behind all the content, as bright as in the hero. The footer's solid
// background covers them.
//
// Not on the home page: its hero has its own lights, and the content below
// the hero has a solid background of its own.
//
// Only the beams are back here. The lamp heads are drawn by the navbar, on top
// of its frosted glass (which would otherwise blur them) — see Navbar.
export const showSiteLights = (pathname: string) => pathname !== "/";

/** Same strength for the beams here and the heads in the navbar: full, as in the hero. */
export const SITE_LIGHTS_OPACITY = "opacity-100";

export function SiteLights() {
  const pathname = usePathname();
  if (!showSiteLights(pathname)) return null;
  return <StageLights heads={false} className={`fixed inset-0 -z-10 ${SITE_LIGHTS_OPACITY}`} />;
}
