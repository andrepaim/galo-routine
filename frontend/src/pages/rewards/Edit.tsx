import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore, useRewardStore } from '../../lib/stores';
import { RewardForm } from '../../components/rewards/RewardForm';
import type { RewardFormData } from '../../lib/types';

export default function EditReward() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const familyId = useAuthStore((s) => s.familyId);
  const { rewards, editReward, removeReward } = useRewardStore();
  const [loading, setLoading] = useState(false);

  const reward = rewards.find((r) => r.id === id);

  if (!reward) {
    navigate('/parent/manage', { replace: true });
    return null;
  }

  const handleSubmit = async (data: RewardFormData) => {
    if (!familyId || !id) return;
    setLoading(true);
    try {
      await editReward(familyId, id, data);
      navigator.vibrate?.([50, 30, 50]);
      navigate('/parent/manage', { replace: true });
    } catch (e) {
      console.error('Failed to update reward:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(`Excluir "${reward.name}"?`);
    if (!confirmed) return;
    if (!familyId || !id) return;
    await removeReward(familyId, id);
    navigate('/parent/manage', { replace: true });
  };

  return (
    <div className="min-h-screen bg-galo-black safe-bottom flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b border-card-border">
        <button
          onClick={() => navigate('/parent/manage', { replace: true })}
          className="text-text-secondary hover:text-text-primary active:scale-95 transition-all"
        >
          ← Voltar
        </button>
        <h1 className="text-lg font-bold text-text-primary">Editar Prêmio</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <RewardForm
          initialData={{
            name: reward.name,
            description: reward.description,
            starCost: reward.starCost,
            icon: reward.icon,
            availability: reward.availability,
            quantity: reward.quantity,
            requiresApproval: reward.requiresApproval,
          }}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/parent/manage', { replace: true })}
          isLoading={loading}
          submitLabel="Salvar"
        />
      </div>
      <div className="p-4 border-t border-card-border">
        <button
          onClick={handleDelete}
          className="w-full py-3 rounded-xl border border-accent-red text-accent-red font-semibold hover:bg-accent-red/10 transition-colors active:scale-95"
        >
          🗑 Excluir Prêmio
        </button>
      </div>
    </div>
  );
}
