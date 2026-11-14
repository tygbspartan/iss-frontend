import type { Metadata } from "next";
import type { TeamMember } from "@/lib/admin/types";
import { getTeam } from "@/lib/publicApi";
import { EmptyNotice, PAGE_SHELL, PageHeader } from "@/components/site/PageHeader";
import { TeamDepartments } from "@/components/site/TeamDepartments";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Our Team",
  description:
    "Meet the founders, managers and crew behind ISS Nepal — the team that plans, rigs, mixes and lights events across Nepal.",
  path: "/teams",
});

// Everyone, by department. (The About page shows only the departments marked
// "Show on About page" in the admin, and links here for the rest.)
export default async function TeamsPage() {
  let members: TeamMember[] | null = null;
  try {
    members = await getTeam();
  } catch {
    // Backend unreachable: still render the page, with a notice instead of cards.
  }

  return (
    <div className={PAGE_SHELL}>
      <PageHeader
        title="Our Team"
        intro="Meet the people behind every show — the founders, managers and crew who plan, rig, mix and light each event from the first call to the final encore."
      />

      {!members || members.length === 0 ? (
        <EmptyNotice>
          {members ? "Team members will be introduced here soon." : "The team couldn't be loaded right now."}
        </EmptyNotice>
      ) : (
        <div className="mt-12 sm:mt-16 lg:mt-24">
          <TeamDepartments members={members} />
        </div>
      )}
    </div>
  );
}
