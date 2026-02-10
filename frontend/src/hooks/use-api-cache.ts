import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function buildKey(fetcher: Function, args: unknown[]): string {
  return `${fetcher.name}:${JSON.stringify(args)}`;
}

/** Clear cached entries. No prefix = clear all. With prefix = clear matching keys. */
export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

interface UseApiCacheResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

interface UseApiCacheOptions {
  enabled?: boolean;
}

export function useApiCache<T>(
  fetcher: (...args: any[]) => Promise<T>,
  args: unknown[] = [],
  options: UseApiCacheOptions = {},
): UseApiCacheResult<T> {
  const { enabled = true } = options;
  const key = buildKey(fetcher, args);
  const cached = cache.get(key) as CacheEntry<T> | undefined;

  const [data, setData] = useState<T | null>(cached?.data ?? null);
  const [loading, setLoading] = useState(!cached?.data && enabled);
  const [error, setError] = useState<Error | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current(...args);
      cache.set(key, { data: result, timestamp: Date.now() });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!enabled) return;
    // If we have cached data, return it immediately but still refetch
    if (cached?.data) {
      setData(cached.data);
    }
    execute();
  }, [execute, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, refetch: execute };
}
