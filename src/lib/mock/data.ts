import type { Blog, Client, Department, Project, Service, TeamMember, Testimonial, UpcomingEvent } from "@/lib/admin/types";
import type { InstagramPost } from "@/lib/instagram";
import { SOCIAL_LINKS } from "@/lib/site";
import snapshot from "./snapshot.json";

// Content for demo mode (see ./index.ts).
//
// Services, departments, the team and upcoming events are a copy of the real
// site's content (snapshot.json, photos in public/demo/), so the demo matches
// what the admin holds. To refresh it after editing them in the admin, export
// a new snapshot from the backend's public API.
//
// Projects, blogs, testimonials, clients and Instagram posts are made up for
// the preview (the admin has none, or only test posts, yet); their photos are
// the few already in public/, and portraits and logos are drawn here as SVGs.

const PHOTOS = ["/about/concert.png", "/about/lakhe-dance.png", "/hero-crowd.png", "/about/champions.png"];
const photo = (i: number) => PHOTOS[i % PHOTOS.length];

const STAMP = { createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" };

const svg = (markup: string) => `data:image/svg+xml;utf8,${encodeURIComponent(markup)}`;

/** A square portrait stand-in: the person's initials on a warm gradient. */
function portrait(name: string, i: number): string {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
  const hues = [["#3A2A16", "#0E0E0E"], ["#2B2B2B", "#0A0A0A"], ["#4A3218", "#141414"]][i % 3];
  return svg(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${hues[0]}"/><stop offset="1" stop-color="${hues[1]}"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/><text x="200" y="200" dy=".35em" text-anchor="middle" font-family="Montserrat, Arial, sans-serif" font-size="130" font-weight="600" fill="#E79E3F">${initials}</text></svg>`,
  );
}

/** A wordmark stand-in for a client logo. */
function logo(name: string, style: number): string {
  const [first, ...rest] = name.split(" ");
  const shapes = [
    `<circle cx="34" cy="40" r="22" fill="none" stroke="#fff" stroke-width="5"/>`,
    `<rect x="12" y="18" width="44" height="44" rx="8" fill="#fff"/>`,
    `<path d="M12 62 34 18 56 62Z" fill="#fff"/>`,
    `<path d="M12 40h44M34 18v44" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`,
  ];
  return svg(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 80">${shapes[style % shapes.length]}<text x="72" y="40" dy=".35em" font-family="Arial, sans-serif" font-size="26" fill="#fff"><tspan font-weight="700">${first}</tspan>${rest.length ? ` ${rest.join(" ")}` : ""}</text></svg>`,
  );
}

// ─── Services ───────────────────────────────────────────────────────────────

export const MOCK_SERVICES = snapshot.services as Service[];

const serviceLink = (slug: string) => {
  const service = MOCK_SERVICES.find((s) => s.slug === slug)!;
  return { id: service.id, title: service.title, slug: service.slug };
};

// ─── Projects (newest first) ────────────────────────────────────────────────

// The made-up projects, each linked to one or more of the real services.
const AUDIO = "audio-solutions";
const DISPLAY = "display-solutions";
const LIGHTING = "lighting-solutions";
const TRUSS = "truss-rigging-systems";
const PLANNING = "technical-consultation-event-planning";

const PROJECT_LIST: [title: string, description: string, services: string[]][] = [
  ["Kathmandu Winter Music Festival", "Two nights, three stages and twelve thousand people in Tundikhel, with a full line-array main stage and a lighting rig programmed for every headliner.", [AUDIO, LIGHTING, TRUSS]],
  ["Himalayan Rock Night", "A forty-metre stage roof, side LED screens and a loud, clean rock mix that carried to the back of the crowd.", [AUDIO, DISPLAY]],
  ["Royal Garden Wedding", "Warm uplighting across the garden, a dance floor rig for the reception and a quiet, crisp sound system for the vows.", [LIGHTING, PLANNING]],
  ["Corporate Annual Gala 2026", "Stage, LED wall, presentation sound and live band setup for a thousand guests, delivered in a single afternoon load-in.", [PLANNING, DISPLAY]],
  ["Lakhe Cultural Evening", "Traditional performances lit with care, with sound tuned for drums, flutes and dialogue in an open courtyard.", [AUDIO, LIGHTING]],
  ["New Year's Eve Countdown", "A midnight countdown with cold sparks, CO₂ jets and confetti cannons fired on the final beat.", [LIGHTING]],
  ["College Fest Main Stage", "A full outdoor main stage with roof, line arrays and lighting for a three-day college festival.", [TRUSS, AUDIO]],
  ["Pokhara Lakeside Concert", "A floating-look stage by the lake, lit for sunset and night, with screens for the crowd at the back.", [TRUSS, DISPLAY, LIGHTING]],
  ["Product Launch Showcase", "A reveal moment built around an LED wall, haze and a beam show, timed to the second.", [DISPLAY, LIGHTING]],
  ["Charity Football Final", "Stadium announcements, half-time show sound and a victory moment with confetti and sparks.", [AUDIO, LIGHTING]],
  ["Jazz Under the Stars", "A small, warm stage with a careful acoustic mix for an evening jazz series.", [AUDIO, LIGHTING]],
  ["Fashion Week Runway", "A forty-metre runway with even, camera-friendly light and a punchy sound system for the music.", [TRUSS, LIGHTING]],
  ["Dashain Mela", "Stage, sound and power for a week-long community mela with performances every evening.", [PLANNING, AUDIO]],
  ["Tech Summit Kathmandu", "Conference sound, breakout rooms, LED screens and recording feeds for a two-day summit.", [PLANNING, DISPLAY]],
  ["Hip-Hop Block Party", "Heavy subs, a DJ riser and a strobe-and-beam rig for a sold-out street party.", [AUDIO, LIGHTING]],
  ["Classical Music Recital", "A discreet, natural-sounding setup for a classical recital in a heritage hall.", [AUDIO]],
  ["Marathon Finish Line", "Start and finish line sound, a timing screen and a stage for the medal ceremony.", [DISPLAY, TRUSS]],
  ["Film Premiere Night", "A red carpet lit for cameras, a screening sound system and an after-party rig.", [LIGHTING, PLANNING]],
];

export const MOCK_PROJECTS: Project[] = PROJECT_LIST.map(([title, description, services], i) => ({
  ...STAMP,
  id: `mock-project-${i + 1}`,
  title,
  slug: `mock-project-${i + 1}`,
  description,
  image: photo(i + 1),
  thumbnails: [],
  isActive: true,
  services: services.map(serviceLink),
}));

// ─── Blogs (newest first) ───────────────────────────────────────────────────

const article = (intro: string, points: [string, string][]) =>
  [
    intro,
    ...points.flatMap(([heading, body]) => [`## ${heading}`, body]),
    "## Planning an event?",
    "Tell us about it on the [contact page](/contact) and we'll put together a plan and a quote.",
  ].join("\n\n");

const BLOG_LIST: [title: string, description: string, date: string, readTime: number, content: string][] = [
  [
    "How to Choose the Right Sound System for Your Event",
    "Speakers, subs and monitors explained in plain words, so you know what to ask for.",
    "2026-11-02",
    6,
    article("The right sound system is the difference between a crowd that leans in and one that drifts away. Here's what matters.", [
      ["Start with the crowd and the space", "Guest numbers and whether you're indoors or outdoors decide almost everything. A garden of 300 needs very different gear from a hall of 300."],
      ["Line arrays versus point source", "Line arrays throw sound evenly to the back of large crowds. For smaller rooms, point-source speakers are simpler and just as clear."],
      ["Don't forget the monitors", "Performers need to hear themselves. Good monitoring makes for a better show for everyone."],
    ]),
  ],
  [
    "Stage Lighting 101: Washes, Beams and Moving Heads",
    "A quick tour of the lights we use and the moments each one is made for.",
    "2026-10-18",
    5,
    article("Lighting sets the mood before the first note is played. These are the building blocks of every rig we design.", [
      ["Washes", "Soft, even colour across the stage. They're the base layer that makes performers visible and sets the palette."],
      ["Beams", "Tight, punchy shafts of light that cut through haze. Perfect for drops, choruses and big entrances."],
      ["Moving heads", "Lights that pan, tilt and change colour on cue, so one fixture can play many roles through a show."],
    ]),
  ],
  [
    "Planning an Outdoor Concert in Nepal: A Checklist",
    "Weather, power, permits and stage roofs: what to sort out before the big day.",
    "2026-09-29",
    7,
    article("Outdoor shows are magical, and they're also where most things can go wrong. Our checklist keeps them on track.", [
      ["Plan for rain", "Even in the dry season, a stage roof and covered front-of-house position are non-negotiable."],
      ["Power first", "Confirm generator capacity early. Sound, light and screens all need clean, stable power."],
      ["Permits and neighbours", "Check local permits and sound curfews, and let nearby residents know what's coming."],
    ]),
  ],
  [
    "Behind the Scenes: Building a Festival Main Stage",
    "From empty field to show-ready stage in two days — how our crew does it.",
    "2026-09-07",
    4,
    article("A festival main stage starts as a truck full of steel. Here's how it becomes the centre of the weekend.", [
      ["Day one: structure", "Ground support, roof and truss go up first, then are checked and signed off for safety."],
      ["Day two: systems", "Sound, lighting and screens are flown, cabled and powered, then tested one by one."],
      ["Show day: tuning", "Engineers walk the field and tune the system so every spot in the crowd sounds right."],
    ]),
  ],
  [
    "Wedding Lighting Ideas That Guests Remember",
    "Uplighting, fairy lights and a dance-floor rig: simple ideas that change the whole night.",
    "2026-08-21",
    5,
    article("Light turns a venue into your venue. These are the ideas couples ask us for again and again.", [
      ["Warm uplighting", "A ring of warm light around a hall or garden makes everything feel close and golden."],
      ["Spotlight the moments", "A soft spot on the first dance or the cake cutting makes photos look stunning."],
      ["Party mode", "When the dancing starts, switch the room to a livelier rig with movement and colour."],
    ]),
  ],
  [
    "Why LED Screens Make Big Events Better",
    "Close-ups for the back row, sponsor slots and live feeds — the case for a screen.",
    "2026-07-30",
    4,
    article("Past a few hundred people, most of your audience can't see the stage clearly. Screens fix that.", [
      ["Everyone gets the front row", "Live camera feeds bring performers' faces to the back of the crowd."],
      ["Built-in sponsor space", "Screens give sponsors visible slots between acts without cluttering the stage."],
      ["Daylight-ready", "Modern LED walls are bright enough to read in afternoon sun."],
    ]),
  ],
  [
    "Special Effects Safety: Sparks, Fog and Confetti",
    "Big moments without the risk — how we plan effects that are safe for crowds.",
    "2026-07-08",
    5,
    article("Effects get the loudest cheers of the night, so we plan them with the most care.", [
      ["Cold sparks", "They look like fireworks but stay cool to the touch, which makes them safe close to people."],
      ["Fog and haze", "We choose fluids that are safe to breathe and won't set off smoke alarms indoors."],
      ["Clear zones", "Every effect has a marked safety zone and an operator watching it on the night."],
    ]),
  ],
];

export const MOCK_BLOGS: Blog[] = BLOG_LIST.map(([title, description, date, readTime, content], i) => ({
  ...STAMP,
  id: `mock-blog-${i + 1}`,
  title,
  slug: title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, ""),
  description,
  content,
  image: photo(i + 2),
  author: "ISS Nepal",
  readTime,
  isPublished: true,
  publishedAt: `${date}T09:00:00.000Z`,
}));

