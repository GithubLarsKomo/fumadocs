export type KnowledgeSourceClass = 'canonical' | 'evidence' | 'derived';

export interface BrainNavigationItem {
  id: string;
  label: string;
  url: string;
  sourceClass: KnowledgeSourceClass;
  description?: string;
}

const defaultItems: BrainNavigationItem[] = [
  {
    id: 'drive',
    label: 'Drive Evidence',
    url: '/drive',
    sourceClass: 'evidence',
    description: 'Freigegebene Quelldokumente',
  },
];

function isSourceClass(value: unknown): value is KnowledgeSourceClass {
  return value === 'canonical' || value === 'evidence' || value === 'derived';
}

function isNavigationItem(value: unknown): value is BrainNavigationItem {
  if (!value || typeof value !== 'object') return false;

  const item = value as Record<string, unknown>;
  return (
    typeof item.id === 'string' &&
    item.id.length > 0 &&
    typeof item.label === 'string' &&
    item.label.length > 0 &&
    typeof item.url === 'string' &&
    item.url.length > 0 &&
    isSourceClass(item.sourceClass) &&
    (item.description === undefined || typeof item.description === 'string')
  );
}

export function getBrainNavigation(): BrainNavigationItem[] {
  const configured = process.env.KNOWLEDGE_PORTAL_BRAINS_JSON;
  if (!configured) return defaultItems;

  try {
    const parsed: unknown = JSON.parse(configured);
    if (!Array.isArray(parsed)) throw new Error('Expected a JSON array.');

    const items = parsed.filter(isNavigationItem);
    if (items.length === 0) throw new Error('No valid navigation items were configured.');

    const deduplicated = new Map(items.map((item) => [item.id, item]));
    return Array.from(deduplicated.values());
  } catch (error) {
    console.error('Ignoring invalid KNOWLEDGE_PORTAL_BRAINS_JSON configuration.', error);
    return defaultItems;
  }
}
