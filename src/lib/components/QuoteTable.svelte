<script lang="ts">
  import { formatCurrency, formatNumber, formatPct, toneClass } from '$lib/format';
  import type { MarketQuote, RankedAsset } from '$lib/types';

  export let rows: Array<MarketQuote | RankedAsset> = [];
  export let linkable = true;

  function symbolOf(row: MarketQuote | RankedAsset) {
    return row.symbol;
  }
</script>

<div class="table-wrap">
  <table>
    <thead>
      <tr>
        <th>代码</th>
        <th>名称</th>
        <th>价格</th>
        <th>涨跌幅</th>
        <th>成交额</th>
        <th>换手</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as row}
        <tr>
          <td>
            {#if linkable}
              <a class="pill" href={`/symbol/${symbolOf(row)}`}>{symbolOf(row)}</a>
            {:else}
              {symbolOf(row)}
            {/if}
          </td>
          <td>{row.name}</td>
          <td>{formatCurrency(row.price ?? null, 'currency' in row ? row.currency : 'CNY')}</td>
          <td class={toneClass(row.changePercent ?? null)}>{formatPct(row.changePercent ?? null)}</td>
          <td>{formatNumber(row.turnover ?? null)}</td>
          <td>{formatPct(row.turnoverRate ?? null)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
