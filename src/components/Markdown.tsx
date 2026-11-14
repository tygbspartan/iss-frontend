import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Renders admin-written Markdown (blog content). Shared by the admin preview
// and the public blog page so both look the same.
//
// Safe for user content: react-markdown does not render raw HTML, and its
// default URL transform drops `javascript:` and similar links.
export function Markdown({ children, className = "" }: { children: string; className?: string }) {
  return (
    <div
      className={`prose prose-zinc max-w-none min-w-0 wrap-anywhere dark:prose-invert prose-headings:tracking-tight prose-a:underline-offset-2 prose-img:rounded-lg ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]} // tables, ~~strikethrough~~, task lists, autolinks
        components={{
          // External links open in a new tab without giving it access to this page.
          // `node` is pulled out so it isn't spread onto the DOM element.
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          a: ({ node, href, ...props }) => {
            const external = !!href && /^https?:\/\//.test(href);
            return (
              <a
                href={href}
                {...props}
                {...(external && { target: "_blank", rel: "noopener noreferrer" })}
              />
            );
          },
          // Images in the text load only as the reader scrolls near them.
          // eslint-disable-next-line @typescript-eslint/no-unused-vars, @next/next/no-img-element
          img: ({ node, alt, ...props }) => <img alt={alt ?? ""} loading="lazy" decoding="async" {...props} />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
