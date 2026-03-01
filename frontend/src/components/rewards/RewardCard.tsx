import React from 'react';
import type { Reward } from '../../lib/types';

interface RewardCardProps {
  reward: Reward;
  starBalance: number;
  onRedeem?: () => void;
  onPress?: () => void;
  showRedeem?: boolean;
}

export function RewardCard({ reward, starBalance, onRedeem, showRedeem = false }: RewardCardProps) {
  const canAfford = starBalance >= reward.starCost;
  const isAvailable =
    reward.isActive && (reward.availability === 'unlimited' || (reward.quantity ?? 0) > 0);

  return (
    <div
      className={`bg-card-bg border border-card-border rounded-xl p-4 ${!isAvailable ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-galo-dark flex items-center justify-center shrink-0">
          <span className="text-3xl">{reward.icon || '🎁'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={`text-base font-bold truncate ${!isAvailable ? 'text-text-muted' : 'text-text-primary'}`}
          >
            {reward.name}
          </p>
          {reward.description ? (
            <p className="text-sm text-text-secondary truncate mt-0.5">{reward.description}</p>
          ) : null}
          <div className="flex items-center gap-1 mt-1">
            <span className="text-star-gold text-sm">⭐</span>
            <span className="text-star-gold font-bold text-sm">{reward.starCost}</span>
            {reward.availability === 'limited' && (
              <span className="text-text-secondary text-xs ml-1">({reward.quantity} restantes)</span>
            )}
          </div>
        </div>
        {showRedeem && (
          <button
            onClick={onRedeem}
            disabled={!canAfford || !isAvailable}
            className={`px-4 py-2 rounded-xl font-bold text-sm shrink-0 active:scale-95 transition-all ${
              canAfford && isAvailable
                ? 'bg-star-gold text-galo-black hover:bg-star-gold-dark'
                : 'bg-text-muted text-text-secondary cursor-not-allowed'
            }`}
          >
            Resgatar
          </button>
        )}
      </div>
    </div>
  );
}
