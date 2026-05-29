<script lang="ts">
  import type { ModelResult } from '$lib/types';

  export let result: ModelResult;
</script>

<section class="panel">
  <div class="panel-head">
    <div>
      <h2>{result.horizon === 'short' ? '短线研究' : '长线研究'}</h2>
      <p class="muted">{result.modelVersion} · {new Date(result.generatedAt).toLocaleString()}</p>
    </div>
    <span class="score">{result.score}</span>
  </div>
  <p>{result.summary}</p>
  <div class="status-line">
    <span class="pill">置信度 {result.confidence}%</span>
    <span class="pill">{result.stance === 'track' ? '跟踪' : result.stance === 'risk' ? '风险' : '观察'}</span>
  </div>
  <ul class="signal-list">
    {#each result.signals as signal}
      <li>
        <strong>{signal.label}</strong>
        <span class="muted">贡献 {signal.contribution} · {signal.note}</span>
      </li>
    {/each}
  </ul>
  <h3>自检</h3>
  <ul class="signal-list">
    {#each result.selfChecks as check}
      <li>{check}</li>
    {/each}
  </ul>
</section>
