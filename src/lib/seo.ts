import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";

// Search-engine and link-preview tags for one page, built the same way
// everywhere so no page is left with a missing or copied one:
//   • <title> and meta description;
//   • the canonical address (the page's one "official" URL);
//   • Open Graph / Twitter tags, so previews on WhatsApp, Facebook, LinkedIn
//     and X show this page's own title, description and address.
// The preview image is the site-wide one (app/opengraph-image.png). It has to
// be listed here: once a page sets its own Open Graph tags, the image Next.js
// would otherwise add from that file is no longer inherited. Blog posts set
// their own cover image instead and don't use this helper.
const PREVIEW_IMAGE = { url: "/opengraph-image.png", width: 1200, height: 630, alt: `${SITE_NAME} logo` };

export function pageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
  image,
}: {
  title: string;
  description: string;
  path: string; // e.g. "/about" — "/" for the home page
  /** Use `title` exactly as given, instead of adding "| ISS Nepal" after it. */
  absoluteTitle?: boolean;
  /** A picture of this page's own (e.g. a service's photo) to show in link previews instead of the site-wide one. */
  image?: string;
}): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} | ${SITE_NAME}`;
  const previewImage = image ? { url: image, alt: title } : PREVIEW_IMAGE;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_US",
      url: path,
      title: fullTitle,
      description,
      images: [previewImage],
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [previewImage] },
  };
}
