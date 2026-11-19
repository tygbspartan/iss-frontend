"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, ChevronDown, Menu, X } from "lucide-react";
import { FaEnvelope, FaWhatsapp } from "react-icons/fa6";
import { CONTACT, NAV_LINKS, SERVICES_HREF, SITE_NAME, SOCIAL_LINKS, TEAMS_PARENT_HREF } from "@/lib/site";
import { PILL_BUTTON } from "./pill";
import { StageLightHeads } from "./home/HeroEffects";
import { showSiteLights, SITE_LIGHTS_OPACITY } from "./SiteLights";

/** A service as listed in the navbar's Services dropdown. */
export interface NavService {
  title: string;
  slug: string;
  description: string;
}

// Is `href` the link to highlight on this page? A link is current on its own
// page and on pages beneath it; "About" is also current on the Teams page,
// which has no link of its own and is reached through About.
export const isActivePath = (pathname: string, href: string) => {
  if (href === "/") return pathname === "/";
  if (href === TEAMS_PARENT_HREF && (pathname === "/teams" || pathname.startsWith("/teams/"))) return true;
  return pathname === href || pathname.startsWith(`${href}/`);
};

// Round icon button with the same hover as the site's pill buttons: its border
// becomes a spinning gold gradient.
const ICON_BUTTON =
  "flex size-10.5 shrink-0 items-center justify-center rounded-full border border-transparent bg-white/12 text-white outline-offset-4 transition-colors hover:animate-border-spin hover:[background:var(--site-gradient)_fixed_padding-box,conic-gradient(from_var(--spin-from,0deg),transparent_var(--spin-reveal,100%),#FFFFFF_0)_border-box,conic-gradient(from_calc(var(--border-angle)_+_var(--spin-from,0deg)),#E79E3F,#C68535,#6D4819,#B8A58C,#FFFFFF,#F2C987,#E79E3F)_border-box] focus-visible:outline-2 focus-visible:outline-white motion-reduce:hover:animate-none";

