import type { AssetKind, WatchAsset } from './types';

export const defaultWatchlist: WatchAsset[] = [
  { symbol: '600519', name: '贵州茅台', kind: 'cn-stock', market: 'CN', pinned: true, createdAt: '2026-05-29T00:00:00.000Z' },
  { symbol: '300750', name: '宁德时代', kind: 'cn-stock', market: 'CN', pinned: true, createdAt: '2026-05-29T00:00:00.000Z' },
  { symbol: '000858', name: '五粮液', kind: 'cn-stock', market: 'CN', pinned: false, createdAt: '2026-05-29T00:00:00.000Z' },
  { symbol: '510300', name: '沪深300ETF', kind: 'cn-etf', market: 'CN', pinned: true, createdAt: '2026-05-29T00:00:00.000Z' },
  { symbol: '159915', name: '创业板ETF', kind: 'cn-etf', market: 'CN', pinned: true, createdAt: '2026-05-29T00:00:00.000Z' },
  { symbol: '588000', name: '科创50ETF', kind: 'cn-etf', market: 'CN', pinned: false, createdAt: '2026-05-29T00:00:00.000Z' },
  { symbol: 'SPY', name: 'SPDR标普500ETF', kind: 'us-etf', market: 'US', pinned: true, createdAt: '2026-05-29T00:00:00.000Z' },
  { symbol: 'QQQ', name: '纳斯达克100ETF', kind: 'us-etf', market: 'US', pinned: true, createdAt: '2026-05-29T00:00:00.000Z' },
  { symbol: 'VTI', name: 'Vanguard全市场ETF', kind: 'us-etf', market: 'US', pinned: true, createdAt: '2026-05-29T00:00:00.000Z' }
];

export function compactSymbol(symbol: string): string {
  return symbol.trim().replace(/\s+/g, '').toUpperCase().replace(/^(SH|SZ|BJ)/, '');
}

export function inferKind(symbol: string, name = ''): AssetKind {
  const clean = compactSymbol(symbol);
  if (/^[A-Z]{1,6}$/.test(clean)) return 'us-etf';
  if (/^(5|1)\d{5}$/.test(clean) || /ETF/i.test(name)) return 'cn-etf';
  if (/^\d{6}$/.test(clean)) return 'cn-stock';
  return 'unknown';
}

export function normalizeCnForEastmoney(symbol: string): string {
  const clean = compactSymbol(symbol);
  if (/^(SH|SZ|BJ)/i.test(symbol)) return symbol.toLowerCase();
  if (/^(6|5)\d{5}$/.test(clean)) return `sh${clean}`;
  if (/^(0|1|2|3)\d{5}$/.test(clean)) return `sz${clean}`;
  if (/^(4|8)\d{5}$/.test(clean)) return `bj${clean}`;
  return clean;
}

export function isUsSymbol(symbol: string): boolean {
  return /^[A-Z]{1,6}$/.test(compactSymbol(symbol));
}

export function displaySymbol(symbol: string): string {
  return compactSymbol(symbol);
}
