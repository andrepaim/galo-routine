import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useTaskStore, useRewardStore } from '../lib/stores';
import { TaskCard } from '../components/tasks/TaskCard';
import { RewardCard } from '../components/rewards/RewardCard';
import { useGaloSchedule } from '../lib/hooks/useGaloSchedule';
import type { GaloSuggestedReward } from '../lib/types';

const DEFAULT_REWARDS = [
  { name: '30min de videogame', description: '', starCost: 5, icon: '🎮', availability: 'unlimited' as const, requiresApproval: false },
  { name: 'Escolher o filme', description: '', starCost: 8, icon: '🎬', availability: 'unlimited' as const, requiresApproval: false },
  { name: 'Sorvete', description: '', starCost: 10, icon: '🍦', availability: 'unlimited' as const, requiresApproval: false },
  { name: 'Passeio especial', description: '', starCost: 20, icon: '🚗', availability: 'unlimited' as const, requiresApproval: true },
];

export default function Manage() {
  const navigate = useNavigate();
  const [tasksExpanded, setTasksExpanded] = useState(true);
  const [rewardsExpanded, setRewardsExpanded] = useState(true);
  const [galoExpanded, setGaloExpanded] = useState(true);
  const [editingSuggestion, setEditingSuggestion] = useState<{ type: string; starCost: number } | null>(null);

  const familyId = useAuthStore((s) => s.familyId);
  const { activeSuggestions, loading: galoLoading } = useGaloSchedule();
  const childName = useAuthStore((s) => s.childName);
  const { tasks, isLoading: tasksLoading, subscribe: subscribeTasks } = useTaskStore();
  const { rewards, isLoading: rewardsLoading, subscribeRewards, addReward } = useRewardStore();

  useEffect(() => {
    // Skip direct subscription in dev mode — data is seeded by useSubscriptions (App.tsx)
    if (!familyId || familyId === 'dev-family-123') return;
    const unsubscribeTasks = subscribeTasks(familyId);
    const unsubscribeRewards = subscribeRewards(familyId);
    return () => {
      unsubscribeTasks();
      unsubscribeRewards();
    };
  }, [familyId, subscribeTasks, subscribeRewards]);

  const activeTasks = tasks.filter((t) => t.isActive);
  const activeRewards = rewards.filter((r) => r.isActive);

  const handleAddGaloReward = async (suggestion: GaloSuggestedReward, starCost: number) => {
    if (!familyId) return;
    await addReward(familyId, {
      name: suggestion.name,
      description: suggestion.matchDate
        ? `${suggestion.competition || 'Jogo'} · ${suggestion.matchDate.slice(8, 10)}/${suggestion.matchDate.slice(5, 7)} às ${suggestion.matchTime || '?'}`
        : '',
      starCost,
      icon: suggestion.icon,
      availability: 'unlimited',
      requiresApproval: true,
    });
    setEditingSuggestion(null);
  };

  const isSuggestionAdded = (suggestion: GaloSuggestedReward) =>
    rewards.some((r) => r.name === suggestion.name);

  const initializeDefaultRewards = async () => {
    if (!familyId) {
      alert('Família não encontrada. Tente fazer login novamente.');
      return;
    }
    const confirmed = window.confirm(
      `Deseja criar alguns prêmios básicos para ${childName || 'seu filho'}?`,
    );
    if (!confirmed) return;
    try {
      for (const reward of DEFAULT_REWARDS) {
        await addReward(familyId, reward);
      }
      alert('Prêmios padrão criados com sucesso!');
    } catch (error: unknown) {
      alert(`Não foi possível criar os prêmios padrão.\n${(error as Error)?.message || ''}`);
    }
  };

  if (tasksLoading || rewardsLoading) {
    return (
      <div className="min-h-screen bg-galo-black flex items-center justify-center">
        <span className="text-5xl animate-pulse">⭐</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-galo-black safe-bottom">
      <div className="p-4 overflow-y-auto">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-6 animate-fade-in">
          <button
            onClick={() => navigate('/parent')}
            className="text-text-secondary hover:text-text-primary active:scale-95 transition-all"
          >
            ← Voltar
          </button>
          <h1 className="text-xl font-bold text-text-primary">Gerenciar</h1>
        </div>

        {/* Tasks Section */}
        <div className="mb-6 animate-fade-in-up">
          <button
            className="w-full flex justify-between items-center p-4 bg-card-bg border border-card-border rounded-xl mb-3 active:scale-[0.99] transition-transform"
            onClick={() => setTasksExpanded(!tasksExpanded)}
          >
            <div className="flex items-center gap-3">
              <span className="text-star-gold text-xl">✅</span>
              <span className="text-lg font-bold text-text-primary">
                Tarefas ({activeTasks.length})
              </span>
            </div>
            <span className="text-text-secondary text-xl">
              {tasksExpanded ? '▲' : '▼'}
            </span>
          </button>

          {tasksExpanded && (
            <div className="flex flex-col gap-3 animate-fade-in-down">
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/parent/tasks/new')}
                  className="flex-1 bg-star-gold text-galo-black font-bold py-2.5 rounded-xl text-sm hover:bg-star-gold-dark transition-colors active:scale-95"
                >
                  + Nova Tarefa
                </button>
              </div>

              {activeTasks.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {activeTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => navigate(`/parent/tasks/${task.id}`)}
                      className="text-left w-full active:scale-[0.99] transition-transform"
                    >
                      <TaskCard task={task} />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-card-bg border border-card-border rounded-xl p-6 flex flex-col items-center">
                  <span className="text-4xl mb-3">📝</span>
                  <p className="text-base font-bold text-text-primary mb-2 text-center">
                    Nenhuma tarefa ativa
                  </p>
                  <p className="text-sm text-text-secondary text-center">
                    Crie tarefas para {childName || 'seu filho'} começar a ganhar estrelas!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rewards Section */}
        <div className="mb-6 animate-fade-in-up">
          <button
            className="w-full flex justify-between items-center p-4 bg-card-bg border border-card-border rounded-xl mb-3 active:scale-[0.99] transition-transform"
            onClick={() => setRewardsExpanded(!rewardsExpanded)}
          >
            <div className="flex items-center gap-3">
              <span className="text-star-gold text-xl">🎁</span>
              <span className="text-lg font-bold text-text-primary">
                Prêmios ({activeRewards.length})
              </span>
            </div>
            <span className="text-text-secondary text-xl">
              {rewardsExpanded ? '▲' : '▼'}
            </span>
          </button>

          {rewardsExpanded && (
            <div className="flex flex-col gap-3 animate-fade-in-down">
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/parent/rewards/new')}
                  className="flex-1 bg-star-gold text-galo-black font-bold py-2.5 rounded-xl text-sm hover:bg-star-gold-dark transition-colors active:scale-95"
                >
                  + Novo Prêmio
                </button>
              </div>

              {activeRewards.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {activeRewards.map((reward) => (
                    <button
                      key={reward.id}
                      onClick={() => navigate(`/parent/rewards/${reward.id}`)}
                      className="text-left w-full active:scale-[0.99] transition-transform"
                    >
                      <RewardCard reward={reward} starBalance={0} />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-card-bg border border-card-border rounded-xl p-6 flex flex-col items-center">
                  <span className="text-4xl mb-3">🎁</span>
                  <p className="text-base font-bold text-text-primary mb-2 text-center">
                    Nenhum prêmio ativo
                  </p>
                  <p className="text-sm text-text-secondary text-center mb-4">
                    Crie prêmios para motivar {childName || 'seu filho'}!
                  </p>
                  <button
                    onClick={initializeDefaultRewards}
                    className="border border-star-gold text-star-gold px-4 py-2 rounded-xl text-sm hover:bg-star-gold/10 transition-colors active:scale-95"
                  >
                    Criar Prêmios Padrão
                  </button>
                </div>
              )}

              {/* Galo Suggestions */}
              {!galoLoading && activeSuggestions.length > 0 && (
                <div className="mt-2">
                  <button
                    className="w-full flex justify-between items-center px-3 py-2.5 bg-star-gold/10 border border-star-gold/40 rounded-xl mb-2 active:scale-[0.99] transition-transform"
                    onClick={() => setGaloExpanded(!galoExpanded)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">🏆</span>
                      <span className="text-sm font-bold text-star-gold">Sugestões Galo</span>
                      <span className="text-xs text-text-secondary">({activeSuggestions.length})</span>
                    </div>
                    <span className="text-text-secondary text-sm">{galoExpanded ? '▲' : '▼'}</span>
                  </button>

                  {galoExpanded && (
                    <div className="flex flex-col gap-2 animate-fade-in-down">
                      {activeSuggestions.map((suggestion) => {
                        const added = isSuggestionAdded(suggestion);
                        return (
                          <div
                            key={suggestion.type + suggestion.name}
                            className="bg-card-bg border border-card-border rounded-xl p-3 flex items-center gap-3"
                          >
                            <span className="text-2xl shrink-0">{suggestion.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-text-primary truncate">{suggestion.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-xs font-bold text-star-gold">⭐ {suggestion.starCost}</p>
                                {suggestion.daysAway !== undefined && suggestion.daysAway <= 7 && (
                                  <span className="text-xs bg-accent-red text-white px-1.5 py-0.5 rounded font-bold">
                                    {suggestion.daysAway === 0 ? 'HOJE' : `${suggestion.daysAway}d`}
                                  </span>
                                )}
                                {suggestion.competition && (
                                  <span className="text-xs text-text-muted">{suggestion.competition}</span>
                                )}
                              </div>
                            </div>
                            {added ? (
                              <span className="px-3 py-2 rounded-lg text-xs font-bold shrink-0 bg-accent-green/20 text-accent-green">
                                ✓ Adicionado
                              </span>
                            ) : editingSuggestion?.type === suggestion.type ? (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-xs text-text-secondary">⭐</span>
                                <input
                                  type="number"
                                  min={1}
                                  value={editingSuggestion.starCost}
                                  onChange={(e) =>
                                    setEditingSuggestion({ type: suggestion.type, starCost: Math.max(1, parseInt(e.target.value) || 1) })
                                  }
                                  className="w-14 text-center text-sm font-bold bg-gray-800 text-text-primary border border-star-gold rounded-lg px-1 py-1 focus:outline-none"
                                />
                                <button
                                  onClick={() => handleAddGaloReward(suggestion, editingSuggestion.starCost)}
                                  className="px-2 py-1.5 rounded-lg text-xs font-bold bg-star-gold text-galo-black active:scale-95 transition-all"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => setEditingSuggestion(null)}
                                  className="px-2 py-1.5 rounded-lg text-xs font-bold bg-gray-700 text-text-secondary active:scale-95 transition-all"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setEditingSuggestion({ type: suggestion.type, starCost: suggestion.starCost })}
                                className="px-3 py-2 rounded-lg text-xs font-bold shrink-0 bg-star-gold text-galo-black hover:bg-star-gold-dark transition-all active:scale-95"
                              >
                                + Adicionar
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="animate-fade-in-up">
          <div className="bg-card-bg border border-card-border rounded-xl p-4">
            <h3 className="text-base font-bold text-text-primary mb-4 text-center">📊 Resumo</h3>
            <div className="flex justify-around">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-star-gold">{activeTasks.length}</span>
                <span className="text-xs text-text-secondary text-center">Tarefas Ativas</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-star-gold">{activeRewards.length}</span>
                <span className="text-xs text-text-secondary text-center">Prêmios Ativos</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-star-gold">
                  {activeTasks.reduce((sum, t) => sum + (t.starValue || 1), 0)}
                </span>
                <span className="text-xs text-text-secondary text-center">Estrelas/Dia</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
