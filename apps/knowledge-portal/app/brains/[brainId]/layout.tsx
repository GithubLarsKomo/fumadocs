import { notFound } from 'next/navigation';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { BrainSwitcher, SourceBoundaryNote } from '@/components/brain-switcher';
import { getGitHubBrainSource } from '@/lib/github-brains';
import { baseOptions } from '@/lib/layout.shared';

export const dynamic = 'force-dynamic';

interface BrainLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    brainId: string;
  }>;
}

export default async function BrainLayout({ children, params }: BrainLayoutProps) {
  const { brainId } = await params;
  const source = await getGitHubBrainSource(brainId);

  if (!source) notFound();

  return (
    <DocsLayout
      tree={source.getPageTree()}
      {...baseOptions()}
      sidebar={{
        banner: <BrainSwitcher activeId={brainId} />,
        footer: <SourceBoundaryNote />,
      }}
    >
      {children}
    </DocsLayout>
  );
}
