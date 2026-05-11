import type { AppConfig, ModelId } from '../types';

export const MODEL_IDS: ModelId[] = ['gpt55', 'gpt54'];

export const MODEL_LABELS: Record<ModelId, string> = {
  gpt55: 'GPT-5.5',
  gpt54: 'GPT-5.4',
};

export const ACCOUNT_MODEL_LABELS = {
  gpt55: 'GPT-5.5',
  gpt54: 'GPT-5.4',
  gpt53: 'GPT-5.3-Codex',
  mixed: 'Mixed',
} as const;

export const STORAGE_KEY = 'token-profit-calculator-config-v1';

export const defaultConfig: AppConfig = {
  basic: {
    period: 'month',
    customStartDate: '',
    customEndDate: '',
    exchangeRate: 7.2,
    saleMultipliers: {
      gpt55: 1.5,
      gpt54: 1.5,
    },
    paymentFeeRate: 0,
    riskBufferRate: 10,
  },
  modelPrices: {
    gpt55: {
      name: 'GPT-5.5',
      inputPricePer1m: 5,
      cachedInputPricePer1m: 0.5,
      outputPricePer1m: 30,
      codexInputCreditsPer1m: 125,
      codexCachedInputCreditsPer1m: 12.5,
      codexOutputCreditsPer1m: 750,
    },
    gpt54: {
      name: 'GPT-5.4',
      inputPricePer1m: 2.5,
      cachedInputPricePer1m: 0.25,
      outputPricePer1m: 15,
      codexInputCreditsPer1m: 62.5,
      codexCachedInputCreditsPer1m: 6.25,
      codexOutputCreditsPer1m: 375,
    },
  },
  accountCosts: {
    accountCount: 5,
    batchTotalCostCny: 500,
  },
  accountPeriods: [
    {
      accountId: 'account_01',
      accountName: 'Plus-主账号',
      batchName: 'batch_01',
      accountType: 'Plus',
      startDate: '2026-05-01',
      endDate: '',
      accountCostCny: 100,
      assignedModel: 'gpt55',
      usedInputTokens: 10_000_000,
      usedCachedInputTokens: 2_000_000,
      usedOutputTokens: 3_000_000,
      usedCodexCredits: null,
    },
  ],
  infraCosts: {
    serverFeeCny: 100,
    databaseFeeCny: 0,
    bandwidthFeeCny: 0,
    domainFeeCny: 0,
    proxyFeeCny: 0,
    otherFeeCny: 0,
  },
  usage: {
    gpt55: {
      enabled: true,
      requestCount: 100,
      inputTokens: 10_000_000,
      cachedInputTokens: 2_000_000,
      outputTokens: 3_000_000,
      actualCodexCredits: null,
      tokenUnit: 'm',
    },
    gpt54: {
      enabled: true,
      requestCount: 200,
      inputTokens: 20_000_000,
      cachedInputTokens: 5_000_000,
      outputTokens: 6_000_000,
      actualCodexCredits: null,
      tokenUnit: 'm',
    },
  },
  costMode: {
    mode: 'api',
    apiSharePercent: 40,
    plusSharePercent: 60,
  },
};
