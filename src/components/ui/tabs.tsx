'use client';

import type { ComponentType, ReactNode, SVGProps } from 'react';
import { cn } from '@/lib/cn';

export interface Tab {
  id: string;
  label: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
}

interface TabsProps {
  tabs: readonly Tab[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  fill?: boolean;
}

interface TabPanelProps {
  className?: string;
  header?: ReactNode;
  headerClassName?: string;
  bodyClassName?: string;
  children: ReactNode;
}

export function TabPanel({
  className,
  header,
  headerClassName,
  bodyClassName,
  children,
}: TabPanelProps) {
  return (
    <section
      className={cn(
        'border-card-border/80 bg-card/40 overflow-hidden rounded-2xl border shadow-lg shadow-black/25',
        className,
      )}
    >
      {header != null && (
        <header
          className={cn(
            'border-card-border/70 bg-surface/60 border-b px-3 py-3 sm:px-4 sm:py-4',
            headerClassName,
          )}
        >
          {header}
        </header>
      )}
      <div className={cn('p-4 sm:p-6', bodyClassName)}>{children}</div>
    </section>
  );
}

export function Tabs({ tabs, activeId, onChange, className, fill = true }: TabsProps) {
  return (
    <div
      className={cn(
        'border-card-border/80 bg-surface/80 flex overflow-hidden rounded-xl border shadow-inner shadow-black/20',
        fill ? 'w-full' : 'w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
      role="tablist"
    >
      {tabs.map((tab, index) => {
        const active = activeId === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={tab.label}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative inline-flex min-h-11 items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold tracking-wide whitespace-nowrap transition sm:min-h-12 sm:px-4 sm:text-sm',
              fill ? 'flex-1' : 'shrink-0 snap-start',
              index > 0 && 'border-card-border/70 border-l',
              active
                ? 'bg-accent text-stone-950 shadow-[inset_0_-2px_0_rgba(0,0,0,0.15)]'
                : 'text-muted hover:text-foreground bg-surface/40 hover:bg-surface-elevated/80',
            )}
          >
            {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden />}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
