'use client';

import { useMemo, useState } from 'react';
import type { BrainNavigationItem, KnowledgeSourceClass } from '@/lib/brain-navigation';
import type { KnowledgeSearchResult } from '@/lib/search/knowledge-search';

interface FacetedSearchProps {
  sources: BrainNavigationItem[];
}

const classLabels: Record<KnowledgeSourceClass | 'all', string> = {
  all: 'Alle',
  canonical: 'Canonical',
  evidence: 'Evidence',
  derived: 'Derived',
};

export function FacetedSearch({ sources }: FacetedSearchProps) {
  const [query, setQuery] = useState('');
  const [sourceClass, setSourceClass] = useState<KnowledgeSourceClass | 'all'>('all');
  const [sourceId, setSourceId] = useState('all');
  const [results, setResults] = useState<KnowledgeSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const filteredSources = useMemo(
    () =>
      sources.filter((source) => sourceClass === 'all' || source.sourceClass === sourceClass),
    [sources, sourceClass],
  );

  async function runSearch(event?: React.FormEvent) {
    event?.preventDefault();
    const value = query.trim();
    if (!value) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const params = new URLSearchParams({ query: value, limit: '50' });
      if (sourceClass !== 'all') params.set('sourceClass', sourceClass);
      if (sourceId !== 'all') params.set('sourceId', sourceId);

      const response = await fetch(`/api/search?${params}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Search failed with HTTP ${response.status}`);
      setResults((await response.json()) as KnowledgeSearchResult[]);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="kp-search-workbench">
      <form className="kp-search-form" onSubmit={runSearch}>
        <label className="kp-search-query">
          <span>Suche</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Wissen, Projekt, Begriff …"
            autoComplete="off"
          />
        </label>
        <button type="submit" disabled={isLoading || !query.trim()}>
          {isLoading ? 'Suche …' : 'Suchen'}
        </button>
      </form>

      <div className="kp-search-facets" aria-label="Suchfilter">
        <div className="kp-search-class-filter">
          {(Object.keys(classLabels) as Array<KnowledgeSourceClass | 'all'>).map((value) => (
            <button
              key={value}
              type="button"
              data-active={sourceClass === value ? 'true' : 'false'}
              onClick={() => {
                setSourceClass(value);
                setSourceId('all');
              }}
            >
              {classLabels[value]}
            </button>
          ))}
        </div>

        <label className="kp-search-source-filter">
          <span>Quelle</span>
          <select value={sourceId} onChange={(event) => setSourceId(event.target.value)}>
            <option value="all">Alle Quellen</option>
            {filteredSources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.label}
              </option>
            ))}
            {sourceClass === 'derived' || sourceClass === 'all' ? (
              <option value="graph">Adaptive Brain</option>
            ) : null}
          </select>
        </label>
      </div>

      <div className="kp-search-result-summary">
        {hasSearched ? (
          <span>{results.length} Treffer</span>
        ) : (
          <span>Filter nach Authority und Quelle, ohne die Source-of-Truth-Grenzen zu verändern.</span>
        )}
      </div>

      <div className="kp-search-results">
        {results.map((result) => (
          <a key={result.id} href={result.url} className="kp-search-result">
            <div className="kp-search-result-meta">
              <span data-source-class={result.sourceClass}>{classLabels[result.sourceClass]}</span>
              <span>{result.sourceLabel}</span>
            </div>
            <strong>{String(result.content)}</strong>
            {result.breadcrumbs?.length ? (
              <span className="kp-search-result-breadcrumbs">
                {result.breadcrumbs.filter(Boolean).join(' · ')}
              </span>
            ) : null}
          </a>
        ))}

        {hasSearched && !isLoading && results.length === 0 ? (
          <div className="kp-search-empty">Keine Treffer für diese Filterkombination.</div>
        ) : null}
      </div>
    </section>
  );
}
