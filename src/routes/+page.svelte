<script lang="ts">
  import { onMount } from 'svelte';
  import { Plus, RefreshCw, Trash2 } from '@lucide/svelte';
  import MiniBarChart from '$lib/components/MiniBarChart.svelte';
  import QuoteTable from '$lib/components/QuoteTable.svelte';
  import { getEtfRank, getIndices, getMoneyFlow, getNews, getQuotes, getSectors, latestCachedQuotes } from '$lib/api';
  import { db, seedDefaults } from '$lib/db';
  import { formatCurrency, formatNumber, formatPct, toneClass } from '$lib/format';
  import { compactSymbol, inferKind } from '$lib/symbols';
  import type { MarketIndex, MarketQuote, MoneyFlowItem, NewsItem, RankedAsset, SectorItem, WatchAsset } from '$lib/types';

  let indices: MarketIndex[] = [];
  let quotes: MarketQuote[] = [];
  let etfs: RankedAsset[] = [];
  let sectors: SectorItem[] = [];
  let moneyFlow: MoneyFlowItem[] = [];
  let news: NewsItem[] = [];
  let watchlist: WatchAsset[] = [];
  let newSymbol = '';
  let loading = true;
  let error = '';
  let updatedAt = '';

  async function loadWatchlist() {
    watchlist = await db.watchlist.orderBy('createdAt').toArray();
  }

  async function refresh() {
    loading = true;
    error = '';
    try {
      await loadWatchlist();
      const symbols = watchlist.map((item) => item.symbol);
      [indices, quotes, etfs, sectors, moneyFlow, news] = await Promise.all([
        getIndices(),
        getQuotes(symbols),
        getEtfRank(),
        getSectors(),
        getMoneyFlow(),
        getNews()
      ]);
      updatedAt = new Date().toLocaleTimeString();
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      quotes = await latestCachedQuotes();
    } finally {
      loading = false;
    }
  }

  async function addSymbol() {
    const symbol = compactSymbol(newSymbol);
    if (!symbol) return;
    await db.watchlist.put({
      symbol,
      name: symbol,
      kind: inferKind(symbol),
      market: /^[A-Z]+$/.test(symbol) ? 'US' : 'CN',
      createdAt: new Date().toISOString()
    });
    newSymbol = '';
    await refresh();
  }

  async function removeSymbol(symbol: string) {
    await db.watchlist.delete(symbol);
    await refresh();
  }

  onMount(() => {
    let timer: number | undefined;
    void (async () => {
      await seedDefaults();
      await refresh();
      timer = window.setInterval(refresh, 15_000);
    })();
    return () => window.clearInterval(timer);
  });
</script>

<header class="page-head">
  <div>
    <p class="eyebrow">本地优先 · A 股 / A 股 ETF / 美股 ETF</p>
    <h1>豆饼投资研究工作室</h1>
    <p class="muted">看盘、筛选、提醒和模型自检在本机完成；不接券商，不自动交易。</p>
  </div>
  <div class="toolbar">
    <input bind:value={newSymbol} placeholder="添加代码，如 510300 / SPY" on:keydown={(event) => event.key === 'Enter' && addSymbol()} />
    <button class="primary" on:click={addSymbol} title="添加自选"><Plus size={16} />添加</button>
    <button on:click={refresh} title="刷新数据"><RefreshCw size={16} />刷新</button>
  </div>
</header>

{#if error}
  <p class="error">{error}。已尝试显示最近缓存。</p>
{/if}

<div class="status-line">
  <span class="pill">{loading ? '刷新中' : '已更新'} {updatedAt}</span>
  <span class="pill">PWA 缓存开启</span>
  <span class="pill">iFinD 预留，当前关闭</span>
</div>

<section class="panel" style="margin-top: 16px;">
  <div class="panel-head">
    <h2>大盘温度</h2>
  </div>
  <div class="metric-strip">
    {#each indices as item}
      <div class="metric">
        <div class="label">{item.name}</div>
        <div class="value">{formatNumber(item.price)}</div>
        <div class={toneClass(item.changePercent)}>{formatPct(item.changePercent)}</div>
      </div>
    {/each}
  </div>
</section>

<div class="grid cols-2" style="margin-top: 16px;">
  <section class="panel">
    <div class="panel-head">
      <h2>自选</h2>
      <span class="muted">{quotes.length} 个标的</span>
    </div>
    {#if quotes.length}
      <QuoteTable rows={quotes} />
      <div class="toolbar" style="margin-top: 12px;">
        {#each watchlist as item}
          <button class="icon" on:click={() => removeSymbol(item.symbol)} title={`删除 ${item.symbol}`}>
            <Trash2 size={16} />
          </button>
        {/each}
      </div>
    {:else}
      <div class="empty">还没有自选，添加 A 股、A 股 ETF 或美股 ETF 代码。</div>
    {/if}
  </section>

  <section class="panel">
    <div class="panel-head">
      <h2>A 股 ETF 成交额榜</h2>
    </div>
    <QuoteTable rows={etfs} />
  </section>
</div>

<div class="grid cols-2" style="margin-top: 16px;">
  <section class="panel">
    <div class="panel-head">
      <h2>板块强弱</h2>
    </div>
    <MiniBarChart items={sectors as unknown as Record<string, unknown>[]} title="行业涨跌幅" />
  </section>

  <section class="panel">
    <div class="panel-head">
      <h2>主力资金</h2>
    </div>
    <MiniBarChart items={moneyFlow as unknown as Record<string, unknown>[]} valueKey="mainNet" title="净流入排行" />
  </section>
</div>

<section class="panel" style="margin-top: 16px;">
  <div class="panel-head">
    <h2>重要快讯</h2>
    <span class="muted">东方财富 7x24</span>
  </div>
  <ul class="news-list">
    {#each news as item}
      <li>
        <strong>{item.time}</strong>
        <div>{item.title}</div>
        <p class="muted">{item.summary}</p>
      </li>
    {/each}
  </ul>
</section>
