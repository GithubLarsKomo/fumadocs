import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { BrainSwitcher, SourceBoundaryNote } from '@/components/brain-switcher';
import { getDriveSource } from '@/lib/drive-source';
import { baseOptions } from '@/lib/layout.shared';

export const dynamic = 'force-dynamic';

export default async function DriveLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const source = await getDriveSource();

  return (
    <DocsLayout
      tree={source.getPageTree()}
      {...baseOptions()}
      sidebar={{
        banner: <BrainSwitcher activeId="drive" />,
        footer: <SourceBoundaryNote />,
      }}
    >
      {children}
    </DocsLayout>
  );
}
