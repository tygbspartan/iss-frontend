"use client";

import { ResourceManager } from "@/components/admin/ResourceManager";
import { upcomingEventsConfig } from "@/lib/admin/resources";

export default function Page() {
  return <ResourceManager config={upcomingEventsConfig} />;
}
