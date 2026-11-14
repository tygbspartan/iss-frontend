import { api, unwrapData, type Envelope } from "../../api";
import type { AdminUser } from "@/lib/admin/types";
import type { Credentials } from "./authSlice";

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<Credentials, { username: string; password: string }>({
      query: (body) => ({ url: "/api/auth/login", method: "POST", body }),
      transformResponse: unwrapData<Credentials>,
    }),
    // Re-validates a restored session against the server (catches deleted
    // users / changed roles). A 401 here logs out via baseQuery.
    getMe: build.query<AdminUser, void>({
      query: () => "/api/auth/me",
      transformResponse: (r: Envelope<AdminUser>) => r.data,
      providesTags: ["Me"],
    }),
  }),
});

export const { useLoginMutation, useGetMeQuery } = authApi;
