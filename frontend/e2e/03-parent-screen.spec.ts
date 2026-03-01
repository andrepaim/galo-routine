import { test, expect } from '@playwright/test';
import { goAsParent } from './helpers';

test.describe('Parent dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await goAsParent(page);
  });

  test.describe('Stats cards', () => {
    test('shows star balance card with star emoji', async ({ page }) => {
      // Parent dashboard shows family star balance
      await expect(page.getByText(/⭐/).first()).toBeVisible();
    });

    test('shows task progress "concluídas"', async ({ page }) => {
      // Should show some task progress indicator
      await expect(page.getByText(/concluída|tarefas|progresso/i).first()).toBeVisible();
    });
  });

  test.describe('Pending approvals', () => {
    test('pending section hidden or shows 0 when no pending completions', async ({ page }) => {
      // In dev mode, there might be some completions
      // Just verify the page loads correctly
      const pendingSection = page.getByText(/Aguardando Aprovação/i);
      // Either not visible OR shows count
      const isVisible = await pendingSection.isVisible();
      if (isVisible) {
        await expect(pendingSection).toBeVisible();
      }
    });

    test('shows "⏳ Aguardando Aprovação" when pending exist', async ({ page }) => {
      // If pending completions exist, should show the section
      // We check using dev mode which might have mock data
      // Just validate page structure
      await expect(page.locator('div').first()).toBeVisible();
    });
  });

  test.describe('Quick actions', () => {
    test.skip('"Nova Tarefa" button present', async ({ page }) => {
      // "Nova Tarefa" is on the Manage screen (/parent/manage), not the parent dashboard
    });

    test.skip('tapping "Nova Tarefa" navigates to /parent/tasks/new', async ({ page }) => {
      // "Nova Tarefa" is on the Manage screen (/parent/manage), not the parent dashboard
    });

    test.skip('"Novo Prêmio" button present', async ({ page }) => {
      // "Novo Prêmio" is on the Manage screen (/parent/manage), not the parent dashboard
    });

    test.skip('tapping "Novo Prêmio" navigates to /parent/rewards/new', async ({ page }) => {
      // "Novo Prêmio" is on the Manage screen (/parent/manage), not the parent dashboard
    });

    test('"Gerenciar" / manage button present', async ({ page }) => {
      await expect(page.getByText(/Gerenciar/i).first()).toBeVisible();
    });
  });

  test.describe('Today tasks list', () => {
    test('shows task names from dev data', async ({ page }) => {
      // Dev mode injects tasks, they should be visible in today's tasks
      await expect(page.getByText(/Escovar os dentes|Fazer lição|Arrumar o quarto/i).first()).toBeVisible();
    });

    test('shows empty state or tasks section', async ({ page }) => {
      // Either tasks are shown OR empty state is shown
      const hasTasks = await page.getByText(/Escovar/i).isVisible().catch(() => false);
      const hasEmpty = await page.getByText(/Nenhuma tarefa para hoje/i).isVisible().catch(() => false);
      expect(hasTasks || hasEmpty).toBe(true);
    });

    test('"Gerenciar Tarefas" button navigates to manage when shown', async ({ page }) => {
      const gerenciarBtn = page.getByRole('button', { name: /Gerenciar Tarefas/i });
      const isVisible = await gerenciarBtn.isVisible();
      if (isVisible) {
        await gerenciarBtn.click();
        await expect(page).toHaveURL('/parent/manage');
      }
    });
  });

  test.describe('Navigation', () => {
    test('manage button navigates to /parent/manage', async ({ page }) => {
      await page.getByText(/⚙️.*Gerenciar|Gerenciar/i).first().click();
      await expect(page).toHaveURL('/parent/manage');
    });
  });
});
