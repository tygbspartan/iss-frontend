"use client";

import { ResourceManager } from "@/components/admin/ResourceManager";
import { blogsConfig } from "@/lib/admin/resources";

export default function Page() {
  return <ResourceManager config={blogsConfig} />;
}
