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

const driveSource = googleDrive({
  rootFolderId: getRootFolderId(),
  driveId: process.env.GOOGLE_SHARED_DRIVE_ID || undefined,
  getAccessToken: getGoogleDriveAccessToken,
  sourceClass: 'evidence',
  staleTime: 60_000,
});

const driveLoader = dynamicLoader(driveSource, {
  baseUrl: '/drive',
});

export async function getDriveSource() {
  return driveLoader.get();
}
