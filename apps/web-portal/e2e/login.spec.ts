import { test, expect } from '@playwright/test';

test('A página do portal deve carregar', async ({ page }) => {
  await page.goto('/');

  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveTitle(/Portal/i);
});
