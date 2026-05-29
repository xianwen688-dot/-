import { fetchQuotes } from '$lib/server/opencli';
import { fail, ok } from '../_helpers';

export async function GET({ url }) {
  try {
    const symbols = (url.searchParams.get('symbols') ?? '')
      .split(',')
      .map((symbol) => symbol.trim())
      .filter(Boolean);
    const data = await fetchQuotes(symbols);
    return ok(data, { provider: 'eastmoney', source: 'mixed quote adapters', fetchedAt: new Date().toISOString() });
  } catch (error) {
    return fail(error, 'quotes');
  }
}
