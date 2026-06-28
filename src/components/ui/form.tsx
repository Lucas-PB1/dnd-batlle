import { cn } from '@/lib/cn';

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'border-card-border text-foreground placeholder:text-muted focus:border-accent/60 min-h-11 w-full rounded-lg border bg-stone-950/60 px-3 py-2.5 text-base transition outline-none sm:text-sm',
        props.className,
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        'border-card-border text-foreground focus:border-accent/60 min-h-11 w-full rounded-lg border bg-stone-950/60 px-3 py-2.5 text-base transition outline-none sm:text-sm',
        props.className,
      )}
    />
  );
}

export function Label({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        'text-muted mb-1 block text-xs font-medium tracking-wide uppercase',
        className,
      )}
    >
      {children}
    </label>
  );
}

export function Badge({
  children,
  tone = 'default',
}: {
  children: React.ReactNode;
  tone?: 'default' | 'success' | 'warning';
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        tone === 'default' && 'bg-stone-800 text-stone-200',
        tone === 'success' && 'bg-green-900/40 text-green-300',
        tone === 'warning' && 'bg-amber-900/40 text-amber-200',
      )}
    >
      {children}
    </span>
  );
}
