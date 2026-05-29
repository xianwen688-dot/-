import { compactSymbol, normalizeCnForEastmoney } from '$lib/symbols';
import type { KlinePoint, MoneyFlowItem, RankedAsset, SectorItem } from '$lib/types';
import { parseNumber } from './parse';
import { fetchJson } from './http';

const CLIST_URL = 'https://push2.eastmoney.com/api/qt/clist/get';
const KLINE_URL = 'https://push2his.eastmoney.com/api/qt/stock/kline/get';
const CLIST_UT = 'bd1d9ddb04089700cf9c27f6f7426281';
const KLINE_UT = 'b2884a393a59ad64002292a3e90d46a5';
const A_MARKET = 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23,m:0+t:81+s:2048';

const markets: Record<string, string> = {
  'hs-a': A_MARKET,
  'sh-a': 'm:1+t:2,m:1+t:23',
  'sz-a': 'm:0+t:6,m:0+t:80',
  'bj-a': 'm:0+t:81+s:2048',
  cyb: 'm:0+t:80',
  kcb: 'm:1+t:23'
};

const rankSorts: Record<string, { fid: string; order: 'asc' | 'desc' }> = {
  change: { fid: 'f3', order: 'desc' },
  drop: { fid: 'f3', order: 'asc' },
  turnover: { fid: 'f6', order: 'desc' },
  volume: { fid: 'f5', order: 'desc' },
  amplitude: { fid: 'f7', order: 'desc' },
  rate: { fid: 'f8', order: 'desc' }
};

const sectorTypes: Record<string, string> = {
  industry: 'm:90+t:2',
  concept: 'm:90+t:3',
  region: 'm:90+t:1'
};

const sectorSorts: Record<string, { fid: string; order: 'asc' | 'desc' }> = {
  change: { fid: 'f3', order: 'desc' },
  drop: { fid: 'f3', order: 'asc' },
  'money-flow': { fid: 'f62', order: 'desc' },
  'out-flow': { fid: 'f62', order: 'asc' },
  turnover: { fid: 'f6', order: 'desc' }
};

const moneyFlowRanges: Record<string, { fid: string; net: string; netPct: string }> = {
  today: { fid: 'f62', net: 'f62', netPct: 'f184' },
  '5d': { fid: 'f164', net: 'f164', netPct: 'f165' },
  '10d': { fid: 'f174', net: 'f174', netPct: 'f175' }
};

const periods: Record<string, string> = {
  day: '101',
  daily: '101',
  week: '102',
  month: '103',
  '1m': '1',
  '5m': '5',
  '15m': '15',
  '30m': '30',
  '60m': '60'
};

export async function fetchRankDirect(market: string, sortKey: string, limitValue: string): Promise<RankedAsset[]> {
  const limit = clampLimit(limitValue, 30, 100);
  const sort = rankSorts[sortKey] ?? rankSorts.change;
  const payload = await fetchJson(
    buildUrl(CLIST_URL, {
      pn: '1',
      pz: String(limit),
      po: sort.order === 'desc' ? '1' : '0',
      np: '1',
      fltt: '2',
      invt: '2',
      fid: sort.fid,
      fs: markets[market] ?? markets['hs-a'],
      fields: 'f2,f3,f4,f5,f6,f7,f8,f9,f10,f12,f13,f14,f15,f16,f17,f18,f20,f21,f23',
      ut: CLIST_UT
    })
  );
  return getDiff(payload).map((item, index) => normalizeRanked(item, index));
}

export async function fetchEtfRankDirect(limitValue: string): Promise<RankedAsset[]> {
  const limit = clampLimit(limitValue, 20, 100);
  const payload = await fetchJson(
    buildUrl(CLIST_URL, {
      pn: '1',
      pz: String(limit),
      po: '1',
      np: '1',
      fltt: '2',
      invt: '2',
      fid: 'f6',
      fs: 'b:MK0021',
      fields: 'f12,f14,f2,f3,f4,f5,f6,f8',
      ut: CLIST_UT
    })
  );
  return getDiff(payload).map((item, index) => normalizeRanked(item, index));
}

