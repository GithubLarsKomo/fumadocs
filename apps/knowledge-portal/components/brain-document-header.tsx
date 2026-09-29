import { DocsDescription, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { DocumentActions } from '@/components/document-actions';
import { KnowledgeStatus } from '@/components/knowledge-status';

interface BrainDocumentHeaderProps {
  brainLabel: string;
  title: string;
  description?: string;
  sourceType?: string;
  sourceRevision?: string;
  sourceUrl?: string;
  sectionPath?: string[];
}

export function BrainDocumentHeader({
  brainLabel,
  title,
  description,
  sourceType,
  sourceRevision,
  sourceUrl,
  sectionPath = [],
}: BrainDocumentHeaderProps) {
  return (
    <header className="kp-document-header">
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
          <DocsTitle className="kp-document-title">{title}</DocsTitle>
          {description ? (
            <DocsDescription className="kp-document-description">{description}</DocsDescription>
          ) : null}
        </div>
        <DocumentActions sourceUrl={sourceUrl} />
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
