import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { KnowledgeMark } from '@/components/knowledge-visuals';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="kp-nav-brand">
          <KnowledgeMark className="kp-nav-mark" />
          <span className="kp-nav-brand-copy">
            <span className="kp-nav-brand-name">Ratzeburg AI</span>
            <span className="kp-nav-brand-product">Knowledge Portal</span>
          </span>
        </span>
      ),
    },
  };
}
