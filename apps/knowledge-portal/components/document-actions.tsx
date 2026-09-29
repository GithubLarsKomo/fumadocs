'use client';

import { useState } from 'react';

interface DocumentActionsProps {
  sourceUrl?: string;
}

export function DocumentActions({ sourceUrl }: DocumentActionsProps) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="kp-document-actions" aria-label="Dokumentaktionen">
      {sourceUrl ? (
        <a
          className="kp-document-action"
          href={sourceUrl}
          target="_blank"
          rel="noreferrer noopener"
        >
          <SourceIcon />
          <span>Quelle</span>
        </a>
      ) : null}
      <button className="kp-document-action" type="button" onClick={copyLink}>
        <LinkIcon />
        <span>{copied ? 'Kopiert' : 'Link kopieren'}</span>
      </button>
    </div>
  );
}

function SourceIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path
        d="M7.5 5.5h-2a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2m-5-9h7v7m0-7-8 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path
        d="m8.25 11.75 3.5-3.5m-5.2 5.2-1.3 1.3a2.5 2.5 0 0 1-3.54-3.54l2.5-2.5a2.5 2.5 0 0 1 3.54 0m4.5 2.58a2.5 2.5 0 0 0 3.54 0l2.5-2.5a2.5 2.5 0 0 0-3.54-3.54l-1.3 1.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
