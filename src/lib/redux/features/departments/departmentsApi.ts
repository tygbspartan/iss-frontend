import { api, unwrapData, type Body, type Envelope, type RelationOption } from "../../api";
import type { Department } from "@/lib/admin/types";

// Team responses embed each member's department, so department writes refresh
// the team lists too.
const INVALIDATES = ["Department", "TeamMember"] as const;

export const departmentsApi = api.injectEndpoints({
  endpoints: (build) => ({
    // ── Public (website) — in display order ──
    getDepartments: build.query<Department[], void>({
      query: () => "/api/departments",
      transformResponse: unwrapData<Department[]>,
      providesTags: ["Department"],
    }),

    // ── Admin ──
    // Includes `_count.members` for each department.
    getAdminDepartments: build.query<Department[], void>({
      query: () => "/api/departments/admin/all",
      transformResponse: unwrapData<Department[]>,
      providesTags: ["Department"],
    }),
    // For the team member form's department dropdown.
    getDepartmentOptions: build.query<RelationOption[], void>({
      query: () => "/api/departments/admin/all",
      transformResponse: (r: Envelope<Department[]>) => r.data.map(({ id, name }) => ({ id, title: name })),
      providesTags: ["Department"],
    }),
    createDepartment: build.mutation<Department, Body>({
      query: (body) => ({ url: "/api/departments", method: "POST", body }),
      transformResponse: unwrapData<Department>,
      invalidatesTags: [...INVALIDATES],
    }),
    updateDepartment: build.mutation<Department, { id: string; body: Body }>({
      query: ({ id, body }) => ({ url: `/api/departments/${id}`, method: "PATCH", body }),
      transformResponse: unwrapData<Department>,
      invalidatesTags: [...INVALIDATES],
    }),
    deleteDepartment: build.mutation<void, string>({
      query: (id) => ({ url: `/api/departments/${id}`, method: "DELETE" }),
      invalidatesTags: [...INVALIDATES],
    }),
  }),
});

export const {
  useGetDepartmentsQuery,
  useGetAdminDepartmentsQuery,
  useGetDepartmentOptionsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} = departmentsApi;
