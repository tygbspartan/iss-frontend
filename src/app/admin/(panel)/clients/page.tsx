"use client";

import { ResourceManager } from "@/components/admin/ResourceManager";
import { clientsConfig } from "@/lib/admin/resources";

export default function Page() {
  return <ResourceManager config={clientsConfig} />;
}
