import { test } from '@playwright/test';
import * as fs from 'fs';

test('Extração de Vite Error', async ({ page }) => {
  await page.goto('/empresas');
  await page.waitForTimeout(5000); 
  
  // A overlay de erro do Vite usa Shadow DOM
  const errorText = await page.evaluate(() => {
    const overlay = document.querySelector('vite-error-overlay');
    if (!overlay) return 'Nenhuma overlay de erro encontrada.';
    
    // Tenta pegar o conteudo legivel
    const root = overlay.shadowRoot;
    if (!root) return 'Overlay existe mas sem Shadow Root';
    
    return root.innerHTML;
  });
  
  fs.writeFileSync('vite_error.txt', errorText);
});
