'use client';

import { useEffect, useState } from 'react';
import type { KnowledgeSourceClass } from '@/lib/brain-navigation';

export interface StoredKnowledgeItem {
  url: string;
  title: string;
  sourceClass: KnowledgeSourceClass;
  viewedAt: string;
}

const RECENT_KEY = 'ratzeburg-ai-brain:recent:v1';
const FAVORITES_KEY = 'ratzeburg-ai-brain:favorites:v1';
const MAX_RECENT = 20;

export function KnowledgeHistoryControls({
  url,
  title,
  sourceClass,
}: {
  url: string;
  title: string;
  sourceClass: KnowledgeSourceClass;
}) {
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    const item: StoredKnowledgeItem = {
      url,
      title,
      sourceClass,
      viewedAt: new Date().toISOString(),
    };

    const recent = readItems(RECENT_KEY).filter((entry) => entry.url !== url);
    writeItems(RECENT_KEY, [item, ...recent].slice(0, MAX_RECENT));
    setFavorite(readItems(FAVORITES_KEY).some((entry) => entry.url === url));
  }, [sourceClass, title, url]);

  function toggleFavorite() {
    const current = readItems(FAVORITES_KEY);
    if (favorite) {
      writeItems(
        FAVORITES_KEY,
        current.filter((entry) => entry.url !== url),
      );
      setFavorite(false);
      return;
    }

    writeItems(FAVORITES_KEY, [
      {
        url,
        title,
        sourceClass,
        viewedAt: new Date().toISOString(),
      },
      ...current.filter((entry) => entry.url !== url),
    ]);
    setFavorite(true);
  }

  return (
    <button
      type="button"
      className="kp-favorite-button"
      data-active={favorite ? 'true' : 'false'}
      onClick={toggleFavorite}
      aria-pressed={favorite}
      title={favorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
    >
      <span aria-hidden="true">{favorite ? '★' : '☆'}</span>
      <span>{favorite ? 'Gemerkt' : 'Merken'}</span>
    </button>
  );
}

export function PersonalKnowledgePanel() {
  const [recent, setRecent] = useState<StoredKnowledgeItem[]>([]);
  const [favorites, setFavorites] = useState<StoredKnowledgeItem[]>([]);

  useEffect(() => {
    setRecent(readItems(RECENT_KEY).slice(0, 6));
    setFavorites(readItems(FAVORITES_KEY).slice(0, 6));
  }, []);

  if (recent.length === 0 && favorites.length === 0) return null;

  return (
    <section className="kp-personal">
      <div className="kp-home-section-heading">
        <div>
          <div className="kp-home-eyebrow">Personal view</div>
          <h2>Dein Arbeitskontext</h2>
        </div>
        <span>Nur lokal in diesem Browser gespeichert</span>
      </div>

      <div className="kp-personal-grid">
        <KnowledgeList title="Favoriten" items={favorites} empty="Noch keine Favoriten." />
        <KnowledgeList title="Zuletzt angesehen" items={recent} empty="Noch kein Verlauf." />
      </div>
    </section>
  );
}

function KnowledgeList({
  title,
  items,
  empty,
}: {
  title: string;
  items: StoredKnowledgeItem[];
  empty: string;
}) {
  return (
    <div className="kp-personal-card">
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p>{empty}</p>
      ) : (
        <div className="kp-personal-list">
          {items.map((item) => (
            <a key={item.url} href={item.url}>
              <span data-source-class={item.sourceClass}>{item.sourceClass}</span>
              <strong>{item.title}</strong>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function readItems(key: string): StoredKnowledgeItem[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter(isStoredKnowledgeItem);
  } catch {
    return [];
  }
}

function writeItems(key: string, items: StoredKnowledgeItem[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // Personal convenience data is best-effort only.
  }
}

function isStoredKnowledgeItem(value: unknown): value is StoredKnowledgeItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.url === 'string' &&
    typeof item.title === 'string' &&
    typeof item.viewedAt === 'string' &&
    (item.sourceClass === 'canonical' ||
      item.sourceClass === 'evidence' ||
      item.sourceClass === 'derived')
  );
}
