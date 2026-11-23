import type { Envelope, Paginated } from "@/lib/redux/api";
import type { Blog, Client, Department, EventType, Project, Service, TeamMember, Testimonial, UpcomingEvent } from "@/lib/admin/types";
import { mockBlogBySlug, mockGet, USE_MOCK_DATA } from "@/lib/mock";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// Server-side reads for the public website. Pages render on the server (good
// for SEO) and are regenerated in the background at most once a minute, so
// admin edits show up shortly after they're saved.
const REVALIDATE_SECONDS = 60;

async function getPublic<T>(path: string): Promise<T> {
  if (USE_MOCK_DATA) return mockGet(path) as T;
  const res = await fetch(`${API_URL}${path}`, { next: { revalidate: REVALIDATE_SECONDS } });
  if (!res.ok) throw new Error(`GET ${path} failed with ${res.status}`);
  const body = (await res.json()) as Envelope<T>;
  return body.data;
}

/**
 * Every visible team member, each with its `department`. Already sorted:
 * departments in their display order, then members in theirs.
 */
export const getTeam = () => getPublic<TeamMember[]>("/api/team");

/** All departments, in display order. */
export const getDepartments = () => getPublic<Department[]>("/api/departments");

export const BLOGS_PER_PAGE = 12;

/** One page of published blog posts, newest first. */
export const getBlogs = (page = 1, limit = BLOGS_PER_PAGE) =>
  getPublic<Paginated<Blog>>(`/api/blogs?page=${page}&limit=${limit}`);

/** Visible services, in display order. */
export const getServices = () => getPublic<Service[]>("/api/services");

/** Event types in display order, each with how many visible projects it has. */
export const getEventTypes = () => getPublic<EventType[]>("/api/event-types");

/** Visible testimonials, in display order. */
export const getTestimonials = () => getPublic<Testimonial[]>("/api/testimonials");

/** Active events that haven't passed yet, soonest first. */
export const getUpcomingEvents = () => getPublic<UpcomingEvent[]>("/api/upcoming-events");

/** Visible clients (name + logo), in display order. */
export const getClients = () => getPublic<Client[]>("/api/clients");

/** One published post with its Markdown content, or null if there is no such post. */
export async function getBlogBySlug(slug: string): Promise<Blog | null> {
  if (USE_MOCK_DATA) return mockBlogBySlug(slug);
  const res = await fetch(`${API_URL}/api/blogs/slug/${encodeURIComponent(slug)}`, {
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET blog "${slug}" failed with ${res.status}`);
  return ((await res.json()) as Envelope<Blog>).data;
}

export const PROJECTS_PER_PAGE = 12;

/** One page of visible projects, newest first, optionally only those for one service and/or event type (by slug). */
export async function getProjects({
  service,
  type,
  page = 1,
  limit = PROJECTS_PER_PAGE,
}: { service?: string; type?: string; page?: number; limit?: number } = {}): Promise<Paginated<Project>> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (service) params.set("service", service);
  if (type) params.set("type", type);
  return getPublic<Paginated<Project>>(`/api/projects?${params}`);
}
