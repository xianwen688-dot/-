export function toneClass(value: number | null | undefined) {
  if (value == null || value === 0) return 'flat';
  return value > 0 ? 'up' : 'down';
}

export function formatPct(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return '--';
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export function formatCurrency(value: number | null | undefined, currency: 'CNY' | 'USD' = 'CNY') {
  if (value == null || !Number.isFinite(value)) return '--';
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
    maximumFractionDigits: value > 100 ? 2 : 3
  }).format(value);
}

export function formatNumber(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return '--';
  const abs = Math.abs(value);
  if (abs >= 100_000_000) return `${(value / 100_000_000).toFixed(2)}亿`;
  if (abs >= 10_000) return `${(value / 10_000).toFixed(2)}万`;
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(value);
}
