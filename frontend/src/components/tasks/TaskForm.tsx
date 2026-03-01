import React, { useState } from 'react';
import { DAY_NAMES, STAR_VALUES, TASK_CATEGORIES } from '../../constants';
import type { TaskFormData, TaskCategoryId } from '../../lib/types';

interface TaskFormProps {
  initialData?: Partial<TaskFormData>;
  onSubmit: (data: TaskFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function TaskForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Criar Tarefa',
}: TaskFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [starValue, setStarValue] = useState(initialData?.starValue ?? 1);
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'specific_days' | 'once'>(
    initialData?.recurrenceType ?? 'daily',
  );
  const [days, setDays] = useState<number[]>(initialData?.days ?? []);
  const [icon, setIcon] = useState(initialData?.icon ?? '⭐');
  const [startTime, setStartTime] = useState<string>(initialData?.startTime ?? '');
  const [endTime, setEndTime] = useState<string>(initialData?.endTime ?? '');
  const [category, setCategory] = useState<string | undefined>(initialData?.category);
  const [requiresProof, setRequiresProof] = useState(initialData?.requiresProof ?? false);

  const toggleDay = (day: number) => {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      starValue,
      icon: icon || '⭐',
      recurrenceType,
      days,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      category: category as TaskCategoryId,
      requiresProof,
    });
  };

  const inputCls =
    'w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-star-gold transition-colors';
  const labelCls = 'block text-text-secondary text-sm mb-1 mt-4';

  return (
    <div className="overflow-y-auto">
      <div className="p-4 flex flex-col gap-1">
        {/* Name */}
        <label className={labelCls}>Nome da Tarefa *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCls}
          placeholder="Ex: Escovar os dentes"
        />

        {/* Description */}
        <label className={labelCls}>Descrição (opcional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`${inputCls} resize-none`}
          rows={2}
          placeholder="Detalhes da tarefa..."
        />

        {/* Icon */}
        <label className={labelCls}>Emoji / Ícone</label>
        <input
          type="text"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          className={inputCls}
          placeholder="Ex: 🦷 ou 📚"
        />

        {/* Category */}
        <label className={labelCls}>Categoria</label>
        <div className="flex flex-wrap gap-2">
          {TASK_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(category === cat.id ? undefined : cat.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all active:scale-95 ${
                category === cat.id
                  ? 'text-white border-transparent'
                  : 'text-text-secondary border-card-border bg-galo-dark'
              }`}
              style={category === cat.id ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Star Value */}
        <label className={labelCls}>Valor em Estrelas: {starValue}</label>
        <input
          type="range"
          min="1"
          max="5"
          value={starValue}
          onChange={(e) => setStarValue(Number(e.target.value))}
          className="w-full accent-yellow-400 h-2 rounded-full"
        />
        <div className="flex justify-between text-text-muted text-xs px-1">
          {STAR_VALUES.map((v) => (
            <span key={v} className={v <= starValue ? 'text-star-gold' : ''}>
              {'★'.repeat(v)}
            </span>
          ))}
        </div>

        {/* Recurrence */}
        <label className={labelCls}>Recorrência</label>
        <div className="flex rounded-xl overflow-hidden border border-card-border">
          {(['daily', 'specific_days', 'once'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setRecurrenceType(type)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                recurrenceType === type
                  ? 'bg-star-gold text-galo-black'
                  : 'bg-card-bg text-text-secondary hover:bg-card-border'
              }`}
            >
              {type === 'daily' ? 'Todo dia' : type === 'specific_days' ? 'Dias específicos' : 'Uma vez'}
            </button>
          ))}
        </div>

        {/* Days (when specific_days) */}
        {recurrenceType === 'specific_days' && (
          <div className="flex flex-wrap gap-2 mt-2">
            {DAY_NAMES.map((dayName, index) => (
              <button
                key={index}
                type="button"
                onClick={() => toggleDay(index)}
                className={`w-12 h-12 rounded-full text-sm font-bold border transition-all active:scale-95 ${
                  days.includes(index)
                    ? 'bg-star-gold text-galo-black border-star-gold'
                    : 'bg-card-bg text-text-secondary border-card-border'
                }`}
              >
                {dayName}
              </button>
            ))}
          </div>
        )}

        {/* Time */}
        <label className={labelCls}>Horário (opcional)</label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-text-muted mb-1">Início</p>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <p className="text-xs text-text-muted mb-1">Fim</p>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        {/* Requires Proof */}
        <div className="flex items-center justify-between py-3 mt-2">
          <span className="text-sm text-text-primary">Requer comprovante (foto/nota)</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={requiresProof}
              onChange={(e) => setRequiresProof(e.target.checked)}
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
