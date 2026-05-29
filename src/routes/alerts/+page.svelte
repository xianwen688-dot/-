<script lang="ts">
  import { onMount } from 'svelte';
  import { Bell, Trash2 } from '@lucide/svelte';
  import { getQuotes } from '$lib/api';
  import { db } from '$lib/db';
  import { formatCurrency, formatNumber, formatPct } from '$lib/format';
  import type { AlertRule, MarketQuote } from '$lib/types';

  let alerts: AlertRule[] = [];
  let quotes: MarketQuote[] = [];
  let message = '';

  async function load() {
    alerts = await db.alerts.orderBy('createdAt').reverse().toArray();
    const symbols = Array.from(new Set(alerts.filter((item) => item.enabled).map((item) => item.symbol)));
    quotes = symbols.length ? await getQuotes(symbols) : [];
  }

  function valueFor(rule: AlertRule) {
    const quote = quotes.find((item) => item.symbol === rule.symbol);
    if (!quote) return null;
    return rule.metric === 'price' ? quote.price : rule.metric === 'changePercent' ? quote.changePercent : quote.turnover;
  }

  function hit(rule: AlertRule) {
    const value = valueFor(rule);
    if (value == null) return false;
    return rule.direction === 'above' ? value >= rule.threshold : value <= rule.threshold;
  }

  async function requestPermission() {
    if (!('Notification' in window)) {
      message = '当前浏览器不支持通知。';
      return;
    }
    const permission = await Notification.requestPermission();
    message = permission === 'granted' ? '通知权限已开启。' : '通知权限未开启。';
  }

  async function remove(id: number | undefined) {
    if (!id) return;
    await db.alerts.delete(id);
    await load();
  }

  onMount(load);
</script>

<header class="page-head">
  <div>
    <p class="eyebrow">浏览器本地通知</p>
    <h1>提醒中心</h1>
    <p class="muted">提醒规则保存在本机 IndexedDB。页面打开时会检查，不会连接券商或执行交易。</p>
  </div>
  <button class="primary" on:click={requestPermission}><Bell size={16} />开启通知</button>
</header>

{#if message}
  <p class="status-line">{message}</p>
{/if}

<section class="panel">
  <div class="panel-head">
    <h2>规则</h2>
    <button on:click={load}>检查一次</button>
  </div>
  {#if alerts.length}
    <div class="table-wrap">
      <table>
        <thead><tr><th>标的</th><th>指标</th><th>条件</th><th>当前值</th><th>状态</th><th></th></tr></thead>
        <tbody>
          {#each alerts as rule}
            <tr>
              <td>{rule.symbol}</td>
              <td>{rule.metric}</td>
              <td>{rule.direction === 'above' ? '高于' : '低于'} {rule.threshold}</td>
              <td>
                {#if rule.metric === 'price'}
                  {formatCurrency(valueFor(rule), quotes.find((item) => item.symbol === rule.symbol)?.currency ?? 'CNY')}
                {:else if rule.metric === 'changePercent'}
                  {formatPct(valueFor(rule))}
                {:else}
                  {formatNumber(valueFor(rule))}
                {/if}
              </td>
              <td>{hit(rule) ? '触发' : '未触发'}</td>
              <td><button class="icon" on:click={() => remove(rule.id)} title="删除"><Trash2 size={16} /></button></td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <div class="empty">还没有提醒。进入任一标的详情页可以添加价格、涨跌幅或成交额提醒。</div>
  {/if}
</section>
