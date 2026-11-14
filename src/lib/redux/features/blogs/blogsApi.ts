import {
  api,
  imageForm,
  toMultipart,
  toListResult,
  unwrapData,
  type Body,
  type ListArgs,
  type ListResult,
  type Paginated,
} from "../../api";
import type { Blog } from "@/lib/admin/types";

export const blogsApi = api.injectEndpoints({
  endpoints: (build) => ({
    // ── Public (website) — published posts only ──
    getBlogs: build.query<Paginated<Blog>, ListArgs | void>({
      query: (params) => ({ url: "/api/blogs", params: params ?? undefined }),
      transformResponse: unwrapData<Paginated<Blog>>,
      providesTags: ["Blog"],
    }),
    getBlogBySlug: build.query<Blog, string>({
      query: (slug) => `/api/blogs/slug/${encodeURIComponent(slug)}`,
      transformResponse: unwrapData<Blog>,
      providesTags: ["Blog"],
    }),

    // ── Admin — includes drafts ──
    getAdminBlogs: build.query<ListResult<Blog>, ListArgs>({
      query: (params) => ({ url: "/api/blogs/admin/all", params }),
      transformResponse: toListResult<Blog>,
      providesTags: ["Blog"],
    }),
    getBlog: build.query<Blog, string>({
      query: (id) => `/api/blogs/${id}`,
      transformResponse: unwrapData<Blog>,
      providesTags: ["Blog"],
    }),
    createBlog: build.mutation<Blog, Body>({
      // Multipart: the image is required and travels with the fields (body.image is a File).
      query: (body) => ({ url: "/api/blogs", method: "POST", body: toMultipart(body) }),
      transformResponse: unwrapData<Blog>,
      invalidatesTags: ["Blog"],
    }),
    updateBlog: build.mutation<Blog, { id: string; body: Body }>({
      query: ({ id, body }) => ({ url: `/api/blogs/${id}`, method: "PATCH", body }),
      transformResponse: unwrapData<Blog>,
      invalidatesTags: ["Blog"],
    }),
    deleteBlog: build.mutation<void, string>({
      query: (id) => ({ url: `/api/blogs/${id}`, method: "DELETE" }),
      invalidatesTags: ["Blog"],
    }),
    uploadBlogImage: build.mutation<Blog, { id: string; file: File }>({
      query: ({ id, file }) => ({ url: `/api/blogs/${id}/image`, method: "POST", body: imageForm("image", file) }),
      transformResponse: unwrapData<Blog>,
      invalidatesTags: ["Blog"],
    }),
  }),
});

export const {
  useGetBlogsQuery,
  useGetBlogBySlugQuery,
  useGetAdminBlogsQuery,
  useGetBlogQuery,
  useCreateBlogMutation,
  useUpdateBlogMutation,
  useDeleteBlogMutation,
  useUploadBlogImageMutation,
} = blogsApi;
