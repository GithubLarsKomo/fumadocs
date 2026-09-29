import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Markdown } from 'fumadocs-core/content/md';
import { getTableOfContents } from 'fumadocs-core/content/toc';
import { DocsBody, DocsPage } from 'fumadocs-ui/layouts/docs/page';
import { DriveDocumentHeader } from '@/components/drive-document-header';
import {
  driveRootUrl,
  findDriveRootByRoute,
  getDriveRoots,
  type DriveRootConfig,
} from '@/lib/drive-config';
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
    const roots = getDriveRoots();

    return (
      <DocsPage toc={[]} className="kp-doc-page" breadcrumb={{ enabled: false }}>
        <DriveDocumentHeader
          title="Drive Evidence"
          description="Read-only Zugriff auf freigegebene Wissensquellen und Originalartefakte."
        />
        <DocsBody className="kp-doc-body">
          <p>Wähle links ein Dokument oder einen freigegebenen Google-Drive-Bereich aus.</p>
          {roots.length > 1 ? (
            <div className="kp-drive-root-grid">
              {roots.map((root) => (
                <a key={root.id} href={driveRootUrl(root)} className="kp-drive-root-card">
                  <span className="kp-drive-root-title">{root.label}</span>
                  {root.description ? (
                    <span className="kp-drive-root-description">{root.description}</span>
                  ) : null}
                  <span className="kp-home-card-arrow" aria-hidden="true">
                    →
                  </span>
                </a>
              ))}
            </div>
          ) : null}
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

  const root = findDriveRootByRoute(slug);
  if (root) return <DriveRootLanding root={root} />;

  const source = await getDriveSource();
  const page = source.getPage(slug);

  if (!page) notFound();

  const loaded = await page.data.load();
  const toc = getTableOfContents(loaded.content);

  return (
    <DocsPage toc={toc} className="kp-doc-page" breadcrumb={{ enabled: false }}>
      <DriveDocumentHeader
        title={page.data.title}
        description={page.data.description}
        sourceType={page.data.sourceType}
        contentKind={page.data.contentKind}
        modifiedTime={page.data.driveFile.modifiedTime}
      />
      <DocsBody className="kp-doc-body">
        <Markdown>{loaded.content}</Markdown>
      </DocsBody>
    </DocsPage>
  );
}

function DriveRootLanding({ root }: { root: DriveRootConfig }) {
  return (
    <DocsPage toc={[]} className="kp-doc-page" breadcrumb={{ enabled: false }}>
      <DriveDocumentHeader
        title={root.label}
        description={root.description ?? 'Freigegebener Google-Drive-Wissensbereich.'}
      />
      <DocsBody className="kp-doc-body">
        <p>
          Dieser Bereich wird read-only aus dem konfigurierten Google-Drive-Ordner projiziert.
          Wähle links einen Unterordner oder ein Dokument aus.
        </p>
        <p>
          Google Drive bleibt Eigentümer der Quelldokumente; diese Portalroute ist nur die stabile
          Einstiegsebene für den freigegebenen Root.
        </p>
        <p>
          <a href="/drive">← Zur Übersicht aller Drive-Bereiche</a>
        </p>
      </DocsBody>
    </DocsPage>
  );
}

export async function generateMetadata({ params }: DrivePageProps): Promise<Metadata> {
  const { slug = [] } = await params;

  if (slug.length === 0) {
    return {
      title: 'Drive Evidence',
      description: 'Read-only Zugriff auf freigegebene Wissensquellen und Originalartefakte.',
    };
  }

  const root = findDriveRootByRoute(slug);
  if (root) {
    return {
      title: root.label,
      description: root.description ?? 'Freigegebener Google-Drive-Wissensbereich.',
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
