import Link from "next/link";
import { ArrowCircle } from "./ArrowCircle";
import type { Blog } from "@/lib/admin/types";

/** Grid the cards sit in: 1 column on phones, 2 on tablets, 3 on desktop. */
export const BLOG_GRID = "grid gap-x-7.5 gap-y-10 sm:grid-cols-2 sm:gap-y-14.5 lg:grid-cols-3 lg:gap-y-17.5";

// Card for one post, used by the Blogs listing and by "You Might Also Like" on
// a post page. `as` sets the title's heading level to fit the page outline.
export function BlogCard({ blog, as: Title = "h2" }: { blog: Blog; as?: "h2" | "h3" }) {
  return (
    // The whole card is one link to the post.
    <Link href={`/blogs/${blog.slug}`} data-cursor="Read" className="group block rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
      <article>
        <div className="aspect-537/298 overflow-hidden rounded-md border border-white/10 bg-neutral-900">
          {/* Plain <img>: images come from the backend's storage host, which
              next/image would need configured as a remote pattern. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={blog.image}
            alt=""
            loading="lazy"
            className="size-full object-cover transition duration-500 group-hover:scale-105"
          />
        </div>

        <div className="mt-2 flex items-start justify-between gap-2 sm:mt-2.5 sm:gap-4">
          {/* Phones (one card per row): the title is 14px and the
              description 12px, the same as the team cards. */}
          {/* From tablets up to mid-size desktop screens (640–1535px wide, e.g.
              1376×1032) the title is 18px, the same as a project card's title,
              and the description stays at 14px to suit. Only on large screens
              (1536px and up) do they grow to 24px and 16px. */}
          <Title className="line-clamp-2 text-sm leading-5 font-medium text-white sm:text-lg sm:leading-7 2xl:text-2xl 2xl:leading-10">
            {blog.title}
          </Title>
          <ArrowCircle className="sm:mt-0 2xl:mt-1.5" />
        </div>

        <p className="mt-1 line-clamp-2 text-xs leading-normal font-normal text-[#9DA1B1] sm:text-sm sm:leading-[1.7] 2xl:text-base">
          {blog.description}
        </p>
      </article>
    </Link>
  );
}
