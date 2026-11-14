"use client";

import { ResourceManager } from "@/components/admin/ResourceManager";
import { testimonialsConfig } from "@/lib/admin/resources";

export default function Page() {
  return <ResourceManager config={testimonialsConfig} />;
}
