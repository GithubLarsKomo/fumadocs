import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Markdown } from 'fumadocs-core/content/md';
import { getTableOfContents } from 'fumadocs-core/content/toc';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { KnowledgeStatus } from '@/components/knowledge-status';
import { getDriveSource } from '@/lib/drive-source';

export const dynamic = 'force-dynamic';

interface DrivePageProps {
  params: Promise<{
    slug?: string[];
  }>;
}

export default async function DrivePage({ params }: DrivePageProps) {
  const { slug = [] } = await params;

  if (slug.length === 0) {
    return (
      <DocsPage toc={[]}>
        <DocsTitle>Knowledge Portal</DocsTitle>
        <DocsDescription>Read-only Zugriff auf freigegebene Wissensquellen.</DocsDescription>
        <KnowledgeStatus sourceClass="evidence" sourceType="google-drive" />
        <DocsBody>
          <p>Wähle links ein Dokument aus dem freigegebenen Google-Drive-Bereich aus.</p>
          <p>
            Google Drive bleibt Eigentümer der Quelldokumente. Eine Übernahme in kanonisches Wissen
            erfolgt nicht automatisch.
          </p>
          <p>
            Wichtige visuelle und binäre Artefakte liegen im verbundenen Drive-Bereich (bevorzugt
            unter <code>Assets/</code>) und werden hier als Evidence mit Link zum Original
            bereitgestellt.
          </p>
        </DocsBody>
      </DocsPage>
    );
  }

  const source = await getDriveSource();
  const page = source.getPage(slug);

  if (!page) notFound();

  const loaded = await page.data.load();
  const toc = getTableOfContents(loaded.content);

  return (
    <DocsPage toc={toc}>
      <DocsTitle>{page.data.title}</DocsTitle>
      {page.data.description ? <DocsDescription>{page.data.description}</DocsDescription> : null}
      <KnowledgeStatus
        sourceClass="evidence"
        sourceType={page.data.sourceType}
        contentKind={page.data.contentKind}
        modifiedTime={page.data.driveFile.modifiedTime}
      />
      <DocsBody>
        <Markdown>{loaded.content}</Markdown>
      </DocsBody>
    </DocsPage>
  );
}

export async function generateMetadata({ params }: DrivePageProps): Promise<Metadata> {
  const { slug = [] } = await params;

  if (slug.length === 0) {
    return {
      title: 'Knowledge Portal',
      description: 'Read-only Zugriff auf freigegebene Wissensquellen.',
    };
  }

  const source = await getDriveSource();
  const page = source.getPage(slug);

  if (!page) {
    return {
      title: 'Nicht gefunden',
    };
  }

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
