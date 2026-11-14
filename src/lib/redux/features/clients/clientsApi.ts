import { api, imageForm, toListResult, toMultipart, unwrapData, type Body, type ListArgs, type ListResult } from "../../api";
import type { Client } from "@/lib/admin/types";

export const clientsApi = api.injectEndpoints({
  endpoints: (build) => ({
    // ── Public (website) ──
    getClients: build.query<Client[], void>({
      query: () => "/api/clients",
      transformResponse: unwrapData<Client[]>,
      providesTags: ["Client"],
    }),

    // ── Admin ──
    getAdminClients: build.query<ListResult<Client>, ListArgs>({
      query: () => "/api/clients/admin/all",
      transformResponse: toListResult<Client>,
      providesTags: ["Client"],
    }),
    getClient: build.query<Client, string>({
      query: (id) => `/api/clients/${id}`,
      transformResponse: unwrapData<Client>,
      providesTags: ["Client"],
    }),
    createClient: build.mutation<Client, Body>({
      // Multipart: the image is required and travels with the fields (body.image is a File).
      query: (body) => ({ url: "/api/clients", method: "POST", body: toMultipart(body) }),
      transformResponse: unwrapData<Client>,
      invalidatesTags: ["Client"],
    }),
    updateClient: build.mutation<Client, { id: string; body: Body }>({
      query: ({ id, body }) => ({ url: `/api/clients/${id}`, method: "PATCH", body }),
      transformResponse: unwrapData<Client>,
      invalidatesTags: ["Client"],
    }),
    deleteClient: build.mutation<void, string>({
      query: (id) => ({ url: `/api/clients/${id}`, method: "DELETE" }),
      invalidatesTags: ["Client"],
    }),
    uploadClientImage: build.mutation<Client, { id: string; file: File }>({
      query: ({ id, file }) => ({ url: `/api/clients/${id}/image`, method: "POST", body: imageForm("image", file) }),
      transformResponse: unwrapData<Client>,
      invalidatesTags: ["Client"],
    }),
  }),
});

export const {
  useGetClientsQuery,
  useGetAdminClientsQuery,
  useGetClientQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
  useUploadClientImageMutation,
} = clientsApi;
