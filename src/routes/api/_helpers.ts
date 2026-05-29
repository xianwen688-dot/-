import { json } from '@sveltejs/kit';
import type { ProviderMeta } from '$lib/types';

export function ok<T>(data: T, meta: ProviderMeta) {
  return json(
    {
      ok: true,
      data,
      meta
    },
    {
      headers: {
        'cache-control': 'no-store'
      }
    }
  );
}

export function fail(error: unknown, source = 'local api') {
  const message = error instanceof Error ? error.message : String(error);
  return json(
    {
      ok: false,
      data: null,
      meta: {
        provider: 'eastmoney',
        source,
        fetchedAt: new Date().toISOString(),
        warning: message
      },
      error: message
    },
    { status: 500 }
  );
}
