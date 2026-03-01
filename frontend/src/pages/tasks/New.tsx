import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaskStore, useAuthStore } from '../../lib/stores';
import { TaskForm } from '../../components/tasks/TaskForm';
import type { TaskFormData } from '../../lib/types';

export default function NewTask() {
  const navigate = useNavigate();
  const familyId = useAuthStore((s) => s.familyId);
  const addTask = useTaskStore((s) => s.addTask);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: TaskFormData) => {
    if (!familyId) return;
    setLoading(true);
    try {
      await addTask(familyId, data);
      navigate(-1);
    } catch (e) {
      console.error('Failed to create task:', e);
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
        <h1 className="text-lg font-bold text-text-primary">Nova Tarefa</h1>
      </div>
      <TaskForm
        onSubmit={handleSubmit}
        onCancel={() => navigate(-1)}
        isLoading={loading}
        submitLabel="Criar Tarefa"
      />
    </div>
  );
}
