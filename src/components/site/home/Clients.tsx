import { getClients } from "@/lib/publicApi";
import { SectionHeader } from "../PageHeader";
import { ClientsMarquee } from "./ClientsMarquee";
import { devSampleClients } from "./samples";

const MIN_CARDS_PER_LOOP = 8; // enough cards to fill even a very wide screen

// "Trusted By": client logos from the backend in an endless, draggable row
// (see ClientsMarquee). The list is repeated until it's wider than any screen
// so the loop never shows a gap, however few clients there are. Nothing is
// rendered until there's at least one client.
export async function Clients() {
  const fetched = await getClients().catch(() => []);
  // While developing, sample cards stand in until real clients exist.
  const clients = fetched.length > 0 ? fetched : devSampleClients();
  if (clients.length === 0) return null;

  const repeats = Math.ceil(MIN_CARDS_PER_LOOP / clients.length);
  const loop = Array.from({ length: repeats }, (_, round) =>
    clients.map((client) => ({ key: `${client.id}-${round}`, name: client.companyName, image: client.image })),
  ).flat();

  return (
    <section className="py-14 lg:py-20">
      <div className="site-container">
        <SectionHeader
          label="Clients"
          title="Trusted By"
          intro="Brands, venues and organisers who count on us to make their events sound and look their best."
        />
      </div>
      <ClientsMarquee clients={loop} />
    </section>
  );
}
