import { useState } from 'react';
import { Copy, Plus, Trash2 } from 'lucide-react';
import type {
  AccountPeriod,
  AccountPeriodCalculation,
  AccountType,
  AppConfig,
  AssignedAccountModel,
} from '../types';
import { ACCOUNT_MODEL_LABELS } from '../constants/defaultConfig';
import { formatCurrency, formatNumber, formatPercent } from '../utils/format';

interface Props {
  accounts: AccountPeriod[];
  accountCosts: AppConfig['accountCosts'];
  calculations: AccountPeriodCalculation[];
  periodStart: string;
  periodEnd: string;
  onAccountsChange: (accounts: AccountPeriod[]) => void;
}

const accountTypes: AccountType[] = ['Plus', 'Pro', 'Team', 'API'];
const assignedModels: AssignedAccountModel[] = ['gpt55', 'gpt54', 'gpt53', 'mixed'];

const toNumber = (value: string) => (value === '' ? 0 : Number(value));

const nextAccountId = (accounts: AccountPeriod[], offset = 1) => {
  const maxId = accounts.reduce((max, account) => {
    const match = account.accountId.match(/account_(\d+)/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `account_${String(maxId + offset).padStart(2, '0')}`;
};

const nextBatchName = (accounts: AccountPeriod[]) => {
  const maxId = accounts.reduce((max, account) => {
    const match = account.batchName.match(/batch_(\d+)/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `batch_${String(maxId + 1).padStart(2, '0')}`;
};

const getDefaultAccountCostCny = (accountCosts: AppConfig['accountCosts'], count = accountCosts.accountCount) =>
  (accountCosts.batchTotalCostCny || 0) / Math.max(1, count || 1);

const makeAccount = (
  accountId: string,
  index: number,
  accountCosts: AppConfig['accountCosts'],
  periodStart: string,
  periodEnd = '',
  batchName = `batch_${String(Math.floor(index / Math.max(1, accountCosts.accountCount || 1)) + 1).padStart(2, '0')}`,
  accountCostCny = getDefaultAccountCostCny(accountCosts),
): AccountPeriod => ({
  accountId,
  accountName: `Plus-${String(index + 1).padStart(2, '0')}`,
  batchName,
  accountType: 'Plus',
  startDate: periodStart,
  endDate: periodEnd,
  accountCostCny,
  assignedModel: 'gpt55',
  usedInputTokens: 0,
  usedCachedInputTokens: 0,
  usedOutputTokens: 0,
  usedCodexCredits: null,
});

export default function AccountPeriodManager({
  accounts,
  accountCosts,
  calculations,
  periodStart,
  periodEnd,
  onAccountsChange,
}: Props) {
  const [batchCount, setBatchCount] = useState(String(accountCosts.accountCount || 1));

  const updateAccount = <K extends keyof AccountPeriod>(index: number, key: K, value: AccountPeriod[K]) => {
    onAccountsChange(accounts.map((account, accountIndex) => (accountIndex === index ? { ...account, [key]: value } : account)));
  };

  const addAccount = () => {
    onAccountsChange([
      ...accounts,
      makeAccount(nextAccountId(accounts), accounts.length, accountCosts, periodStart, '', nextBatchName(accounts)),
    ]);
  };

  const copyAccount = (index: number) => {
    const source = accounts[index];
    onAccountsChange([
      ...accounts,
      {
        ...source,
        accountId: nextAccountId(accounts),
        accountName: `${source.accountName || source.accountId}-复制`,
      },
    ]);
  };

  const deleteAccount = (index: number) => {
    onAccountsChange(accounts.filter((_, accountIndex) => accountIndex !== index));
  };

  const batchCreate = () => {
    const count = Math.max(0, Math.floor(toNumber(batchCount)));
    const batchName = nextBatchName(accounts);
    const accountCostCny = getDefaultAccountCostCny(accountCosts, count);
    const created = Array.from({ length: count }, (_, index) =>
      makeAccount(nextAccountId(accounts, index + 1), accounts.length + index, accountCosts, periodStart, '', batchName, accountCostCny),
    );
    onAccountsChange([...accounts, ...created]);
  };

  const setAllToPeriod = () => {
    onAccountsChange(accounts.map((account) => ({ ...account, startDate: periodStart, endDate: periodEnd })));
  };

  const calculationMap = new Map(calculations.map((item) => [item.account.accountId, item]));

  return (
    <section className="panel p-4">
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="panel-title">账号使用周期管理</h2>
          <p className="mt-1 text-sm text-slate-600">
            当前统计周期：{periodStart} 至 {periodEnd}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary" type="button" onClick={addAccount}>
            <Plus className="h-4 w-4" />
            新增账号
          </button>
          <button className="btn btn-secondary" type="button" onClick={setAllToPeriod}>
            一键设置周期
          </button>
          <div className="flex">
            <input
              className="h-10 w-20 rounded-l-md border border-slate-300 px-2 text-sm"
              type="number"
              min="0"
              step="1"
              value={batchCount}
              onChange={(event) => setBatchCount(event.target.value)}
            />
            <button className="btn btn-secondary rounded-l-none" type="button" onClick={batchCreate}>
              批量生成
            </button>
          </div>
        </div>
      </div>

      <p className="mb-4 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
        账号成本统一按人民币录入。批量生成会把本批总成本 CNY 均摊到本批账号，每个账号仍可单独修改成本和流量；未覆盖当前统计周期的账号不会计入本周期成本。
      </p>

      <div className="overflow-x-auto">
        <table className="min-w-[1800px] text-left text-sm">
          <thead className="bg-slate-100 text-xs text-slate-600">
            <tr>
              {[
                '账号名称',
                '批次',
                '账号类型',
                '开始日期',
                '结束日期',
                '使用天数',
                '使用月数',
                '账号成本 CNY',
                '主要模型',
                'input tokens',
                'cached input',
                'output tokens',
                '总 tokens',
                'Codex credits 消耗',
                '标准消耗额度 CNY',
                '账号利用率',
                '账号利润估算',
                '操作',
              ].map((header) => (
                <th className="whitespace-nowrap px-3 py-2 font-semibold" key={header}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {accounts.map((account, index) => {
              const calculation = calculationMap.get(account.accountId);
              return (
                <tr key={account.accountId} className={`border-b border-slate-100 ${calculation?.hasDateError ? 'bg-rose-50' : ''}`}>
                  <td className="px-3 py-2">
                    <input className="input min-w-36" value={account.accountName} onChange={(event) => updateAccount(index, 'accountName', event.target.value)} />
                    <div className="mt-1 text-xs text-slate-400">{account.accountId}</div>
                  </td>
                  <td className="px-3 py-2">
                    <input className="input min-w-32" value={account.batchName} onChange={(event) => updateAccount(index, 'batchName', event.target.value)} />
                  </td>
                  <td className="px-3 py-2">
                    <select className="input min-w-24" value={account.accountType} onChange={(event) => updateAccount(index, 'accountType', event.target.value as AccountType)}>
                      {accountTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input className="input min-w-36" type="date" value={account.startDate} onChange={(event) => updateAccount(index, 'startDate', event.target.value)} />
                  </td>
                  <td className="px-3 py-2">
                    <input className="input min-w-36" type="date" value={account.endDate} onChange={(event) => updateAccount(index, 'endDate', event.target.value)} />
                    {calculation?.hasDateError && <div className="mt-1 text-xs text-rose-600">结束日期早于开始日期</div>}
                  </td>
                  <td className="px-3 py-2">{formatNumber(calculation?.activeDays ?? 0)}</td>
                  <td className="px-3 py-2">{formatNumber(calculation?.activeMonths ?? 0, 2)}</td>
                  <td className="px-3 py-2">
                    <input className="input min-w-28" type="number" step="0.01" value={account.accountCostCny} onChange={(event) => updateAccount(index, 'accountCostCny', toNumber(event.target.value))} />
                    <div className="mt-1 text-xs text-slate-500">计入：{formatCurrency(calculation?.accountCostCny)}</div>
                  </td>
                  <td className="px-3 py-2">
                    <select className="input min-w-36" value={account.assignedModel} onChange={(event) => updateAccount(index, 'assignedModel', event.target.value as AssignedAccountModel)}>
                      {assignedModels.map((model) => (
                        <option key={model} value={model}>
                          {ACCOUNT_MODEL_LABELS[model]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input className="input min-w-32" type="number" step="1" value={account.usedInputTokens} onChange={(event) => updateAccount(index, 'usedInputTokens', toNumber(event.target.value))} />
                  </td>
                  <td className="px-3 py-2">
                    <input className="input min-w-32" type="number" step="1" value={account.usedCachedInputTokens} onChange={(event) => updateAccount(index, 'usedCachedInputTokens', toNumber(event.target.value))} />
                  </td>
                  <td className="px-3 py-2">
                    <input className="input min-w-32" type="number" step="1" value={account.usedOutputTokens} onChange={(event) => updateAccount(index, 'usedOutputTokens', toNumber(event.target.value))} />
                  </td>
                  <td className="px-3 py-2">{formatNumber(calculation?.totalTokens)}</td>
                  <td className="px-3 py-2">
                    <input
                      className="input min-w-32"
                      type="number"
                      step="0.01"
                      placeholder={formatNumber(calculation?.estimatedCodexCredits, 2)}
                      value={account.usedCodexCredits ?? ''}
                      onChange={(event) => updateAccount(index, 'usedCodexCredits', event.target.value === '' ? null : toNumber(event.target.value))}
                    />
                    <div className="mt-1 text-xs text-slate-500">显示：{formatNumber(calculation?.codexCreditsUsed, 2)}</div>
                  </td>
                  <td className="px-3 py-2">{formatCurrency(calculation?.standardCostCny)}</td>
                  <td className="px-3 py-2">{formatPercent(calculation?.utilizationRate)}</td>
                  <td className={`px-3 py-2 font-semibold ${(calculation?.profitEstimateCny ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {formatCurrency(calculation?.profitEstimateCny)}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button className="btn btn-secondary h-9 w-9 p-0" type="button" title="复制账号" onClick={() => copyAccount(index)}>
                        <Copy className="h-4 w-4" />
                      </button>
                      <button className="btn btn-secondary h-9 w-9 p-0 text-rose-700" type="button" title="删除账号" onClick={() => deleteAccount(index)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
