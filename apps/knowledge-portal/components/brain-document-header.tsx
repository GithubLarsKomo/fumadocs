import { DocsDescription, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { DocumentActions } from '@/components/document-actions';
import { KnowledgeHistoryControls } from '@/components/knowledge-history';
import { BrainGlyph, KnowledgeMark } from '@/components/knowledge-visuals';
import { KnowledgeStatus } from '@/components/knowledge-status';

interface BrainDocumentHeaderProps {
  brainId: string;
  brainLabel: string;
  title: string;
  currentUrl: string;
  description?: string;
  sourceType?: string;
  sourceRevision?: string;
  sourceUrl?: string;
  sectionPath?: string[];
}

export function BrainDocumentHeader({
  brainId,
  brainLabel,
  title,
  currentUrl,
  description,
  sourceType,
  sourceRevision,
  sourceUrl,
  sectionPath = [],
}: BrainDocumentHeaderProps) {
  return (
    <header className="kp-document-header">
      <div className="kp-document-watermark" aria-hidden="true">
        <KnowledgeMark className="kp-document-watermark-mark" />
      </div>

      <nav className="kp-context-path" aria-label="Dokumentpfad">
        <span>Knowledge Portal</span>
        <span aria-hidden="true">/</span>
        <span>{brainLabel}</span>
        {sectionPath.map((segment) => (
          <span key={segment} className="contents">
            <span aria-hidden="true">/</span>
            <span>{humanize(segment)}</span>
          </span>
        ))}
      </nav>

      <div className="kp-document-title-row">
        <div className="kp-document-heading">
          <div className="kp-document-heading-line">
            <BrainGlyph id={brainId} label={brainLabel} className="kp-document-brain-glyph" />
            <DocsTitle className="kp-document-title">{title}</DocsTitle>
          </div>
          {description ? (
            <DocsDescription className="kp-document-description">{description}</DocsDescription>
          ) : null}
        </div>
        <div className="kp-document-toolbar">
          <KnowledgeHistoryControls url={currentUrl} title={title} sourceClass="canonical" />
          <DocumentActions sourceUrl={sourceUrl} />
        </div>
      </div>

      <KnowledgeStatus
        sourceClass="canonical"
        sourceType={sourceType ?? 'github-brain'}
        sourceRevision={sourceRevision}
      />
    </header>
  );
}

function humanize(value: string): string {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
