'use client';

import type { ReactNode } from 'react';
import { RootProvider } from 'fumadocs-ui/provider/next';
import KnowledgePortalSearch from '@/components/search';

export function KnowledgePortalProvider({ children }: { children: ReactNode }) {
  return (
    <RootProvider
      search={{
        SearchDialog: KnowledgePortalSearch,
      }}
    >
      {children}
    </RootProvider>
  );
}
