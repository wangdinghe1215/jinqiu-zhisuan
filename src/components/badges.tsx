import { cn } from '@/lib/utils';

interface TLevelBadgeProps {
  level: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const levelStyles: Record<string, string> = {
  'T0': 't-diamond',
  'T1a': 't-gold',
  'T1b': 't-silver',
  'T2': 't-copper',
  'T2b': 't-copper opacity-80',
  'T3': 't-iron',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

const levelLabels: Record<string, string> = {
  'T0': 'T0 钻石',
  'T1a': 'T1a 金',
  'T1b': 'T1b 银',
  'T2': 'T2 铜',
  'T2b': 'T2b 铜',
  'T3': 'T3 铁',
};

export function TLevelBadge({ level, size = 'md', className }: TLevelBadgeProps) {
  const style = levelStyles[level] || 't-iron';
  const sizeCls = sizeClasses[size];
  const label = levelLabels[level] || level;

  return (
    <span
      className={cn(
        'inline-flex items-center font-bold rounded font-mono uppercase tracking-wide',
        style,
        sizeCls,
        level === 'T0' && 'glow-diamond',
        level === 'T1a' && 'glow-gold',
        className
      )}
    >
      {label}
    </span>
  );
}

interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md';
}

export function StarRating({ rating, size = 'md' }: StarRatingProps) {
  const starSize = size === 'sm' ? 14 : 16;

  if (rating >= 5) {
    return (
      <div className="flex items-center gap-0.5" title={`${rating}星 - 钻石`}>
        <span style={{ fontSize: starSize }}>💎</span>
        <span className="text-diamond font-bold text-sm">钻石</span>
      </div>
    );
  }

  if (rating <= 1) {
    return (
      <div className="flex items-center gap-0.5" title={`${rating}星 - 铁标`}>
        <span style={{ fontSize: starSize }}>⚙️</span>
        <span className="text-gray-500 font-medium text-sm">铁标</span>
      </div>
    );
  }

  const stars = Array.from({ length: 5 }, (_, i) => i < rating);
  const labels: Record<number, string> = {
    4: '金标',
    3: '银标',
    2: '铜标',
  };
  const label = labels[rating] || '';
  const labelColor = rating >= 4 ? 'text-gold' : rating >= 3 ? 'text-silver' : 'text-copper';

  return (
    <div className="flex items-center gap-0.5" title={`${rating}星${label ? ' - ' + label : ''}`}>
      {stars.map((filled, i) => (
        <span
          key={i}
          className={filled ? 'text-yellow-400' : 'text-gray-700'}
          style={{ fontSize: starSize }}
        >
          {filled ? '⭐' : '☆'}
        </span>
      ))}
      {label && (
        <span className={cn('font-medium text-xs ml-1', labelColor)}>{label}</span>
      )}
    </div>
  );
}

interface DirectionBadgeProps {
  direction: string;
  className?: string;
}

export function DirectionBadge({ direction, className }: DirectionBadgeProps) {
  const getStyle = (dir: string) => {
    if (dir.includes('锁主胜') || dir === '主胜') return 'bg-red-500/20 text-red-400 border-red-500/40';
    if (dir.includes('锁客胜') || dir === '客胜') return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
    if (dir.includes('排除平')) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
    if (dir.includes('排除')) return 'bg-gray-500/20 text-gray-400 border-gray-500/40';
    if (dir.includes('平')) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
    if (dir.includes('分胜负')) return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/40';
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border',
        getStyle(direction),
        className
      )}
    >
      {direction}
    </span>
  );
}

interface ResultBadgeProps {
  result: string;
  className?: string;
}

export function ResultBadge({ result, className }: ResultBadgeProps) {
  if (!result) return null;

  const isHit = result === '命中';
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-bold rounded',
        isHit
          ? 'bg-green-500/20 text-green-400 border border-green-500/40'
          : 'bg-red-500/20 text-red-400 border border-red-500/40',
        className
      )}
    >
      {result}
    </span>
  );
}
