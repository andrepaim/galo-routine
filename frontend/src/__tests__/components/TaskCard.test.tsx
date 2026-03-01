import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TaskCard } from '../../components/tasks/TaskCard';
import type { Task } from '../../lib/types';

const baseTask: Task = {
  id: 'task-1',
  name: 'Brush Teeth',
  description: 'Morning brush',
  starValue: 2,
  icon: '🦷',
  isActive: true,
  recurrence: { type: 'daily' },
};

describe('TaskCard', () => {
  it('renders task name', () => {
    const { getByText } = render(<TaskCard task={baseTask} />);
    expect(getByText('Brush Teeth')).toBeTruthy();
  });

  it('shows daily recurrence label', () => {
    const { getByText } = render(<TaskCard task={baseTask} />);
    expect(getByText(/Todo dia/)).toBeTruthy();
  });

  it('shows specific_days recurrence label', () => {
    const task: Task = {
      ...baseTask,
      recurrence: { type: 'specific_days', days: [0, 2, 4] },
    };
    const { getByText } = render(<TaskCard task={task} />);
    expect(getByText(/Dom, Ter, Qui/)).toBeTruthy();
  });

  it('shows once recurrence label', () => {
    const task: Task = {
      ...baseTask,
      recurrence: { type: 'once' },
    };
    const { getByText } = render(<TaskCard task={task} />);
    expect(getByText(/Uma vez/)).toBeTruthy();
  });

  it('shows inactive chip for inactive task', () => {
    const task: Task = { ...baseTask, isActive: false };
    const { getByText } = render(<TaskCard task={task} />);
    expect(getByText(/Inativo/)).toBeTruthy();
  });

  it('hides recurrence when showRecurrence is false', () => {
    const { queryByText } = render(<TaskCard task={baseTask} showRecurrence={false} />);
    expect(queryByText(/Todo dia/)).toBeNull();
  });

  it('shows time range when times are set', () => {
    const task: Task = {
      ...baseTask,
      startTime: '08:00',
      endTime: '09:00',
    };
    const { getByText } = render(<TaskCard task={task} />);
    expect(getByText(/8:00 AM - 9:00 AM/)).toBeTruthy();
  });
});
