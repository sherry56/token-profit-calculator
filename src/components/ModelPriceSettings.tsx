import type { AppConfig, ModelId, ModelPrice } from '../types';
import { MODEL_IDS, MODEL_LABELS } from '../constants/defaultConfig';

interface Props {
  prices: AppConfig['modelPrices'];
  onChange: (prices: AppConfig['modelPrices']) => void;
}

const fields: Array<[keyof ModelPrice, string]> = [
  ['inputPricePer1m', 'input / 1M USD'],
  ['cachedInputPricePer1m', 'cached input / 1M USD'],
  ['outputPricePer1m', 'output / 1M USD'],
  ['codexInputCreditsPer1m', 'input credits / 1M'],
  ['codexCachedInputCreditsPer1m', 'cached input credits / 1M'],
  ['codexOutputCreditsPer1m', 'output credits / 1M'],
];

const toNumber = (value: string) => (value === '' ? 0 : Number(value));

export default function ModelPriceSettings({ prices, onChange }: Props) {
  const update = (modelId: ModelId, key: keyof ModelPrice, value: number | string) => {
    onChange({ ...prices, [modelId]: { ...prices[modelId], [key]: value } });
  };

  return (
    <section className="panel p-4">
      <h2 className="panel-title mb-4">官方模型价格配置</h2>
      <div className="grid gap-4">
        {MODEL_IDS.map((modelId) => (
          <div key={modelId} className="rounded-lg border border-slate-200 p-3">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">{MODEL_LABELS[modelId]}</h3>
              <input className="h-9 w-32 rounded-md border border-slate-300 px-2 text-sm" value={prices[modelId].name} onChange={(event) => update(modelId, 'name', event.target.value)} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {fields.map(([key, label]) => (
                <label className="space-y-1" key={key}>
                  <span className="field-label">{label}</span>
                  <input className="input" type="number" step="0.01" value={prices[modelId][key]} onChange={(event) => update(modelId, key, toNumber(event.target.value))} />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
