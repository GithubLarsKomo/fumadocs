import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Markdown } from 'fumadocs-core/content/md';
import { getTableOfContents } from 'fumadocs-core/content/toc';
import { DocsBody, DocsPage } from 'fumadocs-ui/layouts/docs/page';
import { BrainDocumentHeader } from '@/components/brain-document-header';
import { RelatedKnowledge } from '@/components/related-knowledge';
import { getEnabledFederationBrain } from '@/lib/federation';
import { getGitHubBrainSource } from '@/lib/github-brains';
import { prepareBrainMarkdown } from '@/lib/brain-markdown';
import { getRelatedKnowledge } from '@/lib/related-knowledge';

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

  const currentUrl = `/brains/${encodeURIComponent(brainId)}${
    slug.length ? `/${slug.map(encodeURIComponent).join('/')}` : ''
  }`;
  const page = source.getPage(slug);

  if (!page) {
    if (slug.length > 0) notFound();

    return (
      <DocsPage toc={[]} className="kp-doc-page" breadcrumb={{ enabled: false }}>
        <BrainDocumentHeader
          brainId={brainId}
          brainLabel={brain.label}
          title={brain.label}
          currentUrl={currentUrl}
          description={brain.scope}
          sourceType="github-brain"
        />
        <DocsBody className="kp-doc-body">
          <p>
            Dieser Bereich wird read-only aus dem kanonischen Project-Memory des registrierten Child
            Brains projiziert.
          </p>
        </DocsBody>
      </DocsPage>
    );
  }

  const loaded = await page.data.load();
  const presentation = prepareBrainMarkdown(loaded.content);
  const toc = getTableOfContents(presentation.body);
  const title = presentation.title ?? page.data.title;
  const related = await getRelatedKnowledge({
    title,
    currentUrl,
    brainId,
    limit: 8,
  });

  return (
    <DocsPage toc={toc} className="kp-doc-page" breadcrumb={{ enabled: false }}>
      <BrainDocumentHeader
        brainId={brainId}
        brainLabel={brain.label}
        title={title}
        currentUrl={currentUrl}
        description={page.data.description}
        sourceType={page.data.sourceType}
        sourceRevision={page.data.sourceRevision}
        sourceUrl={page.data.sourceUrl}
        sectionPath={slug.slice(0, -1)}
      />
      <DocsBody className="kp-doc-body">
        <Markdown>{presentation.body}</Markdown>
      </DocsBody>
      <RelatedKnowledge items={related} />
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
    return { title: 'Nicht gefunden' };
  }

  const page = source.getPage(slug);
  let title = page?.data.title ?? brain.label;

  if (page) {
    const loaded = await page.data.load();
    title = prepareBrainMarkdown(loaded.content).title ?? title;
  }

  return {
    title,
    description: page?.data.description ?? brain.scope,
  };
}
