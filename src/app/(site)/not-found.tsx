import { NotFoundContent } from "@/components/site/NotFoundContent";

// 404 for public pages that exist as a route but have nothing to show — e.g. a
// blog post address whose post was deleted. It renders inside the public
// site's layout, so the navbar and footer are already there.
export default function NotFound() {
  return <NotFoundContent />;
}
