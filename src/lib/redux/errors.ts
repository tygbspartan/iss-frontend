import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { SerializedError } from "@reduxjs/toolkit";
import { API_URL } from "./baseQuery";

// Helpers for reading RTK Query errors, which are either a FetchBaseQueryError
// (HTTP / network failure, with iss-be's JSON body in `data`) or a
// SerializedError (something threw).

interface ApiErrorBody {
  message?: string;
  errors?: Record<string, string[]>;
}

export const isFetchBaseQueryError = (error: unknown): error is FetchBaseQueryError =>
  typeof error === "object" && error !== null && "status" in error;

export const getErrorStatus = (error: unknown): number | string | undefined =>
  isFetchBaseQueryError(error) ? error.status : undefined;

export function getErrorMessage(error: unknown): string {
  if (isFetchBaseQueryError(error)) {
    if (error.status === "FETCH_ERROR") {
      return `Could not reach the server at ${API_URL || "(NEXT_PUBLIC_API_URL not set)"}. Is iss-be running?`;
    }
    const body = error.data as ApiErrorBody | undefined;
    if (body?.message) return body.message;
    return typeof error.status === "number" ? `Request failed (${error.status})` : "Request failed";
  }
  const message = (error as SerializedError | Error | undefined)?.message;
  return message || "Something went wrong";
}

/** Per-field validation errors from the backend, keyed by field name. */
export const getFieldErrors = (error: unknown): Record<string, string[]> =>
  (isFetchBaseQueryError(error) && (error.data as ApiErrorBody | undefined)?.errors) || {};
