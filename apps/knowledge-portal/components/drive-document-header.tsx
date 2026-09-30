import { DocsDescription, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import type { GoogleDriveContentKind } from 'fumadocs-google-drive';
import { KnowledgeHistoryControls } from '@/components/knowledge-history';
import { KnowledgeMark, SourceGlyph } from '@/components/knowledge-visuals';
import { KnowledgeStatus } from '@/components/knowledge-status';

interface DriveDocumentHeaderProps {
  title: string;
  currentUrl: string;
  description?: string;
  contentKind?: GoogleDriveContentKind;
  modifiedTime?: string;
  sourceType?: string;
}

export function DriveDocumentHeader({
  title,
  currentUrl,
  description,
  contentKind,
  modifiedTime,
  sourceType = 'google-drive',
}: DriveDocumentHeaderProps) {
  return (
    <header className="kp-document-header kp-evidence-header">
      <div className="kp-document-watermark" aria-hidden="true">
        <KnowledgeMark className="kp-document-watermark-mark" />
      </div>

      <nav className="kp-context-path" aria-label="Dokumentpfad">
        <span>Knowledge Portal</span>
        <span aria-hidden="true">/</span>
        <span>Drive Evidence</span>
      </nav>

      <div className="kp-document-title-row">
        <div className="kp-document-heading">
          <div className="kp-document-heading-line">
            <span className="kp-document-brain-glyph kp-evidence-glyph">
              <SourceGlyph sourceClass="evidence" />
            </span>
            <DocsTitle className="kp-document-title">{title}</DocsTitle>
          </div>
          {description ? (
            <DocsDescription className="kp-document-description">{description}</DocsDescription>
          ) : null}
        </div>
        <KnowledgeHistoryControls url={currentUrl} title={title} sourceClass="evidence" />
      </div>

      <KnowledgeStatus
        sourceClass="evidence"
        sourceType={sourceType}
        contentKind={contentKind}
        modifiedTime={modifiedTime}
      />
    </header>
  );
}
