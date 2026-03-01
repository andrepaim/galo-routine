import React from 'react';

interface Props {
  size?: number;          // width of the shield in px (default 40)
  glow?: boolean;         // gold glow effect (default false)
  invert?: boolean;       // invert colours to white (default false)
  className?: string;
}

export function GaloBadge({ size = 40, glow = false, invert = false, className = '' }: Props) {
  const starSize   = Math.round(size * 0.28);
  const shieldH    = Math.round(size * 1.12);   // shield is taller than wide
  const totalH     = starSize + Math.round(size * 0.06) + shieldH;

  const filters: string[] = [];
  if (invert) filters.push('invert(1)');
  if (glow)   filters.push('drop-shadow(0 0 8px rgba(255,215,0,0.7))');
  const imgFilter = filters.length ? filters.join(' ') : 'none';

  return (
    <div
      className={`inline-flex flex-col items-center shrink-0 ${className}`}
      style={{ width: size, height: totalH }}
    >
      {/* Gold star */}
      <span
        aria-hidden="true"
        style={{
          fontSize:   starSize,
          lineHeight: 1,
          color:      '#FFD700',
          textShadow: glow ? '0 0 10px rgba(255,215,0,0.9)' : '0 1px 3px rgba(0,0,0,0.8)',
          userSelect: 'none',
        }}
      >
        ★
      </span>

      {/* Shield */}
      <img
        src="/atletico-badge.svg"
        alt="Atlético Mineiro"
        draggable={false}
        style={{
          width:  size,
          height: shieldH,
          filter: imgFilter,
          marginTop: 2,
        }}
      />
    </div>
  );
}
