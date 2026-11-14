import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MissionVision } from "@/components/site/MissionVision";
import { PageHeader, SectionHeader } from "@/components/site/PageHeader";
import { PhotoStrip, type StripPhoto } from "@/components/site/PhotoStrip";
import { ScrollSparkles } from "@/components/site/ScrollSparkles";
import { TeamDepartments } from "@/components/site/TeamDepartments";
import { PILL_BUTTON } from "@/components/site/pill";
import { getCoreTeam } from "@/lib/publicApi";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "About Us",
  description:
    "The story of ISS Nepal: over 25 years of sound, lighting and stage production for concerts, festivals, weddings and corporate events across Nepal.",
  path: "/about",
});

const STORY =
  "For more than 25 years, ISS Nepal has been the crew behind the sound, the lights and the stage at events across the country — from stadium concerts and street festivals to weddings and corporate nights. We bring high-fidelity sound, precise planning and people who treat every show like a flagship, so that what the audience remembers is the moment, not the equipment.";

// The photo strip: five photos of the same size in an endless, draggable row
// that climbs from left to right (see PhotoStrip). The page opens with the
// second photo in the middle of the screen and its neighbours either side.
const PHOTOS: StripPhoto[] = [
  {
    src: "/about/champions.png",
    alt: "A cricket team in red celebrating a championship win on a stage with fireworks behind them",
    width: 842,
    height: 440,
  },
  {
    src: "/about/lakhe-dance.png",
    alt: "A masked Lakhe dancer performing in a city street in front of a lit stage and sound system",
    width: 786,
    height: 464,
  },
  {
    src: "/about/concert.png",
    alt: "A singer on a concert stage between two columns of red smoke, with confetti in the air",
    width: 547,
    height: 300,
  },
  // PLACEHOLDER — the home page's hero photo, standing in for a 4th About
  // photo. Replace with a real one: add the file to public/about/ and update
  // src, alt, width and height here.
  {
    src: "/hero-crowd.png",
    alt: "A performer on a runway stage facing a large night-time crowd",
    width: 1920,
    height: 562,
  },
  // PLACEHOLDER — a repeat of the Lakhe dance photo, standing in for a 5th
  // About photo. Replace it the same way.
  {
    src: "/about/lakhe-dance.png",
    alt: "A masked Lakhe dancer performing in a city street in front of a lit stage and sound system",
    width: 786,
    height: 464,
  },
];

export default async function AboutPage() {
  // The "core" people: members of the departments marked "Show on About page"
  // in the admin. Everyone else appears only on the Teams page. If the backend
  // can't be reached, or no department is marked, the section is left out.
  const coreTeam = await getCoreTeam().catch(() => []);

  return (
    // `relative isolate`: lets the sparkle layer sit behind this page's content
    // but in front of the page background.
    <div className="relative isolate pt-[65px] sm:pt-[81px] lg:pt-[65px]">
      {/* Rising sparkles behind the page: strongest at the top, fading as you
          scroll, and gone by the time the team section comes into view. */}
      <ScrollSparkles endId="about-team" />

      <div className="site-container">
        <PageHeader title="Our Story" intro={STORY} />
      </div>

      {/* The vertical padding leaves room for the photos at the low (left) and high (right) ends. */}
      <PhotoStrip photos={PHOTOS} className="mt-10 py-[11vw] lg:mt-6 lg:py-[10vw]" />

      <MissionVision />

      {/* Where the sparkles end. Always here, even if the team section below is left out. */}
      <div id="about-team" />

      {coreTeam.length > 0 && (
        <section className="site-container pt-6 pb-14 lg:pt-10 lg:pb-20">
          <SectionHeader
            label="The People"
            title="Our Team"
            intro="The people who lead ISS Nepal and stand behind every show we take on."
          />
          <div className="mt-12 lg:mt-16">
            <TeamDepartments members={coreTeam} level={3} />
          </div>
          {/* The Teams page isn't in the navbar: this is the way to it. */}
          <div className="mt-12 flex justify-center lg:mt-14">
            <Link href="/teams" className={PILL_BUTTON}>
              Meet the Team
              <ArrowRight className="size-4" strokeWidth={2.5} aria-hidden />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
