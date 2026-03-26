import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuthStore, useCompletionStore, useRewardStore } from '../lib/stores';
import { useTodayTasks } from '../lib/hooks/useTodayTasks';
import { useCurrentPeriod } from '../lib/hooks/useCurrentPeriod';
import { useGaloSchedule, pickNextNews } from '../lib/hooks/useGaloSchedule';
import { getGaloNewsState, addShownNewsId } from '../lib/api/db';
import { GaloCelebration } from '../components/galo/GaloCelebration';
import { GaloNewsCard } from '../components/galo/GaloNewsCard';
import { CanguruBonusModal } from '../components/canguru/CanguruBonusModal';
import type { TodayTask, GaloNewsItem } from '../lib/types';
import type { Reward } from '../lib/types';
import { GaloBadge } from '../components/galo/GaloBadge';

export default function Child() {
  const navigate = useNavigate();
  const childName = useAuthStore((s) => s.childName);
  const familyId = useAuthStore((s) => s.familyId);
  const family = useAuthStore((s) => s.family);
  const { activePeriod } = useCurrentPeriod();
  const { todayTasks, isLoading } = useTodayTasks();
  const markTaskDone = useCompletionStore((s) => s.markTaskDone);
  const allRewards = useRewardStore((s) => s.rewards);
  const redemptions = useRewardStore((s) => s.redemptions);
  const redeemReward = useRewardStore((s) => s.redeemReward);
  const rewards = React.useMemo(() => allRewards.filter((r) => r.isActive), [allRewards]);

  const starBalance = family?.starBalance || 0;
  const [confirmTask, setConfirmTask] = useState<TodayTask | null>(null);
  const [tasksOpen, setTasksOpen] = useState(true);
  const [rewardsOpen, setRewardsOpen] = useState(false);
  const [rewardsShowAll, setRewardsShowAll] = useState(false);
  const [celebrationTask, setCelebrationTask] = useState<{ name: string; stars: number } | null>(null);
  const [canguruBonus, setCanguruBonus] = useState(false);
  const [newsItem, setNewsItem] = useState<GaloNewsItem | null>(null);
  const { schedule } = useGaloSchedule();

  const REWARDS_PREVIEW = 3;
  const formatStars = (n: number) =>
    n >= 10000 ? `${Math.floor(n / 1000)}k`
    : n >= 1000 ? `${(n / 1000).toFixed(1).replace('.0', '')}k`
    : String(n);

  const handleCompleteTask = (task: TodayTask) => {
    setConfirmTask(task);
  };

  const confirmCompleteTask = async () => {
    if (!familyId || !activePeriod?.id || !confirmTask) return;
    navigator.vibrate?.(50);
    const taskName = confirmTask.name;
    const stars = confirmTask.starValue || 1;
    await markTaskDone(familyId, activePeriod.id, confirmTask);
    setConfirmTask(null);
    // Show celebration
    setCelebrationTask({ name: taskName, stars });
  };

  const handleCelebrationDone = () => {
    setCelebrationTask(null);
    setCanguruBonus(true);
  };

  const handleCanguruBonusDone = async () => {
    setCanguruBonus(false);
    if (!familyId || !schedule?.news?.length) return;
    try {
      const shownIds = await getGaloNewsState(familyId);
      const next = pickNextNews(schedule.news, shownIds);
      if (next) setNewsItem(next);
    } catch (err) {
      console.error('[GaloNews] failed to fetch news state:', err);
    }
  };

  const handleCloseNews = async () => {
    if (newsItem && familyId) {
      try {
        await addShownNewsId(familyId, newsItem.id);
      } catch (err) {
        console.error('[GaloNews] failed to save shownId:', err);
      }
    }
    setNewsItem(null);
  };

  const handleRedeemReward = async (reward: Reward) => {
    if (!familyId || starBalance < reward.starCost) return;
    navigator.vibrate?.(80);
    await redeemReward(familyId, reward);
  };

  const ballTapCount = useRef(0);
  const ballTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBallTap = useCallback(() => {
    navigator.vibrate?.(30);
    ballTapCount.current += 1;

    if (ballTapTimer.current) clearTimeout(ballTapTimer.current);

    if (ballTapCount.current >= 3) {
      ballTapCount.current = 0;
      navigator.vibrate?.([50, 30, 50]);
      navigate('/parent-pin');
      return;
    }

    ballTapTimer.current = setTimeout(() => {
      ballTapCount.current = 0;
    }, 1500);
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-galo-black flex items-center justify-center">
        <span className="text-5xl animate-pulse">⭐</span>
      </div>
    );
  }

  const completedCount = todayTasks.filter(
    (t) => t.completion?.status === 'approved' || t.completion?.status === 'pending',
  ).length;
  const totalTasks = todayTasks.length;

  return (
    <div className="min-h-screen bg-galo-black safe-top">
      <div className="p-4 pb-12 overflow-y-auto">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl font-extrabold text-text-primary">
              Oi, {(childName || 'Vitor').split(' ')[0]}!
            </h1>
            <span
              onClick={handleBallTap}
              className="cursor-default select-none text-4xl leading-none"
              aria-hidden="true"
            >
              🐔
            </span>
          </div>
          <p className="text-sm text-text-secondary capitalize mb-3">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
          <div className="inline-flex items-center gap-1.5 bg-card-bg border border-star-gold px-3 py-2 rounded-2xl">
            <span className="text-xl">⭐</span>
            <span className="text-xl font-extrabold text-star-gold">{formatStars(starBalance)}</span>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="mb-6 animate-fade-in-down">
          <button
            className="w-full flex justify-between items-center px-4 pt-4 pb-3 bg-card-bg border border-card-border rounded-xl mb-3 active:scale-[0.99] transition-transform overflow-hidden"
            onClick={() => setTasksOpen((o) => !o)}
          >
            <div className="flex flex-col w-full gap-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-star-gold text-xl">✅</span>
                  <span className="text-lg font-bold text-text-primary">
                    Tarefas de Hoje ({completedCount}/{totalTasks})
                  </span>
                </div>
                <span className="text-text-secondary text-xl">{tasksOpen ? '▲' : '▼'}</span>
              </div>
              {totalTasks > 0 && (
                <div className="h-1.5 bg-card-border rounded-full overflow-hidden w-full">
                  <div
                    className="h-full bg-star-gold rounded-full transition-all duration-500"
                    style={{ width: `${(completedCount / totalTasks) * 100}%` }}
                  />
                </div>
              )}
            </div>
          </button>

          {tasksOpen && (
            <div className="flex flex-col gap-3 animate-fade-in-down">

              {todayTasks.length === 0 ? (
                <div className="bg-card-bg rounded-xl border border-card-border p-8 flex flex-col items-center">
                  <span className="text-5xl mb-3">🎉</span>
                  <h3 className="text-lg font-bold text-text-primary mb-2">Dia Livre!</h3>
                  <p className="text-sm text-text-secondary text-center">Nenhuma tarefa para hoje. Aproveite!</p>
                </div>
              ) : (
                todayTasks.map((item) => {
                  const isCompleted =
                    item.completion?.status === 'approved' || item.completion?.status === 'pending';
                  return (
                    <div key={item.id}>
                      <div
                        className={`rounded-xl border p-4 transition-colors ${
                          isCompleted
                            ? 'bg-green-900/20 border-green-500'
                            : 'bg-card-bg border-card-border'
                        }`}
                      >
                        <button
                          className="w-full flex items-center gap-3 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
                          onClick={() => !isCompleted && handleCompleteTask(item)}
                          disabled={isCompleted}
                        >
                          <div className="w-9 h-9 flex items-center justify-center shrink-0">
                            <span className="text-2xl">
                              {isCompleted ? '✅' : item.icon || '📝'}
                            </span>
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <p className={`text-base font-semibold ${isCompleted ? 'text-text-secondary' : 'text-text-primary'}`}>
                              {item.name}
                            </p>
                            {item.startTime && (
                              <p className="text-xs text-text-muted mt-0.5">{item.startTime}</p>
                            )}
                          </div>
                          <div className="bg-galo-black border border-star-gold px-2 py-1 rounded-lg shrink-0">
                            <span className="text-sm font-bold text-star-gold">★ {item.starValue || 1}</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Canguru Section */}
        {(() => {
          const examDate = new Date('2026-03-19T12:00:00');
          const daysLeft = Math.ceil((examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          if (daysLeft <= 0 || daysLeft > 30) return null;
          return (
            <div className="mb-6 animate-fade-in-up">
              <div className="bg-card-bg border border-star-gold rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🦘</span>
                    <span className="text-lg font-bold text-text-primary">Treino Canguru</span>
                  </div>
                  <span className="text-xs font-bold text-star-gold bg-star-gold/10 px-2 py-1 rounded-full">
                    {daysLeft === 1 ? '1 dia!' : `${daysLeft} dias!`}
                  </span>
                </div>
                <p className="text-sm text-text-secondary mb-3">
                  Nível E (Ecolier). Bora treinar! 💪
                </p>
                <button
                  onClick={() => navigate('/child/canguru')}
                  className="w-full py-3 bg-star-gold text-galo-black font-bold rounded-xl active:scale-95 transition-all"
                >
                  Treinar agora →
                </button>
              </div>
            </div>
          );
        })()}

        {/* Rewards Section */}
        <div className="mb-6 animate-fade-in-up">
          <button
            className="w-full flex justify-between items-center p-4 bg-card-bg border border-card-border rounded-xl mb-3 active:scale-[0.99] transition-transform"
            onClick={() => setRewardsOpen((o) => !o)}
          >
            <div className="flex items-center gap-3">
              <span className="text-star-gold text-xl">🎁</span>
              <span className="text-lg font-bold text-text-primary">
                Meus Prêmios ({rewards.length})
              </span>
            </div>
            <span className="text-text-secondary text-xl">{rewardsOpen ? '▲' : '▼'}</span>
          </button>

          {rewardsOpen && (
            <div className="flex flex-col gap-3 animate-fade-in-down">
              {rewards.length === 0 ? (
                <div className="bg-card-bg rounded-xl border border-card-border p-8 flex flex-col items-center">
                  <span className="text-5xl mb-3">🎁</span>
                  <h3 className="text-lg font-bold text-text-primary mb-2">Nenhum prêmio disponível</h3>
                  <p className="text-sm text-text-secondary text-center">Seus pais ainda não criaram prêmios!</p>
                </div>
              ) : (
                <>
                  {(rewardsShowAll ? rewards : rewards.slice(0, REWARDS_PREVIEW)).map((item) => {
                    const isPending = redemptions.some(
                      (r) => r.rewardId === item.id && r.status === 'pending',
                    );
                    const canAfford = !isPending && starBalance >= item.starCost;
                    return (
                      <div key={item.id}>
                        <div className={`bg-card-bg rounded-xl border p-4 transition-colors ${
                          isPending ? 'border-star-gold' : 'border-card-border'
                        }`}>
                          {/* Top row: name */}
                          <div className="mb-3">
                            <p className="text-base font-semibold text-text-primary leading-snug">
                              {item.name}
                            </p>
                          </div>
                          {/* Bottom row: stars + action */}
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-star-gold">⭐ {item.starCost}</p>
                            {isPending ? (
                              <span className="px-3 py-2 rounded-lg text-sm font-bold text-star-gold bg-star-gold/10">
                                ⏳ Pedido!
                              </span>
                            ) : (
                              <button
                                onClick={() => canAfford && handleRedeemReward(item)}
                                disabled={!canAfford}
                                className={`px-4 py-2 rounded-lg font-bold text-sm active:scale-95 transition-all ${
                                  canAfford
                                    ? 'bg-star-gold text-galo-black hover:bg-star-gold-dark'
                                    : 'bg-text-muted text-text-secondary cursor-not-allowed'
                                }`}
                              >
                                Resgatar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {rewards.length > REWARDS_PREVIEW && (
                    <button
                      onClick={() => setRewardsShowAll((s) => !s)}
                      className="text-star-gold text-sm font-semibold text-center py-2 hover:underline active:scale-95 transition-transform"
                    >
                      {rewardsShowAll
                        ? 'Ver menos ▲'
                        : `Ver todos (${rewards.length}) ▼`}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmTask && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
          <div className="bg-card-bg rounded-2xl p-7 w-full max-w-xs flex flex-col items-center shadow-2xl animate-fade-in-up">
            <GaloBadge size={64} invert className="mb-2" />
            <h3 className="text-xl font-extrabold text-text-primary mb-3">Completar tarefa?</h3>
            <p className="text-lg font-semibold text-star-gold mb-1 text-center">{confirmTask.name}</p>
            <p className="text-sm text-text-secondary mb-6">+{confirmTask.starValue || 0} estrelas</p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setConfirmTask(null)}
                className="flex-1 py-3 rounded-xl bg-[#333] text-[#999] font-bold hover:bg-[#444] active:scale-95 transition-all"
              >
                Não
              </button>
              <button
                onClick={confirmCompleteTask}
                className="flex-1 py-3 rounded-xl bg-star-gold text-galo-black font-bold hover:bg-star-gold-dark active:scale-95 transition-all"
              >
                Fiz sim! ✅
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Celebration overlay */}
      {celebrationTask && (
        <GaloCelebration
          taskName={celebrationTask.name}
          stars={celebrationTask.stars}
          onDone={handleCelebrationDone}
        />
      )}

      {/* Canguru bonus challenge */}
      {canguruBonus && (
        <CanguruBonusModal onDone={handleCanguruBonusDone} />
      )}

      {/* Galo News card */}
      {newsItem && (
        <GaloNewsCard news={newsItem} onClose={handleCloseNews} />
      )}
    </div>
  );
}
