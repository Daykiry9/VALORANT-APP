import { cn } from '../../lib/utils';

interface ResultPillProps {
  result?: string | null;
  score?: string | null;
  className?: string;
}

export function ResultPill({ result, score, className }: ResultPillProps) {
  const r = (result || '').toUpperCase();
  const tone =
    r === 'W' ? 'bg-win/15 text-win border-win/40'
    : r === 'L' ? 'bg-loss/15 text-loss border-loss/40'
    : 'bg-draw/15 text-draw border-draw/40';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-2.5 py-1 rounded-md border font-mono text-xs',
        tone,
        className,
      )}
    >
      <span className="font-bold tracking-widest">{r || '-'}</span>
      {score && <span className="opacity-80">{score}</span>}
    </div>
  );
}
