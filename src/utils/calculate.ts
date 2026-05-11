import type { AppConfig, CalculationResult, ModelCalculation, ModelId } from '../types';
import { MODEL_IDS } from '../constants/defaultConfig';

const n = (value: unknown): number => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const positive = (value: unknown): number => Math.max(0, n(value));

const ratio = (numerator: number, denominator: number): number | null => {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return null;
  }
  return numerator / denominator;
};

const sum = (values: number[]): number => values.reduce((total, value) => total + positive(value), 0);

export const calculateAccountTotalCostCny = (config: AppConfig): number => {
  const { accountCount, plusMonthlyFeeUsd, rechargePerAccountUsd } = config.accountCosts;
  return (
    positive(accountCount) *
    (positive(plusMonthlyFeeUsd) + positive(rechargePerAccountUsd)) *
    positive(config.basic.exchangeRate)
  );
};

export const calculateFixedCostCny = (config: AppConfig): number => {
  const costs = config.infraCosts;
  return sum([
    costs.serverFeeCny,
    costs.databaseFeeCny,
    costs.bandwidthFeeCny,
    costs.domainFeeCny,
    costs.proxyFeeCny,
    costs.otherFeeCny,
  ]);
};

export const calculateModel = (
  modelId: ModelId,
  config: AppConfig,
  accountTotalCostCny: number,
  enabledModelCount: number,
): ModelCalculation => {
  const usage = config.usage[modelId];
  const price = config.modelPrices[modelId];
  const exchangeRate = positive(config.basic.exchangeRate);
  const saleMultiplier = positive(config.basic.saleMultipliers[modelId]);

  const inputTokens = usage.enabled ? positive(usage.inputTokens) : 0;
  const cachedInputTokens = usage.enabled ? positive(usage.cachedInputTokens) : 0;
  const outputTokens = usage.enabled ? positive(usage.outputTokens) : 0;
  const requestCount = usage.enabled ? positive(usage.requestCount) : 0;
  const totalTokens = inputTokens + cachedInputTokens + outputTokens;

  const standardCostUsd =
    (inputTokens / 1_000_000) * positive(price.inputPricePer1m) +
    (cachedInputTokens / 1_000_000) * positive(price.cachedInputPricePer1m) +
    (outputTokens / 1_000_000) * positive(price.outputPricePer1m);
  const standardCostCny = standardCostUsd * exchangeRate;
  const saleAmountUsd = standardCostUsd * saleMultiplier;
  const saleAmountCny = saleAmountUsd * exchangeRate;

  const estimatedCodexCredits =
    (inputTokens / 1_000_000) * positive(price.codexInputCreditsPer1m) +
    (cachedInputTokens / 1_000_000) * positive(price.codexCachedInputCreditsPer1m) +
    (outputTokens / 1_000_000) * positive(price.codexOutputCreditsPer1m);
  const manualCredits = usage.actualCodexCredits;
  const codexCreditsUsed =
    manualCredits === null || manualCredits === undefined || Number.isNaN(Number(manualCredits))
      ? estimatedCodexCredits
      : positive(manualCredits);

  const accountShare = enabledModelCount > 0 && usage.enabled ? accountTotalCostCny / enabledModelCount : 0;
  const modelAllocatedCostCny =
    config.costMode.mode === 'api'
      ? standardCostCny + accountShare
      : config.costMode.mode === 'plus'
        ? accountShare
        : standardCostCny * (positive(config.costMode.apiSharePercent) / 100) +
          accountShare * (positive(config.costMode.plusSharePercent) / 100);
  const modelGrossProfitCny = saleAmountCny - modelAllocatedCostCny;
  const grossMarginRatio = ratio(modelGrossProfitCny, saleAmountCny);

  return {
    id: modelId,
    name: price.name,
    enabled: usage.enabled,
    requestCount,
    inputTokens,
    cachedInputTokens,
    outputTokens,
    totalTokens,
    standardCostUsd,
    standardCostCny,
    saleMultiplier,
    saleAmountUsd,
    saleAmountCny,
    estimatedCodexCredits,
    codexCreditsUsed,
    modelAllocatedCostCny,
    modelGrossProfitCny,
    modelGrossMargin: grossMarginRatio === null ? null : grossMarginRatio * 100,
  };
};

export const calculateAll = (config: AppConfig): CalculationResult => {
  const accountTotalCostCny = calculateAccountTotalCostCny(config);
  const fixedCostCny = calculateFixedCostCny(config);
  const enabledModelCount = MODEL_IDS.filter((modelId) => config.usage[modelId].enabled).length;
  const models = MODEL_IDS.map((modelId) => calculateModel(modelId, config, accountTotalCostCny, enabledModelCount));
  const standardCostUsd = sum(models.map((model) => model.standardCostUsd));
  const standardCostCny = sum(models.map((model) => model.standardCostCny));
  const saleAmountUsd = sum(models.map((model) => model.saleAmountUsd));
  const saleAmountCny = sum(models.map((model) => model.saleAmountCny));
  const paymentFeeCny = saleAmountCny * (positive(config.basic.paymentFeeRate) / 100);
  const riskBufferCostCny = standardCostCny * (positive(config.basic.riskBufferRate) / 100);

  const standardCostComponentCny =
    config.costMode.mode === 'api'
      ? standardCostCny
      : config.costMode.mode === 'hybrid'
        ? standardCostCny * (positive(config.costMode.apiSharePercent) / 100)
        : 0;
  const accountCostComponentCny =
    config.costMode.mode === 'hybrid'
      ? accountTotalCostCny * (positive(config.costMode.plusSharePercent) / 100)
      : accountTotalCostCny;
  const modelCostCny = standardCostComponentCny + accountCostComponentCny;

  const totalCostCny = modelCostCny + fixedCostCny + paymentFeeCny + riskBufferCostCny;
  const grossProfitCny = saleAmountCny - totalCostCny;
  const marginRatio = ratio(grossProfitCny, saleAmountCny);
  const costRatioValue = ratio(totalCostCny, saleAmountCny);
  const breakEven = ratio(totalCostCny, standardCostCny);
  const accountCount = positive(config.accountCosts.accountCount);
  const averageSaleMultiplier = ratio(saleAmountCny, standardCostCny);

  return {
    models,
    standardCostUsd,
    standardCostCny,
    saleAmountUsd,
    saleAmountCny,
    paymentFeeCny,
    riskBufferCostCny,
    accountTotalCostCny,
    fixedCostCny,
    standardCostComponentCny,
    accountCostComponentCny,
    modelCostCny,
    totalCostCny,
    grossProfitCny,
    grossMargin: marginRatio === null ? null : marginRatio * 100,
    costRatio: costRatioValue === null ? null : costRatioValue * 100,
    breakEvenMultiplier: breakEven,
    costPerAccount: accountCount > 0 ? accountTotalCostCny / accountCount : null,
    profitPerAccount: accountCount > 0 ? grossProfitCny / accountCount : null,
    totalTokens: sum(models.map((model) => model.totalTokens)),
    codexCreditsUsed: sum(models.map((model) => model.codexCreditsUsed)),
    averageSaleMultiplier,
  };
};
