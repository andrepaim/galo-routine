import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTaskStore, useAuthStore } from '../../lib/stores';
import { TaskForm } from '../../components/tasks/TaskForm';
import type { TaskFormData } from '../../lib/types';

export default function EditTask() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const familyId = useAuthStore((s) => s.familyId);
  const tasks = useTaskStore((s) => s.tasks);
  const editTask = useTaskStore((s) => s.editTask);
  const removeTask = useTaskStore((s) => s.removeTask);
  const toggleTask = useTaskStore((s) => s.toggleTask);
  const [loading, setLoading] = useState(false);

  const task = tasks.find((t) => t.id === id);

  if (!task || !id) {
    return null;
  }

  const handleSubmit = async (data: TaskFormData) => {
    if (!familyId) return;
    setLoading(true);
    try {
      await editTask(familyId, id, data);
      navigate('/parent/manage', { replace: true });
    } catch (e) {
      console.error('Failed to update task:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(`Tem certeza que deseja excluir "${task.name}"?`);
    if (!confirmed) return;
    if (!familyId) return;
    await removeTask(familyId, id);
    navigate('/parent/manage', { replace: true });
  };

  const handleToggle = async () => {
    if (!familyId) return;
    await toggleTask(familyId, id, !task.isActive);
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
        <h1 className="text-lg font-bold text-text-primary">Editar Tarefa</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <TaskForm
          initialData={{
            name: task.name,
            description: task.description,
            starValue: task.starValue,
            icon: task.icon,
            recurrenceType: task.recurrence.type,
            days: task.recurrence.days ?? [],
            startTime: task.startTime,
            endTime: task.endTime,
            category: task.category,
          }}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/parent/manage', { replace: true })}
          isLoading={loading}
          submitLabel="Salvar"
        />
      </div>
      <div className="flex gap-3 p-4 border-t border-card-border">
        <button
          onClick={handleToggle}
          className="flex-1 py-3 rounded-xl border border-card-border text-text-secondary font-semibold hover:border-text-secondary transition-colors active:scale-95 text-sm"
        >
          {task.isActive ? '⏸ Desativar' : '▶ Ativar'}
        </button>
        <button
          onClick={handleDelete}
          className="flex-1 py-3 rounded-xl border border-accent-red text-accent-red font-semibold hover:bg-accent-red/10 transition-colors active:scale-95 text-sm"
        >
          🗑 Excluir
        </button>
      </div>
    </div>
  );
}
