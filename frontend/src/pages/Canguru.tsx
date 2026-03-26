import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/stores/authStore';
import { QuizCard } from '../components/canguru/QuizCard';
import type { CanguruQuestion } from '../components/canguru/QuizCard';
import { ScoreBoard } from '../components/canguru/ScoreBoard';
import { ResultScreen } from '../components/canguru/ResultScreen';

type Mode = 'quick' | 'full';
type Phase = 'selecting' | 'question' | 'feedback' | 'saving' | 'result';

const SEEN_KEY = 'canguru_seen_ids';

function calcStars(score: number): number {
  if (score >= 100) return 10;
  if (score >= 80) return 6;
  if (score >= 60) return 3;
  if (score >= 40) return 1;
  return 0;
}

function calcScore(base: number, answers: { letter: string | null; correct: string; points: number }[]): number {
  let s = base;
  for (const a of answers) {
    if (a.letter === null) continue; // skipped
    if (a.letter === a.correct) s += a.points;
    else s -= 1;
  }
  return s;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function selectQuestions(all: CanguruQuestion[], mode: Mode): CanguruQuestion[] {
  const seenRaw = localStorage.getItem(SEEN_KEY);
  const seen: Set<string> = seenRaw ? new Set(JSON.parse(seenRaw)) : new Set();

  const easy = all.filter(q => q.difficulty === 'easy');
  const medium = all.filter(q => q.difficulty === 'medium');
  const hard = all.filter(q => q.difficulty === 'hard');

  const pickBucket = (bucket: CanguruQuestion[], n: number): CanguruQuestion[] => {
    const unseen = shuffle(bucket.filter(q => !seen.has(q.id)));
    const seenBucket = shuffle(bucket.filter(q => seen.has(q.id)));
    return [...unseen, ...seenBucket].slice(0, n);
  };

  if (mode === 'quick') {
    // 4 easy, 4 medium, 2 hard
    return [
      ...shuffle(pickBucket(easy, 4)),
      ...shuffle(pickBucket(medium, 4)),
      ...shuffle(pickBucket(hard, 2)),
    ];
  } else {
    // full: 8 easy, 8 medium, 8 hard — sorted by difficulty order
    return [
      ...shuffle(pickBucket(easy, 8)),
      ...shuffle(pickBucket(medium, 8)),
      ...shuffle(pickBucket(hard, 8)),
    ];
  }
}

export default function Canguru() {
  const navigate = useNavigate();
  const familyId = useAuthStore((s) => s.familyId);

  const [allQuestions, setAllQuestions] = useState<CanguruQuestion[]>([]);
  const [loadError, setLoadError] = useState(false);

  const [phase, setPhase] = useState<Phase>('selecting');
  const [mode, setMode] = useState<Mode>('quick');
  const [questions, setQuestions] = useState<CanguruQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Per-question state
  const [answered, setAnswered] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Session accumulators
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [answers, setAnswers] = useState<{ letter: string | null; correct: string; points: number }[]>([]);

  // Result state
  const [finalScore, setFinalScore] = useState(0);
  const [starsEarned, setStarsEarned] = useState(0);

  // Load questions
  useEffect(() => {
    fetch('/canguru/questions.json')
      .then(r => r.json())
      .then(data => setAllQuestions(data))
      .catch(() => setLoadError(true));
  }, []);

  const startSession = useCallback((m: Mode) => {
    if (!allQuestions.length) return;
    const qs = selectQuestions(allQuestions, m);
    setMode(m);
    setQuestions(qs);
    setCurrentIdx(0);
    setAnswered(null);
    setShowResult(false);
    setCorrect(0);
    setWrong(0);
    setSkipped(0);
    setAnswers([]);
    setPhase('question');
  }, [allQuestions]);

  const handleAnswer = useCallback((letter: string) => {
    if (answered !== null) return;
    const q = questions[currentIdx];
    setAnswered(letter);
    setShowResult(true);

    const isCorrect = letter === q.correct;
    if (isCorrect) setCorrect(c => c + 1);
    else setWrong(w => w + 1);

    setAnswers(prev => [...prev, { letter, correct: q.correct, points: q.points }]);

    // Mark as seen
    const seenRaw = localStorage.getItem(SEEN_KEY);
    const seen: string[] = seenRaw ? JSON.parse(seenRaw) : [];
    if (!seen.includes(q.id)) {
      localStorage.setItem(SEEN_KEY, JSON.stringify([...seen, q.id]));
    }

    // Auto-advance after feedback
    setTimeout(() => advanceQuestion(letter), isCorrect ? 1200 : 1000);
  }, [answered, currentIdx, questions]);

  const handleSkip = useCallback(() => {
    if (answered !== null) return;
    const q = questions[currentIdx];
    setSkipped(s => s + 1);
    setAnswers(prev => [...prev, { letter: null, correct: q.correct, points: q.points }]);
    advanceQuestion(null);
  }, [answered, currentIdx, questions]);

  const advanceQuestion = useCallback((letter: string | null) => {
    const nextIdx = currentIdx + 1;
    if (nextIdx >= questions.length) {
      finishSession();
      return;
    }
    setCurrentIdx(nextIdx);
    setAnswered(null);
    setShowResult(false);
  }, [currentIdx, questions]);

  const finishSession = useCallback(() => {
    setPhase('saving');

    // Compute final values from accumulated state + current answer
    // Use functional updates to get latest values
    setAnswers(prevAnswers => {
      const score = calcScore(24, prevAnswers);
      const stars = calcStars(score);
      setFinalScore(score);
      setStarsEarned(stars);

      // Count from prevAnswers
      const c = prevAnswers.filter(a => a.letter !== null && a.letter === a.correct).length;
      const w = prevAnswers.filter(a => a.letter !== null && a.letter !== a.correct).length;
      const sk = prevAnswers.filter(a => a.letter === null).length;

      // POST to backend
      fetch('/api/canguru/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId,
          mode,
          correct: c,
          wrong: w,
          skipped: sk,
          score,
          starsEarned: stars,
        }),
      })
        .catch(err => console.error('[canguru] save session error:', err))
        .finally(() => setPhase('result'));

      return prevAnswers;
    });
  }, [familyId, mode]);

  // Feedback overlay flash
  const feedbackCorrect = showResult && answered === questions[currentIdx]?.correct;
  const feedbackWrong = showResult && answered !== null && answered !== questions[currentIdx]?.correct;

  if (loadError) {
    return (
      <div className="min-h-screen bg-galo-black flex items-center justify-center p-6">
        <div className="text-center">
          <span className="text-5xl mb-4 block">😬</span>
          <p className="text-text-primary font-bold">Erro ao carregar questões</p>
          <button onClick={() => navigate('/child')} className="mt-4 text-star-gold underline">Voltar</button>
        </div>
      </div>
    );
  }

  if (!allQuestions.length) {
    return (
      <div className="min-h-screen bg-galo-black flex items-center justify-center">
        <span className="text-5xl animate-pulse">🦘</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-galo-black safe-top">
      <div className="p-4 pb-12 overflow-y-auto max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => phase === 'selecting' ? navigate('/child') : setPhase('selecting')}
            className="text-text-muted text-2xl active:scale-95 transition-transform"
          >
            ←
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-text-primary">🦘 Treino Canguru</h1>
            <p className="text-xs text-text-muted">Nível E (Ecolier) · 5º e 6º ano</p>
          </div>
        </div>

        {/* MODE SELECTION */}
        {phase === 'selecting' && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <p className="text-text-secondary text-sm text-center mb-2">
              Escolha o modo de treino:
            </p>

            <button
              onClick={() => startSession('quick')}
              className="bg-card-bg border border-star-gold rounded-2xl p-5 text-left active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">⚡</span>
                <span className="text-lg font-extrabold text-text-primary">Treino Rápido</span>
              </div>
              <p className="text-sm text-text-secondary">10 questões · Mistura de dificuldades · Sem tempo</p>
              <p className="text-xs text-star-gold mt-2 font-semibold">Ideal para treinar todo dia</p>
            </button>

            <button
              onClick={() => startSession('full')}
              className="bg-card-bg border border-card-border rounded-2xl p-5 text-left active:scale-[0.98] transition-all hover:border-star-gold/50"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">📋</span>
                <span className="text-lg font-extrabold text-text-primary">Prova Completa</span>
              </div>
              <p className="text-sm text-text-secondary">24 questões · Fácil → Médio → Difícil</p>
              <p className="text-xs text-text-muted mt-2">Como a prova de verdade</p>
            </button>

            <div className="bg-card-bg border border-card-border rounded-xl p-4 mt-2">
              <p className="text-xs text-text-muted text-center">
                ✅ Acerto: +3/4/5 pts · ❌ Erro: −1 pt · ⏭ Pular: 0 pts
              </p>
            </div>
          </div>
        )}

        {/* QUIZ */}
        {(phase === 'question' || phase === 'feedback' || phase === 'saving') && questions.length > 0 && (
          <div className="animate-fade-in">
            <ScoreBoard
              correct={correct}
              wrong={wrong}
              current={currentIdx + 1}
              total={questions.length}
            />

            {/* Feedback flash */}
            {feedbackCorrect && (
              <div className="text-center py-3 mb-3 animate-fade-in">
                <span className="text-2xl font-extrabold text-star-gold">⚽ GOL DO GALO!</span>
              </div>
            )}
            {feedbackWrong && (
              <div className="text-center py-3 mb-3 animate-fade-in">
                <span className="text-2xl font-extrabold text-red-400">😬 Tomou gol...</span>
              </div>
            )}

            <QuizCard
              question={questions[currentIdx]}
              answered={answered}
              showResult={showResult}
              onAnswer={handleAnswer}
              onSkip={handleSkip}
            />
          </div>
        )}

        {/* SAVING */}
        {phase === 'saving' && (
          <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
            <span className="text-5xl animate-pulse mb-4">⭐</span>
            <p className="text-text-secondary">Salvando resultado...</p>
          </div>
        )}

        {/* RESULT */}
        {phase === 'result' && (
          <ResultScreen
            score={finalScore}
            correct={correct}
            wrong={wrong}
            skipped={skipped}
            starsEarned={starsEarned}
            mode={mode}
            onPlayAgain={() => setPhase('selecting')}
            onBack={() => navigate('/child')}
          />
        )}
      </div>
    </div>
  );
}
