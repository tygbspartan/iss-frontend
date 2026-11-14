import type { Metadata } from "next";
import type { Blog } from "@/lib/admin/types";
import type { Paginated } from "@/lib/redux/api";
import { getBlogs } from "@/lib/publicApi";
import { BLOG_GRID, BlogCard } from "@/components/site/BlogCard";
import { EmptyNotice, PAGE_SHELL, PageHeader } from "@/components/site/PageHeader";
import { Pagination } from "@/components/site/Pagination";
import { pageMetadata } from "@/lib/seo";

const pageNumber = (value: unknown) => Math.max(1, Number.parseInt(String(value ?? "1"), 10) || 1);

// Page 2 onwards of the list gets its own title and canonical address.
export async function generateMetadata({ searchParams }: PageProps<"/blogs">): Promise<Metadata> {
  const page = pageNumber((await searchParams).page);
  return pageMetadata({
    title: page > 1 ? `Blogs – Page ${page}` : "Blogs",
    description:
      "Stories, guides and behind-the-scenes from ISS Nepal's sound, lighting and stage crew — ideas for planning concerts, weddings and events in Nepal.",
    path: page > 1 ? `/blogs?page=${page}` : "/blogs",
  });
}

// Blog posts, newest first, 12 per page.
export default async function BlogsPage({ searchParams }: PageProps<"/blogs">) {
  const { page: pageParam } = await searchParams;
  const page = pageNumber(pageParam);

  let result: Paginated<Blog> | null = null;
  try {
    result = await getBlogs(page);
  } catch {
    // Backend unreachable: still render the page, with a notice instead of cards.
  }
  const blogs = result?.items ?? [];

  return (
    <div className={PAGE_SHELL}>
      <PageHeader
        title="Blogs"
        intro="Stories from backstage, practical guides and lessons from the road — what we’ve learned about sound, lighting and staging events across Nepal."
      />

      {blogs.length === 0 ? (
        <EmptyNotice>
          {!result
            ? "The blogs couldn't be loaded right now."
            : page > 1
              ? "There are no posts on this page."
              : "Posts will be published here soon."}
        </EmptyNotice>
      ) : (
        <>
          <ul className={`mt-12 sm:mt-16 lg:mt-24 ${BLOG_GRID}`}>
            {blogs.map((blog) => (
              <li key={blog.id}>
                <BlogCard blog={blog} />
              </li>
            ))}
          </ul>
          {result && (
            <Pagination
              label="Blog pages"
              page={result.pagination.page}
              totalPages={result.pagination.totalPages}
              hrefFor={(p) => (p === 1 ? "/blogs" : `/blogs?page=${p}`)}
            />
          )}
        </>
      )}
    </div>
  );
}
