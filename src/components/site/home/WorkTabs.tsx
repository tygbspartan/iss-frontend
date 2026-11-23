"use client";

import { useState } from "react";
// import { DropIn } from "../DropIn"; // see "DROP-IN ANIMATION" below
import {
  FILTER_PILL,
  FILTER_PILL_OFF,
  FILTER_PILL_ON,
  FILTER_ROW,
  PROJECT_GRID,
  ProjectCard,
} from "../ProjectCard";

export interface WorkGroup {
  id: string;
  title: string; // the event type's name, shown on its tab
  slug: string;
  projects: { id: string; title: string; image: string }[];
}

// One tab per event type; picking a tab shows that type's projects. Everything
// is already loaded, so switching is instant.
export function WorkTabs({ groups }: { groups: WorkGroup[] }) {
  const [activeId, setActiveId] = useState(groups[0]?.id);
  const active = groups.find((group) => group.id === activeId) ?? groups[0];
  if (!active) return null;

  return (
    <>
      {/* DROP-IN ANIMATION — switched off for now, kept for possible later use.
          To bring it back (tabs dropping into place one by one when the row
          scrolls into view): uncomment the DropIn import at the top, and swap
          this <div …> and its closing </div> for the two commented lines.
      <DropIn role="tablist" aria-label="Projects by type of event" className={`mt-8 lg:mt-10 ${FILTER_ROW}`}> */}
      <div role="tablist" aria-label="Projects by type of event" className={`mt-8 lg:mt-10 ${FILTER_ROW}`}>
        {groups.map((group) => {
          const selected = group.id === active.id;
          return (
            <button
              key={group.id}
              type="button"
              role="tab"
              id={`work-tab-${group.id}`}
              aria-selected={selected}
              aria-controls="work-panel"
              onClick={() => setActiveId(group.id)}
              className={`${FILTER_PILL} ${selected ? FILTER_PILL_ON : FILTER_PILL_OFF}`}
            >
              {group.title}
            </button>
          );
        })}
      </div>
      {/* </DropIn> */}

      <div id="work-panel" role="tabpanel" aria-labelledby={`work-tab-${active.id}`} className="mt-8 lg:mt-10">
        {active.projects.length === 0 ? (
          <p className="py-16 text-center font-poppins text-xs text-[#9DA1B1] sm:text-lg">
            Projects for {active.title} will be added here soon.
          </p>
        ) : (
          <ul className={PROJECT_GRID}>
            {active.projects.map((project) => (
              <li key={project.id}>
                <ProjectCard title={project.title} image={project.image} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
