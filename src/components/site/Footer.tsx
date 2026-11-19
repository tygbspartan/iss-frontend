import { Fragment } from "react";
import Image from "next/image";
import { CONTACT, SITE_NAME, SITEMAP, SITEMAP_NARROW } from "@/lib/site";
import { SitemapLink } from "./SitemapLink";
import { SOCIALS } from "./socials";

// The studio that built the site, credited in the copyright line.
const FIBISPACE_URL = "https://fibispace.com";

export function Footer() {
  return (
    // The footer is at least one screen tall at every size, with its content
    // centred in it, so at the very bottom of a page the footer fills the screen. The
    // top padding (150px) keeps "ISS NEPAL" clear of the navbar (118px), which
    // by then shows only the logo — see `inFooter` in Navbar, which finds this
    // element by its id.
    <footer id="site-footer" className="flex min-h-dvh flex-col bg-[#111111] text-neutral-300">
      {/* Phones and tablets (one column, below 768px): everything is centred.
          On phones the content splits into three groups ("ISS NEPAL", then Work
          with us and Sitemap, then Follow us) with equal gaps above, between and
          below them, starting under the navbar's logo (80px) and ending at the
          copyright line. Tablets have more space above "ISS NEPAL". From 768px it
          is two columns, left-aligned. */}
      <div className="site-container flex flex-1 flex-col justify-evenly gap-8 pt-28 pb-8 text-center sm:justify-center sm:gap-0 sm:pt-36 sm:pb-0 md:pt-32 md:text-left lg:pt-37.5">
        <div>
          <p
            aria-hidden
            className="text-[clamp(3.5rem,13vw,11rem)] font-bold leading-[0.85] tracking-tight text-[#FFFCF2]"
          >
            ISS NEPAL
          </p>

          <hr className="mt-6 border-white/15 sm:mt-14 lg:mt-16" />
        </div>

        <div className="contents sm:grid sm:gap-12 sm:py-12 md:grid-cols-2 lg:py-14">
          {/* Work with us and Sitemap are one group on phones. */}
          <div className="space-y-6 sm:contents sm:space-y-0">
            <section className="md:row-span-2">
              <h2 className="text-sm font-medium text-neutral-200 sm:text-xl lg:text-[22px]">Work with us</h2>
              <address className="mt-5 space-y-1.5 text-xs not-italic sm:mt-8 sm:text-base">
                <p>{CONTACT.address}</p>
                <p>
                  {CONTACT.phones.map((phone, i) => (
                    <Fragment key={phone.tel}>
                      {i > 0 && " / "}
                      <a href={`tel:${phone.tel}`} className="whitespace-nowrap transition hover:text-white">
                        {phone.label}
                      </a>
                    </Fragment>
                  ))}
                </p>
                <a
                  href={`mailto:${CONTACT.email}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mx-auto block w-fit transition hover:text-white md:mx-0"
                >
                  {CONTACT.email}
                </a>
              </address>
            </section>

            <section className="md:col-start-2">
              <h2 className="text-sm font-medium text-neutral-200 sm:text-xl lg:text-[22px]">Sitemap</h2>
              {/* Phones and small tablets (below 768px, where the footer is
                  centred): two columns of three links, left-aligned
                  within each column, with the pair centred as one block. */}
              <nav aria-label="Sitemap" className="mx-auto mt-5 grid w-fit grid-cols-2 gap-x-12 text-left text-xs sm:mt-8 sm:gap-x-16 sm:text-base md:hidden">
                {SITEMAP_NARROW.map((column, i) => (
                  <ul key={i} className="space-y-1.5">
                    {column.map((link) => (
                      <li key={`${link.href}-${link.label}`}>
                        <SitemapLink href={link.href}>{link.label}</SitemapLink>
                      </li>
                    ))}
                  </ul>
                ))}
              </nav>
              {/* From 768px: three columns of two. */}
              <nav aria-label="Sitemap" className="mt-8 hidden grid-cols-3 gap-x-6 gap-y-1.5 md:grid">
                {SITEMAP.map((column, i) => (
                  <ul key={i} className="space-y-1.5">
                    {column.map((link) => (
                      <li key={`${link.href}-${link.label}`}>
                        <SitemapLink href={link.href}>{link.label}</SitemapLink>
                      </li>
                    ))}
                  </ul>
                ))}
              </nav>
            </section>
          </div>

          <section className="md:col-start-2">
            <h2 className="text-sm font-medium text-neutral-200 sm:text-xl lg:text-[22px]">Follow us on</h2>
            <ul className="mt-5 flex flex-wrap justify-center gap-5 sm:mt-8 sm:gap-8 md:justify-start">
              {SOCIALS.map(({ href, label, icon: Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    aria-label={label}
                    title={label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-white transition hover:opacity-70"
                  >
                    <Icon className="size-5 sm:size-7" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      {/* Copyright and the site credit: side by side with a divider on wider
          screens, one above the other on phones. */}
      <div className="flex flex-col items-center justify-center gap-2 px-4 pb-5 text-center text-xs sm:pt-10 sm:pb-8 text-neutral-300 sm:flex-row sm:gap-4 sm:text-base">
        <p>
          All Rights Reserved @{new Date().getFullYear()} {SITE_NAME}.
        </p>
        <span aria-hidden className="hidden h-4 w-px bg-white/25 sm:block" />
        <a
          href={FIBISPACE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-sm outline-offset-4 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-white"
        >
          Powered by Fibispace
          <Image src="/fibispace-logo.png" alt="" width={868} height={866} sizes="16px" className="size-4" />
        </a>
      </div>
    </footer>
  );
}
