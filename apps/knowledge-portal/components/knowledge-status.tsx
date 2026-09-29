import type { GoogleDriveContentKind } from 'fumadocs-google-drive';
import type { KnowledgeSourceClass } from '@/lib/brain-navigation';

const sourceLabels: Record<KnowledgeSourceClass, string> = {
  canonical: 'Canonical',
  evidence: 'Evidence',
  derived: 'Derived',
};

const contentLabels: Record<GoogleDriveContentKind, string> = {
  markdown: 'Markdown',
  text: 'Text',
  evidence: 'Evidence file',
};

interface KnowledgeStatusProps {
  sourceClass: KnowledgeSourceClass;
  sourceType?: string;
  contentKind?: GoogleDriveContentKind;
  modifiedTime?: string;
  sourceRevision?: string;
}

export function KnowledgeStatus({
  sourceClass,
  sourceType,
  contentKind,
  modifiedTime,
  sourceRevision,
}: KnowledgeStatusProps) {
  const date = modifiedTime?.slice(0, 10);
  const revision = sourceRevision?.slice(0, 12);

  return (
    <div className="kp-status-row" aria-label="Quellenstatus">
      <span className="kp-status-authority">
        <span className="kp-source-dot" data-source-class={sourceClass} aria-hidden="true" />
        <span>{sourceLabels[sourceClass]}</span>
      </span>
      {sourceType ? (
        <>
          <span className="kp-status-separator" aria-hidden="true">·</span>
          <span className="kp-status-detail">{formatSourceType(sourceType)}</span>
        </>
      ) : null}
      {contentKind ? (
        <>
          <span className="kp-status-separator" aria-hidden="true">·</span>
          <span className="kp-status-detail">{contentLabels[contentKind]}</span>
        </>
      ) : null}
      {date ? (
        <>
          <span className="kp-status-separator" aria-hidden="true">·</span>
          <span className="kp-status-detail">Stand {date}</span>
        </>
      ) : null}
      {revision ? (
        <>
          <span className="kp-status-separator" aria-hidden="true">·</span>
          <span className="kp-status-detail kp-status-revision" title={sourceRevision}>
            Revision {revision}
          </span>
        </>
      ) : null}
    </div>
  );
}

function formatSourceType(sourceType: string): string {
  if (sourceType === 'google-drive') return 'Google Drive';
  if (sourceType === 'github-brain') return 'GitHub Child Brain';
  return sourceType;
}
