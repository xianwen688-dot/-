export type AssetKind = 'cn-stock' | 'cn-etf' | 'us-etf' | 'index' | 'unknown';

export type ProviderName = 'eastmoney' | 'sinafinance' | 'yahoo' | 'ifind';

export interface ProviderMeta {
  provider: ProviderName;
  source: string;
  fetchedAt: string;
  stale?: boolean;
  warning?: string;
}

export interface MarketQuote {
  symbol: string;
  code: string;
  name: string;
  kind: AssetKind;
  market: string;
  currency: 'CNY' | 'USD';
  price: number | null;
  change: number | null;
  changePercent: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  prevClose: number | null;
  volume: number | null;
  turnover: number | null;
  turnoverRate: number | null;
  amplitude: number | null;
  peDynamic: number | null;
  priceBook: number | null;
  marketCap: number | null;
  meta: ProviderMeta;
}

export interface KlinePoint {
  time: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume?: number | null;
  turnover?: number | null;
  changePercent?: number | null;
}

export interface MarketIndex {
  code: string;
  name: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  meta: ProviderMeta;
}

export interface RankedAsset {
  rank: number;
  code: string;
  symbol: string;
  name: string;
  price: number | null;
  changePercent: number | null;
  turnover: number | null;
  volume: number | null;
  turnoverRate: number | null;
  peDynamic?: number | null;
  marketCap?: number | null;
}

export interface SectorItem {
  rank: number;
  code: string;
  name: string;
  price: number | null;
  changePercent: number | null;
  mainNet: number | null;
  leadStock?: string;
  leadChangePercent?: number | null;
  upCount?: number | null;
  downCount?: number | null;
}

export interface MoneyFlowItem {
  rank: number;
  code: string;
  symbol: string;
  name: string;
  price: number | null;
  changePercent: number | null;
  mainNet: number | null;
  mainNetRatio: number | null;
}

export interface NewsItem {
  id: string;
  time: string;
  title: string;
  summary: string;
  stocks?: string;
  meta: ProviderMeta;
}

export interface WatchAsset {
  symbol: string;
  name: string;
  kind: AssetKind;
  market: 'CN' | 'US';
  pinned?: boolean;
  createdAt: string;
}

export interface AlertRule {
  id?: number;
  symbol: string;
  label: string;
  metric: 'price' | 'changePercent' | 'turnover';
  direction: 'above' | 'below';
  threshold: number;
  enabled: boolean;
  lastTriggeredAt?: string;
  createdAt: string;
}

export interface ResearchFeedback {
  id?: number;
  symbol: string;
  modelVersion: string;
  rating: 'biased' | 'verified' | 'review';
  note: string;
  createdAt: string;
}

export interface ModelSignal {
  label: string;
  value: number;
  contribution: number;
  note: string;
}

export interface ModelResult {
  symbol: string;
  modelVersion: string;
  horizon: 'short' | 'long';
  score: number;
  confidence: number;
  stance: 'observe' | 'track' | 'risk';
  summary: string;
  signals: ModelSignal[];
  selfChecks: string[];
  generatedAt: string;
}

export interface ApiEnvelope<T> {
  ok: boolean;
  data: T;
  meta: ProviderMeta;
  error?: string;
}
