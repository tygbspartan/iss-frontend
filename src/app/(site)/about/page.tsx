import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Generation } from "@/components/site/GenerationCards";
import { StoryPath, type StoryChapter } from "@/components/site/StoryPath";
import { PILL_BUTTON } from "@/components/site/pill";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "About Us",
  description:
    "International Sound Service (ISS): a third-generation family business delivering audio-visual and event production across Nepal, with a story that began in 1960.",
  path: "/about",
});

// The story, in the order the line visits it: the first block centred, then
// left, right, left, right.
const CHAPTERS: StoryChapter[] = [
  {
    label: "Who we are",
    time: "Est. 1960",
    title: "Who we are",
    text: "International Sound Service (ISS) is one of Nepal's established audio-visual and event production companies, delivering comprehensive technical solutions for corporate events, conferences, concerts, exhibitions, government programmes, and special occasions.",
  },
  {
    label: "1960 · Voice of Radio",
    time: "1960",
    title: "Voice of Radio",
    text: "Our journey began in 1960 with Voice of Radio, a family-operated sound system business established by Mr. Asta Ratna Shakya alongside his brother. What began as a small family venture gradually grew into a legacy built on sound, dedication, and service.",
  },
  {
    label: "1993 · International Sound Service",
    time: "1993",
    title: "International Sound Service",
    text: "In 1993, the next chapter began when Mr. Suresh Ratna Shakya established International Sound Service (ISS), transforming the family's experience into a dedicated professional sound service company. Starting with political gatherings, college programmes, and small-scale events, ISS steadily expanded its services, expertise, and presence in Nepal's event industry.",
  },
  {
    label: "Today · The next generation",
    time: "Today",
    title: "The next generation",
    text: "Today, ISS continues this legacy under the leadership of the next generation, with Mr. Shibir Shakya and Mr. Samir Shakya actively involved in its operations, management, and business development. With over six decades of experience, ISS has evolved from a traditional sound system provider into a comprehensive audio-visual and event production partner, combining advanced technology, skilled professionals, and creative thinking to deliver seamless and memorable event experiences.",
  },
  {
    label: "Our promise",
    time: "Always",
    title: "Our promise",
    text: "As a third-generation family business, our commitment remains the same: bringing people, ideas, and experiences together through the power of sound and innovation.",
  },
];

// The cards that close the story: one for each of the family's leaders, from
// the first generation to the third.
const GENERATIONS: Generation[] = [
  {
    label: "1st Gen",
    numeral: "I",
    name: "Mr. Asta Ratna Shakya",
    role: "Founder",
    organisation: "Voice of Radio",
    generation: "First Generation",
  },
  {
    label: "2nd Gen",
    numeral: "II",
    name: "Mr. Suresh Ratna Shakya",
    role: "Founder",
    organisation: "International Sound Service",
    generation: "Second Generation",
  },
  {
    label: "3rd Gen",
    numeral: "III",
    name: "Mr. Shibir Ratna Shakya",
    role: "Managing Director / Sound Engineer",
    organisation: "International Sound Service",
    generation: "Third Generation",
  },
  {
    label: "3rd Gen",
    numeral: "III",
    name: "Mr. Samir Ratna Shakya",
    role: "Managing Director",
    organisation: "International Sound Service",
    generation: "Third Generation",
  },
];

export default function AboutPage() {
  return (
    // overflow-x-clip: the story's spotlights and zoomed blocks reach a little
    // past the content; this keeps the page from scrolling sideways.
    <div className="overflow-x-clip pt-[65px] sm:pt-[81px] lg:pt-[65px]">
      <div className="site-container">
        <header className="text-center">
          <h1 className="text-[30px] leading-[1.1] font-medium tracking-[-0.02em] sm:text-5xl lg:text-[60px]">Our Story</h1>
          <p className="mt-4 font-poppins text-xs tracking-[0.2em] text-[#9DA1B1] uppercase sm:mt-5 sm:text-sm">Since 1960</p>
        </header>
      </div>

      {/* Full width: on desktop the story is a pinned, screen-wide stage.
          Under the generation cards: the way to the Teams page (it isn't in
          the navbar). */}
      <StoryPath chapters={CHAPTERS} generations={GENERATIONS}>
        <div className="flex flex-col items-center text-center">
          <p className="font-poppins text-sm text-[#9DA1B1] sm:text-lg">Want to meet the entire team?</p>
          <Link href="/teams" className={`mt-4 sm:mt-5 ${PILL_BUTTON}`}>
            Meet the Team
            <ArrowRight className="size-4" strokeWidth={2.5} aria-hidden />
          </Link>
        </div>
      </StoryPath>
    </div>
  );
}
