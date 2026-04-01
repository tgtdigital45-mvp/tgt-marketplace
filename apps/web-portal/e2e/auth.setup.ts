import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Acesse a página de login do portal
  await page.goto('/login');

  // Preencha as credenciais
  // TODO: Substituir por credenciais de teste reais ou variáveis de ambiente
  const email = process.env.TEST_USER || 'contato@tgt.com.br';
  const password = process.env.TEST_PASSWORD || 'password123';

  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  
  // Clique no botão de login
  await page.click('button[type="submit"]');

  // Aguarde o redirecionamento para o dashboard
  // O DashboardRedirect resolve o slug da empresa e redireciona para /dashboard/empresa/:slug
  await expect(page).toHaveURL(/.*\/dashboard\/empresa\/.*/, { timeout: 15000 });

  // Salve o estado da sessão para ser reutilizado por outros testes
  await page.context().storageState({ path: authFile });
});
