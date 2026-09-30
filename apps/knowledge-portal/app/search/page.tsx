import type { Metadata } from 'next';
import { FacetedSearch } from '@/components/faceted-search';
import { getBrainNavigation } from '@/lib/brain-navigation';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Knowledge Search',
  description: 'Facettierte Suche über kanonisches Wissen, Evidence und Derived Retrieval.',
};

export default async function SearchPage() {
  const sources = await getBrainNavigation();

  return (
    <main className="kp-tool-page">
      <header className="kp-tool-header">
        <div className="kp-home-eyebrow">Knowledge Portal v6</div>
        <h1>Knowledge Search</h1>
        <p>
          Suche über Child Brains, Drive Evidence und den optionalen Adaptive-Brain-Kanal. Filter
          ändern nur die Sicht, nicht die Autorität der Quellen.
        </p>
      </header>
      <FacetedSearch sources={sources} />
    </main>
  );
}
