import { getTestimonials } from "@/lib/publicApi";
import { SectionHeader } from "../PageHeader";
import { TestimonialCarousel } from "./TestimonialCarousel";
import { devSampleTestimonials } from "./samples";

// "What Our Clients Have To Say": testimonials from the backend, in admin
// display order, shown a screenful at a time (see TestimonialCarousel).
// Nothing is rendered until there's at least one testimonial.
export async function Testimonials() {
  const fetched = await getTestimonials().catch(() => []);
  // While developing, sample cards stand in until real testimonials exist.
  const testimonials = fetched.length > 0 ? fetched : devSampleTestimonials();
  if (testimonials.length === 0) return null;

  return (
    <section className="site-container py-14 lg:py-20">
      <SectionHeader
        label="Testimonials"
        title="What Our Clients Have To Say"
        intro="Honest words from the organisers, couples and brands we’ve shared a stage with."
      />
      <TestimonialCarousel
        testimonials={testimonials.map(({ id, clientName, companyName, testimony, image }) => ({
          id,
          name: clientName,
          company: companyName,
          testimony,
          image,
        }))}
      />
    </section>
  );
}
