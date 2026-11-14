import { Fragment } from "react";
import type { Metadata, Viewport } from "next";
import { Phone } from "lucide-react";
import { CONTACT, MAP_EMBED_URL } from "@/lib/site";
import { getServices } from "@/lib/publicApi";
import { ContactForm } from "@/components/site/ContactForm";
import { MusicNoteIcon } from "@/components/site/MusicNoteIcon";
import { SOCIALS } from "@/components/site/socials";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Contact Us",
  description:
    "Planning a concert, wedding or corporate event in Nepal? Tell ISS Nepal about it and get a quote for sound, lighting and stage production.",
  path: "/contact",
});

// The form's inputs are 12px on phones, and iPhones zoom the page into any input
// under 16px when it's tapped, which also lets the page pan sideways. This stops
// that auto-zoom. It applies to this page only.
export const viewport: Viewport = { maximumScale: 1 };

// Contact page. On desktop, two columns sharing two grid rows. Row 1: the pitch,
// "Call us" and a divider on the left; the form's fields on the right. Row 2:
// "Easy Connect" on the left; the submit button on the right. The form joins
// these rows with CSS subgrid (see ContactForm), so the divider always lines up
// with the bottom line of the "Event Vision" field. On tablets everything is simply stacked; phones get just the pitch and
// the form, without "Call us" or "Easy Connect".
export default async function ContactPage() {
  // The "Event Type" dropdown lists the services. If the backend is
  // unreachable the page still renders; the form then can't be submitted.
  const services = await getServices().catch(() => []);

  return (
    <>
    <div className="site-container flex flex-col pt-[65px] pb-14 sm:pt-[81px] lg:pt-[65px] lg:pb-16">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:grid-rows-[auto_auto] lg:gap-x-16 2xl:gap-x-28">
        {/* Row 1, left: the pitch at the top, "Call us" at the bottom, with the divider under it. */}
        <div className="flex flex-col justify-between gap-12 border-white/30 sm:border-b sm:pb-6 lg:col-start-1 lg:row-start-1">
          <section>
            <h1 className="font-medium tracking-[-0.02em] text-white sm:font-light">
              <span className="block text-[30px] leading-[1.1] sm:text-5xl lg:text-[40px] xl:text-5xl 2xl:text-[60px]">
                Have an event?{" "}
                {/* Small gold note, raised beside the last word and tilted slightly. */}
                <MusicNoteIcon className="inline size-[0.55em] -translate-y-[0.5em] rotate-12 text-[#E79E3F]" />
              </span>
              <span className="mt-1 block text-[30px] leading-[1.1] sm:text-[40px] sm:leading-[1.15] lg:text-[34px] xl:text-[40px] 2xl:text-[50px]">
                Let&rsquo;s make it heard.
              </span>
            </h1>
            <p className="mt-4 max-w-[700px] font-poppins text-xs leading-[1.61] font-light text-[#9DA1B1] sm:text-base">
              Planning a concert, wedding, festival or corporate night? Tell us the date, the venue and the crowd
              you&rsquo;re expecting, and we&rsquo;ll put together the right sound, lighting and stage setup, with a
              quote to match.
            </p>
          </section>

          <section aria-label="Call us" className="hidden items-center gap-4 sm:flex">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#E79E3F33] text-[#E79E3F]">
              <Phone className="size-5" strokeWidth={1.75} aria-hidden />
            </span>
            <div>
              <p className="text-xs text-[#9DA1B1]">Call us</p>
              <p className="mt-0.5 text-xs text-white sm:text-base">
                {CONTACT.phones.map((phone, i) => (
                  <Fragment key={phone.tel}>
                    {i > 0 && " , "}
                    <a href={`tel:${phone.tel}`} className="whitespace-nowrap transition hover:text-[#E79E3F]">
                      {phone.label}
                    </a>
                  </Fragment>
                ))}
              </p>
            </div>
          </section>
        </div>

        {/* Row 2, left. */}
        <section className="hidden pt-6 sm:block lg:col-start-1 lg:row-start-2">
          <h2 className="text-sm text-white sm:text-base">Easy Connect</h2>
          <ul className="mt-4 flex flex-wrap gap-6">
            {SOCIALS.map(({ href, label, icon: Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  aria-label={label}
                  title={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-white transition hover:text-[#E79E3F]"
                >
                  <Icon className="size-6" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* Right column, both rows. The form sits straight on the page: no card, border or padding. */}
        <ContactForm
          services={services.map(({ id, title }) => ({ id, title }))}
          className="mt-12 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:grid lg:grid-rows-subgrid"
        />
      </div>
    </div>

    {/* "Give us a visit": the map on the left, with the right third kept empty
        for now (2:1). On phones the map takes the full width. */}
    <section aria-labelledby="visit-heading" className="site-container pb-14 lg:pb-20">
      <h2
        id="visit-heading"
        className="text-center text-[26px] leading-[1.1] font-light tracking-[-0.02em] text-white sm:text-4xl lg:text-[40px]"
      >
        Give us a visit
      </h2>
      <div className="mt-8 grid gap-3 sm:grid-cols-[2fr_1fr] lg:mt-12">
        <div className="aspect-4/3 overflow-hidden rounded-md border border-white/10 bg-neutral-900 sm:aspect-5/2">
          {/* Google's embed has no dark mode, so the filter makes one: invert
              turns the light map dark with light labels, and the hue rotation
              puts the colours back to roughly what they were. */}
          <iframe
            src={MAP_EMBED_URL}
            title="Map showing ISS BASE, Lalitpur"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            className="size-full border-0 [filter:invert(0.9)_hue-rotate(180deg)_grayscale(0.4)_contrast(0.95)]"
          />
        </div>
        {/* Deliberately empty. */}
        <div aria-hidden className="hidden sm:block" />
      </div>
    </section>
    </>
  );
}
