import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { USE_MOCK_DATA } from "@/lib/mock/flag";

// Served at /robots.txt: tells search engines what they may crawl and where
// the sitemap is. Search engines read it by themselves — it isn't submitted
// anywhere. Everything public is allowed; the admin panel is kept out (its
// pages also carry "noindex", and it needs a login anyway).
export default function robots(): MetadataRoute.Robots {
  // A demo deployment with made-up content is kept out of search engines entirely.
  if (USE_MOCK_DATA) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/admin" },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
