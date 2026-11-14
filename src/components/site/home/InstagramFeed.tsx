import { FaInstagram } from "react-icons/fa6";
import { getInstagramFeed, type InstagramPost } from "@/lib/instagram";
import { SOCIAL_LINKS } from "@/lib/site";
import { SectionHeader } from "../PageHeader";

// Phones show nine (three by three); from 640px up, the first six.
const POST_COUNT = 9;
const POSTS_ABOVE_PHONE = 6;

// DEVELOPMENT ONLY: stand-in tiles so the section can be seen before the
// Instagram access token is set up. A production build never shows these.
const SAMPLE_POSTS: InstagramPost[] = [
  "/about/lakhe-dance.png",
  "/about/champions.png",
  "/about/concert.png",
  "/hero-crowd.png",
  "/about/concert.png",
  "/about/lakhe-dance.png",
  "/about/champions.png",
  "/hero-crowd.png",
  "/about/concert.png",
].map((image, i) => ({
  id: `sample-instagram-${i + 1}`,
  image,
  href: SOCIAL_LINKS.instagram,
  caption: `Sample post ${i + 1} (shown only while developing)`,
  isVideo: false,
}));

// "On The Feed": the newest posts from the company's Instagram, three across
// (three rows on phones, two above that), in the same order as on the Instagram profile (so a
// picture split across several posts lines up here too). Each tile opens its
// post on Instagram.
//
// The posts come from the backend, which holds the Instagram access token and
// keeps it renewed. If the backend has no token, or Instagram can't be
// reached, the live site leaves the section out entirely; while developing,
// sample tiles stand in until a token is set up.
export async function InstagramFeed() {
  let posts: InstagramPost[] = [];
  let configured = false;
  try {
    ({ posts, configured } = await getInstagramFeed(POST_COUNT));
  } catch (error) {
    console.error("Instagram feed could not be loaded:", (error as Error).message);
  }
  if (posts.length === 0 && process.env.NODE_ENV === "development" && !configured) {
    posts = SAMPLE_POSTS;
  }
  if (posts.length === 0) return null;

  return (
    <section className="site-container py-14 lg:py-20">
      <SectionHeader
        label="Our Instagram"
        title="On The Feed"
        intro="More moments, updates, and everything in between."
      />

      <ul className="mx-auto mt-10 grid max-w-[1030px] grid-cols-3 gap-1 lg:mt-14 lg:gap-1.5">
        {posts.map((post, i) => (
          <li key={post.id} className={i >= POSTS_ABOVE_PHONE ? "sm:hidden" : undefined}>
            <a
              href={post.href}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="Open"
              aria-label={post.caption ? `Instagram post: ${post.caption.slice(0, 100)}` : "View this post on Instagram"}
              className="group block aspect-3/4 overflow-hidden rounded-lg bg-neutral-900 outline-offset-2 focus-visible:outline-2 focus-visible:outline-white sm:rounded-2xl"
            >
              {/* Plain <img>: the pictures come from Instagram's own servers,
                  which next/image would need configured as a remote pattern. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.image}
                alt=""
                loading="lazy"
                className="size-full object-cover transition duration-500 group-hover:scale-105 group-hover:brightness-110"
              />
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-center lg:mt-10">
        <a
          href={SOCIAL_LINKS.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-sm font-poppins text-xs text-white sm:text-base outline-offset-4 transition-colors hover:text-[#E79E3F] focus-visible:outline-2 focus-visible:outline-white sm:text-lg"
        >
          Follow us on Instagram
          <FaInstagram className="size-5" aria-hidden />
        </a>
      </p>
    </section>
  );
}
