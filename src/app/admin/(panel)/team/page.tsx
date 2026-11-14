"use client";

import { DepartmentsPanel } from "@/components/admin/DepartmentsPanel";
import { ResourceManager } from "@/components/admin/ResourceManager";
import { teamConfig } from "@/lib/admin/resources";

// Departments are managed here too: a member's department is picked from this
// list, so both belong on one page. The box sits between the title and the
// member list.
export default function Page() {
  return (
    <ResourceManager config={teamConfig}>
      <DepartmentsPanel />
    </ResourceManager>
  );
}
