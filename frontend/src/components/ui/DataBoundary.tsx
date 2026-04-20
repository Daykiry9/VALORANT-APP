import type { ReactNode } from 'react';
import { AlertCircle, Inbox, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DataBoundaryProps {
  loading?: boolean;
  error?: Error | string | null;
  empty?: boolean;
  emptyMessage?: string;
  children: ReactNode;
  className?: string;
  skeleton?: ReactNode;
}

export function DataBoundary({
  loading,
  error,
  empty,
  emptyMessage = 'Sin datos todavía',
  children,
  className,
  skeleton,
}: DataBoundaryProps) {
  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-12 text-text-secondary', className)}>
        {skeleton || (
          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-wider">
            <Loader2 className="animate-spin" size={14} />
            Cargando…
          </div>
        )}
      </div>
    );
  }

  if (error) {
    const message = typeof error === 'string' ? error : error.message;
    return (
      <div className={cn('flex flex-col items-center justify-center gap-2 py-12 text-center', className)}>
        <AlertCircle className="text-accent" size={24} />
        <div className="font-mono text-xs uppercase tracking-wider text-accent">Error</div>
        <div className="text-sm text-text-secondary max-w-md">{message}</div>
      </div>
    );
  }

  if (empty) {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-2 py-12 text-center', className)}>
        <Inbox className="text-text-secondary" size={24} />
        <div className="text-sm text-text-secondary">{emptyMessage}</div>
      </div>
    );
  }

  return <>{children}</>;
}
