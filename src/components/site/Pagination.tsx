import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

const BOX =
  "flex h-9 min-w-9 items-center justify-center gap-2 rounded-md border bg-black px-3 font-poppins text-xs sm:h-11 sm:min-w-11 sm:gap-2.5 sm:px-4 outline-offset-2 transition-colors focus-visible:outline-2 focus-visible:outline-white sm:text-lg";
const IDLE = "border-transparent text-white hover:border-white/30";
const CURRENT = "border-[#E79E3F] font-semibold text-[#E79E3F]";
const DISABLED = "border-transparent text-white/30";

// Which page numbers to show: always the first and last, the current page and
// its neighbours, with "…" standing in for any run that's skipped.
function pageList(page: number, totalPages: number): (number | "gap")[] {
  const wanted = new Set([1, totalPages, page - 1, page, page + 1]);
  const pages = [...wanted].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  return pages.flatMap((p, i) => (i > 0 && p - pages[i - 1] > 1 ? ["gap" as const, p] : [p]));
}

/**
 * "Back 1 2 3 4 Next" page links, bottom right of a listing (centred on phones).
 * `hrefFor` gives the address of a page number. Renders nothing for a single page.
 */
export function Pagination({
  page,
  totalPages,
  hrefFor,
  label,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
  label: string; // what is being paged, for screen readers — e.g. "Blog pages"
}) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label={label} className="mt-14 flex flex-wrap items-center justify-center gap-2 sm:justify-end lg:mt-16">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" className={`${BOX} ${IDLE}`}>
          <ChevronLeft className="size-4 text-[#E79E3F]" strokeWidth={2.5} aria-hidden />
          Back
        </Link>
      ) : (
        <span aria-disabled className={`${BOX} ${DISABLED}`}>
          <ChevronLeft className="size-4" strokeWidth={2.5} aria-hidden />
          Back
        </span>
      )}

      {pageList(page, totalPages).map((item, i) =>
        item === "gap" ? (
          <span key={`gap-${i}`} aria-hidden className="px-1 text-white/50">
            …
          </span>
        ) : item === page ? (
          <span key={item} aria-current="page" className={`${BOX} ${CURRENT}`}>
            <span className="sr-only">Page </span>
            {item}
          </span>
        ) : (
          <Link key={item} href={hrefFor(item)} className={`${BOX} ${IDLE}`}>
            <span className="sr-only">Page </span>
            {item}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} rel="next" className={`${BOX} ${IDLE}`}>
          Next
          <ChevronRight className="size-4 text-[#E79E3F]" strokeWidth={2.5} aria-hidden />
        </Link>
      ) : (
        <span aria-disabled className={`${BOX} ${DISABLED}`}>
          Next
          <ChevronRight className="size-4" strokeWidth={2.5} aria-hidden />
        </span>
      )}
    </nav>
  );
}
