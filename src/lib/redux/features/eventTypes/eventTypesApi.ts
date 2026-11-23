import { api, unwrapData, type Body, type Envelope, type RelationOption } from "../../api";
import type { EventType } from "@/lib/admin/types";

// Project responses embed their event type, so writes refresh the projects too.
const INVALIDATES = ["EventType", "Project"] as const;

export const eventTypesApi = api.injectEndpoints({
  endpoints: (build) => ({
    // ── Admin ──
    // Includes `_count.projects` for each type.
    getAdminEventTypes: build.query<EventType[], void>({
      query: () => "/api/event-types/admin/all",
      transformResponse: unwrapData<EventType[]>,
      providesTags: ["EventType"],
    }),
    // For the project form's event type dropdown.
    getEventTypeOptions: build.query<RelationOption[], void>({
      query: () => "/api/event-types/admin/all",
      transformResponse: (r: Envelope<EventType[]>) => r.data.map(({ id, name }) => ({ id, title: name })),
      providesTags: ["EventType"],
    }),
    createEventType: build.mutation<EventType, Body>({
      query: (body) => ({ url: "/api/event-types", method: "POST", body }),
      transformResponse: unwrapData<EventType>,
      invalidatesTags: [...INVALIDATES],
    }),
    updateEventType: build.mutation<EventType, { id: string; body: Body }>({
      query: ({ id, body }) => ({ url: `/api/event-types/${id}`, method: "PATCH", body }),
      transformResponse: unwrapData<EventType>,
      invalidatesTags: [...INVALIDATES],
    }),
    deleteEventType: build.mutation<void, string>({
      query: (id) => ({ url: `/api/event-types/${id}`, method: "DELETE" }),
      invalidatesTags: [...INVALIDATES],
    }),
  }),
});

export const {
  useGetAdminEventTypesQuery,
  useGetEventTypeOptionsQuery,
  useCreateEventTypeMutation,
  useUpdateEventTypeMutation,
  useDeleteEventTypeMutation,
} = eventTypesApi;
