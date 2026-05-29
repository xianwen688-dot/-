import Dexie, { type Table } from 'dexie';
import { defaultWatchlist } from './symbols';
import type { AlertRule, KlinePoint, MarketQuote, ResearchFeedback, WatchAsset } from './types';

export interface CachedQuote {
  symbol: string;
  quote: MarketQuote;
  updatedAt: string;
}

export interface CachedKline {
  key: string;
  symbol: string;
  period: string;
  points: KlinePoint[];
  updatedAt: string;
}

export interface LocalSetting {
  key: string;
  value: unknown;
  updatedAt: string;
}

class DoubingDatabase extends Dexie {
  watchlist!: Table<WatchAsset, string>;
  quotes!: Table<CachedQuote, string>;
  klines!: Table<CachedKline, string>;
  alerts!: Table<AlertRule, number>;
  feedback!: Table<ResearchFeedback, number>;
  settings!: Table<LocalSetting, string>;

  constructor() {
    super('doubing-investment-studio');
    this.version(1).stores({
      watchlist: '&symbol, market, kind, pinned, createdAt',
      quotes: '&symbol, updatedAt',
      klines: '&key, symbol, period, updatedAt',
      alerts: '++id, symbol, enabled, metric, createdAt',
      feedback: '++id, symbol, modelVersion, rating, createdAt',
      settings: '&key, updatedAt'
    });
  }
}

export const db = new DoubingDatabase();

export async function seedDefaults() {
  const count = await db.watchlist.count();
  if (count === 0) {
    await db.watchlist.bulkPut(defaultWatchlist);
  }
}

export async function cacheQuotes(quotes: MarketQuote[]) {
  const updatedAt = new Date().toISOString();
  await db.quotes.bulkPut(quotes.map((quote) => ({ symbol: quote.symbol, quote, updatedAt })));
}

export async function cacheKline(symbol: string, period: string, points: KlinePoint[]) {
  const key = `${symbol}:${period}`;
  await db.klines.put({ key, symbol, period, points, updatedAt: new Date().toISOString() });
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await db.settings.get(key);
  return (row?.value as T | undefined) ?? fallback;
}

export async function putSetting(key: string, value: unknown) {
  await db.settings.put({ key, value, updatedAt: new Date().toISOString() });
}
