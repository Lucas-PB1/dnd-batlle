'use client';

import { cn } from '@/lib/cn';

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: readonly Tab[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeId, onChange, className }: TabsProps) {
  return (
    <div
      className={cn(
        'border-card-border -mx-1 flex snap-x snap-mandatory gap-1 overflow-x-auto rounded-xl border bg-stone-950/40 p-1 [scrollbar-width:none] sm:mx-0 [&::-webkit-scrollbar]:hidden',
        className,
      )}
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeId === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'min-h-9 snap-start rounded-lg px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition sm:text-sm',
            activeId === tab.id
              ? 'bg-accent text-stone-950 shadow-sm'
              : 'text-muted hover:text-foreground hover:bg-white/5',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
