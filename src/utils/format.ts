export const formatCurrency = (value: number | null | undefined, currency = 'CNY'): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-';
  return `${currency} ${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatNumber = (value: number | null | undefined, digits = 0): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-';
  return value.toLocaleString('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits });
};

export const formatPercent = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-';
  return `${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
};

export const formatMultiplier = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-';
  return `${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}x`;
};
