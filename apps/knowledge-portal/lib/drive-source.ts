import { dynamicLoader } from 'fumadocs-core/source';
import { googleDrive } from 'fumadocs-google-drive';
import { getGoogleDriveAccessToken } from '@/lib/service-account';

function getRootFolderId(): string {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!folderId) {
    throw new Error('GOOGLE_DRIVE_FOLDER_ID is not configured.');
  }

  return folderId;
}

let loader: ReturnType<typeof dynamicLoader> | undefined;

function getDriveLoader() {
  if (loader) return loader;

  const driveSource = googleDrive({
    rootFolderId: getRootFolderId(),
    driveId: process.env.GOOGLE_SHARED_DRIVE_ID || undefined,
    getAccessToken: getGoogleDriveAccessToken,
    sourceClass: 'evidence',
    staleTime: 60_000,
  });

  loader = dynamicLoader(driveSource, {
    baseUrl: '/drive',
  });

  return loader;
}

export async function getDriveSource() {
  return getDriveLoader().get();
}
