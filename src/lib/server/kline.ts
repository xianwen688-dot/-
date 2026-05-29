import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { compactSymbol, isUsSymbol, normalizeCnForEastmoney } from '$lib/symbols';
import type { KlinePoint, ProviderMeta } from '$lib/types';
import { fetchEastmoneyKlineDirect } from './eastmoney';
import { parseNumber } from './parse';

const execFileAsync = promisify(execFile);

export async function fetchKline(symbol: string, period: string, limit: number) {
  if (isUsSymbol(symbol)) return fetchYahooKline(symbol, limit);
  return fetchEastmoneyKline(symbol, period, limit);
}

export async function fetchEastmoneyKline(symbol: string, period: string, limit: number) {
  try {
    const points = await fetchEastmoneyKlineDirect(symbol, period, limit);
    if (points.length) {
      return {
        points,
        meta: {
          provider: 'eastmoney',
          source: 'Eastmoney kline API',
          fetchedAt: new Date().toISOString()
        } satisfies ProviderMeta
      };
    }
  } catch {
    // Fall through to Yahoo suffix fallback for local research continuity.
  }

  const fallbackSymbol = yahooCnSymbol(symbol);
  const fallback = await fetchYahooKline(fallbackSymbol, limit);
  return {
    points: fallback.points,
    meta: {
      ...fallback.meta,
      source: `Yahoo Finance chart API fallback for ${normalizeCnForEastmoney(symbol)}`
    } satisfies ProviderMeta
  };
}

export async function fetchYahooKline(symbol: string, limit: number) {
  const clean = compactSymbol(symbol);
  const range = limit > 260 ? '2y' : limit > 120 ? '1y' : limit > 60 ? '6mo' : '3mo';
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${clean}?range=${range}&interval=1d`;
  const payload = await fetchYahooPayload(url);
  const result = payload?.chart?.result?.[0];
  const timestamps: number[] = result?.timestamp ?? [];
  const quote = result?.indicators?.quote?.[0] ?? {};
  const points: KlinePoint[] = timestamps.map((timestamp, index) => ({
    time: new Date(timestamp * 1000).toISOString().slice(0, 10),
    open: Number(quote.open?.[index] ?? 0),
    close: Number(quote.close?.[index] ?? 0),
    high: Number(quote.high?.[index] ?? 0),
    low: Number(quote.low?.[index] ?? 0),
    volume: parseNumber(quote.volume?.[index])
  }));

  return {
    points: points.filter((point) => point.open && point.close && point.high && point.low).slice(-limit),
    meta: {
      provider: 'yahoo',
      source: 'Yahoo Finance chart API',
      fetchedAt: new Date().toISOString()
    } satisfies ProviderMeta
  };
}

async function fetchYahooPayload(url: string) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 DoubingInvestmentStudio/0.1',
      Accept: 'application/json,text/plain,*/*',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  });
  if (response.ok) return response.json();

  if (process.platform === 'win32') {
    const safeUrl = url.replace(/'/g, "''");
    const command = `$ProgressPreference="SilentlyContinue"; Invoke-RestMethod -Uri '${safeUrl}' | ConvertTo-Json -Depth 50`;
    const { stdout } = await execFileAsync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command], {
      timeout: 20_000,
      maxBuffer: 1024 * 1024 * 8,
      windowsHide: true
    });
    return JSON.parse(stdout);
  }

  throw new Error(`Yahoo chart failed: ${response.status}`);
}

function yahooCnSymbol(symbol: string) {
  const normalized = normalizeCnForEastmoney(symbol).toLowerCase();
  const code = compactSymbol(normalized);
  if (normalized.startsWith('sh') || /^(6|5)\d{5}$/.test(code)) return `${code}.SS`;
  if (normalized.startsWith('bj') || /^(4|8)\d{5}$/.test(code)) return `${code}.BJ`;
  return `${code}.SZ`;
}
