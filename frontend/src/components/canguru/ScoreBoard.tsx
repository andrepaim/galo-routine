import React from 'react';

interface ScoreBoardProps {
  correct: number;
  wrong: number;
  current: number;
  total: number;
}

export function ScoreBoard({ correct, wrong, current, total }: ScoreBoardProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-card-bg border border-card-border rounded-xl mb-4">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🐔</span>
        <span className="text-xl font-extrabold text-star-gold">{correct}</span>
        <span className="text-sm text-text-muted">Galo</span>
      </div>
      <div className="text-xs text-text-muted font-semibold">
        {current}/{total}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-text-muted">Adv.</span>
        <span className="text-xl font-extrabold text-red-400">{wrong}</span>
        <span className="text-2xl">⚽</span>
      </div>
    </div>
  );
}
