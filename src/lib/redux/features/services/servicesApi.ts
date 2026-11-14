import {
  api,
  imageForm,
  toMultipart,
  toListResult,
  unwrapData,
  type Body,
  type Envelope,
  type ListArgs,
  type ListResult,
  type RelationOption,
} from "../../api";
import type { Service } from "@/lib/admin/types";

// Writes to services also refresh projects: project responses embed their
// services, and service ↔ project links can change from either side.
const INVALIDATES = ["Service", "Project"] as const;

export const servicesApi = api.injectEndpoints({
  endpoints: (build) => ({
    // ── Public (website) ──
    getServices: build.query<Service[], void>({
      query: () => "/api/services",
      transformResponse: unwrapData<Service[]>,
      providesTags: ["Service"],
    }),
    getServiceBySlug: build.query<Service, string>({
      query: (slug) => `/api/services/slug/${encodeURIComponent(slug)}`,
      transformResponse: unwrapData<Service>,
      providesTags: ["Service"],
    }),

    // ── Admin ──
    getAdminServices: build.query<ListResult<Service>, ListArgs>({
      query: (params) => ({ url: "/api/services/admin/all", params }),
      transformResponse: toListResult<Service>,
      providesTags: ["Service"],
    }),
    getServiceOptions: build.query<RelationOption[], void>({
      query: () => "/api/services/admin/all",
      transformResponse: (r: Envelope<Service[]>) =>
        r.data.map(({ id, title, isActive }) => ({ id, title, isActive })),
      providesTags: ["Service"],
    }),
    getService: build.query<Service, string>({
      query: (id) => `/api/services/${id}`,
      transformResponse: unwrapData<Service>,
      providesTags: ["Service"],
    }),
    createService: build.mutation<Service, Body>({
      // Multipart: the image is required and travels with the fields (body.image is a File).
      query: (body) => ({ url: "/api/services", method: "POST", body: toMultipart(body) }),
      transformResponse: unwrapData<Service>,
      invalidatesTags: [...INVALIDATES],
    }),
    updateService: build.mutation<Service, { id: string; body: Body }>({
      query: ({ id, body }) => ({ url: `/api/services/${id}`, method: "PATCH", body }),
      transformResponse: unwrapData<Service>,
      invalidatesTags: [...INVALIDATES],
    }),
    deleteService: build.mutation<void, string>({
      query: (id) => ({ url: `/api/services/${id}`, method: "DELETE" }),
      invalidatesTags: [...INVALIDATES],
    }),
    uploadServiceImage: build.mutation<Service, { id: string; file: File }>({
      query: ({ id, file }) => ({ url: `/api/services/${id}/image`, method: "POST", body: imageForm("image", file) }),
      transformResponse: unwrapData<Service>,
      invalidatesTags: [...INVALIDATES],
    }),
  }),
});

export const {
  useGetServicesQuery,
  useGetServiceBySlugQuery,
  useGetAdminServicesQuery,
  useGetServiceOptionsQuery,
  useGetServiceQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
  useUploadServiceImageMutation,
} = servicesApi;
