'use client';

import { useState, useCallback, useRef } from 'react';

/**
 * Tri-state hook — 为页面同时管理 loading / empty / error 三态
 *
 * 用法:
 * ```ts
 * const { loading, empty, error, wrapLoad, setEmpty, setError, reset } = useTriState();
 *
 * useEffect(() => {
 *   wrapLoad(fetchData());
 * }, []);
 * ```
 */
export type TriState = {
  loading: boolean;
  empty: boolean;
  error: string | null;
};

export function useTriState(initialState: Partial<TriState> = {}) {
  const [loading, setLoading] = useState(initialState.loading ?? false);
  const [empty, setEmpty] = useState(initialState.empty ?? false);
  const [error, setError] = useState<string | null>(initialState.error ?? null);
  const mountedRef = useRef(true);

  /** 包装一个 async 调用，自动管理 loading / error */
  const wrapLoad = useCallback(
    async <T>(
      promise: Promise<T>,
      options?: { signal?: AbortSignal },
    ): Promise<T | undefined> => {
      setLoading(true);
      setError(null);
      setEmpty(false);
      try {
        const result = await promise;
        if (options?.signal?.aborted) return undefined;
        return result;
      } catch (err: unknown) {
        if (options?.signal?.aborted) return undefined;
        const message =
          err instanceof Error ? err.message : typeof err === 'string' ? err : '请求失败，请稍后重试';
        setError(message);
        return undefined;
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [],
  );

  /** 根据数据数组自动判断 empty */
  const syncData = useCallback(<T>(data: T[] | null | undefined) => {
    if (!data || data.length === 0) {
      setEmpty(true);
    } else {
      setEmpty(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setEmpty(false);
    setError(null);
  }, []);

  return {
    loading,
    empty,
    error,
    setLoading,
    setEmpty,
    setError,
    wrapLoad,
    syncData,
    reset,
  };
}
