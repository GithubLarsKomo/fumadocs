import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Markdown } from 'fumadocs-core/content/md';
import { getTableOfContents } from 'fumadocs-core/content/toc';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { KnowledgeStatus } from '@/components/knowledge-status';
import { getEnabledFederationBrain } from '@/lib/federation';
import { getGitHubBrainSource } from '@/lib/github-brains';

export const dynamic = 'force-dynamic';

interface BrainPageProps {
  params: Promise<{
    brainId: string;
    slug?: string[];
  }>;
}

export default async function BrainPage({ params }: BrainPageProps) {
  const { brainId, slug = [] } = await params;
  const [brain, source] = await Promise.all([
    getEnabledFederationBrain(brainId),
    getGitHubBrainSource(brainId),
  ]);

  if (!brain || !source) notFound();

  const page = source.getPage(slug);

  if (!page) {
    if (slug.length > 0) notFound();

    return (
      <DocsPage toc={[]}>
        <DocsTitle>{brain.label}</DocsTitle>
        {brain.scope ? <DocsDescription>{brain.scope}</DocsDescription> : null}
        <KnowledgeStatus sourceClass="canonical" sourceType="github-brain" />
        <DocsBody>
          <p>
            Dieser Bereich wird read-only aus dem kanonischen Project-Memory des registrierten Child
            Brains projiziert.
          </p>
        </DocsBody>
      </DocsPage>
    );
  }

  const loaded = await page.data.load();
  const toc = getTableOfContents(loaded.content);

  return (
    <DocsPage toc={toc}>
      <DocsTitle>{page.data.title}</DocsTitle>
      {page.data.description ? <DocsDescription>{page.data.description}</DocsDescription> : null}
      <KnowledgeStatus
        sourceClass="canonical"
        sourceType={page.data.sourceType}
        sourceRevision={page.data.sourceRevision}
      />
      <DocsBody>
        <Markdown>{loaded.content}</Markdown>
      </DocsBody>
    </DocsPage>
  );
}

export async function generateMetadata({ params }: BrainPageProps): Promise<Metadata> {
  const { brainId, slug = [] } = await params;
  const [brain, source] = await Promise.all([
    getEnabledFederationBrain(brainId),
    getGitHubBrainSource(brainId),
  ]);

  if (!brain || !source) {
    return {
      title: 'Nicht gefunden',
    };
  }

  const page = source.getPage(slug);

  return {
    title: page?.data.title ?? brain.label,
    description: page?.data.description ?? brain.scope,
  };
}
