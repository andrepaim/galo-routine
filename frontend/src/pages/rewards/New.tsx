import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useRewardStore } from '../../lib/stores';
import { RewardForm } from '../../components/rewards/RewardForm';
import type { RewardFormData } from '../../lib/types';

export default function NewReward() {
  const navigate = useNavigate();
  const familyId = useAuthStore((s) => s.familyId);
  const addReward = useRewardStore((s) => s.addReward);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: RewardFormData) => {
    if (!familyId) return;
    setLoading(true);
    try {
      await addReward(familyId, data);
      navigator.vibrate?.([50, 30, 50]);
      navigate(-1);
    } catch (e) {
      console.error('Failed to create reward:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-galo-black safe-bottom">
      <div className="flex items-center gap-3 p-4 border-b border-card-border">
        <button
          onClick={() => navigate(-1)}
          className="text-text-secondary hover:text-text-primary active:scale-95 transition-all"
        >
          ← Voltar
        </button>
        <h1 className="text-lg font-bold text-text-primary">Novo Prêmio</h1>
      </div>
      <RewardForm
        onSubmit={handleSubmit}
        onCancel={() => navigate(-1)}
        isLoading={loading}
        submitLabel="Criar Prêmio"
      />
    </div>
  );
}
