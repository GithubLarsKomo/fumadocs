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
}

export function KnowledgeStatus({
  sourceClass,
  sourceType,
  contentKind,
  modifiedTime,
}: KnowledgeStatusProps) {
  const date = modifiedTime?.slice(0, 10);

  return (
    <div className="kp-status-row" aria-label="Quellenstatus">
      <span className="kp-source-badge" data-source-class={sourceClass}>
        {sourceLabels[sourceClass]}
      </span>
      {sourceType ? <span className="kp-status-detail">{formatSourceType(sourceType)}</span> : null}
      {contentKind ? <span className="kp-status-detail">{contentLabels[contentKind]}</span> : null}
      {date ? <span className="kp-status-detail">Stand {date}</span> : null}
    </div>
  );
}

function formatSourceType(sourceType: string): string {
  if (sourceType === 'google-drive') return 'Google Drive';
  return sourceType;
}
