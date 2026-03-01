import { test, expect } from '@playwright/test';
import { goAsParent } from './helpers';

test.describe('Manage screen', () => {
  test.beforeEach(async ({ page }) => {
    await goAsParent(page);
    await page.goto('/?dev=parent');
    await page.waitForURL('/parent');
    await page.getByText(/⚙️.*Gerenciar|Gerenciar/i).first().click();
    await expect(page).toHaveURL('/parent/manage');
  });

  test.describe('Stats summary', () => {
    test('shows "Tarefas Ativas" stat', async ({ page }) => {
      await expect(page.getByText('Tarefas Ativas')).toBeVisible();
    });

    test('shows "Prêmios Ativos" stat', async ({ page }) => {
      await expect(page.getByText('Prêmios Ativos')).toBeVisible();
    });

    test('shows "Estrelas/Dia" stat', async ({ page }) => {
      await expect(page.getByText('Estrelas/Dia')).toBeVisible();
    });

    test('shows Resumo section', async ({ page }) => {
      await expect(page.getByText(/Resumo/i)).toBeVisible();
    });
  });

  test.describe('Tasks section', () => {
    test('shows "Tarefas" header with count', async ({ page }) => {
      await expect(page.getByText(/Tarefas \(\d+\)/)).toBeVisible();
    });

    test('tasks section expanded by default', async ({ page }) => {
      await expect(page.getByText(/Nova Tarefa/)).toBeVisible();
    });

    test('tapping section header collapses tasks list', async ({ page }) => {
      // Click the Tarefas header button to collapse
      const tasksHeader = page.getByRole('button').filter({ hasText: /Tarefas \(\d+\)/ });
      await tasksHeader.click();
      // After collapse, "Nova Tarefa" button should not be visible
      await expect(page.getByText(/Nova Tarefa/).first()).not.toBeVisible();
    });

    test('tapping collapsed section header expands tasks list', async ({ page }) => {
      const tasksHeader = page.getByRole('button').filter({ hasText: /Tarefas \(\d+\)/ });
      await tasksHeader.click(); // collapse
      await tasksHeader.click(); // expand
      await expect(page.getByText(/Nova Tarefa/)).toBeVisible();
    });

    test('"Nova Tarefa" button navigates to /parent/tasks/new', async ({ page }) => {
      await page.getByText(/Nova Tarefa/).click();
      await expect(page).toHaveURL('/parent/tasks/new');
    });

    test('renders task cards from dev data', async ({ page }) => {
      await expect(page.getByText(/Escovar os dentes/)).toBeVisible();
    });

    test('tapping task card navigates to edit page', async ({ page }) => {
      await page.getByText(/Escovar os dentes/).click();
      await expect(page).toHaveURL(/\/parent\/tasks\/task-1/);
    });
  });

  test.describe('Rewards section', () => {
    test('shows "Prêmios" header with count', async ({ page }) => {
      await expect(page.getByText(/Prêmios \(\d+\)/)).toBeVisible();
    });

    test('rewards section expanded by default', async ({ page }) => {
      await expect(page.getByText(/Novo Prêmio/)).toBeVisible();
    });

    test('tapping section header collapses rewards list', async ({ page }) => {
      const rewardsHeader = page.getByRole('button').filter({ hasText: /Prêmios \(\d+\)/ });
      await rewardsHeader.click();
      await expect(page.getByText(/Novo Prêmio/).first()).not.toBeVisible();
    });

    test('"Novo Prêmio" button navigates to /parent/rewards/new', async ({ page }) => {
      await page.getByText(/Novo Prêmio/).click();
      await expect(page).toHaveURL('/parent/rewards/new');
    });

    test('renders reward cards from dev data', async ({ page }) => {
      await expect(page.getByText(/videogame|Filme|Sorvete/i).first()).toBeVisible();
    });

    test('shows "Criar Prêmios Padrão" when no rewards or shows rewards', async ({ page }) => {
      // Either rewards are shown OR "Criar Prêmios Padrão" is shown
      const hasRewards = await page.getByText(/videogame|Sorvete/i).first().isVisible().catch(() => false);
      const hasDefault = await page.getByText(/Criar Prêmios Padrão/i).isVisible().catch(() => false);
      expect(hasRewards || hasDefault).toBe(true);
    });
  });

  test.describe('Navigation', () => {
    test('back button navigates back to /parent', async ({ page }) => {
      await page.getByRole('button', { name: /←.*Voltar|Voltar/i }).click();
      await expect(page).toHaveURL('/parent');
    });
  });
});
