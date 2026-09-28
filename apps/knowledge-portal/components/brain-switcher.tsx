import { getBrainNavigation, type KnowledgeSourceClass } from '@/lib/brain-navigation';

const labels: Record<KnowledgeSourceClass, string> = {
  canonical: 'Canonical',
  evidence: 'Evidence',
  derived: 'Derived',
};

export function BrainSwitcher({ activeId }: { activeId?: string }) {
  const items = getBrainNavigation();

  return (
    <section aria-label="Wissensbereiche" className="kp-boundary-card">
      <div className="kp-section-kicker">Wissensbereiche</div>
      <div className="mt-2 flex flex-col gap-1">
        {items.map((item) => {
          const active = item.id === activeId;

          return (
            <a
              key={item.id}
              href={item.url}
              aria-current={active ? 'page' : undefined}
              className="kp-brain-link"
              data-active={active ? 'true' : 'false'}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-fd-foreground">{item.label}</span>
                {item.description ? (
                  <span className="mt-0.5 block text-xs leading-4 text-fd-muted-foreground">
                    {item.description}
                  </span>
                ) : null}
              </span>
              <span className="kp-source-badge" data-source-class={item.sourceClass}>
                {labels[item.sourceClass]}
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}

export function SourceBoundaryNote() {
  return (
    <div className="text-xs leading-5 text-fd-muted-foreground">
      Portal und Suche sind Delivery-Layer. Der angezeigte Quellenstatus bestimmt die Autorität.
    </div>
  );
}
