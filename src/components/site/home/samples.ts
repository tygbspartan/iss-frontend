import type { Client, Testimonial } from "@/lib/admin/types";

// Stand-in content so the Testimonials and Clients sections can be seen while
// developing, before any real entries exist in the admin. DEVELOPMENT ONLY:
// `devSamples` returns nothing in a production build, so the live site never
// shows made-up testimonials — there the sections stay hidden until real
// entries are added.
const stamp = { createdAt: "", updatedAt: "", sortOrder: 0, isActive: true };

// Eight of them (so there are three screenfuls on desktop, the last one short),
// each worded differently so it's obvious when the cards change.
const SAMPLE_TESTIMONY = [
  "Sample one. This text is shown only while developing — add real testimonials in the admin panel and they will replace these.",
  "Sample two. A shorter one, to see how a brief quote sits in the card.",
  "Sample three. The sound was clear at the very back of the venue and the crew had everything packed down before we knew it.",
  "Sample four. From the first call to the last song, everything ran exactly to plan.",
  "Sample five. A longer one, to see how the card copes when someone has a lot to say about the stage, the lighting, the sound and the people who ran all of it on the night.",
  "Sample six. Professional, calm and on time. We will be booking them again next year.",
  "Sample seven. Our guests are still talking about the lighting.",
  "Sample eight. The last sample — on desktop it shares its screen with sample seven only.",
];

const SAMPLE_TESTIMONIALS: Testimonial[] = SAMPLE_TESTIMONY.map((testimony, i) => ({
  ...stamp,
  id: `sample-testimonial-${i + 1}`,
  clientName: `Sample Client ${i + 1}`,
  companyName: "Sample Company",
  testimony,
  image: "/icon.png",
}));

const SAMPLE_CLIENTS: Client[] = [1, 2, 3, 4, 5].map((n) => ({
  ...stamp,
  id: `sample-client-${n}`,
  companyName: `Sample Client ${n}`,
  image: "/icon.png",
}));

const isDev = process.env.NODE_ENV === "development";

export const devSampleTestimonials = (): Testimonial[] => (isDev ? SAMPLE_TESTIMONIALS : []);
export const devSampleClients = (): Client[] => (isDev ? SAMPLE_CLIENTS : []);
