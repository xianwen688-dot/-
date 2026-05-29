import { fetchSectors } from '$lib/server/opencli';
import { fail, ok } from '../_helpers';

export async function GET({ url }) {
  try {
    const data = await fetchSectors(
      url.searchParams.get('type') ?? 'industry',
      url.searchParams.get('sort') ?? 'change',
      url.searchParams.get('limit') ?? '20'
    );
    return ok(data, { provider: 'eastmoney', source: 'Eastmoney sector API', fetchedAt: new Date().toISOString() });
  } catch (error) {
    return fail(error, 'sectors');
  }
}
