// Centred page title + intro shared by the public listing pages (Teams, Blogs).
export const PAGE_INTRO =
  "High-fidelity sound, precision logistics, and a crew that treats every show like a flagship. Built for the world’s most demanding stages.";

// The intro is always shown in full (e.g. a service's whole description).
export function PageHeader({ title, intro = PAGE_INTRO }: { title: string; intro?: string }) {
  return (
    <header className="mx-auto max-w-[760px] text-center">
      <h1 className="text-[30px] leading-[1.1] font-medium tracking-[-0.02em] capitalize sm:text-5xl lg:text-[60px]">
        {title}
      </h1>
      <p className="mt-4 font-poppins text-xs leading-[1.61] font-normal text-[#9DA1B1] sm:mt-5 sm:text-lg">{intro}</p>
    </header>
  );
}

/**
 * Sub-heading within a page — a department on the Teams page ("Founders &
 * Partners"), "Our Best Work, So Far" on a service page, "You Might Also Like"
 * under a blog post. Light Poppins: 26px on phones, 36px on tablets, 40px on
 * desktop. Use it on a <GoldHeading>, which adds the gold rule underneath.
 */
export const SUBHEADING =
  "font-poppins text-[26px] leading-[1.1] font-light tracking-[-0.02em] capitalize sm:text-4xl lg:text-[40px]";

/** Outer wrapper for those pages: gutters plus the design's top/bottom spacing. */
export const PAGE_SHELL = "site-container pt-[65px] pb-20 sm:pt-[81px] lg:pt-[65px] lg:pb-28";

/** Notice shown in place of a listing (empty, or the backend unreachable). */
export function EmptyNotice({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-16 text-center font-poppins text-xs text-[#9DA1B1] sm:mt-20 sm:text-lg">{children}</p>
  );
}

/** Centred heading for a section within a page: small gold label, title, intro. Pass `intro={null}` for no intro. */
export function SectionHeader({
  label,
  title,
  intro = PAGE_INTRO,
}: {
  label: string;
  title: string;
  intro?: string | null;
}) {
  return (
    <header className="mx-auto max-w-[760px] text-center">
      <p className="font-poppins text-[13px] text-[#E79E3F] sm:text-base">{label}</p>
      <h2 className="mt-3 text-[26px] leading-[1.1] font-medium tracking-[-0.02em] capitalize sm:text-[40px] lg:text-5xl">
        {title}
      </h2>
      {intro && (
        <p className="mt-4 font-poppins text-xs leading-[1.61] font-normal text-[#9DA1B1] sm:text-lg">{intro}</p>
      )}
    </header>
  );
}
