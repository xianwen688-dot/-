import type { MarketQuote, ModelResult, ModelSignal } from './types';

const MODEL_VERSION = 'doubing-v0.1';

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function numberOrZero(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function contribution(label: string, value: number, weight: number, note: string): ModelSignal {
  return {
    label,
    value,
    contribution: Math.round(value * weight),
    note
  };
}

export function selfChecks(quote: MarketQuote): string[] {
  const checks: string[] = [];
  const fetched = Date.parse(quote.meta.fetchedAt);
  if (Number.isFinite(fetched) && Date.now() - fetched > 1000 * 60 * 8) {
    checks.push('数据时间超过 8 分钟，请刷新后再判断。');
  }
  if (quote.price == null || quote.price <= 0) checks.push('价格字段缺失或异常。');
  if (quote.changePercent == null) checks.push('涨跌幅字段缺失。');
  if (quote.kind !== 'us-etf' && quote.volume != null && quote.volume <= 0) checks.push('成交量为 0，可能处于停牌或数据源异常。');
  if (Math.abs(numberOrZero(quote.changePercent)) > 15) checks.push('涨跌幅较极端，请核对是否为复权、停牌恢复或数据跳变。');
  if (quote.meta.warning) checks.push(quote.meta.warning);
  return checks.length ? checks : ['自检未发现明显数据异常。'];
}

export function buildShortModel(quote: MarketQuote): ModelResult {
  const pct = numberOrZero(quote.changePercent);
  const turnoverRate = numberOrZero(quote.turnoverRate);
  const amplitude = numberOrZero(quote.amplitude);
  const turnover = numberOrZero(quote.turnover);

  const trend = clamp(50 + pct * 7);
  const liquidity = clamp(turnover > 1_000_000_000 ? 85 : turnover > 200_000_000 ? 68 : turnover > 30_000_000 ? 50 : 30);
  const activity = clamp(turnoverRate * 12 + amplitude * 6);
  const riskPenalty = clamp(Math.abs(pct) > 8 ? 25 : amplitude > 8 ? 15 : 5, 0, 30);

  const signals = [
    contribution('涨跌动量', trend, 0.34, '观察短线强弱，不等同于买卖信号。'),
    contribution('流动性', liquidity, 0.28, '成交额越高，短线可观察性越强。'),
    contribution('活跃度', activity, 0.22, '换手与振幅共同反映交易拥挤度。'),
    contribution('波动扣分', -riskPenalty, 0.16, '极端波动降低置信度。')
  ];
  const score = clamp(signals.reduce((sum, item) => sum + item.contribution, 0) + 22);
  const checks = selfChecks(quote);

  return {
    symbol: quote.symbol,
    modelVersion: MODEL_VERSION,
    horizon: 'short',
    score: Math.round(score),
    confidence: checks.length === 1 ? 76 : 58,
    stance: score >= 70 ? 'track' : score <= 40 ? 'risk' : 'observe',
    summary: score >= 70 ? '短线热度较高，适合放入观察队列。' : score <= 40 ? '短线信号偏弱，优先关注风险和流动性。' : '短线处于中性观察区间。',
    signals,
    selfChecks: checks,
    generatedAt: new Date().toISOString()
  };
}

export function buildLongModel(quote: MarketQuote): ModelResult {
  const pct = Math.abs(numberOrZero(quote.changePercent));
  const pe = numberOrZero(quote.peDynamic);
  const pb = numberOrZero(quote.priceBook);
  const marketCap = numberOrZero(quote.marketCap);

  const valuation = quote.kind.includes('etf') ? 62 : pe > 0 ? clamp(100 - Math.abs(pe - 22) * 2.4) : 42;
  const qualityProxy = pb > 0 ? clamp(78 - Math.abs(pb - 3) * 7) : quote.kind.includes('etf') ? 66 : 46;
  const scale = marketCap > 500_000_000_000 ? 78 : marketCap > 100_000_000_000 ? 66 : marketCap > 0 ? 52 : quote.kind === 'us-etf' ? 70 : 44;
  const stability = clamp(82 - pct * 6);

  const signals = [
    contribution('估值区间', valuation, 0.3, '用 PE/PB 或 ETF 属性做粗略估值观察。'),
    contribution('质量代理', qualityProxy, 0.24, '以 PB/ETF 宽基属性做简化质量代理。'),
    contribution('规模流动性', scale, 0.24, '规模越高，长期跟踪稳定性通常更好。'),
    contribution('当日稳定性', stability, 0.22, '当日波动越小，长期判断噪音越低。')
  ];
  const score = clamp(signals.reduce((sum, item) => sum + item.contribution, 0));
  const checks = selfChecks(quote);

  return {
    symbol: quote.symbol,
    modelVersion: MODEL_VERSION,
    horizon: 'long',
    score: Math.round(score),
    confidence: checks.length === 1 ? 70 : 54,
    stance: score >= 70 ? 'track' : score <= 42 ? 'risk' : 'observe',
    summary: score >= 70 ? '长期跟踪条件较好，可纳入研究池。' : score <= 42 ? '长期指标偏弱，建议先补充财务与行业信息。' : '长期信号中性，需要结合基本面继续验证。',
    signals,
    selfChecks: checks,
    generatedAt: new Date().toISOString()
  };
}
