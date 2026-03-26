import React, { useState, useEffect } from 'react';
import { QuizCard } from './QuizCard';
import type { CanguruQuestion } from './QuizCard';
import { apiFetch } from '../../lib/api/client';

const STORAGE_KEY = 'canguru_answered_ids';
const STARS_BY_DIFF: Record<string, number> = { easy: 1, medium: 2, hard: 3 };

function getAnsweredIds(): string[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function addAnsweredId(id: string) {
  const ids = getAnsweredIds();
  if (!ids.includes(id)) localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids, id]));
}

async function loadQuestions(): Promise<CanguruQuestion[]> {
  const res = await fetch('/canguru/questions.json');
  return res.json();
}

function pickQuestion(questions: CanguruQuestion[]): CanguruQuestion {
  const answered = getAnsweredIds();
  const unseen = questions.filter(q => !answered.includes(q.id));
  const pool = unseen.length > 0 ? unseen : questions;
  return pool[Math.floor(Math.random() * pool.length)];
}

type Phase = 'prompt' | 'question' | 'result';

interface Props {
  onDone: () => void;
}

export function CanguruBonusModal({ onDone }: Props) {
  const [phase, setPhase] = useState<Phase>('prompt');
  const [question, setQuestion] = useState<CanguruQuestion | null>(null);
  const [answered, setAnswered] = useState<string | null>(null);
  const [starsEarned, setStarsEarned] = useState(0);
  const [loading, setLoading] = useState(false);

  const startQuestion = async () => {
    setLoading(true);
    try {
      const qs = await loadQuestions();
      setQuestion(pickQuestion(qs));
      setPhase('question');
    } catch (e) {
      console.error('[CanguruBonus] failed to load questions', e);
      onDone();
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (letter: string) => {
    if (!question) return;
    setAnswered(letter);
    const correct = letter === question.correct;
    const stars = correct ? STARS_BY_DIFF[question.difficulty] : 0;
    setStarsEarned(stars);
    addAnsweredId(question.id);

    try {
      await apiFetch('/canguru/session', {
        method: 'POST',
        body: JSON.stringify({
          mode: 'bonus',
          correct: correct ? 1 : 0,
          wrong: correct ? 0 : 1,
          skipped: 0,
          score: stars,
          starsEarned: stars,
        }),
      });
    } catch (e) {
      console.error('[CanguruBonus] failed to save session', e);
    }

    setTimeout(() => setPhase('result'), 800);
  };

  const handleSkip = () => {
    addAnsweredId(question?.id || '');
    onDone();
  };

  if (phase === 'prompt') {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 pb-8">
        <div className="w-full max-w-md bg-card-bg border border-star-gold/40 rounded-2xl p-6 flex flex-col items-center gap-4 shadow-2xl">
          <div className="text-5xl">🦘</div>
          <h2 className="text-xl font-extrabold text-star-gold text-center">
            Desafio Canguru!
          </h2>
          <p className="text-text-secondary text-center text-sm leading-snug">
            Quer ganhar estrelas extras respondendo uma pergunta de Matemática?
          </p>
          <div className="flex gap-2 text-sm text-text-muted">
            <span className="bg-green-900/30 border border-green-700 px-3 py-1 rounded-full">Fácil → ⭐</span>
            <span className="bg-yellow-900/30 border border-yellow-700 px-3 py-1 rounded-full">Médio → ⭐⭐</span>
            <span className="bg-red-900/30 border border-red-700 px-3 py-1 rounded-full">Difícil → ⭐⭐⭐</span>
          </div>
          <button
            onClick={startQuestion}
            disabled={loading}
            className="w-full py-3 bg-star-gold text-galo-black font-extrabold rounded-xl text-lg active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Carregando...' : '⚽ Sim, quero!'}
          </button>
          <button
            onClick={onDone}
            className="text-text-muted text-sm underline"
          >
            Agora não
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'question' && question) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-galo-black">
        <div className="min-h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-card-border sticky top-0 bg-galo-black z-10">
            <div className="flex items-center gap-2">
              <span className="text-xl">🦘</span>
              <span className="font-bold text-star-gold text-sm">Desafio Canguru</span>
            </div>
            <button onClick={handleSkip} className="text-text-muted text-xs underline">
              Pular
            </button>
          </div>

          {/* Question */}
          <div className="flex-1 p-4">
            <QuizCard
              question={question}
              answered={answered}
              showResult={answered !== null}
              onAnswer={handleAnswer}
              onSkip={handleSkip}
            />
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'result') {
    const correct = answered === question?.correct;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
        <div className="w-full max-w-sm bg-card-bg border border-card-border rounded-2xl p-8 flex flex-col items-center gap-5 shadow-2xl">
          <div className="text-6xl">{correct ? '⚽' : '🥅'}</div>
          <h2 className={`text-2xl font-extrabold text-center ${correct ? 'text-green-400' : 'text-red-400'}`}>
            {correct ? 'Gooool!' : 'Quase!'}
          </h2>
          {correct ? (
            <p className="text-star-gold text-center font-bold text-lg">
              +{starsEarned} ⭐ {starsEarned > 1 ? 'estrelas' : 'estrela'}!
            </p>
          ) : (
            <p className="text-text-secondary text-center text-sm">
              A resposta certa era a opção <span className="font-bold text-star-gold">{question?.correct}</span>. Na próxima!
            </p>
          )}
          <button
            onClick={onDone}
            className="w-full py-3 bg-star-gold text-galo-black font-extrabold rounded-xl active:scale-95 transition-all"
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  return null;
}
