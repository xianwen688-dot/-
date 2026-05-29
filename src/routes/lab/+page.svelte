<script lang="ts">
  import { onMount } from 'svelte';
  import QuoteTable from '$lib/components/QuoteTable.svelte';
  import { getEtfRank, getQuotes, getRank } from '$lib/api';
  import { buildLongModel, buildShortModel } from '$lib/model';
  import type { MarketQuote, RankedAsset } from '$lib/types';

  let sort = 'change';
  let ranked: RankedAsset[] = [];
  let etfs: RankedAsset[] = [];
  let modelQuotes: MarketQuote[] = [];
  let error = '';

  async function load() {
    try {
      ranked = await getRank(sort);
      etfs = await getEtfRank();
      const candidates = [...ranked.slice(0, 8), ...etfs.slice(0, 4)].map((item) => item.symbol || item.code);
      modelQuotes = await getQuotes(candidates);
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }
  }

  $: shortResults = modelQuotes.map(buildShortModel).sort((a, b) => b.score - a.score);
  $: longResults = modelQuotes.map(buildLongModel).sort((a, b) => b.score - a.score);

  onMount(load);
</script>

<header class="page-head">
  <div>
    <p class="eyebrow">模型版本 doubing-v0.1</p>
    <h1>选股实验室</h1>
    <p class="muted">短线看热度和资金，长线看估值、规模和稳定性。这里只做研究排序，不输出买卖指令。</p>
  </div>
  <div class="toolbar">
    <select bind:value={sort}>
      <option value="change">涨幅</option>
      <option value="drop">跌幅</option>
      <option value="turnover">成交额</option>
      <option value="volume">成交量</option>
      <option value="amplitude">振幅</option>
    </select>
    <button class="primary" on:click={load}>重新筛选</button>
  </div>
</header>

{#if error}
  <p class="error">{error}</p>
{/if}

<div class="grid cols-2">
  <section class="panel">
    <div class="panel-head">
      <h2>A 股排行池</h2>
    </div>
    <QuoteTable rows={ranked} />
  </section>

  <section class="panel">
    <div class="panel-head">
      <h2>A 股 ETF 流动性池</h2>
    </div>
    <QuoteTable rows={etfs} />
  </section>
</div>

<div class="grid cols-2" style="margin-top: 16px;">
  <section class="panel">
    <div class="panel-head">
      <h2>短线研究排序</h2>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>代码</th><th>分数</th><th>结论</th><th>置信度</th></tr></thead>
        <tbody>
          {#each shortResults as item}
            <tr>
              <td><a class="pill" href={`/symbol/${item.symbol}`}>{item.symbol}</a></td>
              <td>{item.score}</td>
              <td>{item.summary}</td>
              <td>{item.confidence}%</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>

  <section class="panel">
    <div class="panel-head">
      <h2>长线研究排序</h2>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>代码</th><th>分数</th><th>结论</th><th>置信度</th></tr></thead>
        <tbody>
          {#each longResults as item}
            <tr>
              <td><a class="pill" href={`/symbol/${item.symbol}`}>{item.symbol}</a></td>
              <td>{item.score}</td>
              <td>{item.summary}</td>
              <td>{item.confidence}%</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>
</div>
