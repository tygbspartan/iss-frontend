import type { Paginated } from "@/lib/redux/api";
import type { Project, Service } from "@/lib/admin/types";

// Stand-in projects so the Projects page, its service filter and its
// pagination can be tried out while developing, before any real projects exist
// in the admin. DEVELOPMENT ONLY — see `getProjects` in publicApi.ts, which
// only calls this in development and only when the backend has no projects.
//
// 100 of them, dealt out evenly across the real services, so "All" runs to
// several pages (enough to show the "…" in the pagination) and each service's
// filter runs to two.
const SAMPLE_COUNT = 100;
const SAMPLE_IMAGES = ["/about/lakhe-dance.png", "/about/champions.png", "/about/concert.png", "/hero-crowd.png"];

export function devSampleProjects(
  services: Service[],
  { service, page, limit }: { service?: string; page: number; limit: number },
): Paginated<Project> {
  const all: Project[] = Array.from({ length: SAMPLE_COUNT }, (_, i) => {
    const owner = services.length > 0 ? services[i % services.length] : undefined;
    return {
      id: `sample-project-${i + 1}`,
      title: `Sample Project ${i + 1}${owner ? ` · ${owner.title}` : ""}`,
      slug: `sample-project-${i + 1}`,
      description: "A sample project, shown only while developing.",
      image: SAMPLE_IMAGES[i % SAMPLE_IMAGES.length],
      thumbnails: [],
      isActive: true,
      services: owner ? [{ id: owner.id, title: owner.title, slug: owner.slug }] : [],
      createdAt: "",
      updatedAt: "",
    };
  });

  const matching = service ? all.filter((project) => project.services?.some((s) => s.slug === service)) : all;
  return {
    items: matching.slice((page - 1) * limit, page * limit),
    pagination: { page, limit, total: matching.length, totalPages: Math.ceil(matching.length / limit) },
  };
}
