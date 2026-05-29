import { cacheKline, cacheQuotes, db } from './db';
import type {
  ApiEnvelope,
  KlinePoint,
  MarketIndex,
  MarketQuote,
  MoneyFlowItem,
  NewsItem,
  RankedAsset,
  SectorItem
} from './types';

async function fetchEnvelope<T>(url: string): Promise<ApiEnvelope<T>> {
  const response = await fetch(url);
  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || !payload.ok) {
    throw new Error(payload.error ?? `Request failed: ${url}`);
  }
  return payload;
}

export async function getIndices() {
  return (await fetchEnvelope<MarketIndex[]>('/api/market/indices')).data;
}

export async function getQuotes(symbols: string[]) {
  const filtered = symbols.map((symbol) => symbol.trim()).filter(Boolean);
  if (filtered.length === 0) return [];
  const data = (await fetchEnvelope<MarketQuote[]>(`/api/quotes?symbols=${encodeURIComponent(filtered.join(','))}`)).data;
  await cacheQuotes(data);
  return data;
}

export async function getKline(symbol: string, period = 'day', limit = 120) {
  const data = (
    await fetchEnvelope<KlinePoint[]>(
      `/api/kline/${encodeURIComponent(symbol)}?period=${encodeURIComponent(period)}&limit=${limit}`
    )
  ).data;
  await cacheKline(symbol.toUpperCase(), period, data);
  return data;
}

export async function getEtfRank() {
  return (await fetchEnvelope<RankedAsset[]>('/api/etf?limit=12')).data;
}

export async function getSectors() {
  return (await fetchEnvelope<SectorItem[]>('/api/sectors?type=industry&sort=change&limit=12')).data;
}

export async function getMoneyFlow() {
  return (await fetchEnvelope<MoneyFlowItem[]>('/api/money-flow?range=today&order=desc&limit=12')).data;
}

export async function getNews() {
  return (await fetchEnvelope<NewsItem[]>('/api/news?limit=16')).data;
}

export async function getRank(sort = 'change') {
  return (await fetchEnvelope<RankedAsset[]>(`/api/rank?market=hs-a&sort=${sort}&limit=30`)).data;
}

export async function latestCachedQuotes() {
  return (await db.quotes.toArray()).map((row) => row.quote);
}
