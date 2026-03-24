import { test, expect } from '@playwright/test';

test.describe('1. Responsividade e Loading UI (Fase 1)', () => {

  test.describe('Visualização Desktop', () => {
    test.use({ viewport: { width: 1920, height: 1080 } });

    test('Deve exibir barra de busca e esconder botão do menu mobile (hambúrguer)', async ({ page }) => {
      // Usamos a rota /empresas pois é a listagem core do marketplace
      await page.goto('/empresas');

      const mobileMenuButton = page.locator('button[aria-label="Menu"]');
      await expect(mobileMenuButton).toBeHidden();

      const searchInputs = page.locator('input[type="text"]');
      await expect(searchInputs.first()).toBeVisible();
    });
  });

  test.describe('Visualização Mobile (Celular 390x844)', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('Deve alternar menu hambúrguer perfeitamente', async ({ page }) => {
      await page.goto('/empresas');

      const mobileMenuButton = page.locator('button[aria-label="Menu"]');
      await expect(mobileMenuButton).toBeVisible();

      await mobileMenuButton.click();

      // O MobileSheet usa role="dialog" em modais nativos/headless UI
      const dialog = page.locator('div[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });
      
      const sheetLink = dialog.getByRole('link').first();
      await expect(sheetLink).toBeVisible();
    });
  });

  test('Garante resiliência visual exibindo Skeletons durante requisição lenta (Mockado)', async ({ page }) => {
    test.setTimeout(10000); 

    // Intercepta qualquer chamada às APIs do Supabase e introduz delay
    await page.route('**/*', async (route) => {
      if (route.request().url().includes('supabase') || route.request().url().includes('rest/v1')) {
        await new Promise(fulfill => setTimeout(fulfill, 2000));
      }
      await route.continue();
    });

    await page.goto('/empresas');

    // Assim que a página carrega, o React dispara requests e mostra os skeletons (animate-pulse)
    const skeletonLoaders = page.locator('.animate-pulse');
    await expect(skeletonLoaders.first()).toBeVisible({ timeout: 5000 });
  });
});
