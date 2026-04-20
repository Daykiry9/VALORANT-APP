import { useEffect, useState } from 'react';
import { getAgentIcon, getAgentPortrait } from '../../lib/valorantAssets';
import { cn } from '../../lib/utils';

interface AgentPortraitProps {
  agent?: string | null;
  size?: number;
  variant?: 'icon' | 'portrait';
  className?: string;
}

export function AgentPortrait({ agent, size = 32, variant = 'icon', className }: AgentPortraitProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = variant === 'portrait' ? getAgentPortrait(agent) : getAgentIcon(agent);
    load.then((url) => { if (!cancelled) setSrc(url); });
    return () => { cancelled = true; };
  }, [agent, variant]);

  const initials = (agent || '?').slice(0, 2).toUpperCase();
  const sizeStyle = { width: size, height: size };

  if (!src) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded bg-bg-elevated border border-border-default text-[10px] font-mono text-text-secondary',
          className,
        )}
        style={sizeStyle}
        title={agent || 'Unknown agent'}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={agent || 'Agent'}
      className={cn('rounded object-cover bg-bg-elevated', className)}
      style={sizeStyle}
      loading="lazy"
    />
  );
}
