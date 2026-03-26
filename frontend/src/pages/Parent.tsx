import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useCompletionStore, useRewardStore } from '../lib/stores';
import { useCurrentPeriod } from '../lib/hooks/useCurrentPeriod';
import { useTodayTasks } from '../lib/hooks/useTodayTasks';

export default function Parent() {
  const navigate = useNavigate();

  const childName = useAuthStore((s) => s.childName);
  const setRole = useAuthStore((s) => s.setRole);
  const logout = useAuthStore((s) => s.logout);
  const family = useAuthStore((s) => s.family);
  const familyId = useAuthStore((s) => s.familyId);
  const { activePeriod } = useCurrentPeriod();
  const { todayTasks, isLoading } = useTodayTasks();
  const { completions, approveCompletion, rejectCompletion } = useCompletionStore();
  const { rewards, redemptions, fulfillRedemption, rejectRedemption } = useRewardStore();
  const pendingRedemptions = redemptions.filter((r) => r.status === 'pending');

  const pendingCompletions = completions.filter((c) => c.status === 'pending');
  const completedCount = todayTasks.filter((t) => t.completion?.status === 'approved').length;
  const totalTasks = todayTasks.length;
  const starBalance = family?.starBalance || 0;

  const handleApprove = async (completionId: string) => {
    if (!familyId || !activePeriod?.id) return;
    navigator.vibrate?.([50, 30, 50]);
    await approveCompletion(familyId, activePeriod.id, completionId);
  };

  const handleReject = async (completionId: string) => {
    if (!familyId || !activePeriod?.id) return;
    navigator.vibrate?.([100]);
    await rejectCompletion(familyId, activePeriod.id, completionId, 'Não aprovado');
  };

  const handleFulfillRedemption = async (redemptionId: string) => {
    if (!familyId) return;
    navigator.vibrate?.([50, 30, 50]);
    await fulfillRedemption(familyId, redemptionId);
  };

  const handleRejectRedemption = async (redemptionId: string) => {
    if (!familyId) return;
    navigator.vibrate?.([100]);
    await rejectRedemption(familyId, redemptionId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-galo-black flex items-center justify-center">
        <span className="text-5xl animate-pulse">⭐</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-galo-black safe-bottom">
      <div className="p-4 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 animate-fade-in">
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              Painel dos Pais 👨‍👩‍👦
            </h1>
            <p className="text-sm text-text-secondary">{childName || 'Vitor'}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { navigate('/child', { replace: true }); setRole('child'); }}
              className="border border-star-gold text-star-gold px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-star-gold/10 transition-colors active:scale-95"
            >
              👶 Filho
            </button>
            <button
              onClick={() => navigate('/parent/manage')}
              className="bg-card-bg border border-card-border px-4 py-2 rounded-xl text-text-secondary text-sm hover:border-star-gold hover:text-star-gold transition-colors active:scale-95"
            >
              ⚙️ Gerenciar
            </button>
            <button
              onClick={() => { if (confirm('Sair da conta?')) logout(); }}
              className="bg-card-bg border border-card-border px-3 py-2 rounded-xl text-text-secondary text-sm hover:border-red-500 hover:text-red-400 transition-colors active:scale-95"
              title="Sair"
            >
              🚪
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6 animate-fade-in-down">
          <div className="bg-card-bg border border-card-border rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">⭐</span>
            <div className="flex-1 min-w-0">
              <p className="text-xl font-bold text-text-primary truncate">
                {starBalance >= 1000
                  ? `${(starBalance / 1000).toFixed(1).replace('.0', '')}k`
                  : starBalance}
              </p>
              <p className="text-xs text-text-secondary truncate">Estrelas de {childName || 'Vitor'}</p>
            </div>
          </div>
          <div className="bg-card-bg border border-card-border rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <div className="flex-1">
              <p className="text-xl font-bold text-text-primary">{completedCount}/{totalTasks}</p>
              <p className="text-xs text-text-secondary">Tarefas de hoje</p>
            </div>
          </div>
        </div>

        {/* Pending Approvals */}
        {pendingCompletions.length > 0 && (
          <div className="mb-6 animate-fade-in-down">
            <h2 className="text-lg font-bold text-text-primary mb-3">
              ⏳ Aguardando Aprovação ({pendingCompletions.length})
            </h2>
            <div className="flex flex-col gap-3">
              {pendingCompletions.map((completion) => {
                const task = todayTasks.find((t) => t.id === completion.taskId);
                if (!task) return null;
                return (
                  <div
                    key={completion.id}
                    className="bg-card-bg border border-star-gold rounded-xl p-4 animate-fade-in-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 flex items-center justify-center shrink-0">
                        <span className="text-2xl">{task.icon || '📝'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-text-primary truncate">{task.name}</p>
                        <p className="text-sm text-star-gold">⭐ {task.starValue || 1} estrelas</p>
                        {completion.completedAt && (
                          <p className="text-xs text-text-muted">
                            {new Date(completion.completedAt as string).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleReject(completion.id!)}
                          className="px-3 py-1.5 rounded-lg text-sm font-bold border border-accent-red text-accent-red active:scale-95 transition-transform"
                        >
                          Não
                        </button>
                        <button
                          onClick={() => handleApprove(completion.id!)}
                          className="px-3 py-1.5 rounded-lg text-sm font-bold bg-star-gold text-galo-black active:scale-95 transition-transform"
                        >
                          Sim
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pending Redemptions */}
        {pendingRedemptions.length > 0 && (
          <div className="mb-6 animate-fade-in-down">
            <h2 className="text-lg font-bold text-text-primary mb-3">
              🎁 Prêmios Pedidos ({pendingRedemptions.length})
            </h2>
            <div className="flex flex-col gap-3">
              {pendingRedemptions.map((redemption) => {
                const reward = rewards.find((r) => r.id === redemption.rewardId);
                return (
                  <div
                    key={redemption.id}
                    className="bg-card-bg border border-star-gold rounded-xl p-4 animate-fade-in-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 flex items-center justify-center shrink-0">
                        <span className="text-2xl">{reward?.icon || '🎁'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-text-primary truncate">
                          {redemption.rewardName}
                        </p>
                        <p className="text-sm text-star-gold">⭐ {redemption.starCost} estrelas</p>
                        {redemption.redeemedAt && (
                          <p className="text-xs text-text-muted">
                            {new Date(redemption.redeemedAt as string).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleRejectRedemption(redemption.id!)}
                          className="px-3 py-1.5 rounded-lg text-sm font-bold border border-accent-red text-accent-red active:scale-95 transition-transform"
                        >
                          Não
                        </button>
                        <button
                          onClick={() => handleFulfillRedemption(redemption.id!)}
                          className="px-3 py-1.5 rounded-lg text-sm font-bold bg-star-gold text-galo-black active:scale-95 transition-transform"
                        >
                          Sim
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Today's Tasks */}
        {totalTasks > 0 && (
          <div className="mb-6 animate-fade-in-up">
            <h2 className="text-lg font-bold text-text-primary mb-3">📝 Tarefas de Hoje</h2>
            <div className="flex flex-col gap-2">
              {todayTasks.map((task) => {
                const isCompleted = task.completion?.status === 'approved';
                const isPending = task.completion?.status === 'pending';
                return (
                  <div
                    key={task.id}
                    className={`rounded-xl border p-3 flex items-center gap-3 transition-colors ${
                      isCompleted
                        ? 'border-accent-green bg-accent-green/10'
                        : isPending
                        ? 'border-star-gold bg-star-gold/10'
                        : 'border-card-border bg-card-bg'
                    }`}
                  >
                    <span className="text-xl">{task.icon || '📝'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{task.name}</p>
                      <p className="text-xs text-star-gold">⭐ {task.starValue || 1}</p>
                    </div>
                    <span className="text-xl shrink-0">
                      {isCompleted ? '✅' : isPending ? '⏳' : '⚪'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {totalTasks === 0 && (
          <div className="animate-fade-in-up">
            <div className="bg-card-bg border border-card-border rounded-xl p-8 flex flex-col items-center">
              <span className="text-5xl mb-4">📝</span>
              <h3 className="text-xl font-bold text-text-primary mb-2 text-center">
                Nenhuma tarefa para hoje
              </h3>
              <p className="text-sm text-text-secondary text-center mb-6">
                Crie tarefas para {childName || 'seu filho'} começar a ganhar estrelas!
              </p>
              <button
                onClick={() => navigate('/parent/manage')}
                className="bg-star-gold text-galo-black font-bold px-6 py-3 rounded-xl hover:bg-star-gold-dark transition-colors active:scale-95"
              >
                Gerenciar Tarefas
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
