import { test, expect } from '@playwright/test';
import { goAsParent } from './helpers';

test.describe('Task CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await goAsParent(page);
  });

  test.describe('Create task — /parent/tasks/new', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/parent/tasks/new');
    });

    test('renders form with task name field', async ({ page }) => {
      await expect(page.getByPlaceholder(/Escovar os dentes/i)).toBeVisible();
    });

    test('"Criar Tarefa" submit button present', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Criar Tarefa' })).toBeVisible();
    });

    test('validation: empty name disables submit button', async ({ page }) => {
      // Button is disabled when name is empty — HTML validation prevents submission
      await expect(page.getByRole('button', { name: 'Criar Tarefa' })).toBeDisabled();
    });

    test('renders recurrence options', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Todo dia' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Dias específicos' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Uma vez' })).toBeVisible();
    });

    test('switching to "Dias específicos" shows day checkboxes', async ({ page }) => {
      await page.getByRole('button', { name: 'Dias específicos' }).click();
      // Day buttons should appear
      await expect(page.getByRole('button', { name: /Dom/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /Seg/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /Sáb/ })).toBeVisible();
    });

    test('can select multiple specific days', async ({ page }) => {
      await page.getByRole('button', { name: 'Dias específicos' }).click();
      await page.getByRole('button', { name: /Seg/ }).click();
      await page.getByRole('button', { name: /Qua/ }).click();
      await page.getByRole('button', { name: /Sex/ }).click();
      // Days should be toggled on (active styling)
    });

    test('switching to "Uma vez" hides day checkboxes', async ({ page }) => {
      await page.getByRole('button', { name: 'Dias específicos' }).click();
      await page.getByRole('button', { name: 'Uma vez' }).click();
      await expect(page.getByRole('button', { name: /Dom/ })).not.toBeVisible();
    });

    test.skip('filling name and submitting navigates back', async ({ page }) => {
      // Requires backend API: createTask POSTs to /api/tasks which isn't running in E2E
    });

    test('cancel button navigates back', async ({ page }) => {
      await page.getByRole('button', { name: 'Cancelar' }).click();
      await expect(page).not.toHaveURL('/parent/tasks/new');
    });

    test('back header button navigates back', async ({ page }) => {
      await page.getByText(/← Voltar/).click();
      await expect(page).not.toHaveURL('/parent/tasks/new');
    });

    test('renders category section', async ({ page }) => {
      await expect(page.getByText('Categoria')).toBeVisible();
    });

    test('renders schedule/time section', async ({ page }) => {
      await expect(page.getByText(/Horário/)).toBeVisible();
    });
  });

  test.describe('Edit task — /parent/tasks/:id', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate with ?dev=parent so initAuth sets up dev data (including task-1)
      await page.goto('/parent/tasks/task-1?dev=parent');
    });

    test('pre-fills task name from existing data', async ({ page }) => {
      // The dev task 'task-1' is 'Escovar os dentes'; check via input value
      await expect(page.locator('input[value="Escovar os dentes"]')).toBeVisible();
    });

    test('"Salvar" / save button present', async ({ page }) => {
      // Edit task uses submitLabel="Salvar"
      await expect(page.getByRole('button', { name: /^Salvar$/ })).toBeVisible();
    });

    test('"Excluir" delete button present', async ({ page }) => {
      await expect(page.getByRole('button', { name: /Excluir/i })).toBeVisible();
    });

    test('can change task name', async ({ page }) => {
      // Find the task name input and update it
      const nameInput = page.getByPlaceholder(/Escovar os dentes/i);
      await nameInput.clear();
      await nameInput.fill('Updated Task Name');
      await expect(nameInput).toHaveValue('Updated Task Name');
    });

    test('"Desativar" / toggle button present', async ({ page }) => {
      await expect(page.getByRole('button', { name: /Desativar|Ativar/i })).toBeVisible();
    });

    test('back button navigates back', async ({ page }) => {
      await page.getByText(/← Voltar/).click();
      await expect(page).not.toHaveURL('/parent/tasks/task-1');
    });
  });
});
