import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Markdown } from 'fumadocs-core/content/md';
import { getTableOfContents } from 'fumadocs-core/content/toc';
import { DocsBody, DocsPage } from 'fumadocs-ui/layouts/docs/page';
import { BrainDocumentHeader } from '@/components/brain-document-header';
import { getEnabledFederationBrain } from '@/lib/federation';
import { getGitHubBrainSource } from '@/lib/github-brains';
import { prepareBrainMarkdown } from '@/lib/brain-markdown';

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
      <DocsPage toc={[]} className="kp-doc-page" breadcrumb={{ enabled: false }}>
        <BrainDocumentHeader
          brainLabel={brain.label}
          title={brain.label}
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

  return (
    <DocsPage toc={toc} className="kp-doc-page" breadcrumb={{ enabled: false }}>
      <BrainDocumentHeader
        brainLabel={brain.label}
        title={title}
        description={page.data.description}
        sourceType={page.data.sourceType}
        sourceRevision={page.data.sourceRevision}
        sourceUrl={page.data.sourceUrl}
        sectionPath={slug.slice(0, -1)}
      />
      <DocsBody className="kp-doc-body">
        <Markdown>{presentation.body}</Markdown>
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
