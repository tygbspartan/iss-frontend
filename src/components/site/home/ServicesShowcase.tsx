import { getServices } from "@/lib/publicApi";
import { SectionHeader } from "../PageHeader";
import { ServiceScroller } from "./ServiceScroller";

// "What We Offer". On desktop the section pins to the screen while you scroll:
// the heading and the list of services stay put and the services' images
// scroll past on the right (see ServiceScroller for how). On tablets and
// phones it's a plain stacked list.
export async function ServicesShowcase() {
  const services = await getServices().catch(() => []);
  if (services.length === 0) return null;

  return (
    // id="services": the target of the "Services" links (see SERVICES_HREF).
    <section id="services" className="site-container pb-14 lg:pb-20">
      <ServiceScroller
        header={
          <SectionHeader
            label="Our Services"
            title="What We Offer"
            intro={null}
          />
        }
        services={services.map(({ id, title, slug, description, image }) => ({
          id,
          title,
          slug,
          description,
          image,
        }))}
      />
    </section>
  );
}
