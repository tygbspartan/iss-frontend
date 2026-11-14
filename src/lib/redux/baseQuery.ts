import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { loggedOut } from "./features/auth/authSlice";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// Minimal shape of the store this file needs — importing RootState here would
// create a circular import (store → api → baseQuery → store).
interface StateWithAuth {
  auth: { token: string | null };
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as StateWithAuth).auth.token;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

export const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  // 401 on an authenticated call → token expired or revoked: end the session.
  // (Login itself sends no token, so a wrong password doesn't trigger this.)
  if (result.error?.status === 401 && (api.getState() as StateWithAuth).auth.token) {
    api.dispatch(loggedOut());
  }

  return result;
};
