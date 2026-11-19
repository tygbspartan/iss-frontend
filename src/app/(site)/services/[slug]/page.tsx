import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CornerDownRight } from "lucide-react";
import type { Service } from "@/lib/admin/types";
import { getProjects, getServices } from "@/lib/publicApi";
import { pageMetadata } from "@/lib/seo";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { DropIn } from "@/components/site/DropIn";
import { GoldHeading } from "@/components/site/GoldHeading";
import { PAGE_SHELL, PageHeader, SUBHEADING } from "@/components/site/PageHeader";
import { ParallaxImage } from "@/components/site/ParallaxImage";
import { PROJECT_GRID, ProjectCard } from "@/components/site/ProjectCard";
import { PILL_BUTTON } from "@/components/site/pill";

const BEST_WORK_COUNT = 3;

/** The service with this slug (only those shown on the website), or undefined. */
async function findService(slug: string): Promise<{ service?: Service; all: Service[] }> {
  const all = await getServices().catch(() => []);
  return { service: all.find((item) => item.slug === slug), all };
}

// Search engines and link previews: the service's own name, description and photo.
export async function generateMetadata({ params }: PageProps<"/services/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { service } = await findService(slug);
  if (!service) return { title: "Service not found", robots: { index: false } };

  const description =
    service.description.length > 155 ? `${service.description.slice(0, 152).trimEnd()}…` : service.description;
  return pageMetadata({ title: service.title, description, path: `/services/${service.slug}`, image: service.image });
}

// One service: its name and description, a wide photo, what it includes (the
// list set in the admin), the newest projects done for it, and links to every
// other service.
export default async function ServicePage({ params }: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  const { service, all } = await findService(slug);
  if (!service) notFound();

  const others = all.filter((item) => item.id !== service.id);
  const projects = await getProjects({ service: service.slug, limit: BEST_WORK_COUNT })
    .then((result) => result.items)
    .catch(() => []);

  // Structured data so search engines know this page describes a service and who offers it.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.description,
    image: service.image,
    url: `${SITE_URL}/services/${service.slug}`,
    areaServed: { "@type": "Country", name: "Nepal" },
    provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL, logo: `${SITE_URL}/icon.png` },
  };

  return (
    <div className={PAGE_SHELL}>
      <script
        type="application/ld+json"
        // Escape "<" so the JSON can't close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <PageHeader title={service.title} intro={service.description} />

      {/* The banner is a wide, short window onto the service's photo, which is
          taller than it: the photo slides up behind the window as you scroll. */}
      <ParallaxImage
        src={service.image}
        alt={service.title}
        className="mx-auto mt-10 aspect-[842/300] max-w-[1680px] rounded-2xl border border-white/10 bg-neutral-900 sm:aspect-[842/220] lg:mt-12 lg:aspect-[842/200]"
      />

      {/* What's included: numbered, two columns from tablet width up (one on
          phones), then a way to ask about it. Left out if the list is empty. */}
      {service.features.length > 0 && (
        <section aria-labelledby="included" className="mt-14 text-center lg:mt-20">
          <GoldHeading id="included" className={SUBHEADING}>
            What&rsquo;s Included
          </GoldHeading>
          <ul className="mx-auto mt-8 grid max-w-[980px] gap-x-12 text-left sm:grid-cols-2 lg:mt-10">
            {service.features.map((feature, i) => (
              <li key={`${i}-${feature}`} className="flex items-baseline gap-4 border-t border-white/10 py-4 sm:py-5">
                <span className="w-5 shrink-0 font-poppins text-xs text-[#E79E3F] tabular-nums sm:w-6 sm:text-sm">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm text-white sm:text-lg">{feature}</span>
              </li>
            ))}
          </ul>
          <Link href="/contact" className={`mt-10 ${PILL_BUTTON}`}>
            Talk to us about it
          </Link>
        </section>
      )}

      {projects.length > 0 && (
        <section aria-labelledby="best-work" className="mt-20 lg:mt-28">
          <GoldHeading id="best-work" className={SUBHEADING}>
            Our Best Work, So Far
          </GoldHeading>
          <ul className={`mt-8 lg:mt-10 ${PROJECT_GRID}`}>
            {projects.map((project) => (
              <li key={project.id}>
                <ProjectCard
                  title={project.title}
                  image={project.image}
                  description={project.description}
                  href={`/projects?service=${encodeURIComponent(service.slug)}`}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {others.length > 0 && (
        <section aria-labelledby="other-services" className="mt-20 text-center lg:mt-28">
          <GoldHeading id="other-services" className={SUBHEADING}>
            Other Services
          </GoldHeading>
          <p className="mt-3 font-poppins text-xs text-[#9DA1B1] sm:text-lg">Explore the rest of what we do.</p>
          <nav aria-label="Other services" className="mt-10 flex justify-center">
            {/* The links drop into place one by one when they come into view. */}
            <DropIn className="grid gap-x-16 gap-y-4 text-left sm:grid-cols-2">
              {others.map((other) => (
                <Link
                  key={other.id}
                  href={`/services/${other.slug}`}
                  className="group inline-flex items-center gap-3 rounded-sm text-xs text-white capitalize sm:text-base outline-offset-4 transition-colors hover:text-[#E79E3F] focus-visible:outline-2 focus-visible:outline-white sm:text-lg"
                >
                  <CornerDownRight
                    aria-hidden
                    strokeWidth={1.5}
                    className="size-5 shrink-0 text-[#9DA1B1] transition-colors group-hover:text-[#E79E3F]"
                  />
                  {other.title}
                </Link>
              ))}
            </DropIn>
          </nav>
        </section>
      )}
    </div>
  );
}
