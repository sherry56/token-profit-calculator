import type { CalculationResult } from '../types';
import { formatCurrency, formatMultiplier, formatNumber, formatPercent } from '../utils/format';

interface Props {
  result: CalculationResult;
}

const toneClass = (profit: number) =>
  profit > 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : profit < 0 ? 'border-rose-200 bg-rose-50 text-rose-900' : 'border-slate-200 bg-slate-50 text-slate-800';

export default function ResultCards({ result }: Props) {
  const cards = [
    ['总消费 CNY', formatCurrency(result.saleAmountCny)],
    ['总消费 USD', formatCurrency(result.saleAmountUsd, 'USD')],
    ['标准消耗额度 CNY', formatCurrency(result.standardCostCny)],
    ['标准消耗额度 USD', formatCurrency(result.standardCostUsd, 'USD')],
    ['实际 token 消耗', formatNumber(result.totalTokens)],
    ['实际 Codex credits 消耗', formatNumber(result.codexCreditsUsed, 2)],
    ['当前周期账号数', formatNumber(result.accountPeriodSummary.activeAccountCount)],
    ['账号总成本', formatCurrency(result.accountTotalCostCny)],
    ['总使用天数', formatNumber(result.accountPeriodSummary.totalActiveDays)],
    ['总使用月数', formatNumber(result.accountPeriodSummary.totalActiveMonths, 2)],
    ['账号平均成本', formatCurrency(result.accountPeriodSummary.averageAccountCostCny)],
    ['账号平均利润', formatCurrency(result.accountPeriodSummary.averageAccountProfitCny)],
    ['账号平均利用率', formatPercent(result.accountPeriodSummary.averageUtilizationRate)],
    ['低利用率账号数', formatNumber(result.accountPeriodSummary.lowUtilizationAccountCount)],
    ['固定成本', formatCurrency(result.fixedCostCny)],
    ['总成本', formatCurrency(result.totalCostCny)],
    ['毛利润', formatCurrency(result.grossProfitCny)],
    ['毛利率', formatPercent(result.grossMargin)],
    ['成本率', formatPercent(result.costRatio)],
    ['保本倍率', formatMultiplier(result.breakEvenMultiplier)],
    ['单账号平均利润', formatCurrency(result.profitPerAccount)],
  ];

  return (
    <section className="panel p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="panel-title">核心指标</h2>
        <span className={`rounded-md border px-3 py-1 text-sm font-semibold ${toneClass(result.grossProfitCny)}`}>
          {result.grossProfitCny >= 0 ? '盈利' : '亏损'}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs text-slate-500">{label}</div>
            <div className="mt-1 break-words text-lg font-semibold text-slate-950">{value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
