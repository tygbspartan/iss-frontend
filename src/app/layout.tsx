import type { Metadata } from "next";
import { USE_MOCK_DATA } from "@/lib/mock/flag";
import { Geist, Geist_Mono, Montserrat, Poppins } from "next/font/google";
import "./globals.css";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Public site typeface. Weights are listed explicitly (static files) rather
// than relying on the variable font: WebKit rendered the variable version at
// its thinnest weight. Italic is for the footer's active-page style.
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

// Secondary site typeface: section headings and intro copy, in light weight.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400"],
});

// Icons (favicon.ico, icon.png, apple-icon.png) and the link-preview image
// (opengraph-image.png) are picked up automatically from this folder.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    url: "/",
  },
  twitter: { card: "summary_large_image" },
  // A demo deployment with made-up content (see lib/mock) must never be indexed.
  ...(USE_MOCK_DATA && { robots: { index: false, follow: false } }),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
