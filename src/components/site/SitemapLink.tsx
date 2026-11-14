"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActivePath } from "./Navbar";

// Footer link that marks the current page in bold italic, as in the design.
export function SitemapLink({ href, children }: { href: string; children: React.ReactNode }) {
  const active = isActivePath(usePathname(), href);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`transition hover:text-white ${active ? "font-bold italic text-white" : ""}`}
    >
      {children}
    </Link>
  );
}
