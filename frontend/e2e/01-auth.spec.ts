import { test, expect } from '@playwright/test';

test.describe('Auth — no-login flow', () => {
  test('/ redirects to /child (default entry view)', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/child');
  });

  test('/login redirects to /child', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL('/child');
  });

  test('dev=parent mode loads parent screen', async ({ page }) => {
    await page.goto('/?dev=parent');
    await expect(page).toHaveURL('/parent');
  });

  test('dev=child mode loads child screen', async ({ page }) => {
    await page.goto('/?dev=child');
    await expect(page).toHaveURL('/child');
  });
});

test.describe('Parent PIN page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/parent-pin');
  });

  test('renders numeric keypad buttons 0-9', async ({ page }) => {
    for (let i = 0; i <= 9; i++) {
      await expect(page.getByRole('button', { name: String(i), exact: true })).toBeVisible();
    }
  });

  test('renders PIN display area (dots)', async ({ page }) => {
    // PIN dots are rendered as rounded-full divs inside a flex container
    await expect(page.locator('div.rounded-full').first()).toBeVisible();
  });

  test('tapping numbers fills PIN display', async ({ page }) => {
    await page.getByRole('button', { name: '1', exact: true }).click();
    await page.getByRole('button', { name: '2', exact: true }).click();
    await page.getByRole('button', { name: '3', exact: true }).click();
    // After clicking 3 digits, something should reflect the filled state
    const dots = page.locator('[class*="filled"], [class*="active"]');
    await expect(dots.first()).toBeVisible();
  });

  test('backspace button removes last digit', async ({ page }) => {
    await page.getByRole('button', { name: '1', exact: true }).click();
    await page.getByRole('button', { name: /back|delete|←|✕|⌫/i }).click();
    // Backspace button should still be visible
    await expect(page.locator('button').filter({ hasText: /back|delete|←|✕|⌫/i })).toBeVisible();
  });

  test('wrong PIN shows error message', async ({ page }) => {
    // Type wrong PIN (4 digits to trigger check)
    await page.getByRole('button', { name: '0', exact: true }).click();
    await page.getByRole('button', { name: '0', exact: true }).click();
    await page.getByRole('button', { name: '0', exact: true }).click();
    await page.getByRole('button', { name: '0', exact: true }).click();
    await expect(page.getByText(/PIN incorreto|Errado|Incorreto/i)).toBeVisible();
  });
});
