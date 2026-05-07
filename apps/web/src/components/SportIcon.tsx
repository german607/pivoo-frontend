import { cn } from '@/utils/cn';

export function PadelPaddle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 52 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('drop-shadow-lg', className)}
    >
      <rect x="4" y="2" width="44" height="40" rx="20" fill="white" fillOpacity="0.92" />
      <circle cx="16" cy="14" r="3" fill="rgba(0,100,120,0.35)" />
      <circle cx="26" cy="14" r="3" fill="rgba(0,100,120,0.35)" />
      <circle cx="36" cy="14" r="3" fill="rgba(0,100,120,0.35)" />
      <circle cx="16" cy="24" r="3" fill="rgba(0,100,120,0.35)" />
      <circle cx="26" cy="24" r="3" fill="rgba(0,100,120,0.35)" />
      <circle cx="36" cy="24" r="3" fill="rgba(0,100,120,0.35)" />
      <circle cx="21" cy="34" r="3" fill="rgba(0,100,120,0.35)" />
      <circle cx="31" cy="34" r="3" fill="rgba(0,100,120,0.35)" />
      <rect x="20" y="40" width="12" height="6" fill="white" fillOpacity="0.85" />
      <rect x="18" y="46" width="16" height="12" rx="4" fill="white" fillOpacity="0.85" />
      <rect x="20" y="49" width="12" height="2" rx="1" fill="rgba(0,100,120,0.3)" />
      <rect x="20" y="53" width="12" height="2" rx="1" fill="rgba(0,100,120,0.3)" />
    </svg>
  );
}

// className controls the size — e.g. "w-5 h-5", "w-10 h-10"
export function SportIcon({ sport, className }: { sport: string; className?: string }) {
  if (sport === 'PADEL') {
    return <PadelPaddle className={className} />;
  }
  if (sport === 'TENNIS') {
    return <span className={cn('leading-none select-none', className)}>🎾</span>;
  }
  return <span className={cn('leading-none select-none', className)}>🏅</span>;
}

// String-only fallback for <option> elements (SVG can't render there)
export const SPORT_EMOJI_STR: Record<string, string> = {
  TENNIS: '🎾',
};
