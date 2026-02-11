# Arquitetura do Sistema TGT Contratto

## Visão Geral
O TGT Contratto é uma plataforma de marketplace de serviços construída como uma Single Page Application (SPA) moderna, utilizando Supabase como Backend-as-a-Service (BaaS) para autenticação, banco de dados e tempo real.

## Stack Tecnológico

### Frontend
- **Core:** React 19
- **Build Tool:** Vite
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS v4
- **State Management:** 
  - `@tanstack/react-query`: Gerenciamento de estado de servidor, cache e sincronização de dados.
  - `React Context API`: Estados globais de aplicação (Auth, Toast, Theme).
- **Roteamento:** React Router DOM v6
- **Animações:** Framer Motion

### Backend (Supabase)
- **Database:** PostgreSQL
- **Auth:** Supabase Auth (Email/Password, Social - Google)
- **Realtime:** Supabase Realtime (WebSockets para Chat e Notificações)
- **Storage:** Supabase Storage (Imagens de perfil, Portfólio)
- **API:** Interface gerada automaticamente via PostgREST + RPC Functions para lógicas complexas (Geospatial).

## Arquitetura de Dados

### Tabelas Principais
- `profiles`: Dados públicos de todos os usuários (Clientes e Empresas).
- `companies`: Perfil detalhado de prestadores de serviço.
- `services`: Serviços oferecidos pelas empresas.
- `bookings`: Agendamentos e pedidos.
- `reviews`: Avaliações e comentários.
- `favorites`: Lista de favoritos dos clientes.
- `messages`: Chat em tempo real.
- `notifications`: Notificações do sistema.

### Segurança
- **RLS (Row Level Security):** Todas as tabelas possuem políticas de segurança a nível de linha para garantir que usuários acessem apenas seus próprios dados ou dados públicos permitidos.

## Fluxo de Autenticação
1. Usuário faz login via Supabase Auth.
2. Trigger `handle_new_user` cria automaticamente entrada na tabela `public.profiles`.
3. Contexto de Autenticação (`AuthContext`) mantém sessão e estado do usuário.

## Integrações Refatoradas
- **Header:** Decomposto em sub-componentes (`UserDropdown`, `MobileMenu`, `LoginDropdown`, `DesktopNav`) para melhor manutenção.
- **Search:** Lógica de busca e filtros centralizada no hook `useCompanySearch`, integrando URL state com Supabase queries.
- **State:** Migração de contextos legados para TanStack Query (`CompanyContext`, `FavoritesContext`) para melhor performance e UX (Optimistic Updates).