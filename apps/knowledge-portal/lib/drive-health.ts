import type { DriveRootConfig } from '@/lib/drive-config';
import { getDriveRoots } from '@/lib/drive-config';
import { getGoogleDriveAccessToken } from '@/lib/service-account';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const FOLDER_MIME = 'application/vnd.google-apps.folder';

export type DriveRootAccessStatus = 'healthy' | 'empty' | 'unavailable';

export interface DriveRootAccess {
  id: string;
  label: string;
  routePrefix: string;
  status: DriveRootAccessStatus;
  directChildren?: number;
  detail: string;
}

interface DriveFileMetadata {
  id?: string;
  name?: string;
  mimeType?: string;
}

interface DriveFileList {
  files?: Array<{ id?: string }>;
  nextPageToken?: string;
}

export async function getDriveRootAccess(): Promise<DriveRootAccess[]> {
  const roots = getDriveRoots();
  const token = await getGoogleDriveAccessToken();

  return Promise.all(roots.map((root) => probeDriveRoot(root, token)));
}

export async function getSingleDriveRootAccess(root: DriveRootConfig): Promise<DriveRootAccess> {
  const token = await getGoogleDriveAccessToken();
  return probeDriveRoot(root, token);
}

async function probeDriveRoot(root: DriveRootConfig, token: string): Promise<DriveRootAccess> {
  const metadataUrl = new URL(`${DRIVE_API}/files/${encodeURIComponent(root.id)}`);
  metadataUrl.searchParams.set('supportsAllDrives', 'true');
  metadataUrl.searchParams.set('fields', 'id,name,mimeType');

  const metadataResponse = await fetch(metadataUrl, {
    headers: driveHeaders(token),
    cache: 'no-store',
    signal: AbortSignal.timeout(5_000),
  });

  if (!metadataResponse.ok) {
    return {
      id: root.id,
      label: root.label,
      routePrefix: root.routePrefix,
      status: 'unavailable',
      detail: accessFailureDetail(metadataResponse.status),
    };
  }

  const metadata = (await metadataResponse.json()) as DriveFileMetadata;
  if (metadata.mimeType !== FOLDER_MIME) {
    return {
      id: root.id,
      label: root.label,
      routePrefix: root.routePrefix,
      status: 'unavailable',
      detail: 'Configured Drive root is not a folder.',
    };
  }

  const listUrl = new URL(`${DRIVE_API}/files`);
  listUrl.searchParams.set('q', `'${escapeDriveQuery(root.id)}' in parents and trashed = false`);
  listUrl.searchParams.set('spaces', 'drive');
  listUrl.searchParams.set('pageSize', '100');
  listUrl.searchParams.set('supportsAllDrives', 'true');
  listUrl.searchParams.set('includeItemsFromAllDrives', 'true');
  listUrl.searchParams.set('fields', 'nextPageToken,files(id)');

  if (root.driveId) {
    listUrl.searchParams.set('corpora', 'drive');
    listUrl.searchParams.set('driveId', root.driveId);
  }

  const listResponse = await fetch(listUrl, {
    headers: driveHeaders(token),
    cache: 'no-store',
    signal: AbortSignal.timeout(5_000),
  });

  if (!listResponse.ok) {
    return {
      id: root.id,
      label: root.label,
      routePrefix: root.routePrefix,
      status: 'unavailable',
      detail: `Drive root is visible, but children cannot be listed (HTTP ${listResponse.status}).`,
    };
  }

  const listing = (await listResponse.json()) as DriveFileList;
  const directChildren = listing.files?.length ?? 0;

  return {
    id: root.id,
    label: root.label,
    routePrefix: root.routePrefix,
    status: directChildren > 0 || listing.nextPageToken ? 'healthy' : 'empty',
    directChildren,
    detail:
      directChildren > 0 || listing.nextPageToken
        ? 'Drive root and child listing are accessible to the portal service account.'
        : 'Drive root is accessible, but no direct children are visible to the portal service account.',
  };
}

function driveHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };
}

function accessFailureDetail(status: number): string {
  if (status === 404) {
    return 'Drive root is not visible to the portal service account. Share the configured root folder with the service account as Viewer.';
  }
  if (status === 403) {
    return 'Drive root access is forbidden for the portal service account. Check the folder permission and Drive policy.';
  }
  return `Drive root metadata request failed with HTTP ${status}.`;
}

function escapeDriveQuery(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}
