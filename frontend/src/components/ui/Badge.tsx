import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

type Variant =
  | 'neutral'
  | 'accent'
  | 'success'
  | 'warning'
  | 'role-duelist'
  | 'role-initiator'
  | 'role-controller'
  | 'role-sentinel'
  | 'role-flex'
  | 'tier-t1'
  | 'tier-t2'
  | 'tier-t3'
  | 'status-main'
  | 'status-tryout';

const styles: Record<Variant, string> = {
  neutral: 'bg-white/5 text-text-secondary border-border-default',
  accent: 'bg-accent/10 text-accent border-accent/30',
  success: 'bg-success/10 text-success border-success/30',
  warning: 'bg-accent-orange/10 text-accent-orange border-accent-orange/30',
  'role-duelist': 'bg-role-duelist/10 text-role-duelist border-role-duelist/30',
  'role-initiator': 'bg-role-initiator/10 text-role-initiator border-role-initiator/30',
  'role-controller': 'bg-role-controller/10 text-role-controller border-role-controller/30',
  'role-sentinel': 'bg-role-sentinel/10 text-role-sentinel border-role-sentinel/30',
  'role-flex': 'bg-white/5 text-role-flex border-border-default',
  'tier-t1': 'bg-tier-t1/10 text-tier-t1 border-tier-t1/30',
  'tier-t2': 'bg-tier-t2/10 text-tier-t2 border-tier-t2/30',
  'tier-t3': 'bg-tier-t3/10 text-tier-t3 border-tier-t3/30',
  'status-main': 'bg-success/10 text-success border-success/30',
  'status-tryout': 'bg-accent-orange/10 text-accent-orange border-accent-orange/30',
};

interface BadgeProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-mono uppercase tracking-wider',
        styles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function roleVariant(role?: string | null): Variant {
  const r = (role || '').toLowerCase();
  if (r === 'duelist') return 'role-duelist';
  if (r === 'initiator') return 'role-initiator';
  if (r === 'controller') return 'role-controller';
  if (r === 'sentinel') return 'role-sentinel';
  return 'role-flex';
}

export function tierVariant(tier?: string | null): Variant {
  const t = (tier || '').toUpperCase();
  if (t === 'T1') return 'tier-t1';
  if (t === 'T2') return 'tier-t2';
  if (t === 'T3') return 'tier-t3';
  return 'neutral';
}
