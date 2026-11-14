import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FaFacebookF, FaLinkedin, FaWhatsapp } from "react-icons/fa6";
import type { Blog } from "@/lib/admin/types";
import { getBlogBySlug, getBlogs } from "@/lib/publicApi";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { Markdown } from "@/components/Markdown";
import { BLOG_GRID, BlogCard } from "@/components/site/BlogCard";
import { GoldHeading } from "@/components/site/GoldHeading";
import { SUBHEADING } from "@/components/site/PageHeader";

const publishedOn = (blog: Blog) => blog.publishedAt ?? blog.createdAt;

// Nepal time, so the date doesn't depend on where the server runs.
const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "Asia/Kathmandu" }).format(new Date(iso));

// Search engines and link previews: the post's own title, summary and cover.
export async function generateMetadata({ params }: PageProps<"/blogs/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);
  if (!blog) return { title: "Post not found", robots: { index: false } };

  const url = `/blogs/${blog.slug}`;
  return {
    title: blog.title,
    description: blog.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: blog.title,
      description: blog.description,
      siteName: SITE_NAME,
      images: [{ url: blog.image, alt: blog.title }],
      publishedTime: publishedOn(blog),
      modifiedTime: blog.updatedAt,
      authors: [SITE_NAME],
    },
    twitter: { card: "summary_large_image", title: blog.title, description: blog.description, images: [blog.image] },
  };
}

export default async function BlogPostPage({ params }: PageProps<"/blogs/[slug]">) {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);
  if (!blog) notFound();

  // "You Might Also Like": the three newest other posts. Optional — the post
  // still renders if this request fails.
  const others = await getBlogs(1, 4)
    .then((result) => result.items.filter((item) => item.id !== blog.id).slice(0, 3))
    .catch(() => []);

  const url = `${SITE_URL}/blogs/${blog.slug}`;
  const organization = { "@type": "Organization", name: SITE_NAME, url: SITE_URL, logo: `${SITE_URL}/icon.png` };
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.title,
    description: blog.description,
    image: [blog.image],
    datePublished: publishedOn(blog),
    dateModified: blog.updatedAt,
    mainEntityOfPage: url,
    author: organization,
    publisher: organization,
  };

  const share = [
    {
      label: "Share on LinkedIn",
      icon: FaLinkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    {
      label: "Share on Facebook",
      icon: FaFacebookF,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      label: "Share on WhatsApp",
      icon: FaWhatsapp,
      href: `https://wa.me/?text=${encodeURIComponent(`${blog.title} ${url}`)}`,
    },
  ];

  return (
    <div className="site-container pt-10 pb-20 sm:pt-14 lg:pt-10 lg:pb-28">
      <script
        type="application/ld+json"
        // Escape "<" so the JSON can't close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <article>
        <header>
          <h1 className="mx-auto max-w-[720px] text-center text-[30px] leading-[1.1] font-medium tracking-[-0.02em] text-balance capitalize wrap-anywhere sm:text-5xl lg:text-[60px]">
            {blog.title}
          </h1>

          <div className="mx-auto mt-8 aspect-770/375 max-w-[770px] overflow-hidden rounded-xl bg-neutral-900 sm:mt-10 lg:mt-12">
            {/* Plain <img>: images come from the backend's storage host, which
                next/image would need configured as a remote pattern. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={blog.image} alt={blog.title} fetchPriority="high" className="size-full object-cover" />
          </div>

          <p className="mt-6 flex items-center justify-center gap-3.5 font-poppins text-xs font-light text-white sm:text-xl">
            <span>{SITE_NAME}</span>
            <span className="h-7 w-px bg-white" aria-hidden />
            <time dateTime={publishedOn(blog)}>{formatDate(publishedOn(blog))}</time>
          </p>
        </header>

        <div className="mx-auto mt-10 max-w-[560px] sm:mt-12">
          <Markdown className="text-sm leading-[1.45] sm:text-base font-light prose-invert [--tw-prose-invert-body:#C4C7D2] [--tw-prose-invert-bullets:#9DA1B1] [--tw-prose-invert-counters:#9DA1B1] [--tw-prose-invert-headings:#FFFFFF] prose-headings:font-medium prose-headings:tracking-normal prose-h1:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-[22px] prose-h3:text-xl prose-strong:font-semibold sm:text-lg">
            {blog.content ?? ""}
          </Markdown>

          <hr className="mt-12 border-white/20" />

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs font-light text-[#C4C7D2] sm:text-lg">Liked it? Share it with your friends.</p>
            <ul className="flex items-center gap-4 sm:gap-6">
              {share.map(({ label, icon: Icon, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    title={label}
                    className="block text-white transition hover:text-[#E79E3F]"
                  >
                    <Icon className="size-5 sm:size-7" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </article>

      {others.length > 0 && (
        <section aria-labelledby="more-posts" className="mt-20 sm:mt-24 lg:mt-30">
          <GoldHeading id="more-posts" className={SUBHEADING}>
            You Might Also Like
          </GoldHeading>
          <ul className={`mt-8 sm:mt-10 lg:mt-12 ${BLOG_GRID}`}>
            {others.map((other) => (
              <li key={other.id}>
                <BlogCard blog={other} as="h3" />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
