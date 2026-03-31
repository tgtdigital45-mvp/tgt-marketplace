# Arquitetura Premium v2 (TGT Contratto Mobile)

Este documento define as diretrizes fundamentais para elevar os aplicativos móveis (`mobile-client` e `mobile-empresas`) do ecosistema TGT Contratto a um padrão **Premium**, inspirado no "Apple Design" (Human Interface Guidelines) e em práticas avançadas de desenvolvimento com Expo (v54).

---

## 🏗️ 1. Princípios Arquiteturais e Design System

A arquitetura base será firmemente pautada em um Design System rigoroso e Atomic Design focado em reusabilidade e coêrencia visual, operando em modelo "Single File" para os prompts do Studio, depois extraído em partes anatômicas reais no projeto.

### Estética Apple & Glassmorphism
Para criar a sensação Premium esperada por clientes exigentes:
- **Tons Neutros Profundos:** Utilização de escala cinza/monocromática refinada, minimizando cores estridentes. As "Brand Colors" servem apenas como "acento" para CTA (Call to Action).
- **Glass Blur:** Interfaces com componentes que dependem de Blur Suave (usado com moderação) para simular o efeito iOS nativo, usando sombras calculadas no NativeWind.
- **Tipografia Escalonada:** Texto perfeitamente legível (System default / SF Pro look). Títulos em negrito pesados (ex: `font-bold text-3xl tracking-tight`), subtítulos contrastando com cores neutras (`text-gray-500`).

## ⚙️ 2. Core Tecnológico e Lógica UI

A base de código para essas interfaces "Premium" usa exclusivamente tecnologias descritas no `package.json` atual do projeto:

### 2.1 Animações e Micro-Interações
As interfaces **nunca** devem ser estáticas. A sensação "premium" vem da resposta ao toque:
- **`react-native-reanimated` (v4+):** Obrigatório para qualquer animação contínua ou mudanças de estado bruscas (interações como flip, expansão de botões/cards, bottom sheets).
- **`expo-haptics`:** O toque no botão deve causar `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)`. Sucesso deve disparar `.NotificationSuccess`. Feedback físico converte.
- **`lottie-react-native`:** Reservado estritamente para estados complexos (Loader Splash Screen premium, Empty States refinados, ícones de Sucesso complexos).

### 2.2 Gerenciamento de Estado (Local e Remoto)
- Para o contexto dos Prompts Single-File focados em UI: será privilegiado o uso de `useState` hook simples acoplados a prop type interfaces definidas strictamente via Typescript, garantindo um contrato claro entre a estrutura "burra" visual (dumb components) da UI real, e o container component superior na nossa base que cuidará da requisição (Supabase/Stripe).
- Com a abstenção de gerar a lógica complexa (Deep Linking ou setups de Zustand global), garantimos que os arquivos gerados atuem como visualizadores visuais perfeitos isolados.

## 🔐 3. Integração Restrita com a Base de Dados (Mockups Single-File)
- Os componentes UI gerados devem assumir que os dados já foram obtidos (ex: os prop types assumem User, Services[], Company Profile).
- Isso dissocia a complexidade rígida de renderizar uma Query ao mesmo tempo que constrói sombras avançadas.
- Essa abordagem visa produzir Views Perfeitas enquanto o core dev assume apenas o preenchimento de dados reais vindos da API (que é segura com RLS validado em outros endpoints).

## 🚀 4. Execução Padrão de Componente (Receita)

Um componente deve ser formado por (TUDO NA MESMA VIEW/ARQUIVO):
1. **Imports:** Restritos a `react-native`, `reanimated`, `lucide-react-native` / `expo/vector-icons`, `expo-haptics` e o NativeWind styling engine.
2. **Interfaces e Tipos:** Definição clara em TypeScript (ex: `interface PremiumCardProps { data: Company }`).
3. **Helpers Internos (Opcional):** Funções para formatar BRL (R$) ou parse dates nativos.
4. **Sub-Componentes (Atom):** Pequenos elementos como `Avatar()`, `TagBadge()` definidos acima do Default Export.
5. **Componente Principal + Animação:** Exportado como `default function()`, encapsulando as props da interface primária, usando os Hooks de Reanimated para os "Gestures", invocando os Haptics on press (TouchableWithoutFeedback geralmente) usando NativeWind e, em ultimo caso `StyleSheet.create`.

---
*Foco na sensação de uso fluida. Nenhuma interface brusca. Nenhuma quebra.*
