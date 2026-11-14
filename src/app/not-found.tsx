import type { Metadata } from "next";
import { NotFoundContent } from "@/components/site/NotFoundContent";
import SiteLayout from "./(site)/layout";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you’re looking for doesn’t exist. Head back to the ISS Nepal home page.",
};

// 404 for addresses that don't match any page at all (e.g. /no-such-page).
// Those are handled here at the top of the app, outside the public site's
// layout, so the navbar and footer are added by wrapping in that layout.
export default function NotFound() {
  return (
    <SiteLayout>
      <NotFoundContent />
    </SiteLayout>
  );
}
