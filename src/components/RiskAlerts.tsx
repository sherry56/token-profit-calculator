import type { AppConfig, CalculationResult } from '../types';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatMultiplier, formatPercent } from '../utils/format';

interface Props {
  result: CalculationResult;
  config: AppConfig;
}

export default function RiskAlerts({ result, config }: Props) {
  const alerts: string[] = [];
  if (result.grossProfitCny < 0) alerts.push('当前测算为亏损，请检查销售倍率、成本模式和固定成本。');
  if (result.grossMargin !== null && result.grossMargin < 20) alerts.push('毛利率偏低，建议提高倍率或降低固定成本。');
  if (result.breakEvenMultiplier !== null && result.averageSaleMultiplier !== null && result.breakEvenMultiplier > result.averageSaleMultiplier) {
    alerts.push('当前倍率低于保本倍率，存在亏损风险。');
  }
  if (config.costMode.mode === 'hybrid' && config.costMode.apiSharePercent + config.costMode.plusSharePercent !== 100) {
    alerts.push('混合模式占比合计不等于 100%，请确认是否符合你的内部摊销口径。');
  }

  return (
    <section className="panel p-4">
      <h2 className="panel-title mb-4">利润分析与风险提醒</h2>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg bg-slate-50 p-3 text-sm">
          <div className="text-slate-500">平均销售倍率</div>
          <div className="mt-1 text-lg font-semibold">{formatMultiplier(result.averageSaleMultiplier)}</div>
        </div>
        <div className="rounded-lg bg-slate-50 p-3 text-sm">
          <div className="text-slate-500">保本倍率</div>
          <div className="mt-1 text-lg font-semibold">{formatMultiplier(result.breakEvenMultiplier)}</div>
        </div>
        <div className="rounded-lg bg-slate-50 p-3 text-sm">
          <div className="text-slate-500">毛利率</div>
          <div className="mt-1 text-lg font-semibold">{formatPercent(result.grossMargin)}</div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {alerts.length === 0 ? (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            当前配置未触发风险提醒。
          </div>
        ) : (
          alerts.map((alert) => (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950" key={alert}>
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {alert}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
