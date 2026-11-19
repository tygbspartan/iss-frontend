import type { ReactNode } from "react";
import type { Body, ListArgs, ListResult, RelationOption } from "@/lib/redux/api";

// Declarative description of one admin section. <ResourceManager> renders the
// list, the create/edit form, image handling and delete from this.

export type FieldType =
  | "text"
  | "textarea"
  | "email"
  | "url"
  | "date"
  | "number"
  | "checkbox"
  | "slug"
  | "relation"
  | "select"
  | "markdown"
  | "list"; // several short lines (sent as a string array, blanks dropped)

export interface FieldConfig {
  name: string; // key sent to the API (matches the backend validator)
  label: string;
  type: FieldType;
  required?: boolean;
  /** Optional text field the API stores as null when left empty. */
  nullable?: boolean;
  rows?: number; // textarea height
  placeholder?: string;
  help?: string;
  /** Spans both columns of the form grid. */
  wide?: boolean;
  /**
   * RTK Query hook that loads the options — for "relation" (pick several, sent
   * as an id array) and "select" (pick one from a dropdown, sent as one id).
   */
  relation?: { useOptions: () => QueryState<RelationOption[]> };
  /** For type "select": shown instead of the dropdown when there are no options yet. */
  emptyHint?: string;
  /** For type "checkbox": default for new records. */
  defaultChecked?: boolean;
}

// Structural views of the RTK Query hooks a section needs, so the generic
// <ResourceManager> can drive any resource. Declared as methods so the real
// (more specific) RTK hooks are assignable to them.
export interface QueryState<R> {
  data?: R;
  error?: unknown;
  isLoading: boolean;
  isFetching: boolean;
}

type Trigger<A, R> = (arg: A) => { unwrap(): Promise<R> };
type MutationHook<A, R> = () => readonly [Trigger<A, R>, { isLoading: boolean }];

export interface ResourceApi<T> {
  useAdminList(arg: ListArgs): QueryState<ListResult<T>>;
  useGetOne(id: string, options?: { skip?: boolean }): QueryState<T>;
  useCreate: MutationHook<Body, T>;
  useUpdate: MutationHook<{ id: string; body: Body }, T>;
  useDelete: MutationHook<string, unknown>;
  useUploadImage: MutationHook<{ id: string; file: File }, T>;
  useAddThumbnails?: MutationHook<{ id: string; files: File[] }, T>;
}

export interface Column<T> {
  label: string;
  render: (item: T) => ReactNode;
  className?: string;
}

export interface ResourceConfig<T extends { id: string; image: string }> {
  api: ResourceApi<T>;
  title: string; // "Services"
  singular: string; // "Service"
  description: string;
  paginated: boolean;
  /**
   * Label for the record's image ("Image", "Photo", "Logo"…). Every resource's
   * image is mandatory: create sends it with the fields in one multipart
   * request, and afterwards it can be replaced but not removed.
   */
  imageLabel: string;
  /**
   * A second, separate image (e.g. a team member's actual photo next to the
   * cartoon). Required when creating — sent in the same multipart request as
   * `field` — and replaced afterwards through `useUpload`.
   */
  secondImage?: {
    field: keyof T & string;
    label: string;
    help?: string;
    useUpload: MutationHook<{ id: string; file: File }, T>;
  };
  fields: FieldConfig[];
  columns: Column<T>[];
  /** Name shown in the first column and in confirmations. */
  primary: (item: T) => string;
  secondary?: (item: T) => ReactNode;
  /** Boolean the list's status badge toggles in place. */
  toggle: { field: keyof T & string; on: string; off: string };
  /** Form values for editing an existing record (relations → id arrays). */
  toFormValues?: (item: T) => Record<string, unknown>;
}
