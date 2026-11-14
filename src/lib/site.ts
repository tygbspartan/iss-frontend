// Public site content in one place: navigation, footer sitemap, contact
// details and social links. Values marked PLACEHOLDER need the real ones.

export const SITE_NAME = "ISS Nepal";
export const SITE_DESCRIPTION =
  "ISS Nepal provides professional sound, lighting and stage production for concerts, festivals, weddings and corporate events across Nepal — 25+ years on stage.";

// Public origin of the website (no trailing slash). Used for absolute URLs in
// link previews and Google's structured data — set it for production.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

// There's no page listing all services: each service has its own page at
// /services/<slug>. In the navbar "Services" opens a dropdown of them; where a
// plain link is needed (footer sitemap, hero button) it goes to the home
// page's "What We Offer" section instead.
export const SERVICES_HREF = "/#services";

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: SERVICES_HREF, label: "Services" },
  { href: "/projects", label: "Projects" },
  { href: "/blogs", label: "Blogs" },
  { href: "/contact", label: "Contact Us" },
] as const;

// The Teams page (/teams) is deliberately not in the navigation: it's reached
// from the "Meet the Team" button in the About page's team section. While on
// it, "About" is the link shown as current.
export const TEAMS_PARENT_HREF = "/about";

// Footer sitemap. The navbar's links come first, in the same order and
// wording (so the two can't drift apart), followed by the info pages. They
// are split into columns two ways:
const SITEMAP_LINKS: { href: string; label: string }[] = [
  ...NAV_LINKS,
  { href: "/faq", label: "FAQ" },
  { href: "/terms", label: "Terms and Services" },
  { href: "/privacy", label: "Privacy Policy" },
];
/** Tablets and up: three columns of three. */
export const SITEMAP: { href: string; label: string }[][] = [
  SITEMAP_LINKS.slice(0, 3),
  SITEMAP_LINKS.slice(3, 6),
  SITEMAP_LINKS.slice(6),
];
/** Phones and small tablets: two columns — the first five, then the other four. */
export const SITEMAP_NARROW: { href: string; label: string }[][] = [SITEMAP_LINKS.slice(0, 5), SITEMAP_LINKS.slice(5)];

export const CONTACT = {
  address: "Sankhamul - Balkumari Rd, Lalitpur 44600",
  // `label` is shown as written; `tel` is the international dial format.
  phones: [
    { label: "+977 01 5186109", tel: "+97715186109" },
    { label: "9802063348", tel: "+9779802063348" },
    { label: "9813028770", tel: "+9779813028770" },
  ],
  email: "soundz.iss@gmail.com",
  // WhatsApp number: `label` is shown on the navbar button; `number` is the
  // full international number, digits only, used in the wa.me chat link.
  whatsapp: { label: "+977 9851025166", number: "9779851025166" },
};

// ISS BASE on Google Maps, as an embeddable map (no API key needed).
export const MAP_EMBED_URL =
  "https://maps.google.com/maps?q=ISS%20BASE,%20Balkumari%20Rd,%20Lalitpur&z=17&output=embed";

export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/isssoundz/",
  tiktok: "https://www.tiktok.com/@isssoundz",
  facebook: "https://www.facebook.com/soundz.iss",
  email: `mailto:${CONTACT.email}`,
  whatsapp: `https://wa.me/${CONTACT.whatsapp.number}`,
};
