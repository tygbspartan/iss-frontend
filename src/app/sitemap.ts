import type { MetadataRoute } from "next";
import { getBlogs, getServices } from "@/lib/publicApi";
import { SITE_URL } from "@/lib/site";

// Served at /sitemap.xml: the list of pages search engines should know about.
// Submit that address once in Google Search Console; after that Google
// re-reads it by itself. Rebuilt at most once an hour, so a new blog post is
// listed without a redeploy.
//
// Addresses are built from NEXT_PUBLIC_SITE_URL — it must be the real domain
// in production, or every address in here will be wrong.
export const revalidate = 3600;

// The fixed pages, most important first. `priority` (0–1) and
// `changeFrequency` are hints to search engines, not rules. Leave a page out
// of here only if it shouldn't be found through search.
const PAGES: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" | "yearly" }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/projects", priority: 0.9, changeFrequency: "weekly" },
  { path: "/about", priority: 0.8, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.8, changeFrequency: "yearly" },
  { path: "/blogs", priority: 0.7, changeFrequency: "weekly" },
  { path: "/teams", priority: 0.6, changeFrequency: "monthly" },
];

const BLOGS_PER_REQUEST = 50; // the most the backend returns in one go
const MAX_BLOG_REQUESTS = 40; // safety stop: 2,000 posts

/** Every published blog post, with the date it was last changed. Empty if the backend can't be reached. */
async function blogEntries(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  try {
    for (let page = 1; page <= MAX_BLOG_REQUESTS; page++) {
      const { items, pagination } = await getBlogs(page, BLOGS_PER_REQUEST);
      for (const blog of items) {
        entries.push({
          url: `${SITE_URL}/blogs/${blog.slug}`,
          lastModified: new Date(blog.updatedAt),
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }
      if (page >= pagination.totalPages) break;
    }
  } catch (error) {
    // Still serve the fixed pages (and any posts read so far).
    console.error("Sitemap: blog posts could not be loaded:", (error as Error).message);
  }
  return entries;
}

/** A page for every service shown on the website. Empty if the backend can't be reached. */
async function serviceEntries(): Promise<MetadataRoute.Sitemap> {
  const services = await getServices().catch((error: Error) => {
    console.error("Sitemap: services could not be loaded:", error.message);
    return [];
  });
  return services.map((service) => ({
    url: `${SITE_URL}/services/${service.slug}`,
    lastModified: new Date(service.updatedAt),
    changeFrequency: "monthly",
    priority: 0.9,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = PAGES.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    changeFrequency,
    priority,
  }));
  const [services, blogs] = await Promise.all([serviceEntries(), blogEntries()]);
  return [...pages, ...services, ...blogs];
}
