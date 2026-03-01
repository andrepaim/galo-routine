import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Manage from '../../pages/Manage';
import { useAuthStore } from '../../lib/stores/authStore';
import { useTaskStore } from '../../lib/stores/taskStore';
import { useRewardStore } from '../../lib/stores/rewardStore';

vi.mock('../../lib/api/db');
vi.mock('../../lib/api/sse', () => ({
  getSSE: vi.fn(() => ({ addEventListener: vi.fn(), removeEventListener: vi.fn() })),
}));

// Mock child components to avoid complex rendering
vi.mock('../../components/tasks/TaskCard', () => ({
  TaskCard: ({ task }: any) => <span>{task.name}</span>,
}));
vi.mock('../../components/rewards/RewardCard', () => ({
  RewardCard: ({ reward }: any) => <span>{reward.name}</span>,
}));

function renderManage() {
  return render(
    <MemoryRouter>
      <Manage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({
    familyId: 'fam-1',
    family: null,
    childName: 'Vitor',
    uid: 'u1',
    email: 'test@test.com',
    role: 'parent',
    parentName: 'Dad',
    isLoading: false,
    isAuthenticated: true,
  });
  useTaskStore.setState({
    tasks: [],
    isLoading: false,
    subscribe: vi.fn(() => vi.fn()) as any,
  });
  useRewardStore.setState({
    rewards: [],
    redemptions: [],
    isLoading: false,
    subscribeRewards: vi.fn(() => vi.fn()) as any,
    subscribeRedemptions: vi.fn(() => vi.fn()) as any,
  });
});

describe('Manage screen', () => {
  it('renders tasks section header', () => {
    const { getByText } = renderManage();
    expect(getByText('Tarefas (0)')).toBeTruthy();
  });

  it('renders rewards section header', () => {
    const { getByText } = renderManage();
    expect(getByText('Prêmios (0)')).toBeTruthy();
  });

  it('shows empty task state', () => {
    const { getByText } = renderManage();
    expect(getByText('Nenhuma tarefa ativa')).toBeTruthy();
  });

  it('shows empty reward state', () => {
    const { getByText } = renderManage();
    expect(getByText('Nenhum prêmio ativo')).toBeTruthy();
  });

  it('shows Nova Tarefa button', () => {
    const { getByText } = renderManage();
    expect(getByText(/Nova Tarefa/)).toBeTruthy();
  });

  it('shows Novo Prêmio button', () => {
    const { getByText } = renderManage();
    expect(getByText(/Novo Prêmio/)).toBeTruthy();
  });

  it('renders tasks when available', () => {
    useTaskStore.setState({
      tasks: [
        { id: 't1', name: 'Brush Teeth', starValue: 2, isActive: true, recurrence: { type: 'daily' } } as any,
        { id: 't2', name: 'Homework', starValue: 3, isActive: true, recurrence: { type: 'daily' } } as any,
      ],
      isLoading: false,
    });
    const { getByText } = renderManage();
    expect(getByText('Tarefas (2)')).toBeTruthy();
    expect(getByText('Brush Teeth')).toBeTruthy();
    expect(getByText('Homework')).toBeTruthy();
  });

  it('renders rewards when available', () => {
    useRewardStore.setState({
      rewards: [
        { id: 'r1', name: 'Video Game', starCost: 10, isActive: true, availability: 'unlimited' } as any,
      ],
      redemptions: [],
      isLoading: false,
    });
    const { getByText } = renderManage();
    expect(getByText('Prêmios (1)')).toBeTruthy();
    expect(getByText('Video Game')).toBeTruthy();
  });

  it('shows stats summary', () => {
    useTaskStore.setState({
      tasks: [
        { id: 't1', name: 'T1', starValue: 2, isActive: true, recurrence: { type: 'daily' } } as any,
        { id: 't2', name: 'T2', starValue: 3, isActive: true, recurrence: { type: 'daily' } } as any,
      ],
      isLoading: false,
    });
    const { getByText } = renderManage();
    expect(getByText('Tarefas Ativas')).toBeTruthy();
    expect(getByText('Prêmios Ativos')).toBeTruthy();
    expect(getByText('Estrelas/Dia')).toBeTruthy();
  });

  it('shows default rewards button when no rewards', () => {
    const { getByText } = renderManage();
    expect(getByText('Criar Prêmios Padrão')).toBeTruthy();
  });

  it('filters only active tasks', () => {
    useTaskStore.setState({
      tasks: [
        { id: 't1', name: 'Active', starValue: 1, isActive: true, recurrence: { type: 'daily' } } as any,
        { id: 't2', name: 'Inactive', starValue: 1, isActive: false, recurrence: { type: 'daily' } } as any,
      ],
      isLoading: false,
    });
    const { getByText, queryByText } = renderManage();
    expect(getByText('Tarefas (1)')).toBeTruthy();
    expect(getByText('Active')).toBeTruthy();
    expect(queryByText('Inactive')).toBeNull();
  });

  it('shows loading spinner when loading', () => {
    useTaskStore.setState({ tasks: [], isLoading: true, subscribe: vi.fn(() => vi.fn()) as any });
    useRewardStore.setState({
      rewards: [],
      redemptions: [],
      isLoading: true,
      subscribeRewards: vi.fn(() => vi.fn()) as any,
      subscribeRedemptions: vi.fn(() => vi.fn()) as any,
    });
    const { container } = renderManage();
    // Loading state renders an animated star instead of the main content
    expect(container.textContent).toContain('⭐');
  });
});
