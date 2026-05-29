<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import KlineChart from '$lib/components/KlineChart.svelte';
  import ResearchPanel from '$lib/components/ResearchPanel.svelte';
  import { getKline, getQuotes } from '$lib/api';
  import { db } from '$lib/db';
  import { formatCurrency, formatNumber, formatPct, toneClass } from '$lib/format';
  import { buildLongModel, buildShortModel } from '$lib/model';
  import type { AlertRule, KlinePoint, MarketQuote } from '$lib/types';

  let symbol = '';
  let quote: MarketQuote | undefined;
  let points: KlinePoint[] = [];
  let error = '';
  let threshold = '';
  let metric: AlertRule['metric'] = 'price';
  let direction: AlertRule['direction'] = 'above';

  async function load() {
    symbol = ($page.params.symbol ?? '').toUpperCase();
    try {
      const [quotes, kline] = await Promise.all([getQuotes([symbol]), getKline(symbol)]);
      quote = quotes[0];
      points = kline;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      const cachedQuote = await db.quotes.get(symbol);
      const cachedKline = await db.klines.get(`${symbol}:day`);
      quote = cachedQuote?.quote;
      points = cachedKline?.points ?? [];
    }
  }

  async function addAlert() {
    if (!quote || !Number.isFinite(Number(threshold))) return;
    await db.alerts.add({
      symbol: quote.symbol,
      label: `${quote.name} ${metric} ${direction} ${threshold}`,
      metric,
      direction,
      threshold: Number(threshold),
      enabled: true,
      createdAt: new Date().toISOString()
    });
    threshold = '';
  }

  async function addFeedback(rating: 'biased' | 'verified' | 'review') {
    if (!quote) return;
    await db.feedback.add({
      symbol: quote.symbol,
      modelVersion: 'doubing-v0.1',
      rating,
      note: rating === 'biased' ? '用户标记模型可能有偏差' : rating === 'verified' ? '用户标记观察有效' : '用户要求后续复盘',
      createdAt: new Date().toISOString()
    });
  }

  onMount(load);
</script>

{#if quote}
  <header class="page-head">
    <div>
      <p class="eyebrow">{quote.market} · {quote.kind}</p>
      <h1>{quote.name} <span class="muted">{quote.symbol}</span></h1>
      <p class="muted">数据源：{quote.meta.source} · {new Date(quote.meta.fetchedAt).toLocaleString()}</p>
    </div>
    <div class="metric">
      <div class="label">最新价</div>
      <div class="value">{formatCurrency(quote.price, quote.currency)}</div>
      <div class={toneClass(quote.changePercent)}>{formatPct(quote.changePercent)}</div>
    </div>
  </header>

  {#if error}
    <p class="error">{error}。正在显示最近缓存。</p>
  {/if}

  <div class="metric-strip">
    <div class="metric"><div class="label">开盘</div><div class="value">{formatCurrency(quote.open, quote.currency)}</div></div>
    <div class="metric"><div class="label">最高</div><div class="value">{formatCurrency(quote.high, quote.currency)}</div></div>
    <div class="metric"><div class="label">最低</div><div class="value">{formatCurrency(quote.low, quote.currency)}</div></div>
    <div class="metric"><div class="label">成交额</div><div class="value">{formatNumber(quote.turnover)}</div></div>
    <div class="metric"><div class="label">动态 PE</div><div class="value">{formatNumber(quote.peDynamic)}</div></div>
    <div class="metric"><div class="label">PB</div><div class="value">{formatNumber(quote.priceBook)}</div></div>
  </div>

  <section class="panel" style="margin-top: 16px;">
    <div class="panel-head">
      <h2>K 线</h2>
      <span class="muted">{points.length} 根</span>
    </div>
    <KlineChart {points} />
  </section>

  <div class="grid cols-2" style="margin-top: 16px;">
    <ResearchPanel result={buildShortModel(quote)} />
    <ResearchPanel result={buildLongModel(quote)} />
  </div>

  <section class="panel" style="margin-top: 16px;">
    <div class="panel-head">
      <h2>提醒与反馈</h2>
    </div>
    <div class="toolbar">
      <select bind:value={metric}>
        <option value="price">价格</option>
        <option value="changePercent">涨跌幅</option>
        <option value="turnover">成交额</option>
      </select>
      <select bind:value={direction}>
        <option value="above">高于</option>
        <option value="below">低于</option>
      </select>
      <input bind:value={threshold} placeholder="阈值" />
      <button class="primary" on:click={addAlert}>添加提醒</button>
      <button on:click={() => addFeedback('verified')}>标记有效</button>
      <button on:click={() => addFeedback('biased')}>标记偏差</button>
      <button on:click={() => addFeedback('review')}>需要复盘</button>
    </div>
  </section>
{:else}
  <p class="error">{error || '正在加载标的详情。'}</p>
{/if}
