import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getProjects, getServices } from "@/lib/publicApi";
import { SectionHeader } from "../PageHeader";
import { PILL_BUTTON } from "../pill";
import { WorkTabs, type WorkGroup } from "./WorkTabs";

const PROJECTS_PER_SERVICE = 6;

// "Our Recent Works": a tab per service, each with that service's newest
// projects. Services that have no projects yet are left out — unless none
// have any, in which case every tab is shown with a "coming soon" note.
export async function RecentWorks() {
  let groups: WorkGroup[] = [];
  try {
    const services = await getServices();
    const all = await Promise.all(
      services.map(async (service) => {
        const { items } = await getProjects({ service: service.slug, limit: PROJECTS_PER_SERVICE });
        return {
          id: service.id,
          title: service.title,
          slug: service.slug,
          projects: items.map(({ id, title, image }) => ({ id, title, image })),
        };
      }),
    );
    const withProjects = all.filter((group) => group.projects.length > 0);
    groups = withProjects.length > 0 ? withProjects : all;
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
