import React, { useState, useEffect } from 'react';

export interface CanguruQuestion {
  id: string;
  year: number;
  number: number;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  text: string;
  options: Record<string, string>;
  correct: string;
  hasImage: boolean;
  imageDesc: string;
  optionsAreImages: boolean;
  pageFile: string;
}

interface QuizCardProps {
  question: CanguruQuestion;
  answered: string | null;   // the letter the user picked, or null
  showResult: boolean;
  onAnswer: (letter: string) => void;
  onSkip: () => void;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

const DIFF_LABEL: Record<string, string> = {
  easy: '3 pts',
  medium: '4 pts',
  hard: '5 pts',
};

const DIFF_COLOR: Record<string, string> = {
  easy: 'text-green-400',
  medium: 'text-yellow-400',
  hard: 'text-red-400',
};

export function QuizCard({ question, answered, showResult, onAnswer, onSkip }: QuizCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen]);

  const getButtonStyle = (letter: string) => {
    if (!showResult || answered === null) {
      // Not yet revealed
      const isSelected = answered === letter && !showResult;
      return `w-full flex items-center gap-3 p-3 rounded-xl border font-bold text-sm active:scale-95 transition-all ${
        isSelected
          ? 'bg-star-gold/20 border-star-gold text-star-gold'
          : 'bg-card-bg border-card-border text-text-primary hover:border-star-gold/50'
      }`;
    }
    // Show result
    if (letter === question.correct) {
      return 'w-full flex items-center gap-3 p-3 rounded-xl border font-bold text-sm bg-green-900/40 border-green-500 text-green-400';
    }
    if (letter === answered && answered !== question.correct) {
      return 'w-full flex items-center gap-3 p-3 rounded-xl border font-bold text-sm bg-red-900/40 border-red-500 text-red-400';
    }
    return 'w-full flex items-center gap-3 p-3 rounded-xl border font-bold text-sm bg-card-bg border-card-border text-text-muted opacity-50';
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Difficulty badge */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">Questão {question.number}</span>
        <span className={`text-xs font-bold ${DIFF_COLOR[question.difficulty]}`}>
          {DIFF_LABEL[question.difficulty]}
        </span>
      </div>

      {/* Page image (shows the actual exam question image) */}
      {question.hasImage && (
        <>
          <div
            className="w-full bg-white rounded-xl overflow-hidden cursor-zoom-in relative group"
            onClick={() => setLightboxOpen(true)}
          >
            <img
              src={`/canguru/questions/${question.id}.jpg`}
              alt={question.imageDesc || 'Figura da questão'}
              className="w-full object-contain"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-active:opacity-100 bg-black/10 transition-opacity">
              <span className="text-2xl">🔍</span>
            </div>
          </div>

          {/* Lightbox modal — shows full exam page */}
          {lightboxOpen && (
            <div
              className="fixed inset-0 z-50 flex items-start justify-center bg-black/95 overflow-y-auto"
              onClick={() => setLightboxOpen(false)}
            >
              <button
                className="fixed top-4 right-4 text-white text-3xl leading-none w-10 h-10 flex items-center justify-center rounded-full bg-white/10 active:bg-white/30 z-10"
                onClick={() => setLightboxOpen(false)}
                aria-label="Fechar"
              >
                ×
              </button>
              <img
                src={`/canguru/pages/${question.pageFile}`}
                alt={`Página completa — questão ${question.number}`}
                className="w-full max-w-2xl object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </>
      )}

      {/* Question text */}
      <p className="text-base font-bold text-text-primary leading-snug">
        {question.text}
      </p>

      {/* Answer options */}
      <div className="flex flex-col gap-2">
        {LETTERS.map((letter) => (
          <button
            key={letter}
            className={getButtonStyle(letter)}
            onClick={() => !answered && onAnswer(letter)}
            disabled={!!answered}
          >
            <span className="w-7 h-7 rounded-lg bg-galo-black border border-current flex items-center justify-center text-xs font-extrabold shrink-0">
              {letter}
            </span>
            <span className="flex-1 text-left">
              {question.optionsAreImages
                ? `Opção ${letter}`
                : (question.options[letter] || `Opção ${letter}`)}
            </span>
            {showResult && letter === question.correct && (
              <span className="text-green-400 text-lg">✅</span>
            )}
            {showResult && letter === answered && answered !== question.correct && (
              <span className="text-red-400 text-lg">❌</span>
            )}
          </button>
        ))}
      </div>

      {/* Skip button */}
      {!answered && (
        <button
          onClick={onSkip}
          className="text-text-muted text-sm underline text-center py-1 active:scale-95 transition-transform"
        >
          ⏭ Pular (sem penalidade)
        </button>
      )}

      {question.optionsAreImages && (
        <p className="text-xs text-text-muted text-center italic">
          💡 As opções estão na imagem acima
        </p>
      )}
    </div>
  );
}
