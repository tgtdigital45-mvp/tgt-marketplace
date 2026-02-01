# Relatório de Auditoria: Frontend & Visibilidade

Este documento detalha a análise crítica de UI/UX e SEO Técnico do projeto TGT Contratto.

## 1. Auditoria de Design e Estética (UI/UX)

### ✅ Pontos Fortes Visuais
*   **Adoção de Stack Moderna:** A utilização do **Tailwind CSS v4** com variáveis CSS (`@theme` em `index.css`) é excelente para performance e facilidade de manutenção.
*   **Tipografia Fluida:** O uso de funções `clamp()` (`text-fluid-xl`) garante que os títulos escalem suavemente em diferentes dispositivos, melhorando a legibilidade mobile.
*   **Feedback de Carregamento:** O uso consistente de `LoadingSkeleton` e classes `animate-pulse` previne saltos de layout (CLS) e melhora a percepção de velocidade.
*   **Sistema de Cores:** A paleta (Laranja `#FF6B35` / Azul `#004E89`) está corretamente mapeada no Tailwind, garantindo consistência visual nos estados interativos (hover/focus).

### ❌ Erros de Design (UI) - "Radius Roulette"
A aplicação sofre de inconsistência no arredondamento de bordas, transmitindo uma sensação de "colcha de retalhos":
*   **Botões (`Button.tsx`)**: Utilizam `rounded-md` (raio médio).
*   **Inputs e Filtros (`LandingPage.tsx`)**: Utilizam `rounded-xl` (raio grande).
*   **Cards (`CompanyCard`)**: Variam ou herdam padrões mistos.

**Veredito:** Padronize para **um** estilo. Para uma aparência amigável e moderna, recomendo migrar tudo para `rounded-lg` ou `rounded-xl`.

### ⚠️ Refinamentos Visuais Necessários
*   **Sombras Desiguais:** O filtro de preço usa `shadow-md`, enquanto a busca usa `shadow-sm`. Elementos vizinhos devem compartilhar a mesma "elevação".
*   **Componentes Nativos:** O uso de `<select>` nativo na Landing Page empobrece a experiência. Considere componentes customizados (ex: HeadlessUI Listbox) para manter a imersão visual.

---

## 2. Auditoria de SEO Técnico

### ✅ Pontos Positivos
*   **Metadados Dinâmicos:** Implementação correta de `react-helmet-async` para títulos baseados em busca/categoria.
*   **Performance:** `App.tsx` utiliza `lazy` loading para rotas pesadas, e `OptimizedImage` gerencia o carregamento de mídia.

### 🚨 Checklist de SEO Faltante (GAPS)
1.  **Tags Canônicas (Canonical Tags):**
    *   **Problema:** A `LandingPage.tsx` não define a tag canonical.
    *   **Risco:** O Google pode punir conteúdo duplicado se acessado via parâmetros (ex: `/?category=construcao` vs `/`).
    *   **Solução:** Inserir `<link rel="canonical" href="..." />`.

2.  **HTML Semântico (Estrutura):**
    *   **Problema:** Excesso de `<div>`. A `LandingPage` carece de tags estruturais.
    *   **Solução:**
        *   Envolver o conteúdo principal em `<main>`.
        *   Usar `<section>` para separar a área de busca da lista de resultados.
        *   Usar `<article>` para cada `CompanyCard`.

3.  **Open Graph (Compartilhamento Social):**
    *   **Problema:** As tags OG em `index.html` são estáticas. Compartilhar uma busca específica ou perfil de empresa não reflete o conteúdo real (Título/Imagem) no WhatsApp/LinkedIn.

4.  **Arquivos Ausentes:**
    *   `manifest.json`: Não encontrado em `/public`. Essencial para experiência mobile (PWA) e "Adicionar à Tela Inicial".

---

## 3. Plano de Ação (Quick Wins)

### Imediato (High Impact, Low Effort)
1.  [x] **Padronizar Bordas:** Definir `--radius-box: 0.75rem;` no `index.css` e aplicar `rounded-[var(--radius-box)]` nos componentes globais.
2.  [x] **HTML Semântico:** Substituir as `div` principais por `main` e `section` na `LandingPage` e `CompanyProfilePage`.
3.  [x] **Canonical Tags:** Adicionar lógica de canonical no `Helmet` das páginas principais.

### Médio Prazo
1.  [x] **Manifest.json:** Criar e linkar o manifesto para suporte PWA básico.
2.  [x] **Select Customizado:** Substituir selects nativos por componentes estilizados.
