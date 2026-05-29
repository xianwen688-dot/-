<script lang="ts">
  import '../styles/app.css';
  import { Bell, FlaskConical, Home, Settings, Star } from '@lucide/svelte';
</script>

<svelte:head>
  <title>豆饼投资研究工作室</title>
  <meta name="description" content="本地优先的 A 股、A 股 ETF、美股 ETF 看盘与研究工作台。" />
</svelte:head>

<div class="app-shell">
  <aside class="sidebar" aria-label="主导航">
    <a class="brand" href="/">
      <img src="/icon.svg" alt="" />
      <span>豆饼投研</span>
    </a>
    <nav>
      <a href="/"><Home size={18} />工作台</a>
      <a href="/lab"><FlaskConical size={18} />选股实验室</a>
      <a href="/alerts"><Bell size={18} />提醒中心</a>
      <a href="/settings"><Settings size={18} />设置</a>
    </nav>
    <div class="sidebar-note">
      <Star size={16} />
      <span>本地研究工具，不接券商，不自动交易。</span>
    </div>
  </aside>

  <main>
    <slot />
  </main>
</div>
