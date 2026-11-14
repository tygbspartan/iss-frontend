import type { Blog, Client, Department, Project, Service, TeamMember, Testimonial, UpcomingEvent } from "@/lib/admin/types";
import type { InstagramPost } from "@/lib/instagram";
import { SOCIAL_LINKS } from "@/lib/site";

// Made-up content for demo mode (see ./index.ts). Names, quotes, companies and
// projects are all invented for the preview; photos are the few already in
// public/, and portraits and logos are drawn here as small SVGs.

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

const SERVICE_LIST: [title: string, slug: string, description: string][] = [
  ["Sound Systems", "sound-systems", "Concert-grade line arrays, monitors and mixing for crowds of fifty to fifty thousand, tuned on site by engineers who know every venue in the valley."],
  ["Stage Lighting", "stage-lighting", "Moving heads, washes, beams and full lighting design programmed to the music, so every moment of the show looks the way it feels."],
  ["Stage & Truss", "stage-and-truss", "Modular stages, roofs and truss structures built to any size and signed off for safety, from intimate platforms to festival main stages."],
  ["LED Screens", "led-screens", "High-brightness LED walls and side screens for live feeds, visuals and sponsor content, readable even in afternoon sun."],
  ["Event Production", "event-production", "One team managing sound, light, stage and power from the first plan to the last cable, so organisers can focus on their guests."],
  ["Special Effects", "special-effects", "Cold sparks, CO₂ jets, haze, confetti and low fog that land on cue and make the big moments unforgettable."],
];

export const MOCK_SERVICES: Service[] = SERVICE_LIST.map(([title, slug, description], i) => ({
  ...STAMP,
  id: `mock-service-${i + 1}`,
  title,
  slug,
  description,
  image: photo(i),
  sortOrder: i,
  isActive: true,
}));

const serviceLink = (slug: string) => {
  const service = MOCK_SERVICES.find((s) => s.slug === slug)!;
  return { id: service.id, title: service.title, slug: service.slug };
};

// ─── Projects (newest first) ────────────────────────────────────────────────

