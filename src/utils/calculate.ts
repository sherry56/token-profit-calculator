import type {
  AccountPeriod,
  AccountPeriodCalculation,
  AccountPeriodSummary,
  AppConfig,
  CalculationResult,
  ModelCalculation,
  ModelId,
  PeriodRange,
} from '../types';
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

const toDateOnly = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDate = (value: string): Date | null => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const daysBetweenInclusive = (start: Date, end: Date): number => {
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.floor((end.getTime() - start.getTime()) / dayMs) + 1;
};

export const calculatePeriodRange = (config: AppConfig): PeriodRange => {
  const today = new Date();
  if (config.basic.period === 'day') {
    const current = toDateOnly(today);
    return { periodStart: current, periodEnd: current };
  }

  if (config.basic.period === 'custom' && config.basic.customStartDate && config.basic.customEndDate) {
    return {
      periodStart: config.basic.customStartDate,
      periodEnd: config.basic.customEndDate,
    };
  }

  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { periodStart: toDateOnly(start), periodEnd: toDateOnly(end) };
};

export const calculateActiveDays = (account: AccountPeriod, periodStart: string, periodEnd: string): number => {
  const accountStart = parseDate(account.startDate);
  const rangeStart = parseDate(periodStart);
  const rangeEnd = parseDate(periodEnd);
  if (!accountStart || !rangeStart || !rangeEnd) return 0;

  const accountEnd = parseDate(account.endDate) ?? rangeEnd;
  if (accountEnd < accountStart) return 0;

  const overlapStart = accountStart > rangeStart ? accountStart : rangeStart;
  const overlapEnd = accountEnd < rangeEnd ? accountEnd : rangeEnd;
  if (overlapEnd < overlapStart) return 0;

  return daysBetweenInclusive(overlapStart, overlapEnd);
};

export const calculateActiveMonths = (account: AccountPeriod, periodStart: string, periodEnd: string): number => {
  const activeDays = calculateActiveDays(account, periodStart, periodEnd);
  if (activeDays <= 0) return 0;
  return activeDays / 30;
};

export const calculateAccountCost = (
  account: AccountPeriod,
  periodStart: string,
  periodEnd: string,
  exchangeRate: number,
): number => {
  const activeDays = calculateActiveDays(account, periodStart, periodEnd);
  if (activeDays <= 0) return 0;
  void exchangeRate;
  return positive(account.accountCostCny);
};

const modelIdFromAssigned = (assignedModel: AccountPeriod['assignedModel']): ModelId | null => {
  if (assignedModel === 'gpt55' || assignedModel === 'gpt54') return assignedModel;
  return null;
};

export const calculateAccountPeriod = (
  account: AccountPeriod,
  config: AppConfig,
  periodStart: string,
  periodEnd: string,
): AccountPeriodCalculation => {
  const exchangeRate = positive(config.basic.exchangeRate);
  const activeDays = calculateActiveDays(account, periodStart, periodEnd);
  const activeMonths = calculateActiveMonths(account, periodStart, periodEnd);
  const accountCostCny = calculateAccountCost(account, periodStart, periodEnd, exchangeRate);
  const inputTokens = positive(account.usedInputTokens);
  const cachedInputTokens = positive(account.usedCachedInputTokens);
  const outputTokens = positive(account.usedOutputTokens);
  const totalTokens = inputTokens + cachedInputTokens + outputTokens;
  const modelId = modelIdFromAssigned(account.assignedModel);
  const price = modelId ? config.modelPrices[modelId] : null;

  const standardCostUsd = price
    ? (inputTokens / 1_000_000) * positive(price.inputPricePer1m) +
      (cachedInputTokens / 1_000_000) * positive(price.cachedInputPricePer1m) +
      (outputTokens / 1_000_000) * positive(price.outputPricePer1m)
    : 0;
  const standardCostCny = standardCostUsd * exchangeRate;
  const estimatedCodexCredits = price
    ? (inputTokens / 1_000_000) * positive(price.codexInputCreditsPer1m) +
      (cachedInputTokens / 1_000_000) * positive(price.codexCachedInputCreditsPer1m) +
      (outputTokens / 1_000_000) * positive(price.codexOutputCreditsPer1m)
    : 0;
  const codexCreditsUsed =
    account.usedCodexCredits === null || account.usedCodexCredits === undefined || Number.isNaN(Number(account.usedCodexCredits))
      ? estimatedCodexCredits
      : positive(account.usedCodexCredits);
  const multiplier = modelId ? positive(config.basic.saleMultipliers[modelId]) : 0;
  const saleAmountCny = standardCostCny * multiplier;
  const utilization = ratio(standardCostCny, accountCostCny);
  const accountStart = parseDate(account.startDate);
  const accountEnd = parseDate(account.endDate);

  return {
    account,
    activeDays,
    activeMonths,
    accountCostCny,
    totalTokens,
    standardCostUsd,
    standardCostCny,
    estimatedCodexCredits,
    codexCreditsUsed,
    utilizationRate: utilization === null ? null : utilization * 100,
    saleAmountCny,
    profitEstimateCny: saleAmountCny - accountCostCny,
    hasDateError: Boolean(accountStart && accountEnd && accountEnd < accountStart),
  };
};

export const calculateAccountPeriodSummary = (config: AppConfig): AccountPeriodSummary => {
  const { periodStart, periodEnd } = calculatePeriodRange(config);
  const calculations = (config.accountPeriods ?? []).map((account) =>
    calculateAccountPeriod(account, config, periodStart, periodEnd),
  );
  const activeCalculations = calculations.filter((item) => item.activeDays > 0);
  const accountTotalCostCny = sum(activeCalculations.map((item) => item.accountCostCny));
  const standardCostCny = sum(activeCalculations.map((item) => item.standardCostCny));
  const accountProfitTotalCny = activeCalculations.reduce((total, item) => total + item.profitEstimateCny, 0);
  const activeAccountCount = activeCalculations.length;
  const averageUtilizationRatio = ratio(standardCostCny, accountTotalCostCny);

  return {
    periodStart,
    periodEnd,
    activeAccountCount,
    accountTotalCostCny,
    totalActiveDays: sum(activeCalculations.map((item) => item.activeDays)),
    totalActiveMonths: sum(activeCalculations.map((item) => item.activeMonths)),
    averageAccountCostCny: activeAccountCount > 0 ? accountTotalCostCny / activeAccountCount : null,
    accountProfitTotalCny,
    averageAccountProfitCny: activeAccountCount > 0 ? accountProfitTotalCny / activeAccountCount : null,
    averageUtilizationRate: averageUtilizationRatio === null ? null : averageUtilizationRatio * 100,
    lowUtilizationAccountCount: activeCalculations.filter(
      (item) => item.utilizationRate !== null && item.utilizationRate < 100,
    ).length,
    standardCostCny,
    calculations,
  };
};

export const calculateAccountTotalCostCny = (config: AppConfig): number => {
  if ((config.accountPeriods ?? []).length > 0) {
    return calculateAccountPeriodSummary(config).accountTotalCostCny;
  }
  return positive(config.accountCosts.batchTotalCostCny);
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
  const accountPeriodSummary = calculateAccountPeriodSummary(config);
  const accountTotalCostCny =
    (config.accountPeriods ?? []).length > 0 ? accountPeriodSummary.accountTotalCostCny : calculateAccountTotalCostCny(config);
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
  const accountCount =
    (config.accountPeriods ?? []).length > 0 ? accountPeriodSummary.activeAccountCount : positive(config.accountCosts.accountCount);
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
    accountPeriodSummary,
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
