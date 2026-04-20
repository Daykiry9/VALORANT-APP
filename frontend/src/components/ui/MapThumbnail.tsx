import { useEffect, useState } from 'react';
import { getMapMinimap, getMapSplash } from '../../lib/valorantAssets';
import { cn } from '../../lib/utils';

interface MapThumbnailProps {
  mapName?: string | null;
  variant?: 'minimap' | 'splash';
  className?: string;
}

export function MapThumbnail({ mapName, variant = 'minimap', className }: MapThumbnailProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = variant === 'splash' ? getMapSplash(mapName) : getMapMinimap(mapName);
    load.then((url) => { if (!cancelled) setSrc(url); });
    return () => { cancelled = true; };
  }, [mapName, variant]);

  if (!src) {
    return (
      <div className={cn('flex items-center justify-center bg-bg-elevated rounded text-[10px] font-mono text-text-secondary', className)}>
        {mapName || '—'}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={mapName || 'Map'}
      className={cn('object-cover rounded', className)}
      loading="lazy"
    />
  );
}
