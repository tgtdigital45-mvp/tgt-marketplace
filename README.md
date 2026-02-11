# TGT Marketplace

Plataforma B2B completa para conectar empresas a prestadores de serviços profissionais. 
Marketplace transacional com modelo SaaS + comissão regressiva, permitindo que agências e consultorias criem perfis profissionais, gerenciem serviços e recebam pagamentos, enquanto clientes corporativos podem buscar, contratar e avaliar serviços de forma segura e eficiente.

![Status](https://img.shields.io/badge/Status-MVP-green)
![License](https://img.shields.io/badge/License-Proprietary-red)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)

## 🚀 Funcionalidades

### 👤 Para Clientes
- **Busca Inteligente:** Encontre prestadores de serviços por categoria, localização ou nome.
- **Perfil do Usuário:** Gerencie dados, histórico de pedidos e preferências.
- **Sistema de Orçamentos:** Solicite orçamentos e acompanhe o status em tempo real.
- **Chat em Tempo Real:** Comunicação direta com empresas via Supabase Realtime.
- **Sistema de Avaliação:** Classifique serviços com notas e comentários verificados.
- **Favoritos:** Salve empresas para acesso rápido.
- **Checkout Seguro:** Pagamentos via Stripe com proteção ao comprador.

### 🏢 Para Empresas (Prestadores)
- **Perfil Profissional:** Página pública customizável com Logo, Capa, Portfólio e Mapa.
- **Gestão de Serviços:** Cadastro detalhado com pacotes, preços e prazos.
- **Dashboard Administrativo:** Painel completo para gerenciar orçamentos, pedidos e métricas.
- **Planos de Assinatura:** Starter, Pro e Agency com comissões regressivas.
- **Interação com Clientes:** Responda avaliações e mensagens.
- **Gestão Financeira:** Acompanhe receitas, comissões e extratos.

### 🔐 Para Administradores
- **Painel Admin:** Gestão completa de usuários, empresas e conteúdo.
- **Moderação:** Aprovação de empresas, serviços e avaliações.
- **Auditoria:** Logs de ações administrativas com rastreamento de IP.
- **Analytics:** Métricas de uso, conversão e receita.
- **Timeout de Sessão:** Logout automático após 15min de inatividade.

## 🛠️ Tecnologias e Arquitetura

### Stack Principal
- **Frontend:** [React 19](https://react.dev/) + [Vite 6](https://vitejs.dev/)
- **Linguagem:** [TypeScript 5.8](https://www.typescriptlang.org/) (Strict Mode)
- **Estilização:** [Tailwind CSS v4](https://tailwindcss.com/) + [Framer Motion](https://www.framer.com/motion/)
- **State Management:** [@tanstack/react-query](https://tanstack.com/query) + React Context API
- **Roteamento:** [React Router v6](https://reactrouter.com/)
- **Backend:** [Supabase](https://supabase.com/) (Auth, PostgreSQL, Realtime, Storage, Edge Functions)
- **Pagamentos:** [Stripe](https://stripe.com/) (Checkout, Subscriptions, Webhooks)

### Otimizações Recentes
- **Auth Context:** Inicialização inteligente via localStorage para prevenir flash de logout no F5.
- **React Query:** Configuração otimizada (30s staleTime, refetchOnWindowFocus, refetchOnMount).
- **Performance:** Lazy loading de rotas, code splitting e otimização de bundle.
- **SEO:** Meta tags dinâmicas, sitemap automático e robots.txt.

### Padrões de Qualidade
- **Linting:** ESLint 9 com regras rigorosas para React e TypeScript.
- **Type Safety:** Tipagem estrita em todo o código.
- **Clean Code:** Componentes modulares, hooks customizados e separação de responsabilidades.
- **Testing:** Vitest + Testing Library para testes unitários e de integração.

## 📦 Instalação e Execução

### Pré-requisitos
- Node.js 18+
- Conta no Supabase
- Conta no Stripe (para pagamentos)

### Passo a Passo

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/tgtdigital45-mvp/tgt-marketplace.git
    cd tgt-contratto-mvp
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configuração do Ambiente:**
    Crie um arquivo `.env.local` na raiz do projeto:
    ```env
    VITE_SUPABASE_URL=sua_url_supabase
    VITE_SUPABASE_ANON_KEY=sua_chave_anonima
    VITE_STRIPE_PUBLISHABLE_KEY=sua_chave_publica_stripe
    ```

4.  **Execute o projeto:**
    ```bash
    npm run dev
    ```

5.  **Acesse:** http://localhost:5173

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais
- `profiles`: Usuários do sistema com roles (user, admin, moderator).
- `companies`: Perfis de empresas com dados fiscais (CNPJ), endereço e configurações.
- `services`: Catálogo de serviços com pacotes, preços e FAQs.
- `orders`: Pedidos com status e integração Stripe.
- `reviews`: Avaliações verificadas com moderação.
- `messages`: Chat em tempo real com histórico.
- `favorites`: Empresas favoritas dos usuários.
- `notifications`: Sistema de notificações em tempo real.
- `audit_logs`: Logs de auditoria para ações administrativas.

### Segurança
- **RLS (Row Level Security):** Políticas rigorosas em todas as tabelas.
- **JWT:** Autenticação via tokens com refresh automático.
- **Triggers:** Automação de criação de perfis e validações.

## 📁 Estrutura do Projeto

```
tgt-contratto-mvp/
├── src/
│   ├── components/       # Componentes React reutilizáveis
│   ├── contexts/         # Context API (Auth, Toast, Notifications)
│   ├── hooks/            # Custom hooks (useCompanyProfile, useSubscription)
│   ├── pages/            # Páginas da aplicação
│   ├── utils/            # Funções utilitárias
│   ├── lib/              # Configurações (Supabase)
│   └── types.ts          # Definições de tipos TypeScript
├── database/             # Scripts SQL e migrações
├── docs/                 # Documentação do projeto
├── supabase/             # Edge Functions e configurações
└── public/               # Assets estáticos
```

## 🚀 Deploy

### Vercel (Frontend)
O projeto está configurado para deploy automático na **Vercel**.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ftgtdigital45-mvp%2Ftgt-marketplace)

### Supabase (Backend)
- Edge Functions deployadas via Supabase CLI
- Database migrations versionadas
- Storage configurado para logos e portfólios

## 🔧 Scripts Disponíveis

```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build
npm run lint         # Executa ESLint
npm test             # Executa testes
npm run test:ui      # Interface de testes
```

## 📊 Modelo de Negócio

### SaaS + Marketplace (Take Rate Regressivo)
- **Starter:** R$ 97/mês - Comissão 15%
- **Pro:** R$ 297/mês - Comissão 10%
- **Agency:** R$ 697/mês - Comissão 5%

### Recursos por Plano
- Todos os planos incluem: Perfil profissional, chat, orçamentos ilimitados
- Pro+: Destaque em buscas, analytics avançado
- Agency: API access, white-label, suporte prioritário

## 🤝 Contribuindo

Este é um projeto proprietário. Para contribuições, entre em contato com a equipe TGT.

## 📜 Licença

© 2026 TGT Digital. Todos os direitos reservados.

---

**Desenvolvido com ❤️ pela equipe TGT Digital**

