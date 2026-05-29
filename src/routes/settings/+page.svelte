<script lang="ts">
  import { onMount } from 'svelte';
  import { getSetting, putSetting } from '$lib/db';

  let providers: Array<{ id: string; label: string; enabled: boolean; role: string }> = [];
  let refreshQuote = 15;
  let refreshNews = 60;
  let saved = '';

  async function load() {
    const response = await fetch('/api/providers');
    const payload = await response.json();
    providers = payload.data;
    refreshQuote = await getSetting('refreshQuote', 15);
    refreshNews = await getSetting('refreshNews', 60);
  }

  async function save() {
    await putSetting('refreshQuote', refreshQuote);
    await putSetting('refreshNews', refreshNews);
    saved = `已保存 ${new Date().toLocaleTimeString()}`;
  }

  onMount(load);
</script>

<header class="page-head">
  <div>
    <p class="eyebrow">本地配置</p>
    <h1>设置</h1>
    <p class="muted">数据源、刷新频率和后续接入状态集中在这里。</p>
  </div>
  <button class="primary" on:click={save}>保存</button>
</header>

<div class="grid cols-2">
  <section class="panel">
    <div class="panel-head">
      <h2>数据源</h2>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>来源</th><th>用途</th><th>状态</th></tr></thead>
        <tbody>
          {#each providers as provider}
            <tr>
              <td>{provider.label}</td>
              <td>{provider.role}</td>
              <td>{provider.enabled ? '启用' : '预留'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>

  <section class="panel">
    <div class="panel-head">
      <h2>刷新频率</h2>
      {#if saved}<span class="muted">{saved}</span>{/if}
    </div>
    <div class="grid">
      <label>
        行情刷新秒数
        <input type="number" min="5" max="300" bind:value={refreshQuote} />
      </label>
      <label>
        快讯刷新秒数
        <input type="number" min="30" max="600" bind:value={refreshNews} />
      </label>
      <p class="muted">v1 默认不接 iFinD；后续如果本机服务可用，会在这里开启。</p>
    </div>
  </section>
</div>
