"use client";

import { EventTypesPanel } from "@/components/admin/EventTypesPanel";
import { ResourceManager } from "@/components/admin/ResourceManager";
import { projectsConfig } from "@/lib/admin/resources";

// Event types are managed here too: a project's type is picked from this list,
// so both belong on one page. The box sits between the title and the projects.
export default function Page() {
  return (
    <ResourceManager config={projectsConfig}>
      <EventTypesPanel />
    </ResourceManager>
  );
}
