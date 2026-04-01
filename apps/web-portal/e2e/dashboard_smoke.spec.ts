import { test, expect } from '@playwright/test';

test.describe('Portal Pro - Dashboard Smoke Tests', () => {
  // O Playwright carrega automaticamente o estado de autenticação (user.json) para cada teste
  // conforne configurado no playwright.config.ts

  const dashItems = [
    { name: 'Geral', path: '' },
    { name: 'Funil de Vendas', path: '/crm/funil' },
    { name: 'Prospecção', path: '/crm/prospeccao' },
    { name: 'Insights & BI', path: '/crm/analytics' },
    { name: 'Vagas', path: '/vagas' },
    { name: 'Serviços', path: '/servicos' },
    { name: 'Agenda', path: '/agenda' },
    { name: 'Mensagens', path: '/mensagens' },
    { name: 'Portfólio', path: '/portfolio' },
    { name: 'Projetos', path: '/projects' },
    { name: 'Avaliações', path: '/avaliacoes' },
    { name: 'Financeiro', path: '/faturamento' },
    { name: 'Assinatura', path: '/assinatura' },
  ];

  for (const item of dashItems) {
    test(`Deve carregar a página: ${item.name}`, async ({ page }) => {
      // O DashboardRedirect lidará com o redirecionamento para o slug da empresa
      // mas como o storageState já está autenticado, podemos ir direto ou via /dashboard
      await page.goto(`/dashboard`);
      
      // Aguarde o redirecionamento para a empresa logada
      await expect(page).toHaveURL(/.*\/dashboard\/empresa\/.*/, { timeout: 15000 });
      
      const currentUrl = page.url();
      const companyBaseUrl = currentUrl.split('?')[0]; // Remove query params se houver

      // Navegue para o item específico usando o base da empresa
      await page.goto(`${companyBaseUrl}${item.path}`);

      // Verificações Básicas de Integridade
      await page.waitForLoadState('networkidle');
      
      // 1. Verifique se não há erro 404 ou 500 visível
      await expect(page.locator('text=Página Não Encontrada')).not.toBeVisible();
      await expect(page.locator('text=Erro ao carregar')).not.toBeVisible();

      // 2. Verifique se o conteúdo principal ou o título da página está presente
      // Geralmente há um h1 ou o nome do item no sidebar como 'active'
      await expect(page.locator(`nav >> text=${item.name}`)).toBeVisible();
    });
  }
});
