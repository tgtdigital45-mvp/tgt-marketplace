import { test, expect } from '@playwright/test';

test('A página inicial web deve carregar a marca CONTRATTO', async ({ page }) => {
  await page.goto('/');

  // Aguardar body e verificar se contem o titulo do app.
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveTitle(/CONTRATTO/i);
});
