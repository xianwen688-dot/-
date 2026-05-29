import { fetchMoneyFlow } from '$lib/server/opencli';
import { fail, ok } from '../_helpers';

export async function GET({ url }) {
  try {
    const data = await fetchMoneyFlow(
      url.searchParams.get('range') ?? 'today',
      url.searchParams.get('order') ?? 'desc',
      url.searchParams.get('limit') ?? '20'
    );
    return ok(data, { provider: 'eastmoney', source: 'Eastmoney money-flow API', fetchedAt: new Date().toISOString() });
  } catch (error) {
    return fail(error, 'money-flow');
  }
}
