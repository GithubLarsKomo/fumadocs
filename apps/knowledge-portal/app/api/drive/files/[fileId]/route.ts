import { getDriveSource } from '@/lib/drive-source';
import { getGoogleDriveAccessToken } from '@/lib/service-account';

const previewMimeTypes = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp']);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await params;
  const source = await getDriveSource();
  const page = source.getPages().find((candidate) => candidate.data.driveFile.id === fileId);

  if (!page) return new Response('Not found', { status: 404 });

  const file = page.data.driveFile;
  if (!previewMimeTypes.has(file.mimeType)) {
    return new Response('Preview not supported for this file type.', { status: 415 });
  }

  const token = await getGoogleDriveAccessToken();
  const url = new URL(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}`);
  url.searchParams.set('alt', 'media');
  url.searchParams.set('supportsAllDrives', 'true');

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: file.mimeType,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    return new Response('Drive preview unavailable.', { status: response.status });
  }

  return new Response(response.body, {
    status: 200,
    headers: {
      'content-type': file.mimeType,
      'cache-control': 'private, max-age=60',
      'content-disposition': `inline; filename="${safeFilename(file.name)}"`,
      'x-content-type-options': 'nosniff',
    },
  });
}

function safeFilename(value: string): string {
  return value.replace(/[\r\n"]/g, '_');
}
