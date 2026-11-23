import type { Metadata } from "next";
import Link from "next/link";
import { X } from "lucide-react";
import type { EventType, Project, Service } from "@/lib/admin/types";
import type { Paginated } from "@/lib/redux/api";
import { getEventTypes, getProjects, getServices, PROJECTS_PER_PAGE } from "@/lib/publicApi";
// import { DropIn } from "@/components/site/DropIn"; // see "DROP-IN ANIMATION" below
import {
  EmptyNotice,
  PAGE_SHELL,
  PageHeader,
} from "@/components/site/PageHeader";
import { Pagination } from "@/components/site/Pagination";
import {
  FILTER_PILL,
  FILTER_PILL_OFF,
  FILTER_PILL_ON,
  FILTER_ROW,
  PROJECT_GRID,
  ProjectCard,
} from "@/components/site/ProjectCard";
import { pageMetadata } from "@/lib/seo";

interface Filters {
  type?: string; // event type slug — the filter pills
  service?: string; // service slug — from a service's "View projects" link
}

// Address of the listing for a set of filters and a page number. Page 1 and
// "no filter" are left out so each view has one clean address.
const listingHref = ({ type, service }: Filters, page: number) => {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  if (service) params.set("service", service);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/projects?${query}` : "/projects";
};

const pageNumber = (value: unknown) =>
  Math.max(1, Number.parseInt(String(value ?? "1"), 10) || 1);
const slugParam = (value: unknown) =>
  typeof value === "string" && value ? value : undefined;

// Each filter, and each page of the list, gets its own title, description and
// canonical address.
export async function generateMetadata({
  searchParams,
}: PageProps<"/projects">): Promise<Metadata> {
  const params = await searchParams;
  const page = pageNumber(params.page);
  const typeSlug = slugParam(params.type);
  const serviceSlug = slugParam(params.service);
  const [types, services] = await Promise.all([
    typeSlug ? getEventTypes().catch(() => []) : [],
    serviceSlug ? getServices().catch(() => []) : [],
  ]);
  const type = types.find((item) => item.slug === typeSlug);
  const service = services.find((item) => item.slug === serviceSlug);

  const name = type ? type.name : service ? `${service.title} Projects` : "Projects";
  return pageMetadata({
    title: page > 1 ? `${name} – Page ${page}` : name,
    description: type
      ? `${type.name} produced by ISS Nepal — the sound, lighting and stage production behind them.`
      : service
        ? `${service.title} by ISS Nepal — browse the events we've delivered it for across Nepal.`
        : "Concerts, award shows, conferences and corporate events produced by ISS Nepal — browse our recent sound, lighting and stage projects across Nepal.",
    path: listingHref({ type: type?.slug, service: service?.slug }, page),
  });
}

// Projects, like the home page's "Our Recent Works" but the full list: filter
// by event type with the pills, 12 per page. A service's "View projects" link
// adds a service filter on top, shown as a chip that can be cleared.
export default async function ProjectsPage({
  searchParams,
}: PageProps<"/projects">) {
  const params = await searchParams;
  const page = pageNumber(params.page);
  const type = slugParam(params.type);
  const service = slugParam(params.service);

  let types: EventType[] = [];
  let services: Service[] = [];
  let result: Paginated<Project> | null = null;
  try {
    [types, services, result] = await Promise.all([
      getEventTypes(),
      service ? getServices() : Promise.resolve([]),
      getProjects({ type, service, page, limit: PROJECTS_PER_PAGE }),
    ]);
  } catch {
    // Backend unreachable: still render the page, with a notice instead of cards.
  }
  const projects = result?.items ?? [];
  // Only types with visible projects get a pill (plus the selected one, so it
  // never disappears from under you).
  const pills = types.filter((item) => (item._count?.projects ?? 0) > 0 || item.slug === type);
  const activeType = types.find((item) => item.slug === type);
  const activeService = services.find((item) => item.slug === service);

  return (
    <div className={PAGE_SHELL}>
      <PageHeader
        title="Our Projects"
        intro="A look at the events we’ve brought to life — concerts, award shows, conferences and corporate nights. Pick a type of event to see the work behind it."
      />

      {pills.length > 0 && (
        <nav aria-label="Filter projects by type of event" className="mt-8 lg:mt-10">
          {/* DROP-IN ANIMATION — switched off for now, kept for possible later
              use. To bring it back (pills dropping into place one by one when
              the page opens): uncomment the DropIn import at the top, and swap
              this <div …> and its closing </div> for the two commented lines.
          <DropIn className={FILTER_ROW}> */}
          <div className={FILTER_ROW}>
            <Link
              href={listingHref({ service }, 1)}
              aria-current={!type ? "true" : undefined}
              className={`${FILTER_PILL} ${!type ? FILTER_PILL_ON : FILTER_PILL_OFF}`}
            >
              All
            </Link>
            {pills.map((item) => (
              <Link
                key={item.id}
                href={listingHref({ type: item.slug, service }, 1)}
                aria-current={item.slug === type ? "true" : undefined}
                className={`${FILTER_PILL} ${item.slug === type ? FILTER_PILL_ON : FILTER_PILL_OFF}`}
              >
                {item.name}
              </Link>
            ))}
          </div>
          {/* </DropIn> */}
        </nav>
      )}

      {activeService && (
        <p className="mt-5 flex justify-center">
          <Link
            href={listingHref({ type }, 1)}
            className="inline-flex items-center gap-2 rounded-full border border-[#E79E3F]/50 px-3.5 py-1 text-xs text-[#E79E3F] transition-colors hover:bg-[#E79E3F]/10 sm:text-sm"
          >
            Service: {activeService.title}
            <X className="size-3.5" aria-hidden />
            <span className="sr-only">— show all services</span>
          </Link>
        </p>
      )}

      {projects.length === 0 ? (
        <EmptyNotice>
          {!result
            ? "The projects couldn't be loaded right now."
            : page > 1
              ? "There are no projects on this page."
              : activeType || activeService
                ? `Projects for ${[activeType?.name, activeService?.title].filter(Boolean).join(" — ")} will be added here soon.`
                : "Projects will be added here soon."}
        </EmptyNotice>
      ) : (
        <>
          <ul className={`mt-8 lg:mt-10 ${PROJECT_GRID}`}>
            {projects.map((project) => (
              <li key={project.id}>
                <ProjectCard title={project.title} image={project.image} />
              </li>
            ))}
          </ul>
          {result && (
            <Pagination
              label="Project pages"
              page={result.pagination.page}
              totalPages={result.pagination.totalPages}
              hrefFor={(p) => listingHref({ type, service }, p)}
            />
          )}
        </>
      )}
    </div>
  );
}
