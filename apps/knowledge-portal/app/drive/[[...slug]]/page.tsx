import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Markdown } from 'fumadocs-core/content/md';
import { getTableOfContents } from 'fumadocs-core/content/toc';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { getDriveSource } from '@/lib/drive-source';

export const dynamic = 'force-dynamic';

interface DrivePageProps {
  params: Promise<{
    slug?: string[];
  }>;
}

export default async function DrivePage({ params }: DrivePageProps) {
  const { slug = [] } = await params;
  const source = await getDriveSource();
  const page = source.getPage(slug);

  if (!page) notFound();

  const loaded = await page.data.load();
  const toc = getTableOfContents(loaded.content);

  return (
    <DocsPage toc={toc}>
      <DocsTitle>{page.data.title}</DocsTitle>
      {page.data.description ? <DocsDescription>{page.data.description}</DocsDescription> : null}
      <DocsBody>
        <Markdown>{loaded.content}</Markdown>
      </DocsBody>
    </DocsPage>
  );
}

export async function generateMetadata({ params }: DrivePageProps): Promise<Metadata> {
  const { slug = [] } = await params;
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
