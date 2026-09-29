import { dynamicLoader } from 'fumadocs-core/source';
import { googleDrive } from 'fumadocs-google-drive';
import { getDriveRoots } from '@/lib/drive-config';
import { getGoogleDriveAccessToken } from '@/lib/service-account';

type DriveSource = ReturnType<typeof googleDrive>;
type DriveLoader = ReturnType<typeof dynamicLoader>;

let cache:
  | {
      key: string;
      loader: DriveLoader;
    }
  | undefined;

function getDriveLoader(): DriveLoader {
  const roots = getDriveRoots();
  const globalDriveId = process.env.GOOGLE_SHARED_DRIVE_ID || undefined;
  const key = JSON.stringify({ roots, globalDriveId });

  if (cache?.key === key) return cache.loader;

  const sources = roots.map((root) => ({
    root,
    source: googleDrive({
      rootFolderId: root.id,
      driveId: root.driveId ?? globalDriveId,
      getAccessToken: getGoogleDriveAccessToken,
      sourceClass: 'evidence',
      baseDir: root.routePrefix || undefined,
      staleTime: 60_000,
    }),
  }));

  const aggregateSource = {
    cache: 'memory' as const,
    staleTime: 60_000,
    async files() {
      const batches = await Promise.all(
        sources.map(async ({ root, source }) => {
          try {
            const files = await source.files();

            if (!root.routePrefix) return files;

            return [
              {
                type: 'meta' as const,
                path: `${root.routePrefix}/meta.json`,
                data: {
                  title: root.label,
                },
              },
              ...files,
            ];
          } catch (error) {
            console.error(
              `Google Drive root "${root.label}" is unavailable; skipping this root.`,
              error,
            );
            return [];
          }
        }),
      );

      return batches.flat();
    },
    invalidate() {
      for (const { source } of sources) source.invalidate?.();
    },
  };

  const loader = dynamicLoader(aggregateSource as DriveSource, {
    baseUrl: '/drive',
  });

  cache = { key, loader };
  return loader;
}

export async function getDriveSource() {
  return getDriveLoader().get();
}
