import { fetchIndices } from '$lib/server/opencli';
import { fail, ok } from '../../_helpers';

export async function GET() {
  try {
    const data = await fetchIndices();
    return ok(data, { provider: 'eastmoney', source: 'opencli eastmoney index-board', fetchedAt: new Date().toISOString() });
  } catch (error) {
    return fail(error, 'indices');
  }
}
