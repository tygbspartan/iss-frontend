import { CursorFollower } from "@/components/site/CursorFollower";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { getServices } from "@/lib/publicApi";

// Public website shell: dark left-to-right gradient page, navbar, full-width footer.
// The services are loaded here for the navbar's Services dropdown; if the
// backend can't be reached the dropdown is simply left out.
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const services = await getServices().catch(() => []);

  return (
    <div className="site-root flex min-h-dvh flex-1 flex-col bg-[image:var(--site-gradient)] font-montserrat text-white [color-scheme:dark]">
      <Navbar services={services.map(({ title, slug, description }) => ({ title, slug, description }))} />
      <main className="flex-1">{children}</main>
      <Footer />
      {/* The circle that trails the mouse and labels what can be dragged or opened. */}
      <CursorFollower />
    </div>
  );
}
