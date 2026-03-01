import React, { useState } from 'react';
import { REWARD_ICONS } from '../../constants';
import type { RewardFormData } from '../../lib/types';

interface RewardFormProps {
  initialData?: Partial<RewardFormData>;
  onSubmit: (data: RewardFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function RewardForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Criar Prêmio',
}: RewardFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [starCost, setStarCost] = useState(String(initialData?.starCost ?? 10));
  const [icon, setIcon] = useState(initialData?.icon ?? '🎁');
  const [availability, setAvailability] = useState<'unlimited' | 'limited'>(
    initialData?.availability ?? 'unlimited',
  );
  const [quantity, setQuantity] = useState(String(initialData?.quantity ?? 1));
  const [requiresApproval, setRequiresApproval] = useState(initialData?.requiresApproval ?? true);

  const handleSubmit = () => {
    if (!name.trim()) return;
    const cost = parseInt(starCost, 10);
    if (isNaN(cost) || cost < 1) return;
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      starCost: cost,
      icon: icon || '🎁',
      availability,
      quantity: availability === 'limited' ? parseInt(quantity, 10) || 1 : undefined,
      requiresApproval,
    });
  };

  const inputCls =
    'w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-star-gold transition-colors';
  const labelCls = 'block text-text-secondary text-sm mb-1 mt-4';

  return (
    <div className="overflow-y-auto">
      <div className="p-4 flex flex-col gap-1">
        {/* Name */}
        <label className={labelCls}>Nome do Prêmio *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCls}
          placeholder="Ex: 30min de videogame"
        />

        {/* Description */}
        <label className={labelCls}>Descrição (opcional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`${inputCls} resize-none`}
          rows={2}
          placeholder="Detalhes do prêmio..."
        />

        {/* Star Cost */}
        <label className={labelCls}>Custo em Estrelas</label>
        <input
          type="number"
          value={starCost}
          onChange={(e) => setStarCost(e.target.value.replace(/[^0-9]/g, ''))}
          className={inputCls}
          placeholder="10"
          min="1"
        />

        {/* Icon */}
        <label className={labelCls}>Ícone</label>
        <input
          type="text"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          className={`${inputCls} mb-2`}
          placeholder="🎁"
        />
        <div className="flex flex-wrap gap-2">
          {REWARD_ICONS.map((ic) => (
            <button
              key={ic}
              type="button"
              onClick={() => setIcon(ic)}
              className={`w-10 h-10 text-xl rounded-xl border transition-all active:scale-95 ${
                icon === ic
                  ? 'bg-star-gold border-star-gold'
                  : 'bg-card-bg border-card-border hover:border-star-gold'
              }`}
            >
              {ic}
            </button>
          ))}
        </div>

        {/* Availability */}
        <label className={labelCls}>Disponibilidade</label>
        <div className="flex rounded-xl overflow-hidden border border-card-border">
          {(['unlimited', 'limited'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setAvailability(type)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                availability === type
                  ? 'bg-star-gold text-galo-black'
                  : 'bg-card-bg text-text-secondary hover:bg-card-border'
              }`}
            >
              {type === 'unlimited' ? 'Ilimitado' : 'Limitado'}
            </button>
          ))}
        </div>

        {/* Quantity (when limited) */}
        {availability === 'limited' && (
          <>
            <label className={labelCls}>Quantidade</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value.replace(/[^0-9]/g, ''))}
              className={inputCls}
              placeholder="1"
              min="1"
            />
          </>
        )}

        {/* Requires Approval */}
        <div className="flex items-center justify-between py-3 mt-2">
          <span className="text-sm text-text-primary">Requer aprovação dos pais</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={requiresApproval}
              onChange={(e) => setRequiresApproval(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-card-border peer-checked:bg-star-gold rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6 pb-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-card-border text-text-secondary font-semibold hover:border-text-secondary transition-colors active:scale-95"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!name.trim() || isLoading}
            className="flex-1 py-3 rounded-xl bg-star-gold text-galo-black font-bold hover:bg-star-gold-dark transition-colors disabled:opacity-60 active:scale-95"
          >
            {isLoading ? 'Salvando...' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
