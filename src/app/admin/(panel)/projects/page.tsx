"use client";

import { ResourceManager } from "@/components/admin/ResourceManager";
import { projectsConfig } from "@/lib/admin/resources";

export default function Page() {
  return <ResourceManager config={projectsConfig} />;
}
