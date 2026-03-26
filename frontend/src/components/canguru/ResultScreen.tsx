import React from 'react';
import { GaloBadge } from '../galo/GaloBadge';

interface ResultScreenProps {
  score: number;
  correct: number;
  wrong: number;
  skipped: number;
  starsEarned: number;
  mode: string;
  onPlayAgain: () => void;
  onBack: () => void;
}

export function ResultScreen({
  score,
  correct,
  wrong,
  skipped,
  starsEarned,
  mode,
  onPlayAgain,
  onBack,
}: ResultScreenProps) {
  const total = correct + wrong + skipped;

  let matchEmoji = '😤';
  let matchText = 'Perdeu! Revanche amanhã!';
  let matchColor = 'text-red-400';

  if (correct > wrong) {
    matchEmoji = '🏆';
    matchText = 'Galo venceu!';
    matchColor = 'text-star-gold';
  } else if (correct === wrong) {
    matchEmoji = '🤝';
    matchText = 'Empatou!';
    matchColor = 'text-blue-400';
  }

  return (
    <div className="flex flex-col items-center gap-6 py-6 animate-fade-in">
      {/* Badge */}
      <GaloBadge size={72} invert />

      {/* Match result */}
      <div className="text-center">
        <div className="text-6xl mb-2">{matchEmoji}</div>
        <h2 className={`text-2xl font-extrabold ${matchColor}`}>{matchText}</h2>
        <p className="text-sm text-text-muted mt-1">
          {mode === 'quick' ? 'Treino Rápido' : 'Prova Completa'}
        </p>
      </div>

      {/* Score */}
      <div className="bg-card-bg border border-star-gold rounded-2xl px-8 py-4 text-center">
        <p className="text-sm text-text-muted mb-1">Score final</p>
        <p className="text-5xl font-extrabold text-star-gold">{score}</p>
      </div>

      {/* Stats row */}
      <div className="flex gap-4 w-full">
        <div className="flex-1 bg-card-bg border border-green-500/40 rounded-xl p-3 text-center">
          <p className="text-2xl font-extrabold text-green-400">{correct}</p>
          <p className="text-xs text-text-muted">Corretas</p>
        </div>
        <div className="flex-1 bg-card-bg border border-red-500/40 rounded-xl p-3 text-center">
          <p className="text-2xl font-extrabold text-red-400">{wrong}</p>
          <p className="text-xs text-text-muted">Erradas</p>
        </div>
        <div className="flex-1 bg-card-bg border border-card-border rounded-xl p-3 text-center">
          <p className="text-2xl font-extrabold text-text-muted">{skipped}</p>
          <p className="text-xs text-text-muted">Puladas</p>
        </div>
      </div>

      {/* Stars earned */}
      {starsEarned > 0 && (
        <div className="flex items-center gap-2 bg-star-gold/10 border border-star-gold px-5 py-3 rounded-2xl animate-fade-in">
          <span className="text-2xl">⭐</span>
          <span className="text-xl font-extrabold text-star-gold">+{starsEarned} estrelas!</span>
        </div>
      )}

      {/* Tip */}
      {skipped > 0 && (
        <p className="text-xs text-text-muted text-center italic px-4">
          💡 Pular é inteligente! Melhor pular do que errar e perder ponto.
        </p>
      )}

      {/* Buttons */}
      <div className="flex flex-col gap-3 w-full">
        <button
          onClick={onPlayAgain}
          className="w-full py-4 bg-star-gold text-galo-black font-extrabold text-lg rounded-xl active:scale-95 transition-all"
        >
          🔄 Jogar de novo
        </button>
        <button
          onClick={onBack}
          className="w-full py-3 bg-card-bg border border-card-border text-text-secondary font-bold rounded-xl active:scale-95 transition-all"
        >
          ← Voltar
        </button>
      </div>
    </div>
  );
}
