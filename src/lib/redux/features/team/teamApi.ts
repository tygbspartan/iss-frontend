import { api, imageForm, toListResult, toMultipart, unwrapData, type Body, type ListArgs, type ListResult } from "../../api";
import type { TeamMember } from "@/lib/admin/types";

export const teamApi = api.injectEndpoints({
  endpoints: (build) => ({
    // ── Public (website) — visible members, departments in display order ──
    getTeam: build.query<TeamMember[], void>({
      query: () => "/api/team",
      transformResponse: unwrapData<TeamMember[]>,
      providesTags: ["TeamMember"],
    }),
    // Only members of "core" departments — the About page.
    getCoreTeam: build.query<TeamMember[], void>({
      query: () => "/api/team?core=true",
      transformResponse: unwrapData<TeamMember[]>,
      providesTags: ["TeamMember"],
    }),

    // ── Admin ──
    getAdminTeam: build.query<ListResult<TeamMember>, ListArgs>({
      query: () => "/api/team/admin/all",
      transformResponse: toListResult<TeamMember>,
      providesTags: ["TeamMember"],
    }),
    getTeamMember: build.query<TeamMember, string>({
      query: (id) => `/api/team/${id}`,
      transformResponse: unwrapData<TeamMember>,
      providesTags: ["TeamMember"],
    }),
    // Multipart: the photo is required and travels with the fields (body.image is a File).
    createTeamMember: build.mutation<TeamMember, Body>({
      query: (body) => ({ url: "/api/team", method: "POST", body: toMultipart(body) }),
      transformResponse: unwrapData<TeamMember>,
      invalidatesTags: ["TeamMember", "Department"],
    }),
    updateTeamMember: build.mutation<TeamMember, { id: string; body: Body }>({
      query: ({ id, body }) => ({ url: `/api/team/${id}`, method: "PATCH", body }),
      transformResponse: unwrapData<TeamMember>,
      invalidatesTags: ["TeamMember", "Department"],
    }),
    deleteTeamMember: build.mutation<void, string>({
      query: (id) => ({ url: `/api/team/${id}`, method: "DELETE" }),
      invalidatesTags: ["TeamMember", "Department"],
    }),
    // Sets or replaces the actual (real) photo; the cartoon uses uploadTeamMemberImage.
    uploadTeamMemberActualImage: build.mutation<TeamMember, { id: string; file: File }>({
      query: ({ id, file }) => ({
        url: `/api/team/${id}/actual-image`,
        method: "POST",
        body: imageForm("actualImage", file),
      }),
      transformResponse: unwrapData<TeamMember>,
      invalidatesTags: ["TeamMember", "Department"],
    }),
    uploadTeamMemberImage: build.mutation<TeamMember, { id: string; file: File }>({
      query: ({ id, file }) => ({ url: `/api/team/${id}/image`, method: "POST", body: imageForm("image", file) }),
      transformResponse: unwrapData<TeamMember>,
      invalidatesTags: ["TeamMember", "Department"],
    }),
  }),
});

export const {
  useGetTeamQuery,
  useGetCoreTeamQuery,
  useGetAdminTeamQuery,
  useGetTeamMemberQuery,
  useCreateTeamMemberMutation,
  useUpdateTeamMemberMutation,
  useDeleteTeamMemberMutation,
  useUploadTeamMemberImageMutation,
  useUploadTeamMemberActualImageMutation,
} = teamApi;
