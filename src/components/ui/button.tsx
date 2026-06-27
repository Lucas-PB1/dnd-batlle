import { cn } from '@/lib/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50',
        variant === 'primary' &&
          'bg-accent text-stone-950 shadow-lg shadow-amber-900/20 hover:bg-amber-500',
        variant === 'secondary' &&
          'border-card-border bg-card text-foreground hover:border-accent/50 border',
        variant === 'ghost' && 'text-muted hover:text-foreground hover:bg-white/5',
        variant === 'danger' &&
          'border-danger/40 bg-danger/10 hover:bg-danger/20 border text-red-200',
        className,
      )}
      {...props}
    />
  );
}
