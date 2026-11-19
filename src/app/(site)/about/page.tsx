import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/site/PageHeader";
import { StoryPath, type StoryChapter } from "@/components/site/StoryPath";
import { TeamDepartments } from "@/components/site/TeamDepartments";
import { PILL_BUTTON } from "@/components/site/pill";
import { getCoreTeam } from "@/lib/publicApi";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "About Us",
  description:
    "International Sound Service (ISS): a third-generation family business delivering audio-visual and event production across Nepal, with a story that began in 1960.",
  path: "/about",
});

// The story, in the order the line visits it: the first block centred, then
// left, right, left, right. Each says how it lights up when the line reaches it.
const CHAPTERS: StoryChapter[] = [
  {
    label: "Who we are",
    light: "spotlight",
    text: "International Sound Service (ISS) is one of Nepal's established audio-visual and event production companies, delivering comprehensive technical solutions for corporate events, conferences, concerts, exhibitions, government programmes, and special occasions.",
  },
  {
    label: "1960 · Voice of Radio",
    light: "bulb",
    text: "Our journey began in 1960 with Voice of Radio, a family-operated sound system business established by Mr. Asta Ratna Shakya alongside his brother. What began as a small family venture gradually grew into a legacy built on sound, dedication, and service.",
  },
  {
    label: "1993 · International Sound Service",
    light: "spotlight",
    text: "In 1993, the next chapter began when Mr. Suresh Ratna Shakya established International Sound Service (ISS), transforming the family's experience into a dedicated professional sound service company. Starting with political gatherings, college programmes, and small-scale events, ISS steadily expanded its services, expertise, and presence in Nepal's event industry.",
  },
  {
    label: "Today · The next generation",
    light: "bulb",
    text: "Today, ISS continues this legacy under the leadership of the next generation, with Mr. Shibir Shakya and Mr. Samir Shakya actively involved in the company's operations, management, and business development. With more than six decades of heritage and experience, ISS has evolved from a traditional sound system provider into a comprehensive audio-visual and event production partner. By combining advanced technology, skilled professionals, creative thinking, and a commitment to excellence, we continue to deliver seamless and memorable event experiences.",
  },
  {
    label: "Our promise",
    light: "spotlight",
    text: "As a third-generation family business, our commitment remains the same: bringing people, ideas, and experiences together through the power of sound and innovation.",
  },
];

export default async function AboutPage() {
  // The "core" people: members of the departments marked "Show on About page"
  // in the admin. Everyone else appears only on the Teams page. If the backend
  // can't be reached, or no department is marked, the section is left out.
  const coreTeam = await getCoreTeam().catch(() => []);

  return (
    <div className="pt-[65px] sm:pt-[81px] lg:pt-[65px]">
      <div className="site-container">
        <header className="text-center">
          <h1 className="text-[30px] leading-[1.1] font-medium tracking-[-0.02em] sm:text-5xl lg:text-[60px]">Our Story</h1>
          <p className="mt-4 font-poppins text-xs tracking-[0.2em] text-[#9DA1B1] uppercase sm:mt-5 sm:text-sm">Since 1960</p>
        </header>

        <StoryPath chapters={CHAPTERS} />
      </div>

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
