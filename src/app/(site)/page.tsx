import { Hero } from "@/components/site/home/Hero";
import { RecentWorks } from "@/components/site/home/RecentWorks";
import { ServicesShowcase } from "@/components/site/home/ServicesShowcase";
import { Stats } from "@/components/site/home/Stats";
import { Testimonials } from "@/components/site/home/Testimonials";
import { InstagramFeed } from "@/components/site/home/InstagramFeed";
import { Clients } from "@/components/site/home/Clients";
import { UpcomingEvents } from "@/components/site/home/UpcomingEvents";
import { getUpcomingEvents } from "@/lib/publicApi";
import type { Metadata } from "next";
import { CONTACT, SITE_DESCRIPTION, SITE_NAME, SITE_URL, SOCIAL_LINKS } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: `${SITE_NAME} | Sound, Lighting & Stage Production in Nepal`,
  absoluteTitle: true,
  description: SITE_DESCRIPTION,
  path: "/",
});

// Structured data Google reads for the site name and logo in search results.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: SITE_NAME, url: SITE_URL },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icon.png`,
      email: CONTACT.email,
      telephone: CONTACT.phones[0].tel,
      address: { "@type": "PostalAddress", streetAddress: CONTACT.address, addressCountry: "NP" },
      sameAs: [SOCIAL_LINKS.instagram, SOCIAL_LINKS.tiktok, SOCIAL_LINKS.facebook],
    },
  ],
};

export default async function HomePage() {
  // If there are none, or the backend can't be reached, the popup is left out.
  const upcomingEvents = await getUpcomingEvents().catch(() => []);

  return (
    <>
      <script
        type="application/ld+json"
        // Escape "<" so the JSON can't close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      {/* Hero → content "curtain": the hero is pinned (sticky) inside a box two
          screens tall, and the rest of the page is pulled up by one screen so it
          starts right below the hero and slides over it as you scroll. The
          negative top margin tucks the hero under the navbar (its height). */}
      <div className="-mt-20 h-[200svh] lg:-mt-29.5">
        <Hero />
      </div>
      <div className="relative z-10 -mt-[100svh] bg-[image:var(--site-gradient)]">
        {/* Soft leading edge instead of a hard line: a strip of the same
            background sitting just above the panel, fading from see-through
            at its top to solid where it meets the panel. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-full h-24 bg-[image:var(--site-gradient)] [mask-image:linear-gradient(to_bottom,transparent,black)] lg:h-32"
        />
        <RecentWorks />
        <ServicesShowcase />
        <Stats />
        <Testimonials />
        <InstagramFeed />
        <Clients />
      </div>
      {upcomingEvents.length > 0 && <UpcomingEvents events={upcomingEvents} />}
    </>
  );
}
