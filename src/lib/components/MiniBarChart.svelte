<script lang="ts">
  import * as echarts from 'echarts';
  import { onDestroy, onMount } from 'svelte';

  export let items: Record<string, unknown>[] = [];
  export let labelKey = 'name';
  export let valueKey = 'changePercent';
  export let title = '';

  let container: HTMLDivElement;
  let chart: echarts.ECharts | undefined;
  let observer: ResizeObserver | undefined;

  function toNumber(value: unknown) {
    return typeof value === 'number' && Number.isFinite(value) ? value : Number(value ?? 0);
  }

  function render() {
    if (!chart) return;
    const data = items.slice(0, 12);
    chart.setOption({
      title: title ? { text: title, left: 0, textStyle: { fontSize: 13, color: '#31403d' } } : undefined,
      grid: { left: 68, right: 18, top: title ? 30 : 10, bottom: 18 },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'value', axisLabel: { color: '#6d7774' }, splitLine: { lineStyle: { color: '#eee7da' } } },
      yAxis: {
        type: 'category',
        inverse: true,
        data: data.map((item) => String(item[labelKey] ?? '')),
        axisLabel: { color: '#31403d', width: 64, overflow: 'truncate' }
      },
      series: [
        {
          type: 'bar',
          data: data.map((item) => toNumber(item[valueKey])),
          itemStyle: {
            color: (params: { value: number }) => (params.value >= 0 ? '#b43d37' : '#23704b')
          },
          barWidth: 12
        }
      ]
    });
  }

  onMount(() => {
    chart = echarts.init(container, null, { renderer: 'canvas' });
    observer = new ResizeObserver(() => chart?.resize());
    observer.observe(container);
    render();
  });

  $: if (items && chart) render();

  onDestroy(() => {
    observer?.disconnect();
    chart?.dispose();
  });
</script>

<div bind:this={container} class="small-chart" aria-label={title || '柱状图'}></div>
