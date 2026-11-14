import type { Metadata } from "next";
import Link from "next/link";
import type { Project, Service } from "@/lib/admin/types";
import type { Paginated } from "@/lib/redux/api";
import { getProjects, getServices, PROJECTS_PER_PAGE } from "@/lib/publicApi";
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

// Address of the listing for a service filter (none = all) and page number.
// Page 1 and "all" are left out so each view has one clean address.
const listingHref = (service: string | undefined, page: number) => {
  const params = new URLSearchParams();
  if (service) params.set("service", service);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/projects?${query}` : "/projects";
};

const pageNumber = (value: unknown) =>
  Math.max(1, Number.parseInt(String(value ?? "1"), 10) || 1);
const serviceSlug = (value: unknown) =>
  typeof value === "string" && value ? value : undefined;

// Each service filter, and each page of the list, gets its own title,
// description and canonical address.
export async function generateMetadata({
  searchParams,
}: PageProps<"/projects">): Promise<Metadata> {
  const params = await searchParams;
  const page = pageNumber(params.page);
  const slug = serviceSlug(params.service);
  const service = slug
    ? (await getServices().catch(() => [])).find((item) => item.slug === slug)
    : undefined;

  const name = service ? `${service.title} Projects` : "Projects";
  return pageMetadata({
    title: page > 1 ? `${name} – Page ${page}` : name,
    description: service
      ? `${service.title} produced by ISS Nepal — browse our sound, lighting and stage production work for ${service.title.toLowerCase()} across Nepal.`
      : "Concerts, festivals, weddings and corporate events produced by ISS Nepal — browse our recent sound, lighting and stage projects across Nepal.",
    path: listingHref(service?.slug, page),
  });
}

// Projects, like the home page's "Our Recent Works" but the full list: filter
// by service with the pills, 12 per page.
export default async function ProjectsPage({
  searchParams,
}: PageProps<"/projects">) {
  const { page: pageParam, service: serviceParam } = await searchParams;
  const page = pageNumber(pageParam);
  const service = serviceSlug(serviceParam);

  let services: Service[] = [];
  let result: Paginated<Project> | null = null;
  try {
    [services, result] = await Promise.all([
      getServices(),
      getProjects({ service, page, limit: PROJECTS_PER_PAGE }),
    ]);
  } catch {
    // Backend unreachable: still render the page, with a notice instead of cards.
  }
  const projects = result?.items ?? [];
  const activeService = services.find((item) => item.slug === service);

  return (
    <div className={PAGE_SHELL}>
      <PageHeader
        title="Our Projects"
        intro="A look at the events we’ve brought to life — concerts, festivals, weddings and corporate nights. Pick a service to see the work behind it."
      />

      {services.length > 0 && (
        <nav aria-label="Filter projects by service" className="mt-8 lg:mt-10">
          {/* DROP-IN ANIMATION — switched off for now, kept for possible later
              use. To bring it back (pills dropping into place one by one when
              the page opens): uncomment the DropIn import at the top, and swap
              this <div …> and its closing </div> for the two commented lines.
          <DropIn className={FILTER_ROW}> */}
          <div className={FILTER_ROW}>
            <Link
              href={listingHref(undefined, 1)}
              aria-current={!service ? "true" : undefined}
              className={`${FILTER_PILL} ${!service ? FILTER_PILL_ON : FILTER_PILL_OFF}`}
            >
              All
            </Link>
            {services.map((item) => (
              <Link
                key={item.id}
                href={listingHref(item.slug, 1)}
                aria-current={item.slug === service ? "true" : undefined}
                className={`${FILTER_PILL} ${item.slug === service ? FILTER_PILL_ON : FILTER_PILL_OFF}`}
              >
                {item.title}
              </Link>
            ))}
          </div>
          {/* </DropIn> */}
        </nav>
      )}

      {projects.length === 0 ? (
        <EmptyNotice>
          {!result
            ? "The projects couldn't be loaded right now."
            : page > 1
              ? "There are no projects on this page."
              : activeService
                ? `Projects for ${activeService.title} will be added here soon.`
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
              hrefFor={(p) => listingHref(service, p)}
            />
          )}
        </>
      )}
    </div>
  );
}
