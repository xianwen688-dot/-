<script lang="ts">
  import { CandlestickSeries, createChart, HistogramSeries, type IChartApi, type ISeriesApi } from 'lightweight-charts';
  import { onDestroy, onMount } from 'svelte';
  import type { KlinePoint } from '$lib/types';

  export let points: KlinePoint[] = [];

  let container: HTMLDivElement;
  let chart: IChartApi | undefined;
  let series: ISeriesApi<'Candlestick'> | undefined;
  let volumeSeries: ISeriesApi<'Histogram'> | undefined;
  let observer: ResizeObserver | undefined;

  function syncData() {
    if (!series || !volumeSeries) return;
    series.setData(
      points.map((point) => ({
        time: point.time as never,
        open: point.open,
        high: point.high,
        low: point.low,
        close: point.close
      }))
    );
    volumeSeries.setData(
      points.map((point) => ({
        time: point.time as never,
        value: point.volume ?? 0,
        color: point.close >= point.open ? '#b43d37' : '#23704b'
      }))
    );
    chart?.timeScale().fitContent();
  }

  onMount(() => {
    chart = createChart(container, {
      height: 320,
      layout: { background: { color: '#fffdf7' }, textColor: '#31403d' },
      grid: { vertLines: { color: '#eee7da' }, horzLines: { color: '#eee7da' } },
      rightPriceScale: { borderColor: '#ded8ca' },
      timeScale: { borderColor: '#ded8ca' }
    });
    series = chart.addSeries(CandlestickSeries, {
      upColor: '#b43d37',
      downColor: '#23704b',
      borderUpColor: '#b43d37',
      borderDownColor: '#23704b',
      wickUpColor: '#b43d37',
      wickDownColor: '#23704b'
    });
    volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: ''
    });
    volumeSeries?.priceScale().applyOptions({
      scaleMargins: { top: 0.78, bottom: 0 }
    });
    observer = new ResizeObserver(() => chart?.applyOptions({ width: container.clientWidth }));
    observer.observe(container);
    syncData();
  });

  $: if (points && series) syncData();

  onDestroy(() => {
    observer?.disconnect();
    chart?.remove();
  });
</script>

<div bind:this={container} class="chart-box" aria-label="K线图"></div>
