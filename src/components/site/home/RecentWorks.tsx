import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getEventTypes, getProjects } from "@/lib/publicApi";
import { SectionHeader } from "../PageHeader";
import { PILL_BUTTON } from "../pill";
import { WorkTabs, type WorkGroup } from "./WorkTabs";

const PROJECTS_PER_TYPE = 6;

// "Our Recent Works": a tab per event type (concerts, conferences, …), each
// with that type's newest projects. Types with no visible projects yet are
// left out.
export async function RecentWorks() {
  let groups: WorkGroup[] = [];
  try {
    const types = (await getEventTypes()).filter((type) => (type._count?.projects ?? 0) > 0);
    groups = await Promise.all(
      types.map(async (type) => {
        const { items } = await getProjects({ type: type.slug, limit: PROJECTS_PER_TYPE });
        return {
          id: type.id,
          title: type.name,
          slug: type.slug,
          projects: items.map(({ id, title, image }) => ({ id, title, image })),
        };
      }),
    );
  } catch {
    // Backend unreachable: the heading and the link to all work still render.
  }

  return (
    <section className="site-container py-14 lg:py-20">
      <SectionHeader label="Our Projects" title="Our Recent Works" />
      <WorkTabs groups={groups} />
      <div className="mt-10 flex justify-center lg:mt-12">
        <Link href="/projects" className={PILL_BUTTON}>
          Explore work
          <ArrowRight className="size-4" strokeWidth={2.5} aria-hidden />
        </Link>
      </div>
    </section>
  );
}
