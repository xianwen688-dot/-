import { json } from '@sveltejs/kit';

export async function GET() {
  return json({
    ok: true,
    data: [
      { id: 'eastmoney', label: '东方财富 OpenCLI', enabled: true, role: 'A股/A股ETF主源' },
      { id: 'sinafinance', label: '新浪财经 OpenCLI', enabled: true, role: '美股ETF报价' },
      { id: 'yahoo', label: 'Yahoo Finance chart', enabled: true, role: '美股ETF K线备用源' },
      { id: 'ifind', label: '同花顺 iFinD', enabled: false, role: '预留，当前未连接 localhost:5000/iFind' }
    ],
    meta: { provider: 'eastmoney', source: 'local provider registry', fetchedAt: new Date().toISOString() }
  });
}
