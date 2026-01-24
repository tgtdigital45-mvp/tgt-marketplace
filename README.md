# TGT Guia de Negócios

Plataforma completa para conectar clientes a prestadores de serviços locais. 
Permite que empresas criem perfis, gerenciem serviços e recebam orçamentos, enquanto clientes podem buscar, avaliar e agendar serviços.

## 🚀 Funcionalidades

### Para Clientes
- **Busca de Empresas:** Encontre prestadores de serviços por categoria.
- **Perfil Completo:** Gerencie seus dados pessoais (CPF, Endereço), veja histórico de pedidos e mensagens.
- **Agendamentos:** Solicite orçamentos com data/hora preferencial e acompanhe o status (Pendente/Confirmado).
- **Chat Realtime:** Converse diretamente com as empresas para tirar dúvidas.
- **Avaliações:** Deixe feedback (estrelas e comentários) sobre os serviços prestados.
- **Favoritos:** Salve suas empresas preferidas para acesso rápido.

### Para Empresas
- **Perfil Profissional:** Página pública com Logo, Capa, Portfólio, Endereço e Contatos.
- **Gestão de Serviços:** Cadastre seus serviços com preços e duração.
- **Dashboard:** Painel administrativo para gerenciar agendamentos e responder mensagens.
- **Recebimento de Pedidos:** Aceite ou recuse solicitações de orçamento.
- **Resposta a Avaliações:** Interaja com o feedback dos clientes.

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React, Vite, Tailwind CSS (v4), Framer Motion.
- **Backend:** Supabase (Auth, Database, Storage, Realtime).
- **Deploy:** Vercel.

## 📦 Instalação e Execução

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/seu-usuario/tgt-guia-de-negocios.git
    cd tgt-guia-de-negocios
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configuração do Ambiente:**
    Crie um arquivo `.env` na raiz do projeto com suas credenciais do Supabase:
    ```env
    VITE_SUPABASE_URL=sua_url_supabase
    VITE_SUPABASE_ANON_KEY=sua_chave_anonima
    ```

4.  **Execute o projeto:**
    ```bash
    npm run dev
    ```

## 🗄️ Estrutura do Banco de Dados (Supabase)

O projeto utiliza as seguintes tabelas no PostgreSQL:
- `profiles`: Dados de usuários (Clientes e Empresas).
- `companies`: Dados públicos das empresas.
- `services`: Serviços oferecidos pelas empresas.
- `bookings`: Agendamentos e pedidos de orçamento.
- `reviews`: Avaliações de clientes.
- `messages`: Mensagens de chat.
- `favorites`: Empresas favoritas dos clientes.

## 📜 Licença

Este projeto é um MVP desenvolvido para o TGT.