// The navbar's two contact shortcuts: an email button (opens the visitor's
// mail app) and a WhatsApp button showing the number (opens a chat).
// `compact` drops the number where space is tight, leaving the WhatsApp icon.
export function ContactButtons({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <a
        href={SOCIAL_LINKS.email}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Email ${CONTACT.email}`}
        title={`Email ${CONTACT.email}`}
        className={ICON_BUTTON}
      >
        <FaEnvelope className="size-4.5" aria-hidden />
      </a>
      <a
        href={SOCIAL_LINKS.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`WhatsApp ${CONTACT.whatsapp.label}`}
        title="Chat on WhatsApp"
        className={`gap-2.5! font-semibold! ${PILL_BUTTON}`}
      >
        <FaWhatsapp className="size-4 sm:size-5" aria-hidden />
        <span className={compact ? "lg:hidden xl:inline" : ""}>{CONTACT.whatsapp.label}</span>
      </a>
    </div>
  );
}

// "Is the top of the page's first screen still behind the navbar?" — on the
// home page that first screen is the hero, which stays pinned until the next
// section has slid up to the navbar (one screen of scrolling, less the bar).
const NAVBAR_MAX_HEIGHT = 118;
const subscribeToScroll = (onChange: () => void) => {
  window.addEventListener("scroll", onChange, { passive: true });
  window.addEventListener("resize", onChange);
  return () => {
    window.removeEventListener("scroll", onChange);
    window.removeEventListener("resize", onChange);
  };
};
const isWithinFirstScreen = () => window.scrollY < window.innerHeight - NAVBAR_MAX_HEIGHT;

// "Has the footer scrolled up to the navbar?" — i.e. is the footer what's
// behind the bar now. The footer is found by the id it sets on itself.
const isFooterAtNavbar = () => {
  const footer = document.getElementById("site-footer");
  return footer !== null && footer.getBoundingClientRect().top <= NAVBAR_MAX_HEIGHT;
};

export function Navbar({ services }: { services: NavService[] }) {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  // The mobile menu remembers which page it was opened on, so it reads as
  // closed as soon as the route changes.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;

  // The desktop Services dropdown works the same way. A click on "Services"
  // opens it (and a second click closes it); it also closes on Escape, on a
  // click anywhere else, or when a page is chosen. Hovering does nothing.
  const [servicesOn, setServicesOn] = useState<string | null>(null);
  const servicesOpen = servicesOn === pathname && services.length > 0;
  const onServicePage = pathname.startsWith("/services/");

  // Forget both menus whenever the page changes. Without this, a menu left
  // "open on /about" (say) would spring open again by itself the next time
  // the visitor came back to /about.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setOpenOn(null);
    setServicesOn(null);
  }

  useEffect(() => {
    if (!servicesOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setServicesOn(null);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setServicesOn(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [servicesOpen]);

  // While the mobile menu (the curtain) is down: the page behind it doesn't
  // scroll, and Escape raises it.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenOn(null);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // The mobile menu's items appear one after another once the curtain is most
  // of the way down (and vanish at once when it's raised).
  const reveal = `transition-[opacity,translate] duration-500 ease-out motion-reduce:transition-none ${
    open ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
  }`;
  const revealDelay = (index: number) => ({ transitionDelay: open ? `${320 + index * 70}ms` : "0ms" });

  // Every link is medium weight; the active one is white, the rest #9CA3AF.
  const linkClass = (href: string) =>
    `inline-flex font-medium transition-colors hover:text-white ${
      isActivePath(pathname, href) ? "text-white" : "text-[#9CA3AF]"
    }`;

  // On the home page, while the hero is still what's behind the navbar, the
  // bar is completely clear (no blur) so the hero runs unbroken to the top of
  // the screen. An open mobile menu always gets the frosted look, to stay readable.
  const overHero = useSyncExternalStore(subscribeToScroll, isWithinFirstScreen, () => true);

  // Once the footer is behind the bar, the bar steps back: it is clear too, and
  // everything except the logo fades out and stops responding (the footer has
  // its own sitemap and contact links). An open mobile menu is left alone.
  const inFooter = useSyncExternalStore(subscribeToScroll, isFooterAtNavbar, () => false) && !open;
  const clear = ((pathname === "/" && overHero) || inFooter) && !open && !servicesOpen;
  const stepBack = `transition-opacity duration-300 ${inFooter ? "pointer-events-none opacity-0" : "opacity-100"}`;

  return (
    // The bar is frosted glass at every screen size: no tint of its own, just the
    // page content blurred behind it (browsers without backdrop-filter get a
    // solid-ish bar instead). It is only see-through over the home page's hero
    // and the footer (see `clear` above).
    <header
      ref={headerRef}
      // While the Services dropdown is open the bar is solid dark too, so bar
      // and dropdown read as one dark panel rather than frosted glass.
      // With the mobile menu open the bar has no background of its own: the
      // menu's dark sheet covers the whole screen from the very top, and the
      // logo and close button sit on top of it.
      className={`sticky top-0 z-40 transition-[background-color,backdrop-filter] duration-300 ${
        servicesOpen
          ? "bg-[#0A0A0A]"
          : clear || open
          ? "bg-transparent"
          : "bg-black/80 supports-[backdrop-filter]:bg-transparent supports-[backdrop-filter]:backdrop-blur-xl supports-[backdrop-filter]:backdrop-saturate-150"
      }`}
    >
      {/* The background stage lights' lamp heads (see SiteLights), drawn here so
          they sit on top of the bar's frosted glass instead of being blurred
          by it. Under the logo, buttons and the mobile menu's sheet; faded
          out with the rest of the bar once the footer is behind it. */}
      {showSiteLights(pathname) && (
        <StageLightHeads
          className={`absolute inset-x-0 top-0 transition-opacity duration-300 ${inFooter ? "opacity-0" : SITE_LIGHTS_OPACITY}`}
        />
      )}

      {/* relative z-10: keeps the logo and buttons above the mobile menu's sheet. */}
      <div className="site-container relative z-10 flex h-20 items-center justify-between gap-6 lg:h-[118px]">
        <Link href="/" aria-label={`${SITE_NAME} home`} className="shrink-0">
          <Image src="/logo.png" alt={SITE_NAME} width={145} height={61} priority className="h-11 w-auto lg:h-[54px]" />
        </Link>

        <nav aria-label="Main" inert={inFooter} className={`hidden lg:block ${stepBack}`}>
          {/* Tighter spacing on small laptops so the links fit beside the logo and contact buttons. */}
          <ul className="flex items-center gap-5 text-[15px] xl:gap-10">
            {NAV_LINKS.map(({ href, label }) =>
              href === SERVICES_HREF && services.length > 0 ? (
                <li key={href}>
                  <button
                    type="button"
                    aria-expanded={servicesOpen}
                    aria-controls="services-menu"
                    onClick={() => setServicesOn(servicesOpen ? null : pathname)}
                    className={`inline-flex cursor-pointer items-center gap-1.5 font-medium transition-colors hover:text-white ${
                      servicesOpen || onServicePage ? "text-white" : "text-[#9CA3AF]"
                    }`}
                  >
                    {label}
                    <ChevronDown
                      aria-hidden
                      className={`size-4 transition-transform duration-200 ${servicesOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                </li>
              ) : (
                <li key={href}>
                  <Link href={href} className={linkClass(href)} aria-current={isActivePath(pathname, href) ? "page" : undefined}>
                    {label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div inert={inFooter} className={`flex items-center gap-3 ${stepBack}`}>
          {/* Hidden on phones, where the buttons are in the menu instead. On small
              laptops the number is dropped so the links still fit. */}
          <div className="hidden sm:block">
            <ContactButtons compact />
          </div>
          <button
            type="button"
            onClick={() => setOpenOn(open ? null : pathname)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="rounded-md p-2 text-white hover:bg-white/10 lg:hidden"
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Desktop Services dropdown: every service, numbered, with its short
          description. Always in the page (so it can fade and slide), but
          hidden and unreachable while closed. */}
      {services.length > 0 && (
        <div
          id="services-menu"
          inert={!servicesOpen}
          className={`absolute inset-x-0 top-full hidden border-y border-white/10 bg-[#0A0A0A] transition duration-200 ease-out lg:block ${
            servicesOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"
          }`}
        >
          <div className="site-container py-10">
            <p className="font-poppins text-xs tracking-[0.2em] text-[#9DA1B1] uppercase">What we do</p>
            <ul className="mt-6 grid grid-cols-3 gap-x-10 xl:grid-cols-4">
              {services.map((service, i) => (
                <li key={service.slug}>
                  <Link
                    href={`/services/${service.slug}`}
                    onClick={() => setServicesOn(null)}
                    aria-current={pathname === `/services/${service.slug}` ? "page" : undefined}
                    data-cursor="Discover"
                    className="group block h-full border-t border-white/10 pt-5 pb-8 outline-offset-4 focus-visible:outline-2 focus-visible:outline-white"
                  >
                    <span className="flex items-center justify-between">
                      <span className="font-poppins text-xs text-[#E79E3F] tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <ArrowUpRight
                        aria-hidden
                        className="size-4 text-[#9DA1B1] transition duration-300 group-hover:rotate-45 group-hover:text-white"
                      />
                    </span>
                    <span className="mt-2 block text-xl text-white capitalize transition-colors group-hover:text-[#E79E3F]">
                      {service.title}
                    </span>
                    {/* No "block" here: line-clamp sets its own display, which "block" would override. */}
                    <span className="mt-2 line-clamp-2 font-poppins text-sm leading-[1.6] font-light text-[#9DA1B1]">
                      {service.description}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Mobile menu: a plain dark sheet that rolls down over the whole
          screen, starting from the very top of the page (it sits behind the
          bar's logo and close button, not below the bar). The menu itself
          doesn't move — it's uncovered from the top down (clip-path), and
          covered back up the same way when closed. Once it's open the links
          fade in one after another. Always in the page (so it can animate),
          but out of reach while closed. Visitors who ask for reduced motion
          get it without the movement. */}
      <div
        id="mobile-nav"
        inert={!open}
        className="pointer-events-none absolute inset-x-0 top-0 h-dvh overflow-hidden lg:hidden"
      >
        <nav
          aria-label="Main"
          // One plain dark surface. The top padding is the bar's height, so
          // the links start below the logo.
          className={`h-full overflow-y-auto bg-[#0A0A0A] pt-20 transition-[clip-path] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
            open
              ? "pointer-events-auto duration-700 [clip-path:inset(0_0_0_0)]"
              : "duration-500 [clip-path:inset(0_0_100%_0)]"
          }`}
        >
          <ul className="site-container flex flex-col py-5">
            {NAV_LINKS.map(({ href, label }, i) =>
              href === SERVICES_HREF && services.length > 0 ? (
                // On phones and tablets the services are listed under a "Services" heading.
                <li key={href} style={revealDelay(i)} className={reveal}>
                  <p className={`py-3 text-sm font-medium sm:text-[15px] ${onServicePage ? "text-white" : "text-[#9CA3AF]"}`}>{label}</p>
                  <ul className="mb-2 ml-1 border-l border-white/10 pl-4">
                    {services.map((service) => {
                      const current = pathname === `/services/${service.slug}`;
                      return (
                        <li key={service.slug}>
                          <Link
                            href={`/services/${service.slug}`}
                            onClick={() => setOpenOn(null)}
                            aria-current={current ? "page" : undefined}
                            className={`block py-2 text-xs capitalize transition-colors sm:text-sm hover:text-white ${
                              current ? "text-white" : "text-[#9CA3AF]"
                            }`}
                          >
                            {service.title}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ) : (
                <li key={href} style={revealDelay(i)} className={reveal}>
                  <Link
                    href={href}
                    onClick={() => setOpenOn(null)}
                    className={`w-full py-3 text-sm sm:text-[15px] ${linkClass(href)}`}
                    aria-current={isActivePath(pathname, href) ? "page" : undefined}
                  >
                    {label}
                  </Link>
                </li>
              ),
            )}
            <li style={revealDelay(NAV_LINKS.length)} className={`pt-4 pb-2 sm:hidden ${reveal}`}>
              <ContactButtons />
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
