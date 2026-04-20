import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface KPITileProps {
  label: string;
  value: string | number;
  delta?: { value: number; unit?: string } | null;
  hint?: string;
  accent?: 'default' | 'accent' | 'success' | 'warning';
  icon?: ReactNode;
  className?: string;
}

export function KPITile({ label, value, delta, hint, accent = 'default', icon, className }: KPITileProps) {
  const accentCls =
    accent === 'accent' ? 'text-accent'
    : accent === 'success' ? 'text-success'
    : accent === 'warning' ? 'text-accent-orange'
    : 'text-text-primary';

  const deltaCls = delta
    ? delta.value >= 0
      ? 'text-success'
      : 'text-accent'
    : '';

  return (
    <div
      className={cn(
        'group p-4 rounded-lg bg-bg-surface border border-border-default hover:border-border-active transition-colors',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-secondary">{label}</div>
        {icon && <div className="text-text-secondary opacity-60 group-hover:opacity-100 transition-opacity">{icon}</div>}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <div className={cn('font-display text-3xl font-bold tracking-tight', accentCls)}>{value}</div>
        {delta && (
          <div className={cn('font-mono text-xs', deltaCls)}>
            {delta.value >= 0 ? '+' : ''}{delta.value}{delta.unit || '%'}
          </div>
        )}
      </div>
      {hint && <div className="mt-1 text-xs text-text-secondary">{hint}</div>}
    </div>
  );
}
