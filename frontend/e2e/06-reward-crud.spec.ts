import { test, expect } from '@playwright/test';
import { goAsParent } from './helpers';

test.describe('Reward CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await goAsParent(page);
  });

  test.describe('Create reward — /parent/rewards/new', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/parent/rewards/new');
    });

    test('renders form with reward name field', async ({ page }) => {
      await expect(page.getByPlaceholder(/30min de videogame/i)).toBeVisible();
    });

    test('"Criar Prêmio" submit button present', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Criar Prêmio' })).toBeVisible();
    });

    test('validation: empty name disables submit button', async ({ page }) => {
      // Button is disabled when name is empty
      await expect(page.getByRole('button', { name: 'Criar Prêmio' })).toBeDisabled();
    });

    test('"unlimited" availability option present', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Ilimitado', exact: true })).toBeVisible();
    });

    test('"limited" availability option present', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Limitado', exact: true })).toBeVisible();
    });

    test('switching to "Limitado" shows quantity field', async ({ page }) => {
      await page.getByRole('button', { name: 'Limitado', exact: true }).click();
      // The quantity field uses a label without htmlFor; check the label text and input
      await expect(page.getByText('Quantidade').first()).toBeVisible();
    });

    test('quantity field hidden for "Ilimitado"', async ({ page }) => {
      await expect(page.getByLabel(/Quantidade/i)).not.toBeVisible();
    });

    test('requires approval toggle present', async ({ page }) => {
      await expect(page.getByText(/Requer aprovação dos pais/i)).toBeVisible();
    });

    test('renders icon section', async ({ page }) => {
      await expect(page.getByText('Ícone')).toBeVisible();
    });

    test('renders star cost field', async ({ page }) => {
      await expect(page.getByText(/Custo em Estrelas/i)).toBeVisible();
    });

    test.skip('filling name and submitting navigates back', async ({ page }) => {
      // Requires backend API: createReward POSTs to /api/rewards which isn't running in E2E
    });

    test('cancel button navigates back', async ({ page }) => {
      await page.getByRole('button', { name: 'Cancelar' }).click();
      await expect(page).not.toHaveURL('/parent/rewards/new');
    });

    test('back header button navigates back', async ({ page }) => {
      await page.getByText(/← Voltar/).click();
      await expect(page).not.toHaveURL('/parent/rewards/new');
    });
  });

  test.describe('Edit reward — /parent/rewards/:id', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate with ?dev=parent so initAuth sets up dev data (including reward-1)
      await page.goto('/parent/rewards/reward-1?dev=parent');
    });

    test('pre-fills reward name from existing data', async ({ page }) => {
      // Dev mode reward-1 is '30 min de videogame'; check via input value
      await expect(page.locator('input[value="30 min de videogame"]')).toBeVisible();
    });

    test('"Salvar" / save button present', async ({ page }) => {
      // Edit reward uses submitLabel="Salvar"
      await expect(page.getByRole('button', { name: /^Salvar$/ })).toBeVisible();
    });

    test('"Excluir Prêmio" delete button present', async ({ page }) => {
      await expect(page.getByRole('button', { name: /Excluir Prêmio/i })).toBeVisible();
    });

    test('back button navigates to manage', async ({ page }) => {
      await page.getByText(/← Voltar/).click();
      await expect(page).toHaveURL('/parent/manage');
    });
  });

  test.describe('Reward form validation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/parent/rewards/new');
    });

    test('empty name disables submission button', async ({ page }) => {
      // Button is disabled when name is empty
      await expect(page.getByRole('button', { name: 'Criar Prêmio' })).toBeDisabled();
    });

    test('star cost input present and accepts numbers', async ({ page }) => {
      // Star cost field should be present
      const costInput = page.locator('input[type="number"]');
      await costInput.fill('15');
      await expect(costInput).toHaveValue('15');
    });
  });
});
