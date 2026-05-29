import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { compactSymbol, inferKind, isUsSymbol, normalizeCnForEastmoney } from '$lib/symbols';
import type { MarketIndex, MarketQuote, MoneyFlowItem, NewsItem, RankedAsset, SectorItem } from '$lib/types';
import { fetchEtfRankDirect, fetchMoneyFlowDirect, fetchRankDirect, fetchSectorsDirect } from './eastmoney';
import { extractJson, parseNumber } from './parse';

const execFileAsync = promisify(execFile);

function openCliCommand() {
  if (process.platform === 'win32') {
    const appData = process.env.APPDATA;
    if (!appData) throw new Error('APPDATA is not set; cannot locate OpenCLI on Windows.');
    return {
      command: process.execPath,
      baseArgs: [`${appData}\\npm\\node_modules\\@jackwener\\opencli\\dist\\src\\main.js`]
    };
  }
  return { command: 'opencli', baseArgs: [] };
}

export async function runOpenCli(args: string[]) {
  const { command, baseArgs } = openCliCommand();
  const { stdout, stderr } = await execFileAsync(command, [...baseArgs, ...args], {
    timeout: 25_000,
    maxBuffer: 1024 * 1024 * 8,
    windowsHide: true
  });
  if (stderr && /error|exception|failed/i.test(stderr)) {
    throw new Error(stderr.trim());
  }
  return extractJson(stdout);
}

function meta(provider: 'eastmoney' | 'sinafinance') {
  return {
    provider,
    source: provider === 'eastmoney' ? 'opencli eastmoney' : 'opencli sinafinance',
    fetchedAt: new Date().toISOString()
  };
}

export async function fetchCnQuotes(symbols: string[]): Promise<MarketQuote[]> {
  const normalized = symbols.map(normalizeCnForEastmoney).join(',');
  if (!normalized) return [];
  const payload = (await runOpenCli(['eastmoney', 'quote', normalized, '-f', 'json'])) as Record<string, unknown>[];
  return payload.map((item) => normalizeEastmoneyQuote(item));
}

export async function fetchUsQuote(symbol: string): Promise<MarketQuote> {
  const clean = compactSymbol(symbol);
  const payload = (await runOpenCli(['sinafinance', 'stock', clean, '--market', 'us', '-f', 'json'])) as Record<string, unknown>[];
  const item = payload[0] ?? {};
  return normalizeSinaUsQuote(clean, item);
}

export async function fetchQuotes(symbols: string[]) {
  const cn = symbols.filter((symbol) => !isUsSymbol(symbol));
  const us = symbols.filter(isUsSymbol);
  const cnQuotes = await fetchCnQuotes(cn);
  const usQuotes = await Promise.all(us.map((symbol) => fetchUsQuote(symbol)));
  return [...cnQuotes, ...usQuotes];
}

export async function fetchIndices(): Promise<MarketIndex[]> {
  const payload = (await runOpenCli(['eastmoney', 'index-board', '--group', 'main', '-f', 'json'])) as Record<string, unknown>[];
  return payload.map((item) => ({
    code: String(item.code ?? ''),
    name: String(item.name ?? ''),
    price: parseNumber(item.price),
    change: parseNumber(item.change),
    changePercent: parseNumber(item.changePercent),
    meta: meta('eastmoney')
  }));
}

export async function fetchRank(market: string, sort: string, limit: string): Promise<RankedAsset[]> {
  return fetchRankDirect(market, sort, limit);
}

export async function fetchEtfRank(limit: string): Promise<RankedAsset[]> {
  return fetchEtfRankDirect(limit);
}

export async function fetchSectors(type: string, sort: string, limit: string): Promise<SectorItem[]> {
  return fetchSectorsDirect(type, sort, limit);
}

export async function fetchMoneyFlow(range: string, order: string, limit: string): Promise<MoneyFlowItem[]> {
  return fetchMoneyFlowDirect(range, order, limit);
}

export async function fetchNews(limit: string): Promise<NewsItem[]> {
  const payload = (await runOpenCli(['eastmoney', 'kuaixun', '--limit', limit, '-f', 'json'])) as Record<string, unknown>[];
  return payload.map((item, index) => ({
    id: `${item.time ?? index}-${item.title ?? index}`,
    time: String(item.time ?? ''),
    title: String(item.title ?? ''),
    summary: String(item.summary ?? ''),
    stocks: item.stocks == null ? undefined : String(item.stocks),
    meta: meta('eastmoney')
  }));
}

function normalizeEastmoneyQuote(item: Record<string, unknown>): MarketQuote {
  const code = String(item.code ?? '');
  const name = String(item.name ?? '');
  const market = String(item.market ?? 'CN');
  return {
    symbol: compactSymbol(code),
    code,
    name,
    kind: inferKind(code, name),
    market,
    currency: 'CNY',
    price: parseNumber(item.price),
    change: parseNumber(item.change),
    changePercent: parseNumber(item.changePercent),
    open: parseNumber(item.open),
    high: parseNumber(item.high),
    low: parseNumber(item.low),
    prevClose: parseNumber(item.prevClose),
    volume: parseNumber(item.volume),
    turnover: parseNumber(item.turnover),
    turnoverRate: parseNumber(item.turnoverRate),
    amplitude: parseNumber(item.amplitude),
    peDynamic: parseNumber(item.peDynamic),
    priceBook: parseNumber(item.priceBook),
    marketCap: parseNumber(item.marketCap),
    meta: meta('eastmoney')
  };
}

function normalizeSinaUsQuote(symbol: string, item: Record<string, unknown>): MarketQuote {
  return {
    symbol,
    code: symbol,
    name: String(item.Name ?? symbol),
    kind: 'us-etf',
    market: 'US',
    currency: 'USD',
    price: parseNumber(item.Price),
    change: parseNumber(item.Change),
    changePercent: parseNumber(item.ChangePercent),
    open: parseNumber(item.Open),
    high: parseNumber(item.High),
    low: parseNumber(item.Low),
    prevClose: null,
    volume: parseNumber(item.Volume),
    turnover: null,
    turnoverRate: null,
    amplitude: null,
    peDynamic: null,
    priceBook: null,
    marketCap: parseNumber(item.MarketCap),
    meta: meta('sinafinance')
  };
}
