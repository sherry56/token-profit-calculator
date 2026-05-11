import type { CalculationResult } from '../types';
import { formatCurrency, formatNumber, formatPercent } from '../utils/format';

interface Props {
  result: CalculationResult;
}

export default function ModelDetailTable({ result }: Props) {
  return (
    <section className="panel p-4">
      <h2 className="panel-title mb-4">模型明细表</h2>
      <div className="overflow-x-auto">
        <table className="min-w-[1100px] text-left text-sm">
          <thead className="bg-slate-100 text-xs text-slate-600">
            <tr>
              {[
                '模型',
                '请求数',
                'input tokens',
                'cached input tokens',
                'output tokens',
                '总 tokens',
                '标准消耗 USD',
                '标准消耗 CNY',
                '销售倍率',
                '用户侧消费 CNY',
                'Codex credits 消耗',
                '模型毛利润估算',
                '模型毛利率',
              ].map((header) => (
                <th className="whitespace-nowrap px-3 py-2 font-semibold" key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.models.map((model) => (
              <tr key={model.id} className="border-b border-slate-100">
                <td className="whitespace-nowrap px-3 py-2 font-semibold">{model.name}</td>
                <td className="px-3 py-2">{formatNumber(model.requestCount)}</td>
                <td className="px-3 py-2">{formatNumber(model.inputTokens)}</td>
                <td className="px-3 py-2">{formatNumber(model.cachedInputTokens)}</td>
                <td className="px-3 py-2">{formatNumber(model.outputTokens)}</td>
                <td className="px-3 py-2">{formatNumber(model.totalTokens)}</td>
                <td className="px-3 py-2">{formatCurrency(model.standardCostUsd, 'USD')}</td>
                <td className="px-3 py-2">{formatCurrency(model.standardCostCny)}</td>
                <td className="px-3 py-2">{model.saleMultiplier.toFixed(2)}x</td>
                <td className="px-3 py-2">{formatCurrency(model.saleAmountCny)}</td>
                <td className="px-3 py-2">{formatNumber(model.codexCreditsUsed, 2)}</td>
                <td className={`px-3 py-2 font-semibold ${model.modelGrossProfitCny >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatCurrency(model.modelGrossProfitCny)}</td>
                <td className="px-3 py-2">{formatPercent(model.modelGrossMargin)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
