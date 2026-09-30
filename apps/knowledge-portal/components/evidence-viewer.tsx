import type { GoogleDriveFileRef } from 'fumadocs-google-drive';

const imageMimeTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);
const previewMimeTypes = new Set([...imageMimeTypes, 'application/pdf']);

export function EvidenceViewer({ file }: { file: GoogleDriveFileRef }) {
  const previewUrl = `/api/drive/files/${encodeURIComponent(file.id)}`;
  const canPreview = previewMimeTypes.has(file.mimeType);

  return (
    <section className="kp-evidence-viewer" aria-label="Evidence Vorschau">
      <div className="kp-evidence-viewer-head">
        <div>
          <span className="kp-home-eyebrow">Evidence viewer</span>
          <h2>{file.name}</h2>
        </div>
        {file.webViewLink ? (
          <a href={file.webViewLink} target="_blank" rel="noreferrer">
            Original in Drive öffnen ↗
          </a>
        ) : null}
      </div>

      {imageMimeTypes.has(file.mimeType) ? (
        <div className="kp-evidence-image-frame">
          <img src={previewUrl} alt={file.name} />
        </div>
      ) : file.mimeType === 'application/pdf' ? (
        <div className="kp-evidence-pdf-frame">
          <iframe src={previewUrl} title={file.name} />
        </div>
      ) : (
        <div className="kp-evidence-placeholder">
          <strong>Inline-Vorschau für diesen Dateityp noch nicht verfügbar.</strong>
          <span>{file.mimeType}</span>
          {file.webViewLink ? (
            <a href={file.webViewLink} target="_blank" rel="noreferrer">
              In Google Drive öffnen
            </a>
          ) : null}
        </div>
      )}

      <div className="kp-evidence-meta">
        <span>{canPreview ? 'Inline preview' : 'Linked evidence'}</span>
        <span>{file.mimeType}</span>
        {file.modifiedTime ? <span>Stand {file.modifiedTime.slice(0, 10)}</span> : null}
      </div>
    </section>
  );
}
