import type { BasicSettings as BasicSettingsType, CostModeConfig, ModelId, PeriodType } from '../types';
import { MODEL_IDS, MODEL_LABELS } from '../constants/defaultConfig';

interface Props {
  basic: BasicSettingsType;
  costMode: CostModeConfig;
  onBasicChange: (basic: BasicSettingsType) => void;
  onCostModeChange: (costMode: CostModeConfig) => void;
}

const numberValue = (value: string) => (value === '' ? 0 : Number(value));

export default function BasicSettings({ basic, costMode, onBasicChange, onCostModeChange }: Props) {
  const updateBasic = <K extends keyof BasicSettingsType>(key: K, value: BasicSettingsType[K]) => {
    onBasicChange({ ...basic, [key]: value });
  };

  const updateMultiplier = (modelId: ModelId, value: number) => {
    onBasicChange({
      ...basic,
      saleMultipliers: { ...basic.saleMultipliers, [modelId]: value },
    });
  };

  const updateCostMode = <K extends keyof CostModeConfig>(key: K, value: CostModeConfig[K]) => {
    onCostModeChange({ ...costMode, [key]: value });
  };

  return (
    <section className="panel p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="panel-title">基础设置</h2>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">自动保存</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="field-label">统计周期</span>
          <select className="input" value={basic.period} onChange={(event) => updateBasic('period', event.target.value as PeriodType)}>
            <option value="day">日</option>
            <option value="month">月</option>
            <option value="custom">自定义周期</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="field-label">USD 转 CNY 汇率</span>
          <input className="input" type="number" step="0.01" value={basic.exchangeRate} onChange={(event) => updateBasic('exchangeRate', numberValue(event.target.value))} />
        </label>
        {basic.period === 'custom' && (
          <>
            <label className="space-y-1">
              <span className="field-label">开始日期</span>
              <input className="input" type="date" value={basic.customStartDate} onChange={(event) => updateBasic('customStartDate', event.target.value)} />
            </label>
            <label className="space-y-1">
              <span className="field-label">结束日期</span>
              <input className="input" type="date" value={basic.customEndDate} onChange={(event) => updateBasic('customEndDate', event.target.value)} />
            </label>
          </>
        )}
        {MODEL_IDS.map((modelId) => (
          <label className="space-y-1" key={modelId}>
            <span className="field-label">{MODEL_LABELS[modelId]} 销售倍率</span>
            <input className="input" type="number" step="0.01" value={basic.saleMultipliers[modelId]} onChange={(event) => updateMultiplier(modelId, numberValue(event.target.value))} />
          </label>
        ))}
        <label className="space-y-1">
          <span className="field-label">平台手续费率 %</span>
          <input className="input" type="number" step="0.01" value={basic.paymentFeeRate} onChange={(event) => updateBasic('paymentFeeRate', numberValue(event.target.value))} />
        </label>
        <label className="space-y-1">
          <span className="field-label">安全冗余率 %</span>
          <input className="input" type="number" step="0.01" value={basic.riskBufferRate} onChange={(event) => updateBasic('riskBufferRate', numberValue(event.target.value))} />
        </label>
      </div>

      <div className="mt-5 border-t border-slate-200 pt-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-800">成本模式</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ['api', 'API 标准成本'],
            ['plus', 'Plus/Codex 摊销'],
            ['hybrid', '混合模式'],
          ].map(([value, label]) => (
            <label key={value} className={`rounded-lg border p-3 text-sm ${costMode.mode === value ? 'border-teal-500 bg-teal-50 text-teal-900' : 'border-slate-200 bg-white text-slate-700'}`}>
              <input className="mr-2" type="radio" checked={costMode.mode === value} onChange={() => updateCostMode('mode', value as CostModeConfig['mode'])} />
              {label}
            </label>
          ))}
        </div>
        {costMode.mode === 'hybrid' && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="field-label">API 成本占比 %</span>
              <input className="input" type="number" step="1" value={costMode.apiSharePercent} onChange={(event) => updateCostMode('apiSharePercent', numberValue(event.target.value))} />
            </label>
            <label className="space-y-1">
              <span className="field-label">Plus/Codex 成本占比 %</span>
              <input className="input" type="number" step="1" value={costMode.plusSharePercent} onChange={(event) => updateCostMode('plusSharePercent', numberValue(event.target.value))} />
            </label>
          </div>
        )}
      </div>
    </section>
  );
}
