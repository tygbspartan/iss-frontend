import type { Paginated } from "@/lib/redux/api";
import type { InstagramFeedData } from "@/lib/instagram";
import { MOCK_BLOGS, MOCK_CLIENTS, MOCK_DEPARTMENTS, MOCK_EVENT_TYPES, MOCK_EVENTS, MOCK_INSTAGRAM, MOCK_PROJECTS, MOCK_SERVICES, MOCK_TEAM, MOCK_TESTIMONIALS } from "./data";

export { USE_MOCK_DATA } from "./flag";

function paginate<T>(all: T[], params: URLSearchParams): Paginated<T> {
  const page = Math.max(1, Number(params.get("page")) || 1);
  const limit = Math.max(1, Number(params.get("limit")) || 12);
  return {
    items: all.slice((page - 1) * limit, page * limit),
    pagination: { page, limit, total: all.length, totalPages: Math.max(1, Math.ceil(all.length / limit)) },
  };
}

/** What the backend would answer to `GET <path>` (path includes the query). */
export function mockGet(path: string): unknown {
  const url = new URL(path, "http://mock");
  const params = url.searchParams;

  switch (url.pathname) {
    case "/api/services":
      return MOCK_SERVICES;
    case "/api/departments":
      return MOCK_DEPARTMENTS;
    case "/api/team":
      return params.get("core") === "true" ? MOCK_TEAM.filter((m) => m.department.isCore) : MOCK_TEAM;
    case "/api/event-types":
      return MOCK_EVENT_TYPES;
    case "/api/projects": {
      const service = params.get("service");
      const type = params.get("type");
      const matching = MOCK_PROJECTS.filter(
        (p) => (!service || p.services?.some((s) => s.slug === service)) && (!type || p.eventType?.slug === type),
      );
      return paginate(matching, params);
    }
    case "/api/blogs":
      // Lists leave out the full article, like the real endpoint.
      return paginate(
        MOCK_BLOGS.map((blog) => ({ ...blog, content: undefined })),
        params,
      );
    case "/api/testimonials":
      return MOCK_TESTIMONIALS;
    case "/api/clients":
      return MOCK_CLIENTS;
    case "/api/upcoming-events":
      return MOCK_EVENTS;
    case "/api/instagram":
      return {
        configured: true,
        posts: MOCK_INSTAGRAM.slice(0, Number(params.get("limit")) || 9),
      } satisfies InstagramFeedData;
  }
  throw new Error(`No mock data for GET ${path}`);
}

/** One blog post with its article, or null — like GET /api/blogs/slug/:slug. */
export const mockBlogBySlug = (slug: string) => MOCK_BLOGS.find((blog) => blog.slug === slug) ?? null;
