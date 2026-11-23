import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
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
  type Paginated,
  type RelationOption,
} from "../../api";
import type { Project } from "@/lib/admin/types";

// Writes to projects also refresh services (see servicesApi).
// Event types count their projects, so project writes refresh them too.
const INVALIDATES = ["Project", "Service", "EventType"] as const;

export interface PublicProjectArgs {
  page?: number;
  limit?: number;
  service?: string; // service slug filter
}

export const projectsApi = api.injectEndpoints({
  endpoints: (build) => ({
    // ── Public (website) ──
    getProjects: build.query<Paginated<Project>, PublicProjectArgs | void>({
      query: (params) => ({ url: "/api/projects", params: params ?? undefined }),
      transformResponse: unwrapData<Paginated<Project>>,
      providesTags: ["Project"],
    }),
    getProjectBySlug: build.query<Project, string>({
      query: (slug) => `/api/projects/slug/${encodeURIComponent(slug)}`,
      transformResponse: unwrapData<Project>,
      providesTags: ["Project"],
    }),

    // ── Admin ──
    getAdminProjects: build.query<ListResult<Project>, ListArgs>({
      query: (params) => ({ url: "/api/projects/admin/all", params }),
      transformResponse: toListResult<Project>,
      providesTags: ["Project"],
    }),
    // Every project (all pages) for the service form's relation picker.
    getProjectOptions: build.query<RelationOption[], void>({
      async queryFn(_arg, _api, _extra, baseQuery) {
        const options: RelationOption[] = [];
        for (let page = 1, totalPages = 1; page <= totalPages; page++) {
          const res = await baseQuery({ url: "/api/projects/admin/all", params: { page, limit: 50 } });
          if (res.error) return { error: res.error as FetchBaseQueryError };
          const data = (res.data as Envelope<Paginated<Project>>).data;
          totalPages = data.pagination.totalPages;
          options.push(...data.items.map(({ id, title, isActive }) => ({ id, title, isActive })));
        }
        return { data: options };
      },
      providesTags: ["Project"],
    }),
    getProject: build.query<Project, string>({
      query: (id) => `/api/projects/${id}`,
      transformResponse: unwrapData<Project>,
      providesTags: ["Project"],
    }),
    createProject: build.mutation<Project, Body>({
      // Multipart: the image is required and travels with the fields (body.image is a File).
      query: (body) => ({ url: "/api/projects", method: "POST", body: toMultipart(body) }),
      transformResponse: unwrapData<Project>,
      invalidatesTags: [...INVALIDATES],
    }),
    updateProject: build.mutation<Project, { id: string; body: Body }>({
      query: ({ id, body }) => ({ url: `/api/projects/${id}`, method: "PATCH", body }),
      transformResponse: unwrapData<Project>,
      invalidatesTags: [...INVALIDATES],
    }),
    deleteProject: build.mutation<void, string>({
      query: (id) => ({ url: `/api/projects/${id}`, method: "DELETE" }),
      invalidatesTags: [...INVALIDATES],
    }),
    uploadProjectImage: build.mutation<Project, { id: string; file: File }>({
      query: ({ id, file }) => ({ url: `/api/projects/${id}/image`, method: "POST", body: imageForm("image", file) }),
      transformResponse: unwrapData<Project>,
      invalidatesTags: [...INVALIDATES],
    }),
    // Up to 10 files per call (backend limit) — the form batches larger sets.
    addProjectThumbnails: build.mutation<Project, { id: string; files: File[] }>({
      query: ({ id, files }) => ({
        url: `/api/projects/${id}/thumbnails`,
        method: "POST",
        body: imageForm("thumbnails", files),
      }),
      transformResponse: unwrapData<Project>,
      invalidatesTags: [...INVALIDATES],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectBySlugQuery,
  useGetAdminProjectsQuery,
  useGetProjectOptionsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useUploadProjectImageMutation,
  useAddProjectThumbnailsMutation,
} = projectsApi;
