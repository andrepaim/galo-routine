import React from 'react';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-10 animate-fade-in-up">
      <div className="w-28 h-28 rounded-full bg-galo-dark flex items-center justify-center mb-5">
        <span className="text-5xl">{icon}</span>
      </div>
      <h3 className="text-lg font-semibold text-text-primary text-center mb-2">{title}</h3>
      <p className="text-sm text-text-secondary text-center mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-star-gold text-galo-black font-bold px-6 py-3 rounded-xl hover:bg-star-gold-dark transition-colors active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
