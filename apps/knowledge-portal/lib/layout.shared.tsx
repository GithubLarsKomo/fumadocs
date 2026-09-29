import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="kp-nav-brand">
          <img className="kp-nav-logo" src="/brand/logo-dark.svg" alt="Ratzeburg AI Brain" />
        </span>
      ),
    },
  };
}
