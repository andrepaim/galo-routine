import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { RewardForm } from '../../components/rewards/RewardForm';

const mockOnSubmit = vi.fn();
const mockOnCancel = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

describe('RewardForm', () => {
  it('renders with default submit label', () => {
    const { getByText } = render(
      <RewardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );
    expect(getByText('Criar Prêmio')).toBeTruthy();
    expect(getByText('Cancelar')).toBeTruthy();
  });

  it('renders with custom submit label', () => {
    const { getByText } = render(
      <RewardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} submitLabel="Salvar" />
    );
    expect(getByText('Salvar')).toBeTruthy();
  });

  it('calls onCancel when cancel pressed', () => {
    const { getByText } = render(
      <RewardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );
    fireEvent.click(getByText('Cancelar'));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('does not submit when name is empty', () => {
    const { getByText } = render(
      <RewardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );
    fireEvent.click(getByText('Criar Prêmio'));
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits with valid data', () => {
    const { getByText } = render(
      <RewardForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        initialData={{ name: 'Video Game', starCost: 15 }}
      />
    );
    fireEvent.click(getByText('Criar Prêmio'));
    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Video Game', starCost: 15 })
    );
  });

  it('renders availability options', () => {
    const { getByText } = render(
      <RewardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );
    expect(getByText('Ilimitado')).toBeTruthy();
    expect(getByText('Limitado')).toBeTruthy();
  });

  it('renders with initial data', () => {
    const { getByDisplayValue } = render(
      <RewardForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        initialData={{
          name: 'Ice Cream',
          description: 'A treat',
          starCost: 10,
        }}
      />
    );
    expect(getByDisplayValue('Ice Cream')).toBeTruthy();
    expect(getByDisplayValue('A treat')).toBeTruthy();
    expect(getByDisplayValue('10')).toBeTruthy();
  });

  it('renders approval toggle', () => {
    const { getByText } = render(
      <RewardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );
    expect(getByText('Requer aprovação dos pais')).toBeTruthy();
  });

  it('renders icon section', () => {
    const { getByText } = render(
      <RewardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );
    expect(getByText('Ícone')).toBeTruthy();
  });
});
