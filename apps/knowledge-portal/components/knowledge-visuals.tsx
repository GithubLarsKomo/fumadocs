import type { KnowledgeSourceClass } from '@/lib/brain-navigation';

interface GlyphProps {
  className?: string;
}

export function KnowledgeMark({ className }: GlyphProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M13 15.5 24 9l11 6.5v13L24 39l-11-10.5v-13Z" className="kp-mark-shell" />
      <path d="m13 15.5 11 7.25 11-7.25M24 22.75V39" className="kp-mark-edge" />
      <path d="M24 9v13.75M13 28.5l11-5.75 11 5.75" className="kp-mark-edge kp-mark-edge-soft" />
      <circle cx="24" cy="9" r="3" className="kp-mark-node" />
      <circle cx="13" cy="15.5" r="3" className="kp-mark-node" />
      <circle cx="35" cy="15.5" r="3" className="kp-mark-node" />
      <circle cx="13" cy="28.5" r="3" className="kp-mark-node" />
      <circle cx="35" cy="28.5" r="3" className="kp-mark-node" />
      <circle cx="24" cy="39" r="3" className="kp-mark-node kp-mark-node-primary" />
      <circle cx="24" cy="22.75" r="3.5" className="kp-mark-core" />
    </svg>
  );
}

export function SourceGlyph({
  sourceClass,
  className,
}: GlyphProps & { sourceClass: KnowledgeSourceClass }) {
  if (sourceClass === 'evidence') {
    return (
      <svg
        aria-hidden="true"
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      >
        <path d="M7 3.75h7l3 3v13.5H7z" />
        <path d="M14 3.75v3h3M9.5 11h5M9.5 14.5h5" />
      </svg>
    );
  }

  if (sourceClass === 'derived') {
    return (
      <svg
        aria-hidden="true"
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      >
        <circle cx="6" cy="7" r="2.25" />
        <circle cx="18" cy="6" r="2.25" />
        <circle cx="16" cy="18" r="2.25" />
        <path d="m8.2 6.8 7.55-.55M7.4 8.8l7.2 7.35M17.7 8.2l-1.2 7.55" strokeDasharray="2.4 2.4" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <circle cx="12" cy="5" r="2.2" />
      <circle cx="6" cy="17" r="2.2" />
      <circle cx="18" cy="17" r="2.2" />
      <path d="m10.9 6.9-3.8 8M13.1 6.9l3.8 8M8.2 17h7.6" />
    </svg>
  );
}

export function BrainGlyph({
  id,
  label,
  className,
}: GlyphProps & { id: string; label?: string }) {
  const kind = brainGlyphKind(id, label);

  return (
    <span className={className} data-brain-glyph={kind} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65">
        {kind === 'code' ? (
          <>
            <path d="m9 7-5 5 5 5M15 7l5 5-5 5M13.5 4.5l-3 15" />
          </>
        ) : kind === 'shield' ? (
          <>
            <path d="M12 3.5 19 6v5.5c0 4.25-2.65 7.2-7 9-4.35-1.8-7-4.75-7-9V6z" />
            <path d="m9 12 2 2 4-4" />
          </>
        ) : kind === 'people' ? (
          <>
            <circle cx="12" cy="8" r="3" />
            <path d="M5.5 20c.7-4.1 2.85-6.1 6.5-6.1s5.8 2 6.5 6.1" />
          </>
        ) : kind === 'performance' ? (
          <>
            <path d="M3.5 13h4l2-5 3.2 9 2.2-6H20.5" />
          </>
        ) : kind === 'home' ? (
          <>
            <path d="m4 11 8-6.5 8 6.5" />
            <path d="M6.5 10v9h11v-9M10 19v-5h4v5" />
          </>
        ) : kind === 'book' ? (
          <>
            <path d="M4.5 5.5h5.2c1.25 0 2.3.55 2.3 1.8v11.2c0-1.25-1.05-1.8-2.3-1.8H4.5z" />
            <path d="M19.5 5.5h-5.2c-1.25 0-2.3.55-2.3 1.8v11.2c0-1.25 1.05-1.8 2.3-1.8h5.2z" />
          </>
        ) : (
          <>
            <circle cx="12" cy="5" r="2" />
            <circle cx="5.5" cy="16.5" r="2" />
            <circle cx="18.5" cy="16.5" r="2" />
            <path d="m11 6.8-4.4 7.8M13 6.8l4.4 7.8M7.5 16.5h9" />
          </>
        )}
      </svg>
    </span>
  );
}

function brainGlyphKind(id: string, label = ''): string {
  const value = `${id} ${label}`.toLowerCase();

  if (/coding|software|n8n|automation|adaptive|skillz/.test(value)) return 'code';
  if (/regulatory|compliance|legal|tax|investigation/.test(value)) return 'shield';
  if (/leadership|career|people/.test(value)) return 'people';
  if (/sport|performance|rowing|training/.test(value)) return 'performance';
  if (/home|household/.test(value)) return 'home';
  if (/novel|science|research|learning|writing|dossier|podozy|neurology|thought/.test(value)) {
    return 'book';
  }

  return 'network';
}
