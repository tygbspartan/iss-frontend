"use client";

import { useState } from "react";
import type { TeamMember } from "@/lib/admin/types";
import { GoldHeading } from "./GoldHeading";
import { SUBHEADING } from "./PageHeader";

// Group members by department. The API already returns them sorted —
// departments in the display order set in the admin, then members in theirs
// (ties alphabetical) — so groups and people simply keep the order they arrive in.
function groupByDepartment(members: TeamMember[]) {
  const groups = new Map<string, { name: string; people: TeamMember[] }>();
  for (const member of members) {
    const group = groups.get(member.department.id) ?? { name: member.department.name, people: [] };
    group.people.push(member);
    groups.set(member.department.id, group);
  }
  return [...groups.entries()].map(([id, group]) => ({ id, ...group }));
}

// Team members laid out by department: the department's name on the left (gold
// rule under it) and its people's photo cards on the right. Used by the Teams
// page (everyone) and the About page (core departments only).
//
// `level` is the heading level for department names — 2 when they sit directly
// under the page title, 3 when the section has its own heading above them.
// Member names are one level below that.
export function TeamDepartments({ members, level = 2 }: { members: TeamMember[]; level?: 2 | 3 }) {
  return (
    <div className="space-y-14 sm:space-y-16 xl:space-y-12">
      {groupByDepartment(members).map(({ id, name, people }) => (
        <section
          key={id}
          aria-labelledby={`dept-${id}`}
          className="grid gap-6 sm:gap-8 xl:grid-cols-[300px_minmax(0,1fr)] xl:gap-10 2xl:grid-cols-[395px_minmax(0,1fr)]"
        >
          <GoldHeading
            as={level === 2 ? "h2" : "h3"}
            id={`dept-${id}`}
            className={`${SUBHEADING} ${level === 3 ? "max-sm:text-xl" : ""}`}
          >
            {name}
          </GoldHeading>

          {/* Two cards across on phones (with a tighter gap), up to three on wide screens. */}
          <ul className="grid grid-cols-2 gap-x-3.5 gap-y-6 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
            {people.map((member) => (
              <li key={member.id}>
                <MemberCard member={member} nameAs={level === 2 ? "h3" : "h4"} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

// One person: their cartoon image, then name and job title. With a mouse,
// hovering cross-fades to their actual photo (slightly zoomed); on touch
// screens a tap toggles between the two instead. Clicking with a mouse does
// nothing. The cursor says "Hey".
function MemberCard({ member, nameAs: Name }: { member: TeamMember; nameAs: "h3" | "h4" }) {
  const [showPhoto, setShowPhoto] = useState(false);
  const swaps = Boolean(member.actualImage);

  return (
    <article
      data-cursor="Hey"
      data-photo={showPhoto ? "" : undefined}
      // Touch and pen only — mouse clicks leave the card alone. A finger that
      // scrolls the page ends in pointercancel, not pointerup, so scrolling
      // past a card doesn't flip it.
      onPointerUp={(e) => {
        if (swaps && e.pointerType !== "mouse") setShowPhoto((shown) => !shown);
      }}
      className={`group select-none ${swaps ? "[@media(hover:none)]:cursor-pointer" : ""}`}
    >
      <div className="relative aspect-square overflow-hidden rounded-xs bg-neutral-900">
        {/* Plain <img>: photos come from the backend's storage host, which
            next/image would need configured as a remote pattern.
            The cartoon and the actual photo are stacked and cross-fade. Both
            load together (the photo is only transparent), so the swap is
            instant. Members added before actual photos existed just keep their
            cartoon. `group-hover` only applies on devices that can hover, so
            touch screens use the tapped state (`data-photo`) alone. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={member.image}
          alt=""
          loading="lazy"
          draggable={false}
          className={`absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105 group-data-photo:scale-105 ${
            swaps ? "group-hover:opacity-0 group-data-photo:opacity-0" : ""
          }`}
        />
        {member.actualImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.actualImage}
            alt=""
            loading="lazy"
            draggable={false}
            className="absolute inset-0 size-full object-cover opacity-0 transition duration-500 group-hover:scale-105 group-hover:opacity-100 group-data-photo:scale-105 group-data-photo:opacity-100"
          />
        )}
      </div>
      {/* Phones (two narrow cards across): the name is 14px and the job title
          12px. From tablets up to mid-size desktop screens (640–1535px wide,
          e.g. 1376×1032) the name is 18px, the same as a project card's title,
          and the job title 14px. Only on large screens (1536px and up) do they
          grow to 24px and 16px. */}
      <Name className="mt-2 text-sm leading-5 font-normal text-white sm:mt-3 sm:text-lg sm:leading-7 2xl:text-2xl 2xl:leading-10">
        {member.name}
      </Name>
      <p className="mt-0.5 text-xs leading-[1.5] font-normal text-[#9DA1B1] sm:mt-0 sm:text-sm sm:leading-[1.7] 2xl:text-base">
        {member.jobTitle}
      </p>
    </article>
  );
}
