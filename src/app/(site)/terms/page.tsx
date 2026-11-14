import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/site/PagePlaceholder";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Terms and Services",
  description:
    "The terms and conditions for using the ISS Nepal website and for booking our sound, lighting and stage production services.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <PagePlaceholder
      eyebrow="Legal"
      title="Terms and Services"
      description="The terms that apply to our services will be published here."
    />
  );
}
