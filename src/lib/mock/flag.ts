/**
 * Demo mode: when NEXT_PUBLIC_USE_MOCK_DATA is "true" the website never calls
 * the backend. Every read is answered from the made-up content in ./data, the
 * contact form pretends to send, and search engines are told not to index the
 * site. It's for showing the site (e.g. a frontend-only preview on Vercel)
 * before the backend is deployed — never turn it on for the real site. The
 * admin panel doesn't work in this mode.
 *
 * Kept apart from the data so the browser-side contact form can check it
 * without bundling all the mock content.
 */
export const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";
