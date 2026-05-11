import type { InfraCosts } from '../types';
import { formatCurrency } from '../utils/format';

interface Props {
  infraCosts: InfraCosts;
  fixedCostCny: number;
  onChange: (infraCosts: InfraCosts) => void;
}

const labels: Array<[keyof InfraCosts, string]> = [
  ['serverFeeCny', '服务器费用 CNY'],
  ['databaseFeeCny', '数据库费用 CNY'],
  ['bandwidthFeeCny', '带宽费用 CNY'],
  ['domainFeeCny', '域名/证书费用 CNY'],
  ['proxyFeeCny', '代理/网络费用 CNY'],
  ['otherFeeCny', '其他固定费用 CNY'],
];

const toNumber = (value: string) => (value === '' ? 0 : Number(value));

export default function InfraCostSettings({ infraCosts, fixedCostCny, onChange }: Props) {
  const update = (key: keyof InfraCosts, value: number) => {
    onChange({ ...infraCosts, [key]: value });
  };

  return (
    <section className="panel p-4">
      <h2 className="panel-title mb-4">服务器与固定成本</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {labels.map(([key, label]) => (
          <label className="space-y-1" key={key}>
            <span className="field-label">{label}</span>
            <input className="input" type="number" step="0.01" value={infraCosts[key]} onChange={(event) => update(key, toNumber(event.target.value))} />
          </label>
        ))}
      </div>
      <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
        固定成本：<strong className="text-slate-950">{formatCurrency(fixedCostCny)}</strong>
      </div>
    </section>
  );
}
