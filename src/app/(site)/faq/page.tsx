import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/site/PagePlaceholder";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "FAQ",
  description:
    "Answers to common questions about booking ISS Nepal for sound, lighting and stage production — pricing, planning, equipment and what to expect on the day.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <PagePlaceholder
      eyebrow="FAQ"
      title="Frequently asked questions"
      description="Answers to common questions about bookings, equipment and pricing."
    />
  );
}
