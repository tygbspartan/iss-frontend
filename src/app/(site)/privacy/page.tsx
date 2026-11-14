import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/site/PagePlaceholder";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "How ISS Nepal collects, uses and protects the personal information you share through our website and contact form.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <PagePlaceholder
      eyebrow="Legal"
      title="Privacy Policy"
      description="How we collect, use and protect your information will be explained here."
    />
  );
}
