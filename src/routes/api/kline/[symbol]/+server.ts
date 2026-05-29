import { fetchKline } from '$lib/server/kline';
import { fail, ok } from '../../_helpers';

export async function GET({ params, url }) {
  try {
    const period = url.searchParams.get('period') ?? 'day';
    const limit = Number(url.searchParams.get('limit') ?? 120);
    const { points, meta } = await fetchKline(params.symbol, period, Number.isFinite(limit) ? limit : 120);
    return ok(points, meta);
  } catch (error) {
    return fail(error, 'kline');
  }
}
