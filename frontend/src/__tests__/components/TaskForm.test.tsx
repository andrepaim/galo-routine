import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { TaskForm } from '../../components/tasks/TaskForm';

const mockOnSubmit = vi.fn();
const mockOnCancel = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TaskForm', () => {
  it('renders with default submit label', () => {
    const { getByText } = render(
      <TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );
    expect(getByText('Criar Tarefa')).toBeTruthy();
    expect(getByText('Cancelar')).toBeTruthy();
  });

  it('renders with custom submit label', () => {
    const { getByText } = render(
      <TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} submitLabel="Salvar" />
    );
    expect(getByText('Salvar')).toBeTruthy();
  });

  it('calls onCancel when cancel pressed', () => {
    const { getByText } = render(
      <TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );
    fireEvent.click(getByText('Cancelar'));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('does not submit when name is empty', () => {
    const { getByText } = render(
      <TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );
    fireEvent.click(getByText('Criar Tarefa'));
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits with valid data', () => {
    const { getByText, getByDisplayValue } = render(
      <TaskForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        initialData={{ name: 'Brush teeth', starValue: 2, recurrenceType: 'daily' }}
      />
    );
    expect(getByDisplayValue('Brush teeth')).toBeTruthy();
    fireEvent.click(getByText('Criar Tarefa'));
    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Brush teeth', starValue: 2, recurrenceType: 'daily' })
    );
  });

  it('renders recurrence options', () => {
    const { getByText } = render(
      <TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );
    expect(getByText('Todo dia')).toBeTruthy();
    expect(getByText('Dias específicos')).toBeTruthy();
    expect(getByText('Uma vez')).toBeTruthy();
  });

  it('renders with initial data', () => {
    const { getByDisplayValue } = render(
      <TaskForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        initialData={{
          name: 'Test Task',
          description: 'A description',
          starValue: 3,
        }}
      />
    );
    expect(getByDisplayValue('Test Task')).toBeTruthy();
    expect(getByDisplayValue('A description')).toBeTruthy();
  });

  it('shows loading state text', () => {
    const { getByText } = render(
      <TaskForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isLoading={true}
        initialData={{ name: 'Test' }}
      />
    );
    expect(getByText('Salvando...')).toBeTruthy();
  });

  it('renders category section', () => {
    const { getByText } = render(
      <TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );
    expect(getByText('Categoria')).toBeTruthy();
  });

  it('renders schedule section', () => {
    const { getByText } = render(
      <TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );
    expect(getByText('Horário (opcional)')).toBeTruthy();
  });
});
