import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./baseQuery";

// The single RTK Query API slice. Each feature adds its endpoints with
// `api.injectEndpoints(...)` (see features/*), so they all share one cache —
// which matters here because services and projects embed each other and a
// write to one must refresh the other.
export const api = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: ["Me", "Service", "Project", "EventType", "TeamMember", "Department", "Blog", "Testimonial", "Client", "Inquiry", "UpcomingEvent"],
  endpoints: () => ({}),
});

// ── Shared response shapes / helpers ────────────────────────────────────────

/** iss-be wraps every success in `{ status, message, data }`. */
export interface Envelope<T> {
  status: "success";
  message: string;
  data: T;
}

export const unwrapData = <T>(response: Envelope<T>): T => response.data;

export interface Paginated<T> {
  items: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

/** Normalised admin list: same shape whether or not the endpoint paginates. */
export interface ListResult<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ListArgs {
  page?: number;
  limit?: number;
}

export const toListResult = <T>(response: Envelope<T[] | Paginated<T>>): ListResult<T> => {
  const data = response.data;
  if (Array.isArray(data)) {
    return { items: data, total: data.length, page: 1, totalPages: 1 };
  }
  return {
    items: data.items,
    total: data.pagination.total,
    page: data.pagination.page,
    totalPages: Math.max(1, data.pagination.totalPages),
  };
};

/** Option for relation pickers (project ↔ service). */
export interface RelationOption {
  id: string;
  title: string;
  isActive?: boolean;
}

/** Body for create/update — built generically by the admin form. */
export type Body = Record<string, unknown>;

/** Body (+ File values) → multipart form. null/undefined are left out. */
export const toMultipart = (body: Body): FormData => {
  const form = new FormData();
  for (const [key, value] of Object.entries(body)) {
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) value.forEach((item) => form.append(key, String(item)));
    else form.append(key, value instanceof File ? value : String(value));
  }
  return form;
};

export const imageForm = (field: string, files: File | File[]): FormData => {
  const form = new FormData();
  for (const file of Array.isArray(files) ? files : [files]) form.append(field, file);
  return form;
};
