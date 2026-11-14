import { permanentRedirect } from "next/navigation";

// The projects listing used to be planned at /work; it lives at /projects now.
// Old links (including ones with ?service=…) are sent on there.
export default async function WorkPage({ searchParams }: PageProps<"/work">) {
  const { service } = await searchParams;
  permanentRedirect(typeof service === "string" && service ? `/projects?service=${encodeURIComponent(service)}` : "/projects");
}
