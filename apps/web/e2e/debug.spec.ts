import { test } from '@playwright/test';
import * as fs from 'fs';

test('Export HTML for Debug', async ({ page }) => {
  // Acessamos a raiz e empresas, salvando como o Playwright a ve
  const response = await page.goto('/empresas');
  await page.waitForTimeout(3000); // Aguarda hidratacao do React
  
  const content = await page.content();
  fs.writeFileSync('debug_html.txt', `STATUS: ${response?.status()}\n\n${content}`);
});
