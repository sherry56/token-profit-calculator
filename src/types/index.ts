export type ModelId = 'gpt55' | 'gpt54';

export type PeriodType = 'day' | 'month' | 'custom';

export type CostMode = 'api' | 'plus' | 'hybrid';

export type TokenUnit = 'tokens' | 'k' | 'm';

export interface BasicSettings {
  period: PeriodType;
  customStartDate: string;
  customEndDate: string;
  exchangeRate: number;
  saleMultipliers: Record<ModelId, number>;
  paymentFeeRate: number;
  riskBufferRate: number;
}

export interface ModelPrice {
  name: string;
  inputPricePer1m: number;
  cachedInputPricePer1m: number;
  outputPricePer1m: number;
  codexInputCreditsPer1m: number;
  codexCachedInputCreditsPer1m: number;
  codexOutputCreditsPer1m: number;
}

export interface AccountCosts {
  accountCount: number;
  plusMonthlyFeeUsd: number;
  rechargePerAccountUsd: number;
}

export interface InfraCosts {
  serverFeeCny: number;
  databaseFeeCny: number;
  bandwidthFeeCny: number;
  domainFeeCny: number;
  proxyFeeCny: number;
  otherFeeCny: number;
}

export interface ModelUsage {
  enabled: boolean;
  requestCount: number;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  actualCodexCredits: number | null;
  tokenUnit: TokenUnit;
}

export interface CostModeConfig {
  mode: CostMode;
  apiSharePercent: number;
  plusSharePercent: number;
}

export interface AppConfig {
  basic: BasicSettings;
  modelPrices: Record<ModelId, ModelPrice>;
  accountCosts: AccountCosts;
  infraCosts: InfraCosts;
  usage: Record<ModelId, ModelUsage>;
  costMode: CostModeConfig;
}

export interface ModelCalculation {
  id: ModelId;
  name: string;
  enabled: boolean;
  requestCount: number;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  totalTokens: number;
  standardCostUsd: number;
  standardCostCny: number;
  saleMultiplier: number;
  saleAmountUsd: number;
  saleAmountCny: number;
  estimatedCodexCredits: number;
  codexCreditsUsed: number;
  modelAllocatedCostCny: number;
  modelGrossProfitCny: number;
  modelGrossMargin: number | null;
}

export interface CalculationResult {
  models: ModelCalculation[];
  standardCostUsd: number;
  standardCostCny: number;
  saleAmountUsd: number;
  saleAmountCny: number;
  paymentFeeCny: number;
  riskBufferCostCny: number;
  accountTotalCostCny: number;
  fixedCostCny: number;
  standardCostComponentCny: number;
  accountCostComponentCny: number;
  modelCostCny: number;
  totalCostCny: number;
  grossProfitCny: number;
  grossMargin: number | null;
  costRatio: number | null;
  breakEvenMultiplier: number | null;
  costPerAccount: number | null;
  profitPerAccount: number | null;
  totalTokens: number;
  codexCreditsUsed: number;
  averageSaleMultiplier: number | null;
}
