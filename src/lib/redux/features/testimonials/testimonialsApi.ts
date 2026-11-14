import { api, imageForm, toListResult, toMultipart, unwrapData, type Body, type ListArgs, type ListResult } from "../../api";
import type { Testimonial } from "@/lib/admin/types";

export const testimonialsApi = api.injectEndpoints({
  endpoints: (build) => ({
    // ── Public (website) ──
    getTestimonials: build.query<Testimonial[], void>({
      query: () => "/api/testimonials",
      transformResponse: unwrapData<Testimonial[]>,
      providesTags: ["Testimonial"],
    }),

    // ── Admin ──
    getAdminTestimonials: build.query<ListResult<Testimonial>, ListArgs>({
      query: () => "/api/testimonials/admin/all",
      transformResponse: toListResult<Testimonial>,
      providesTags: ["Testimonial"],
    }),
    getTestimonial: build.query<Testimonial, string>({
      query: (id) => `/api/testimonials/${id}`,
      transformResponse: unwrapData<Testimonial>,
      providesTags: ["Testimonial"],
    }),
    createTestimonial: build.mutation<Testimonial, Body>({
      // Multipart: the image is required and travels with the fields (body.image is a File).
      query: (body) => ({ url: "/api/testimonials", method: "POST", body: toMultipart(body) }),
      transformResponse: unwrapData<Testimonial>,
      invalidatesTags: ["Testimonial"],
    }),
    updateTestimonial: build.mutation<Testimonial, { id: string; body: Body }>({
      query: ({ id, body }) => ({ url: `/api/testimonials/${id}`, method: "PATCH", body }),
      transformResponse: unwrapData<Testimonial>,
      invalidatesTags: ["Testimonial"],
    }),
    deleteTestimonial: build.mutation<void, string>({
      query: (id) => ({ url: `/api/testimonials/${id}`, method: "DELETE" }),
      invalidatesTags: ["Testimonial"],
    }),
    uploadTestimonialImage: build.mutation<Testimonial, { id: string; file: File }>({
      query: ({ id, file }) => ({
        url: `/api/testimonials/${id}/image`,
        method: "POST",
        body: imageForm("image", file),
      }),
      transformResponse: unwrapData<Testimonial>,
      invalidatesTags: ["Testimonial"],
    }),
  }),
});

export const {
  useGetTestimonialsQuery,
  useGetAdminTestimonialsQuery,
  useGetTestimonialQuery,
  useCreateTestimonialMutation,
  useUpdateTestimonialMutation,
  useDeleteTestimonialMutation,
  useUploadTestimonialImageMutation,
} = testimonialsApi;
