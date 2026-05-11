import type { AccountCosts } from '../types';
import { formatCurrency } from '../utils/format';

interface Props {
  accountCosts: AccountCosts;
  accountTotalCostCny: number;
  onChange: (accountCosts: AccountCosts) => void;
}

const toNumber = (value: string) => (value === '' ? 0 : Number(value));

const quotaRows = [
  ['GPT-5.5', '15-80', '不可用', '不可用'],
  ['GPT-5.4', '20-100', '不可用', '不可用'],
  ['GPT-5.3-Codex', '30-150', '10-60', '20-50'],
];

export default function AccountCostSettings({ accountCosts, accountTotalCostCny, onChange }: Props) {
  const defaultAccountCostCny = (accountCosts.batchTotalCostCny || 0) / Math.max(1, accountCosts.accountCount || 1);

  const update = <K extends keyof AccountCosts>(key: K, value: AccountCosts[K]) => {
    onChange({ ...accountCosts, [key]: value });
  };

  return (
    <section className="panel p-4">
      <h2 className="panel-title mb-4">账号批量成本默认值</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="field-label">本批账号数量</span>
          <input className="input" type="number" step="1" value={accountCosts.accountCount} onChange={(event) => update('accountCount', toNumber(event.target.value))} />
        </label>
        <label className="space-y-1">
          <span className="field-label">本批总成本 CNY</span>
          <input className="input" type="number" step="0.01" value={accountCosts.batchTotalCostCny} onChange={(event) => update('batchTotalCostCny', toNumber(event.target.value))} />
        </label>
      </div>
      <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
        当前账号列表总成本：<strong className="text-slate-950">{formatCurrency(accountTotalCostCny)}</strong>
        <span className="ml-3 text-slate-500">默认均摊：{formatCurrency(defaultAccountCostCny)} / 账号</span>
        <div className="mt-1 text-xs text-slate-500">
          通常一批 5-10 个账号可直接填本批总成本；批量生成时会先均摊，最终仍以账号周期管理列表中的人民币成本为准。
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs text-slate-600">
            <tr>
              <th className="px-3 py-2">模型</th>
              <th className="px-3 py-2">Local messages / 5h</th>
              <th className="px-3 py-2">Cloud tasks / 5h</th>
              <th className="px-3 py-2">Code reviews / 5h</th>
            </tr>
          </thead>
          <tbody>
            {quotaRows.map((row) => (
              <tr key={row[0]} className="border-b border-slate-100">
                {row.map((cell) => (
                  <td className="px-3 py-2" key={cell}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        Plus / Codex 额度与 API token 计费不是同一种口径。本工具仅用于内部成本摊销和利润测算，实际额度会受模型、上下文、任务复杂度和官方限制影响。
      </p>
    </section>
  );
}
