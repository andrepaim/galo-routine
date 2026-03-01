import { test, expect } from '@playwright/test';
import { goAsParent, goAsChild } from './helpers';

test.describe('Auth redirects', () => {
  // App auto-authenticates — no login redirect
  test('/ redirects to /child (auto-auth, child is default)', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/child');
  });

  test('/parent loads parent dashboard (auto-auth)', async ({ page }) => {
    await page.goto('/parent');
    await expect(page).toHaveURL('/parent');
  });

  test('/child loads child dashboard directly (child is default)', async ({ page }) => {
    await page.goto('/child');
    await expect(page).toHaveURL('/child');
  });

  test('/parent/manage loads manage screen (auto-auth)', async ({ page }) => {
    await page.goto('/parent/manage');
    await expect(page).toHaveURL('/parent/manage');
  });

  test('dev=parent mode redirects to /parent', async ({ page }) => {
    await page.goto('/?dev=parent');
    await expect(page).toHaveURL('/parent');
  });

  test('dev=child mode redirects to /child', async ({ page }) => {
    await page.goto('/?dev=child');
    await expect(page).toHaveURL('/child');
  });
});

test.describe('Breadcrumb navigation', () => {
  test('parent/tasks/new has back button → returns to previous', async ({ page }) => {
    await goAsParent(page);
    await page.goto('/parent/tasks/new');
    await page.getByText(/← Voltar/).click();
    await expect(page).not.toHaveURL('/parent/tasks/new');
  });

  test('parent/tasks/:id has back button → returns to manage', async ({ page }) => {
    // Use ?dev=parent so dev data (task-1) is loaded without a backend
    await page.goto('/parent/tasks/task-1?dev=parent');
    await page.getByText(/← Voltar/).click();
    await expect(page).not.toHaveURL(/\/parent\/tasks\/task-1/);
  });

  test('parent/rewards/new has back button → returns to previous', async ({ page }) => {
    await goAsParent(page);
    await page.goto('/parent/rewards/new');
    await page.getByText(/← Voltar/).click();
    await expect(page).not.toHaveURL('/parent/rewards/new');
  });

  test('parent/rewards/:id has back button → returns to manage', async ({ page }) => {
    // Use ?dev=parent so dev data (reward-1) is loaded without a backend
    await page.goto('/parent/rewards/reward-1?dev=parent');
    await page.getByText(/← Voltar/).click();
    await expect(page).toHaveURL('/parent/manage');
  });

  test('manage screen has back button → returns to parent dashboard', async ({ page }) => {
    // Use ?dev=parent so manage screen loads without a backend subscription
    await page.goto('/parent/manage?dev=parent');
    await page.getByRole('button', { name: /←.*Voltar|Voltar/i }).click();
    await expect(page).toHaveURL('/parent');
  });

  test('parent-pin has back button and is accessible', async ({ page }) => {
    await page.goto('/parent-pin');
    await expect(page).toHaveURL('/parent-pin');
    await expect(page.getByText('Área dos Pais')).toBeVisible();
  });
});

test.describe('Deep links', () => {
  test('/parent/tasks/new loads task creation form directly', async ({ page }) => {
    await goAsParent(page);
    await page.goto('/parent/tasks/new');
    await expect(page.getByText('Nova Tarefa')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Criar Tarefa' })).toBeVisible();
  });

  test('/parent/rewards/new loads reward creation form directly', async ({ page }) => {
    await goAsParent(page);
    await page.goto('/parent/rewards/new');
    await expect(page.getByText('Novo Prêmio')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Criar Prêmio' })).toBeVisible();
  });

  test('/parent/manage loads manage screen directly', async ({ page }) => {
    // Use ?dev=parent so manage screen loads dev data without a backend
    await page.goto('/parent/manage?dev=parent');
    await expect(page).toHaveURL(/\/parent\/manage/);
    await expect(page.getByText('Gerenciar').first()).toBeVisible();
  });

  test('/parent loads parent dashboard directly', async ({ page }) => {
    await page.goto('/?dev=parent');
    await expect(page).toHaveURL('/parent');
  });

  test('/child loads child dashboard directly', async ({ page }) => {
    await page.goto('/?dev=child');
    await expect(page).toHaveURL('/child');
    await expect(page.getByText(/Oi,.*Vitor/)).toBeVisible();
  });
});