const PROJECT_LIST: [title: string, description: string, services: string[]][] = [
  ["Kathmandu Winter Music Festival", "Two nights, three stages and twelve thousand people in Tundikhel, with a full line-array main stage and a lighting rig programmed for every headliner.", ["sound-systems", "stage-lighting", "stage-and-truss"]],
  ["Himalayan Rock Night", "A forty-metre stage roof, side LED screens and a loud, clean rock mix that carried to the back of the crowd.", ["sound-systems", "led-screens"]],
  ["Royal Garden Wedding", "Warm uplighting across the garden, a dance floor rig for the reception and a quiet, crisp sound system for the vows.", ["stage-lighting", "event-production"]],
  ["Corporate Annual Gala 2026", "Stage, LED wall, presentation sound and live band setup for a thousand guests, delivered in a single afternoon load-in.", ["event-production", "led-screens"]],
  ["Lakhe Cultural Evening", "Traditional performances lit with care, with sound tuned for drums, flutes and dialogue in an open courtyard.", ["sound-systems", "stage-lighting"]],
  ["New Year's Eve Countdown", "A midnight countdown with cold sparks, CO₂ jets and confetti cannons fired on the final beat.", ["special-effects", "stage-lighting"]],
  ["College Fest Main Stage", "A full outdoor main stage with roof, line arrays and lighting for a three-day college festival.", ["stage-and-truss", "sound-systems"]],
  ["Pokhara Lakeside Concert", "A floating-look stage by the lake, lit for sunset and night, with screens for the crowd at the back.", ["stage-and-truss", "led-screens", "stage-lighting"]],
  ["Product Launch Showcase", "A reveal moment built around an LED wall, haze and a beam show, timed to the second.", ["led-screens", "special-effects"]],
  ["Charity Football Final", "Stadium announcements, half-time show sound and a victory moment with confetti and sparks.", ["sound-systems", "special-effects"]],
  ["Jazz Under the Stars", "A small, warm stage with a careful acoustic mix for an evening jazz series.", ["sound-systems", "stage-lighting"]],
  ["Fashion Week Runway", "A forty-metre runway with even, camera-friendly light and a punchy sound system for the music.", ["stage-and-truss", "stage-lighting"]],
  ["Dashain Mela", "Stage, sound and power for a week-long community mela with performances every evening.", ["event-production", "sound-systems"]],
  ["Tech Summit Kathmandu", "Conference sound, breakout rooms, LED screens and recording feeds for a two-day summit.", ["event-production", "led-screens"]],
  ["Hip-Hop Block Party", "Heavy subs, a DJ riser and a strobe-and-beam rig for a sold-out street party.", ["sound-systems", "special-effects"]],
  ["Classical Music Recital", "A discreet, natural-sounding setup for a classical recital in a heritage hall.", ["sound-systems"]],
  ["Marathon Finish Line", "Start and finish line sound, a timing screen and a stage for the medal ceremony.", ["led-screens", "stage-and-truss"]],
  ["Film Premiere Night", "A red carpet lit for cameras, a screening sound system and an after-party rig.", ["stage-lighting", "event-production"]],
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

const DEPARTMENT_LIST: [name: string, isCore: boolean][] = [
  ["Founders", true],
  ["Management", true],
  ["Sound Engineering", false],
  ["Lighting & Visuals", false],
  ["Stage Crew", false],
];

export const MOCK_DEPARTMENTS: Department[] = DEPARTMENT_LIST.map(([name, isCore], i) => ({
  id: `mock-department-${i + 1}`,
  name,
  sortOrder: i,
  isCore,
}));

const TEAM_LIST: [department: number, name: string, jobTitle: string, linkedIn: boolean][] = [
  [0, "Rajesh Shrestha", "Founder & Managing Director", true],
  [0, "Sunita Maharjan", "Co-Founder & Creative Director", true],
  [1, "Bikash Tamang", "Operations Manager", true],
  [1, "Anisha Karki", "Client Relations Manager", false],
  [1, "Prakash Gurung", "Production Manager", true],
  [2, "Nabin Thapa", "Head of Sound", true],
  [2, "Sagar Rai", "Front-of-House Engineer", false],
  [2, "Kiran Magar", "Monitor Engineer", false],
  [3, "Ritika Joshi", "Lighting Designer", true],
  [3, "Suman Basnet", "Lighting Technician", false],
  [3, "Dipesh Lama", "LED & Video Technician", false],
  [4, "Ramesh Adhikari", "Stage Manager", false],
  [4, "Manoj Bhandari", "Rigging Lead", false],
  [4, "Santosh K.C.", "Crew Lead", false],
];

export const MOCK_TEAM: TeamMember[] = TEAM_LIST.map(([department, name, jobTitle, linkedIn], i) => ({
  ...STAMP,
  id: `mock-member-${i + 1}`,
  name,
  email: "",
  link: linkedIn ? "https://www.linkedin.com/" : null,
  jobTitle,
  departmentId: MOCK_DEPARTMENTS[department].id,
  department: MOCK_DEPARTMENTS[department],
  image: portrait(name, i),
  actualImage: null,
  sortOrder: i,
  isActive: true,
}));

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

// Dated from today, so the events never run out however long the preview stays up.
const daysFromNow = (days: number) => {
  const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
};

export const MOCK_EVENTS: UpcomingEvent[] = [
  { name: "Kathmandu Winter Music Festival", days: 12, image: photo(0) },
  { name: "New Year's Eve Countdown", days: 34, image: photo(2) },
].map(({ name, days, image }, i) => ({
  ...STAMP,
  id: `mock-event-${i + 1}`,
  name,
  eventDate: daysFromNow(days),
  image,
  isActive: true,
}));

export const MOCK_INSTAGRAM: InstagramPost[] = [
  "Main stage, night one. What a crowd!",
  "Lakhe dancers lit in gold.",
  "Load-in at sunrise.",
  "Line arrays flying high.",
  "Champions on stage.",
  "Wedding season is here.",
].map((caption, i) => ({
  id: `mock-instagram-${i + 1}`,
  image: photo(i),
  href: SOCIAL_LINKS.instagram,
  caption,
  isVideo: false,
}));
