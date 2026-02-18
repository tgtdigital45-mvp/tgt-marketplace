# Documento de Requisitos Funcionais - Marketplace Contratto

Este documento detalha as funcionalidades e regras de negócio para os módulos de Cliente (B2C) e Empresa (B2B) do Marketplace Contratto.

---

## 1. Requisitos para Clientes (Consumidor Final)

### RF01 - Cadastro de Conta de Cliente
O sistema deve permitir que novos usuários se cadastrem preenchendo as seguintes informações obrigatórias:
- **Nome Completo**
- **CPF** (Validação via algoritmo de dígito verificador)
- **Email** (Validação de formato e unicidade)
- **Telefone** (Máscara: (XX) XXXXX-XXXX)
- **Data de Nascimento** (Validação de idade mínima se aplicável)
- **Endereço** (Relacionamento com tabela separada, incluindo CEP, Logradouro, Número, Complemento, Bairro, Cidade e UF)

### RF09 - Busca e Descoberta de Serviços
- O sistema deve permitir a busca de serviços via geolocalização (H3 Index).
- Filtros por categoria, preço, avaliação e disponibilidade.

### RF10 - Fluxo de Contratação e Pagamento
- **Visualização**: O cliente pode ver detalhes do serviço, fotos, descrição e avaliações.
- **Checkout**: Contratação via Stripe, permitindo pagamento em cartão ou PIX.
- **Status do Pedido**: Acompanhamento do ciclo de vida (Pendente, Em Execução, Finalizado, Cancelado).

### RF11 - Comunicação (Chat)
- Sistema de chat em tempo real para negociação de detalhes técnicos antes ou durante a execução do serviço.

### RF02 - Autenticação e Acesso
- O cliente deve conseguir realizar login utilizando Email/CPF e Senha.
- O sistema deve oferecer integração para Login via Redes Sociais (Google, Apple) em fases futuras.
- Recuperação de senha via e-mail.

### RF03 - Manutenção de Perfil (Edição)
O cliente deve conseguir alterar seus dados cadastrais, exceto:
- **CPF**: Campo bloqueado após a primeira validação do cadastro para garantir integridade fiscal.
- **Email**: Pode exigir re-validação caso alterado.

### RF04 - Encerramento de Conta (Exclusão Lógica)
- O cliente pode solicitar a exclusão de sua conta.
- **Regra de Negócio**: A exclusão será **lógica (Soft Delete)**. O registro será marcado como inativo no banco de dados (`deleted_at`), impedindo o acesso do usuário, mas mantendo os dados para conformidade com a LGPD e histórico de transações fiscais.

---

## 2. Requisitos para Empresas (Prestadores de Serviço)

### RF05 - Cadastro de Conta de Empresa
O sistema deve permitir o cadastro de empresas com liberação imediata via API, solicitando:
- **Nome Fantasia** e **Razão Social**
- **CNPJ** (Validação via algoritmo de dígito verificador e unicidade)
- **Email Corporativo** e **Telefone**
- **Site** (Opcional)
- **Categoria** (Definida por lista pré-configurada)
- **Descrição** (Opcional)
- **Identidade Visual**: Logo e Imagem de Capa (Opcionais)

### RF12 - Gestão de Catálogo de Serviços
- A empresa pode cadastrar múltiplos serviços (produtos), definindo: Título, Descrição, Preço, Categoria e Prazo de entrega.

### RF13 - Assinatura de Planos (SaaS)
- A empresa deve escolher um plano de assinatura para operar na plataforma:
  - **Starter**: Taxa de comissão mais alta, sem custo fixo.
  - **Pro**: Mensalidade intermediária, taxa de comissão reduzida, relatórios básicos.
  - **Agency**: Mensalidade alta, menor taxa de comissão, suporte prioritário e API de integração.
- O pagamento da assinatura é processado de forma recursiva via Stripe.

### RF14 - Gestão Financeira e Saques (Payouts)
- Dashboard para visualização de saldo (Disponível, Pendente).
- Configuração de conta bancária via **Stripe Connect** para recebimento de repasses (Payouts).

### RF06 - Upload de Documentação Fiscal
- Obrigatoriedade de envio do **CNPJ em formato PDF** no ato do cadastro para posterior auditoria, se necessário.

### RF07 - Manutenção de Perfil de Empresa
A empresa deve conseguir atualizar seus dados, com as seguintes restrições:
- **CNPJ**: Campo imutável após a validação inicial.
- **Dados Fiscais**: Alterações em Razão Social podem exigir nova validação administrativa.

### RF08 - Encerramento de Conta de Empresa
- Similar ao cliente, o encerramento será **lógico (Soft Delete)** para manter o histórico de notas fiscais emitidas (Webmania) e transações (Stripe) conforme exigência legal (mínimo de 5 anos).

---

## 3. Estrutura de Monetização e Repasses

### RF15 - Modelo de Receita (Take Rate)
A plataforma monetiza através de dois canais principais:
1. **Comissão sobre Vendas**: Percentual retido de cada serviço vendido (ex: 5% a 20%, dependendo do plano da empresa).
2. **Mensalidades (SaaS)**: Valor fixo mensal cobrado das empresas nos planos Pro e Agency.

### RF16 - Divisão de Pagamentos (Split)
- O sistema deve utilizar o **Stripe Connect** para realizar o split automático no momento da transação.
- O valor líquido (valor do serviço - comissão) é direcionado para a subconta da empresa.
- A comissão (application fee) é direcionada para a conta da plataforma.

---

## 3. Validações Técnicas e Regras de Negócio (Detalhamento)

### RN01 - Validação de Identificadores
- **CPF**: Deve seguir o formato `000.000.000-00`.
- **CNPJ**: Deve seguir o formato `00.000.000/0000-00`.
- **CEP**: Deve acionar busca automática de endereço via API (Ex: ViaCEP).

### RN02 - Imutabilidade de Dados Sensíveis
Campos identificadores (CPF/CNPJ) tornam-se "somente leitura" na interface de edição de perfil assim que o registro é criado com sucesso.

### RN03 - Segurança e Futuro
- Implementação de autenticação via **Certificado Digital (A1/A3)** para Empresas para assinatura de contratos e acesso seguro (Fase futura).
- Todas as senhas devem ser armazenadas utilizando algoritmos de hashing seguros (BCrypt/Argon2).

---

## 4. Matriz de Rastreabilidade

| ID | Descrição | Ator | Prioridade |
|----|-----------|------|------------|
| RF01 | Cadastro de Cliente | Cliente | Alta |
| RF03 | Alterar Perfil | Cliente | Média |
| RF04 | Excluir Conta (Soft) | Cliente/Empresa | Média |
| RF05 | Cadastro de Empresa | Empresa | Alta |
| RF06 | Upload de CNPJ (PDF) | Empresa | Alta |
