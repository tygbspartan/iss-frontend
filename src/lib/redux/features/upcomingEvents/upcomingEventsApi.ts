import { api, imageForm, toListResult, toMultipart, unwrapData, type Body, type ListArgs, type ListResult } from "../../api";
import type { UpcomingEvent } from "@/lib/admin/types";

export const upcomingEventsApi = api.injectEndpoints({
  endpoints: (build) => ({
    // ── Admin — includes inactive and past events ──
    getAdminUpcomingEvents: build.query<ListResult<UpcomingEvent>, ListArgs>({
      query: () => "/api/upcoming-events/admin/all",
      transformResponse: toListResult<UpcomingEvent>,
      providesTags: ["UpcomingEvent"],
    }),
    getUpcomingEvent: build.query<UpcomingEvent, string>({
      query: (id) => `/api/upcoming-events/${id}`,
      transformResponse: unwrapData<UpcomingEvent>,
      providesTags: ["UpcomingEvent"],
    }),
    // Multipart: the image is required and travels with the fields (body.image is a File).
    createUpcomingEvent: build.mutation<UpcomingEvent, Body>({
      query: (body) => ({ url: "/api/upcoming-events", method: "POST", body: toMultipart(body) }),
      transformResponse: unwrapData<UpcomingEvent>,
      invalidatesTags: ["UpcomingEvent"],
    }),
    updateUpcomingEvent: build.mutation<UpcomingEvent, { id: string; body: Body }>({
      query: ({ id, body }) => ({ url: `/api/upcoming-events/${id}`, method: "PATCH", body }),
      transformResponse: unwrapData<UpcomingEvent>,
      invalidatesTags: ["UpcomingEvent"],
    }),
    deleteUpcomingEvent: build.mutation<void, string>({
      query: (id) => ({ url: `/api/upcoming-events/${id}`, method: "DELETE" }),
      invalidatesTags: ["UpcomingEvent"],
    }),
    uploadUpcomingEventImage: build.mutation<UpcomingEvent, { id: string; file: File }>({
      query: ({ id, file }) => ({
        url: `/api/upcoming-events/${id}/image`,
        method: "POST",
        body: imageForm("image", file),
      }),
      transformResponse: unwrapData<UpcomingEvent>,
      invalidatesTags: ["UpcomingEvent"],
    }),
  }),
});

export const {
  useGetAdminUpcomingEventsQuery,
  useGetUpcomingEventQuery,
  useCreateUpcomingEventMutation,
  useUpdateUpcomingEventMutation,
  useDeleteUpcomingEventMutation,
  useUploadUpcomingEventImageMutation,
} = upcomingEventsApi;
