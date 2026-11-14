import type { Envelope } from "@/lib/redux/api";
import { mockGet, USE_MOCK_DATA } from "@/lib/mock";

// Latest posts from the company's Instagram account, for the home page feed.
//
// The website doesn't talk to Instagram itself and holds no access token: it
// asks the backend (iss-be), which keeps the token in its database, renews it
// automatically before it can expire, and fetches the posts. See
// iss-be/src/services/instagram.service.ts.

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// Instagram's image links are temporary, so the list is re-read every half hour.
const REVALIDATE_SECONDS = 30 * 60;

export interface InstagramPost {
  id: string;
  image: string;
  href: string; // the post on instagram.com
  caption: string;
  isVideo: boolean;
}

export interface InstagramFeedData {
  /** Whether the backend has an Instagram access token at all. */
  configured: boolean;
  /** Newest first. Empty if not configured, or if Instagram couldn't be reached. */
  posts: InstagramPost[];
}

/** The newest `limit` posts. Throws if the backend can't be reached. */
export async function getInstagramFeed(limit = 6): Promise<InstagramFeedData> {
  if (USE_MOCK_DATA) return mockGet(`/api/instagram?limit=${limit}`) as InstagramFeedData;
  const res = await fetch(`${API_URL}/api/instagram?limit=${limit}`, { next: { revalidate: REVALIDATE_SECONDS } });
  if (!res.ok) throw new Error(`GET /api/instagram failed with ${res.status}`);
  return ((await res.json()) as Envelope<InstagramFeedData>).data;
}
