'use client';

import { useEffect, useId } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/cn';

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          'border-card-border bg-card relative z-10 max-h-[min(90dvh,48rem)] w-full max-w-lg overflow-y-auto rounded-2xl border p-5 shadow-2xl shadow-black/40 sm:p-6',
          className,
        )}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold tracking-tight">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="text-muted mt-1 text-sm">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-foreground hover:bg-white/5 shrink-0 rounded-lg p-1.5 transition"
            aria-label="Fechar"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
