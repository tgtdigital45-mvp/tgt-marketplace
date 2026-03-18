/**
 * taxCalculator.ts
 * Motor de cálculos flexíveis para a plataforma TGT.
 * Lida com taxas escalonadas (Tiered Pricing) e regras de pagamento flexíveis (Ex: 30% Entrada, 70% Entrega).
 */

export interface TaxCalculationResult {
    totalValue: number;         // Valor total do projeto
    platformFee: number;        // Taxa total da TGT
    stripeFee: number;          // Taxa retida pela Stripe
    sellerNet: number;          // Líquido final para o profissional (100%)
    upfrontAmount: number;      // Quanto o cliente paga na Entrada (ex: 30%)
    upfrontPlatformFee: number; // Fração da taxa TGT cobrada na entrada
    upfrontSellerNet: number;   // Fração líquida do profissional na entrada (Escrow / Payout)
    finalAmount: number;        // Quanto o cliente paga na Entrega Final (ex: 70%)
}

/**
 * Calcula as taxas escalonadas do projeto e a divisão de pagamento (entrada vs final).
 * 
 * Regra Escalonada:
 * - Até R$ 500: 10%
 * - R$ 501 a R$ 2500: 5.5%
 * - Acima de R$ 2500: 3%
 * 
 * @param value Valor total do projeto (em BRL)
 * @param isPro Se a empresa assinante é PRO (ex: desconto nas taxas)
 * @param upfrontPercentage Porcentagem de entrada flexível (0 a 100)
 * @returns TaxCalculationResult
 */
export function calculateProjectFees(
    value: number,
    isPro: boolean = false,
    upfrontPercentage: number = 30
): TaxCalculationResult {
    // 1. Validação de segurança para a porcentagem (sempre entre 0 e 100)
    const validUpfront = Math.max(0, Math.min(100, upfrontPercentage));
    
    // 2. Cálculo da Taxa da Plataforma (Escalonada)
    let platformFeePercentage = 0;
    
    if (value <= 500) {
        platformFeePercentage = 0.10; // 10%
    } else if (value <= 2500) {
        platformFeePercentage = 0.055; // 5.5%
    } else {
        platformFeePercentage = 0.03; // 3%
    }

    // (Exemplo de regra de negócio) Usuários PRO podem ter desconto na taxa
    if (isPro) {
        platformFeePercentage *= 0.8; // Desconto de 20% sobre a taxa original
    }

    const platformFee = value * platformFeePercentage;
    
    // 3. Cálculo da Taxa da Stripe (Média de 3.99% + R$ 0,39 por aproximação)
    // Na prática, pode variar a depender se é cartão nacional, internacional ou PIX.
    const stripeFee = (value * 0.0399) + 0.39;
    
    // 4. Líquido Total do Profissional
    const sellerNet = value - platformFee - stripeFee;

    // 5. Motor de Frações (Split)
    const upfrontRatio = validUpfront / 100;
    
    const upfrontAmount = value * upfrontRatio;
    const finalAmount = value - upfrontAmount;
    
    const upfrontPlatformFee = platformFee * upfrontRatio;
    const upfrontSellerNet = sellerNet * upfrontRatio;

    return {
        totalValue: value,
        platformFee,
        stripeFee,
        sellerNet,
        upfrontAmount,
        upfrontPlatformFee,
        upfrontSellerNet,
        finalAmount
    };
}
