import { fetchRank } from '$lib/server/opencli';
import { fail, ok } from '../_helpers';

export async function GET({ url }) {
  try {
    const data = await fetchRank(
      url.searchParams.get('market') ?? 'hs-a',
      url.searchParams.get('sort') ?? 'change',
      url.searchParams.get('limit') ?? '30'
    );
    return ok(data, { provider: 'eastmoney', source: 'Eastmoney rank API', fetchedAt: new Date().toISOString() });
  } catch (error) {
    return fail(error, 'rank');
  }
}
