/**
 * useTriState — 统一的三态管理 hook
 * 管理 loading / error / empty / success 状态迁移
 */
import { useCallback, useState } from 'react';

export type TriStateStatus = 'loading' | 'error' | 'empty' | 'success';

export interface TriStateResult {
  status: TriStateStatus;
  setLoading: () => void;
  setError: (message?: string) => void;
  setEmpty: () => void;
  setSuccess: () => void;
  errorMessage: string | undefined;
}

export function useTriState(initial: TriStateStatus = 'loading'): TriStateResult {
  const [status, setStatus] = useState<TriStateStatus>(initial);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const setLoading = useCallback(() => {
    setStatus('loading');
    setErrorMessage(undefined);
  }, []);

  const setError = useCallback((message?: string) => {
    setStatus('error');
    setErrorMessage(message);
  }, []);

  const setEmpty = useCallback(() => {
    setStatus('empty');
    setErrorMessage(undefined);
  }, []);

  const setSuccess = useCallback(() => {
    setStatus('success');
    setErrorMessage(undefined);
  }, []);

  return { status, setLoading, setError, setEmpty, setSuccess, errorMessage };
}
