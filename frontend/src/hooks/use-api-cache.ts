import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100;

const cache = new Map<string, CacheEntry<unknown>>();

function evictOldest(): void {
  if (cache.size <= MAX_CACHE_SIZE) return;
  const oldest = cache.keys().next().value;
  if (oldest !== undefined) cache.delete(oldest);
}

function buildKey(fetcher: (...args: unknown[]) => unknown, args: unknown[]): string {
  const name = fetcher.name || 'anonymous';
  if (import.meta.env.DEV && !fetcher.name) {
    console.warn('useApiCache: fetcher has no name — cache key will be unstable. Use a named function.');
  }
  return `${name}:${JSON.stringify(args)}`;
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
  ttl?: number;
}

export function useApiCache<T>(
  fetcher: (...args: any[]) => Promise<T>,
  args: unknown[] = [],
  options: UseApiCacheOptions = {},
): UseApiCacheResult<T> {
  const { enabled = true, ttl = DEFAULT_TTL } = options;
  const key = buildKey(fetcher, args);
  const cached = enabled ? (cache.get(key) as CacheEntry<T> | undefined) : undefined;
  const isFresh = cached ? Date.now() - cached.timestamp < ttl : false;

  const [data, setData] = useState<T | null>(cached?.data ?? null);
  const [loading, setLoading] = useState(enabled && !cached?.data);
  const [error, setError] = useState<Error | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current(...args);
      cache.set(key, { data: result, timestamp: Date.now() });
      evictOldest();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    // Serve cached data immediately
    if (cached?.data) {
      setData(cached.data);
      if (isFresh) {
        setLoading(false);
        return;
      }
    }
    execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute, enabled]);

  return { data, loading, error, refetch: execute };
}
