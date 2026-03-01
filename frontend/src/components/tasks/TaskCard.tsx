import React from 'react';
import { DAY_NAMES } from '../../constants';
import { formatTimeRange } from '../../lib/utils/time';
import type { Task } from '../../lib/types';

interface TaskCardProps {
  task: Task;
  onPress?: () => void;
  showRecurrence?: boolean;
}

function getRecurrenceLabel(task: Task): string {
  switch (task.recurrence.type) {
    case 'daily':
      return 'Todo dia';
    case 'specific_days':
      return task.recurrence.days?.map((d) => DAY_NAMES[d]).join(', ') ?? 'Sem dias';
    case 'once':
      return 'Uma vez';
    default:
      return '';
  }
}

export function TaskCard({ task, showRecurrence = true }: TaskCardProps) {
  const recurrenceLabel = getRecurrenceLabel(task);
  const timeLabel = formatTimeRange(task.startTime, task.endTime);

  return (
    <div
      className={`bg-card-bg border border-card-border rounded-xl p-4 ${!task.isActive ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-galo-dark flex items-center justify-center shrink-0">
          <span className="text-xl">{task.icon || '⭐'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-text-primary truncate">{task.name}</p>
          {task.description ? (
            <p className="text-sm text-text-secondary truncate">{task.description}</p>
          ) : null}
        </div>
        <div className="flex gap-0.5 shrink-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={`text-sm ${i < task.starValue ? 'text-star-gold' : 'text-card-border'}`}>
              ★
            </span>
          ))}
        </div>
      </div>

      {showRecurrence && (
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="inline-flex items-center gap-1 bg-galo-dark border border-card-border rounded-full px-2 py-0.5 text-xs text-text-secondary">
            📅 {recurrenceLabel}
          </span>
          {timeLabel && (
            <span className="inline-flex items-center gap-1 bg-galo-dark border border-card-border rounded-full px-2 py-0.5 text-xs text-text-secondary">
              🕐 {timeLabel}
            </span>
          )}
          {!task.isActive && (
            <span className="inline-flex items-center gap-1 bg-accent-red/20 border border-accent-red rounded-full px-2 py-0.5 text-xs text-accent-red">
              ⏸ Inativo
            </span>
          )}
        </div>
      )}
    </div>
  );
}
