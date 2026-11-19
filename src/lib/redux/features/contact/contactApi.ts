import { api, toListResult, unwrapData, type ListArgs, type ListResult } from "../../api";
import type { ContactInquiry } from "@/lib/admin/types";

export interface InquiryInput {
  name: string;
  company: string;
  email: string;
  phone: string;
  eventType: string; // "Type of Event", typed freely
  eventDate: string; // "YYYY-MM-DD", today or later
  requirements: string;
  website?: string; // honeypot — render as a hidden field and leave empty
}

export interface InquiryListArgs extends ListArgs {
  q?: string; // searches name, company, email, phone, event type
}

export const contactApi = api.injectEndpoints({
  endpoints: (build) => ({
    // ── Public (Contact Us page) — rate limited to 5 per hour per visitor ──
    submitInquiry: build.mutation<void, InquiryInput>({
      query: (body) => ({ url: "/api/contact", method: "POST", body }),
      invalidatesTags: ["Inquiry"],
    }),

    // ── Admin — read only ──
    getInquiries: build.query<ListResult<ContactInquiry>, InquiryListArgs>({
      // undefined params are dropped by fetchBaseQuery, so blank filters vanish.
      query: ({ page, limit, q }) => ({
        url: "/api/contact",
        params: { page, limit, q: q?.trim() || undefined },
      }),
      transformResponse: toListResult<ContactInquiry>,
      providesTags: ["Inquiry"],
    }),
    getInquiry: build.query<ContactInquiry, string>({
      query: (id) => `/api/contact/${id}`,
      transformResponse: unwrapData<ContactInquiry>,
      providesTags: ["Inquiry"],
    }),
  }),
});

export const { useSubmitInquiryMutation, useGetInquiriesQuery, useGetInquiryQuery } = contactApi;