// ─── Team ───────────────────────────────────────────────────────────────────

export const MOCK_DEPARTMENTS = snapshot.departments as Department[];

export const MOCK_TEAM = snapshot.team as TeamMember[];

// ─── Testimonials and clients ───────────────────────────────────────────────

const TESTIMONIAL_LIST: [name: string, company: string, testimony: string][] = [
  ["Aarav Sharma", "Festival Organiser", "The sound was clear at the very back of the field and the crew had everything packed down before we knew it. Easily the smoothest festival we've run."],
  ["Priya & Rohan", "Wedding, Kathmandu", "Our guests are still talking about the lighting. The garden looked magical and the dance floor was packed all night."],
  ["Nisha Pradhan", "Events Lead, Summit Kathmandu", "From the first call to the last session, everything ran exactly to plan. Professional, calm and always on time."],
  ["Bijay Rana", "Band Manager", "Best monitor mix our band has had on a Nepali stage. The engineers listened and got it right in minutes."],
  ["Sabina Thapa", "Marketing Head", "The launch reveal with the LED wall and sparks gave us exactly the moment we wanted. We'll be booking them again next year."],
  ["Kumar Hamal", "College Fest Committee", "Three days, a huge crowd and not a single technical hitch. The main stage looked world-class."],
];

export const MOCK_TESTIMONIALS: Testimonial[] = TESTIMONIAL_LIST.map(([clientName, companyName, testimony], i) => ({
  ...STAMP,
  id: `mock-testimonial-${i + 1}`,
  clientName,
  companyName,
  testimony,
  image: portrait(clientName, i + 1),
  sortOrder: i,
  isActive: true,
}));

const CLIENT_LIST = ["Summit Events", "Everest Live", "Valley Weddings", "Himal Media", "Lakeside Resort", "Peak Productions", "Nova Brands", "Temple Arts"];

export const MOCK_CLIENTS: Client[] = CLIENT_LIST.map((companyName, i) => ({
  ...STAMP,
  id: `mock-client-${i + 1}`,
  companyName,
  image: logo(companyName, i),
  sortOrder: i,
  isActive: true,
}));

// ─── Upcoming events and Instagram ──────────────────────────────────────────

export const MOCK_EVENTS = snapshot.events as UpcomingEvent[];

export const MOCK_INSTAGRAM: InstagramPost[] = [
  "Main stage, night one. What a crowd!",
  "Lakhe dancers lit in gold.",
  "Load-in at sunrise.",
  "Line arrays flying high.",
  "Champions on stage.",
  "Wedding season is here.",
  "Sound check before the doors open.",
  "Moving heads, ready for the drop.",
  "Thank you, Kathmandu!",
].map((caption, i) => ({
  id: `mock-instagram-${i + 1}`,
  image: photo(i),
  href: SOCIAL_LINKS.instagram,
  caption,
  isVideo: false,
}));
