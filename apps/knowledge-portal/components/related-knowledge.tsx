import type { RelatedKnowledgeItem } from '@/lib/related-knowledge';

const classLabels = {
  canonical: 'Canonical',
  evidence: 'Evidence',
  derived: 'Derived',
} as const;

export function RelatedKnowledge({ items }: { items: RelatedKnowledgeItem[] }) {
  if (items.length === 0) return null;

  return (
    <aside className="kp-related" aria-label="Verwandtes Wissen">
      <div className="kp-related-heading">
        <div>
          <span className="kp-home-eyebrow">Knowledge connections</span>
          <h2>Verwandtes Wissen</h2>
        </div>
      </div>
      <div className="kp-related-list">
        {items.map((item) => (
          <a key={`${item.relation}:${item.url}`} href={item.url} className="kp-related-item">
            <span className="kp-related-relation">
              {item.relation === 'backlink' ? '↩ Backlink' : classLabels[item.sourceClass]}
            </span>
            <strong>{item.title}</strong>
            <span>{item.sourceLabel}</span>
          </a>
        ))}
      </div>
    </aside>
  );
}
