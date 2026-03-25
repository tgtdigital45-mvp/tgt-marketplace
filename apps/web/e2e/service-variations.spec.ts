import { test, expect } from '@playwright/test';

/**
 * Test Suite: Service Creation Variations
 * Valida as 9 combinações de Localização x Modelo de Preço,
 * incluindo a nova funcionalidade de Ficha Técnica (Atributos).
 */

const variations = [
    { location: 'in_store', price: 'fixed', label: 'Presencial (Empresa) - Preço Fixo' },
    { location: 'in_store', price: 'packages', label: 'Presencial (Empresa) - Pacotes' },
    { location: 'in_store', price: 'budget', label: 'Presencial (Empresa) - Orçamento' },
    { location: 'at_home', price: 'fixed', label: 'Presencial (Cliente) - Preço Fixo' },
    { location: 'at_home', price: 'packages', label: 'Presencial (Cliente) - Pacotes' },
    { location: 'at_home', price: 'budget', label: 'Presencial (Cliente) - Orçamento' },
    { location: 'remote', price: 'fixed', label: 'Remoto (Online) - Preço Fixo' },
    { location: 'remote', price: 'packages', label: 'Remoto (Online) - Pacotes' },
    { location: 'remote', price: 'budget', label: 'Remoto (Online) - Orçamento' },
];

test.describe('Service Creation End-to-End', () => {
    
    test.beforeEach(async ({ page }) => {
        // Mock do Supabase Auth para simular usuário logado e evitar redirecionamentos
        await page.route('**/auth/v1/user', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 'test-user-id',
                    email: 'company@test.com',
                    user_metadata: { type: 'company', companySlug: 'me' },
                    aud: 'authenticated',
                    role: 'authenticated'
                })
            });
        });

        // Mock da sessão do Supabase
        await page.addInitScript(() => {
            const mockSession = {
                access_token: 'mock-token',
                token_type: 'bearer',
                expires_in: 3600,
                refresh_token: 'mock-refresh',
                user: {
                    id: 'test-user-id',
                    email: 'company@test.com',
                    user_metadata: { type: 'company', companySlug: 'me' }
                }
            };
            window.localStorage.setItem('supabase.auth.token', JSON.stringify({
                currentSession: mockSession,
                expiresAt: Date.now() + 3600000
            }));
        });

        // Mock da consulta de empresa
        await page.route('**/rest/v1/companies*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 'test-company-id',
                    h3_index: '88a4282a11fffff',
                    slug: 'me'
                })
            });
        });

        // Mock de inserção de serviço
        await page.route('**/rest/v1/services*', async (route) => {
            const method = route.request().method();
            if (method === 'POST' || method === 'PATCH') {
                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify({ id: 'new-service-id' })
                });
            } else {
                await route.continue();
            }
        });

        // Navega diretamente para o dashboard
        await page.goto('/dashboard/empresa/me');
    });

    for (const v of variations) {
        test(`Criar serviço: ${v.label} com Ficha Técnica`, async ({ page }) => {
            // Acessa o Dashboard de Serviços no Portal
            await page.goto('/dashboard/empresa/me/servicos');

            // Clica no botão para abrir o Wizard
            const addBtn = page.getByRole('button', { name: /Adicionar|Novo/i }).first();
            await addBtn.click();

            // Aguarda o Wizard carregar
            await page.waitForSelector('text=Primeiros Passos');

            // --- PASSO 0: VISÃO GERAL ---
            const serviceTitle = `Serviço Automação ${v.label}`;
            await page.fill('input[placeholder*="Consultoria"]', serviceTitle);
            
            // Seleção de Categoria (Valores fixos baseados no serviceDefinitions.ts)
            await page.locator('select').first().selectOption({ label: 'Design & Criatividade' });
            await page.locator('select').nth(1).selectOption({ label: 'Design Gráfico' });

            // Seleção de Localização
            const locLabel = v.location === 'in_store' ? 'Presencial (Empresa)' : 
                           v.location === 'at_home' ? 'Presencial (Cliente)' : 'Remoto (Online)';
            await page.click(`text=${locLabel}`);

            // Seleção de Modelo de Preço
            const priceLabel = v.price === 'fixed' ? 'Fixo' : 
                             v.price === 'packages' ? 'Pacotes' : 'Orçamento';
            await page.click(`text=${priceLabel}`);

            // --- TESTE DA FICHA TÉCNICA (Nova Funcionalidade) ---
            await page.click('text=Adicionar Atributo');
            await page.locator('input[placeholder="Ex: Formato"]').fill('Material');
            await page.locator('input[placeholder="Ex: Digital (.pdf)"]').fill('Premium');
            
            await page.click('text=Adicionar Atributo');
            await page.locator('input[placeholder="Ex: Formato"]').nth(1).fill('Entrega');
            await page.locator('input[placeholder="Ex: Digital (.pdf)"]').nth(1).fill('Link Download');

            await page.fill('input[placeholder*="logo, branding"]', 'e2e, test, automated');
            
            await page.click('button:has-text("Próximo")');

            // --- PASSO 1: PREÇOS ---
            if (v.price === 'fixed') {
                await page.fill('input[type="number"]', '199');
                await page.fill('textarea', 'Entrega completa do serviço com qualidade garantida.');
            } else if (v.price === 'packages') {
                // Preenche apenas o básico para o teste passar rápido
                await page.locator('input[type="number"]').first().fill('100');
                await page.locator('textarea').first().fill('Pacote inicial de entrada.');
            } else if (v.price === 'budget') {
                // No orçamento o prazo é um select
                await page.locator('select').selectOption({ label: 'Em até 24 horas' });
            }

            await page.click('button:has-text("Próximo")');

            // --- PASSO 2: GALERIA ---
            // Pulamos upload de imagem para não depender de arquivos no sistema de teste
            // O botão final muda o texto se for edit ou new, mas aqui é novo.
            await page.click('button:has-text("Publicar Serviço")');

            // --- VALIDAÇÃO ---
            // Espera toast de sucesso ou redirecionamento
            await expect(page.getByText(/sucesso|criado/i)).toBeVisible();
            
            // Verifica se o serviço aparece na lista ou se a página de detalhes renderiza os atributos
            // (Opcional: navegar até a página pública do serviço)
        });
    }
});
