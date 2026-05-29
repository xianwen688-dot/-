import { fetchEtfRank } from '$lib/server/opencli';
import { fail, ok } from '../_helpers';

export async function GET({ url }) {
  try {
    const data = await fetchEtfRank(url.searchParams.get('limit') ?? '20');
    return ok(data, { provider: 'eastmoney', source: 'Eastmoney ETF API', fetchedAt: new Date().toISOString() });
  } catch (error) {
    return fail(error, 'etf');
  }
}
