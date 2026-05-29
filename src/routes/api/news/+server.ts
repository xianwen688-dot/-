import { fetchNews } from '$lib/server/opencli';
import { fail, ok } from '../_helpers';

export async function GET({ url }) {
  try {
    const data = await fetchNews(url.searchParams.get('limit') ?? '20');
    return ok(data, { provider: 'eastmoney', source: 'opencli eastmoney kuaixun', fetchedAt: new Date().toISOString() });
  } catch (error) {
    return fail(error, 'news');
  }
}
