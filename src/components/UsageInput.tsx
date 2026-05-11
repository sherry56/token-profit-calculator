import type { AppConfig, ModelId, ModelUsage, TokenUnit } from '../types';
import { MODEL_IDS, MODEL_LABELS } from '../constants/defaultConfig';

interface Props {
  usage: AppConfig['usage'];
  onChange: (usage: AppConfig['usage']) => void;
}

const unitMultiplier: Record<TokenUnit, number> = {
  tokens: 1,
  k: 1_000,
  m: 1_000_000,
};

const unitLabels: Record<TokenUnit, string> = {
  tokens: 'tokens',
  k: 'K tokens',
  m: 'M tokens',
};

const tokenFields: Array<[keyof Pick<ModelUsage, 'inputTokens' | 'cachedInputTokens' | 'outputTokens'>, string]> = [
  ['inputTokens', 'input tokens'],
  ['cachedInputTokens', 'cached input tokens'],
  ['outputTokens', 'output tokens'],
];

const toNumber = (value: string) => (value === '' ? 0 : Number(value));

const displayToken = (tokens: number, unit: TokenUnit) => {
  const value = tokens / unitMultiplier[unit];
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(4)));
};

export default function UsageInput({ usage, onChange }: Props) {
  const update = <K extends keyof ModelUsage>(modelId: ModelId, key: K, value: ModelUsage[K]) => {
    onChange({ ...usage, [modelId]: { ...usage[modelId], [key]: value } });
  };

  const updateToken = (modelId: ModelId, key: keyof Pick<ModelUsage, 'inputTokens' | 'cachedInputTokens' | 'outputTokens'>, raw: string) => {
    update(modelId, key, toNumber(raw) * unitMultiplier[usage[modelId].tokenUnit]);
  };

  return (
    <section className="panel p-4">
      <h2 className="panel-title mb-4">用量输入</h2>
      <div className="grid gap-4">
        {MODEL_IDS.map((modelId) => {
          const modelUsage = usage[modelId];
          return (
            <div key={modelId} className={`rounded-lg border p-3 ${modelUsage.enabled ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-80'}`}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-semibold text-slate-800">{MODEL_LABELS[modelId]}</h3>
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={modelUsage.enabled} onChange={(event) => update(modelId, 'enabled', event.target.checked)} />
                  启用该模型
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-1">
                  <span className="field-label">请求数</span>
                  <input className="input" type="number" step="1" value={modelUsage.requestCount} onChange={(event) => update(modelId, 'requestCount', toNumber(event.target.value))} />
                </label>
                <label className="space-y-1">
                  <span className="field-label">Token 单位</span>
                  <select className="input" value={modelUsage.tokenUnit} onChange={(event) => update(modelId, 'tokenUnit', event.target.value as TokenUnit)}>
                    {Object.entries(unitLabels).map(([value, label]) => (
                      <option value={value} key={value}>{label}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="field-label">实际 Codex credits 消耗</span>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    placeholder="留空自动估算"
                    value={modelUsage.actualCodexCredits ?? ''}
                    onChange={(event) => update(modelId, 'actualCodexCredits', event.target.value === '' ? null : toNumber(event.target.value))}
                  />
                </label>
                {tokenFields.map(([key, label]) => (
                  <label className="space-y-1" key={key}>
                    <span className="field-label">{label}</span>
                    <input className="input" type="number" step="0.0001" value={displayToken(modelUsage[key], modelUsage.tokenUnit)} onChange={(event) => updateToken(modelId, key, event.target.value)} />
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
