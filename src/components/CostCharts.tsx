import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { CalculationResult } from '../types';

interface Props {
  result: CalculationResult;
}

const COLORS = ['#0f766e', '#2563eb', '#f59e0b', '#dc2626', '#7c3aed'];

const moneyTooltip = (value: unknown) => `CNY ${Number(value || 0).toFixed(2)}`;

export default function CostCharts({ result }: Props) {
  const costData = [
    { name: '模型标准消耗', value: result.standardCostComponentCny },
    { name: '账号成本', value: result.accountCostComponentCny },
    { name: '服务器/固定成本', value: result.fixedCostCny },
    { name: '手续费', value: result.paymentFeeCny },
    { name: '安全冗余成本', value: result.riskBufferCostCny },
  ].filter((item) => item.value > 0);

  const modelBarData = result.models.map((model) => ({
    name: model.name,
    标准消耗: Number(model.standardCostCny.toFixed(2)),
    用户侧消费: Number(model.saleAmountCny.toFixed(2)),
  }));

  const profitData = [
    { name: '总消费', value: Number(result.saleAmountCny.toFixed(2)) },
    { name: '总成本', value: Number(result.totalCostCny.toFixed(2)) },
    { name: '毛利润', value: Number(result.grossProfitCny.toFixed(2)) },
  ];

  return (
    <section className="panel p-4">
      <h2 className="panel-title mb-4">可视化</h2>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="h-72 rounded-lg border border-slate-200 p-3">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">成本构成</h3>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie data={costData} dataKey="value" nameKey="name" outerRadius={82} label>
                {costData.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={moneyTooltip} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="h-72 rounded-lg border border-slate-200 p-3">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">模型消费</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={modelBarData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={moneyTooltip} />
              <Legend />
              <Bar dataKey="标准消耗" fill="#2563eb" />
              <Bar dataKey="用户侧消费" fill="#0f766e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="h-72 rounded-lg border border-slate-200 p-3">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">利润概览</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={profitData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={moneyTooltip} />
              <Bar dataKey="value" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
