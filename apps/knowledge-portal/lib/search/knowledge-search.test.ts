import { describe, expect, it } from 'vitest';
import type { KnowledgeSearchResult } from './knowledge-search';
import { matchesSourceId } from './knowledge-search';

function result(
  sourceClass: KnowledgeSearchResult['sourceClass'],
  sourceId: string,
): KnowledgeSearchResult {
  return {
    id: `${sourceClass}:${sourceId}`,
    url: '/example',
    type: 'page',
    content: 'Example',
    sourceClass,
    sourceId,
    sourceLabel: 'Example',
  };
}

describe('matchesSourceId', () => {
  it('treats drive as the aggregate Evidence facet', () => {
    expect(matchesSourceId(result('evidence', 'drive:chatgpt'), 'drive')).toBe(true);
    expect(matchesSourceId(result('canonical', 'coding'), 'drive')).toBe(false);
  });

  it('treats graph as the aggregate Derived facet', () => {
    expect(matchesSourceId(result('derived', 'graph:coding'), 'graph')).toBe(true);
    expect(matchesSourceId(result('evidence', 'drive:ai'), 'graph')).toBe(false);
  });

  it('matches canonical Brain IDs exactly', () => {
    expect(matchesSourceId(result('canonical', 'coding'), 'coding')).toBe(true);
    expect(matchesSourceId(result('canonical', 'leadership'), 'coding')).toBe(false);
  });
});