export async function fetchSectorsDirect(type: string, sortKey: string, limitValue: string): Promise<SectorItem[]> {
  const limit = clampLimit(limitValue, 20, 100);
  const sort = sectorSorts[sortKey] ?? sectorSorts.change;
  const payload = await fetchJson(
    buildUrl(CLIST_URL, {
      pn: '1',
      pz: String(limit),
      po: sort.order === 'desc' ? '1' : '0',
      np: '1',
      fltt: '2',
      invt: '2',
      fid: sort.fid,
      fs: sectorTypes[type] ?? sectorTypes.industry,
      fields: 'f12,f14,f2,f3,f62,f104,f105,f128,f136,f140,f141',
      ut: KLINE_UT
    })
  );
  return getDiff(payload).map((item, index) => ({
    rank: index + 1,
    code: String(item.f12 ?? ''),
    name: String(item.f14 ?? ''),
    price: parseNumber(item.f2),
    changePercent: parseNumber(item.f3),
    mainNet: parseNumber(item.f62),
    leadStock: item.f128 == null ? undefined : String(item.f128),
    leadChangePercent: parseNumber(item.f136),
    upCount: parseNumber(item.f104),
    downCount: parseNumber(item.f105)
  }));
}

export async function fetchMoneyFlowDirect(rangeKey: string, order: string, limitValue: string): Promise<MoneyFlowItem[]> {
  const limit = clampLimit(limitValue, 20, 100);
  const range = moneyFlowRanges[rangeKey] ?? moneyFlowRanges.today;
  const payload = await fetchJson(
    buildUrl(CLIST_URL, {
      pn: '1',
      pz: String(limit),
      po: order === 'asc' ? '0' : '1',
      np: '1',
      fltt: '2',
      invt: '2',
      fid: range.fid,
      fs: A_MARKET,
      fields: `f12,f14,f2,f3,${range.net},${range.netPct}`,
      ut: KLINE_UT
    })
  );
  return getDiff(payload).map((item, index) => {
    const code = String(item.f12 ?? '');
    return {
      rank: index + 1,
      code,
      symbol: compactSymbol(code),
      name: String(item.f14 ?? ''),
      price: parseNumber(item.f2),
      changePercent: parseNumber(item.f3),
      mainNet: parseNumber(item[range.net]),
      mainNetRatio: parseNumber(item[range.netPct])
    };
  });
}

export async function fetchEastmoneyKlineDirect(symbol: string, period: string, limitValue: number): Promise<KlinePoint[]> {
  const limit = Math.max(20, Math.min(limitValue, 520));
  const payload = await fetchJson(
    buildUrl(KLINE_URL, {
      secid: eastmoneySecid(symbol),
      klt: periods[period] ?? periods.day,
      fqt: '1',
      lmt: String(limit),
      end: '20500101',
      fields1: 'f1,f2,f3,f4,f5,f6',
      fields2: 'f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61',
      ut: KLINE_UT
    })
  );
  const klines = (payload as { data?: { klines?: string[] } })?.data?.klines ?? [];
  return klines.slice(-limitValue).map((line) => {
    const [time, open, close, high, low, volume, turnover, , changePercent] = String(line).split(',');
    return {
      time,
      open: parseNumber(open) ?? 0,
      close: parseNumber(close) ?? 0,
      high: parseNumber(high) ?? 0,
      low: parseNumber(low) ?? 0,
      volume: parseNumber(volume),
      turnover: parseNumber(turnover),
      changePercent: parseNumber(changePercent)
    };
  });
}

function normalizeRanked(item: Record<string, unknown>, index: number): RankedAsset {
  const code = String(item.f12 ?? item.code ?? '');
  return {
    rank: index + 1,
    code,
    symbol: compactSymbol(code),
    name: String(item.f14 ?? item.name ?? ''),
    price: parseNumber(item.f2 ?? item.price),
    changePercent: parseNumber(item.f3 ?? item.changePercent),
    turnover: parseNumber(item.f6 ?? item.turnover),
    volume: parseNumber(item.f5 ?? item.volume),
    turnoverRate: parseNumber(item.f8 ?? item.turnoverRate),
    peDynamic: parseNumber(item.f9 ?? item.peDynamic),
    marketCap: parseNumber(item.f20 ?? item.marketCap)
  };
}

function getDiff(payload: unknown): Record<string, unknown>[] {
  const diff = (payload as { data?: { diff?: unknown } })?.data?.diff;
  return Array.isArray(diff) ? (diff as Record<string, unknown>[]) : [];
}

function buildUrl(base: string, params: Record<string, string>) {
  const url = new URL(base);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
}

function clampLimit(value: string, fallback: number, max: number) {
  const parsed = Number(value);
  return Math.max(1, Math.min(Number.isFinite(parsed) ? parsed : fallback, max));
}

function eastmoneySecid(symbol: string) {
  const normalized = normalizeCnForEastmoney(symbol).toLowerCase();
  const code = compactSymbol(normalized);
  if (normalized.startsWith('sh') || /^(6|5)\d{5}$/.test(code)) return `1.${code}`;
  return `0.${code}`;
}
