import { useEffect, useMemo, useState } from 'react';
import BasicSettings from './components/BasicSettings';
import ModelPriceSettings from './components/ModelPriceSettings';
import AccountCostSettings from './components/AccountCostSettings';
import AccountPeriodManager from './components/AccountPeriodManager';
import InfraCostSettings from './components/InfraCostSettings';
import UsageInput from './components/UsageInput';
import ResultCards from './components/ResultCards';
import CostCharts from './components/CostCharts';
import ModelDetailTable from './components/ModelDetailTable';
import ImportExportPanel from './components/ImportExportPanel';
import RiskAlerts from './components/RiskAlerts';
import { defaultConfig, STORAGE_KEY } from './constants/defaultConfig';
import type { AppConfig } from './types';
import { calculateAccountTotalCostCny, calculateAll, calculateFixedCostCny } from './utils/calculate';

const cloneDefaultConfig = (): AppConfig => JSON.parse(JSON.stringify(defaultConfig)) as AppConfig;

const mergeConfig = (config: Partial<AppConfig>): AppConfig => ({
  ...cloneDefaultConfig(),
  ...config,
  basic: {
    ...cloneDefaultConfig().basic,
    ...config.basic,
    saleMultipliers: {
      ...cloneDefaultConfig().basic.saleMultipliers,
      ...config.basic?.saleMultipliers,
    },
  },
  modelPrices: {
    ...cloneDefaultConfig().modelPrices,
    ...config.modelPrices,
    gpt55: { ...cloneDefaultConfig().modelPrices.gpt55, ...config.modelPrices?.gpt55 },
    gpt54: { ...cloneDefaultConfig().modelPrices.gpt54, ...config.modelPrices?.gpt54 },
  },
  accountCosts: { ...cloneDefaultConfig().accountCosts, ...config.accountCosts },
  accountPeriods: config.accountPeriods
    ? config.accountPeriods.map((account, index) => {
        const legacyAccount = account as typeof account & {
          accountCostCny?: number;
          monthlyFeeUsd?: number;
          rechargeUsd?: number;
        };
        const directCost = Number(legacyAccount.accountCostCny);
        const legacyMonthlyFee = Number(legacyAccount.monthlyFeeUsd);
        const legacyRecharge = Number(legacyAccount.rechargeUsd);
        const exchangeRate = Number(config.basic?.exchangeRate) || cloneDefaultConfig().basic.exchangeRate;
        const accountCostCny = Number.isFinite(directCost)
          ? directCost
          : ((Number.isFinite(legacyMonthlyFee) ? legacyMonthlyFee : 0) +
              (Number.isFinite(legacyRecharge) ? legacyRecharge : 0)) *
            exchangeRate;

        return {
          ...cloneDefaultConfig().accountPeriods[0],
          accountId: `account_${String(index + 1).padStart(2, '0')}`,
          accountName: '',
          ...account,
          accountCostCny,
        };
      })
    : cloneDefaultConfig().accountPeriods,
  infraCosts: { ...cloneDefaultConfig().infraCosts, ...config.infraCosts },
  usage: {
    ...cloneDefaultConfig().usage,
    ...config.usage,
    gpt55: { ...cloneDefaultConfig().usage.gpt55, ...config.usage?.gpt55 },
    gpt54: { ...cloneDefaultConfig().usage.gpt54, ...config.usage?.gpt54 },
  },
  costMode: { ...cloneDefaultConfig().costMode, ...config.costMode },
});

const loadConfig = (): AppConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? mergeConfig(JSON.parse(raw) as Partial<AppConfig>) : cloneDefaultConfig();
  } catch {
    return cloneDefaultConfig();
  }
};

export default function App() {
  const [config, setConfig] = useState<AppConfig>(loadConfig);
  const [saveHint, setSaveHint] = useState('已自动保存到本地');
  const result = useMemo(() => calculateAll(config), [config]);
  const accountTotalCostCny = useMemo(() => calculateAccountTotalCostCny(config), [config]);
  const fixedCostCny = useMemo(() => calculateFixedCostCny(config), [config]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    setSaveHint('已自动保存到本地');
  }, [config]);

  const saveConfig = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    setSaveHint(`已保存 ${new Date().toLocaleTimeString('zh-CN')}`);
  };

  const resetConfig = () => {
    setConfig(cloneDefaultConfig());
    setSaveHint('已重置为默认演示数据');
  };

  const importConfig = (incoming: AppConfig) => {
    setConfig(mergeConfig(incoming));
    setSaveHint('已导入配置');
  };

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-3 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">Token 利润计算器</h1>
            <p className="mt-2 max-w-4xl text-sm text-slate-600">
              用于内部核算 GPT-5.5 / GPT-5.4 调用成本、Plus/Codex 账号成本、服务器成本、总消费、实际消耗、标准消耗额度和利润情况。
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">{saveHint}</div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(680px,1.1fr)]">
          <div className="space-y-5">
            <BasicSettings
              basic={config.basic}
              costMode={config.costMode}
              onBasicChange={(basic) => setConfig((current) => ({ ...current, basic }))}
              onCostModeChange={(costMode) => setConfig((current) => ({ ...current, costMode }))}
            />
            <ModelPriceSettings
              prices={config.modelPrices}
              onChange={(modelPrices) => setConfig((current) => ({ ...current, modelPrices }))}
            />
            <AccountCostSettings
              accountCosts={config.accountCosts}
              accountTotalCostCny={accountTotalCostCny}
              onChange={(accountCosts) => setConfig((current) => ({ ...current, accountCosts }))}
            />
            <AccountPeriodManager
              accounts={config.accountPeriods}
              accountCosts={config.accountCosts}
              calculations={result.accountPeriodSummary.calculations}
              periodStart={result.accountPeriodSummary.periodStart}
              periodEnd={result.accountPeriodSummary.periodEnd}
              onAccountsChange={(accountPeriods) => setConfig((current) => ({ ...current, accountPeriods }))}
            />
            <InfraCostSettings
              infraCosts={config.infraCosts}
              fixedCostCny={fixedCostCny}
              onChange={(infraCosts) => setConfig((current) => ({ ...current, infraCosts }))}
            />
            <UsageInput usage={config.usage} onChange={(usage) => setConfig((current) => ({ ...current, usage }))} />
            <ImportExportPanel config={config} onImport={importConfig} onReset={resetConfig} onSave={saveConfig} />
          </div>

          <div className="space-y-5">
            <ResultCards result={result} />
            <RiskAlerts result={result} config={config} />
            <CostCharts result={result} />
            <ModelDetailTable result={result} />
          </div>
        </div>
      </div>
    </main>
  );
}
