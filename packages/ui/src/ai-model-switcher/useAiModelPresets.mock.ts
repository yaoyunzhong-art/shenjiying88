/**
 * Mock for useAiModelPresets — 避免在 node:test 中调用 @tanstack/react-query
 *
 * 通过 Module._resolveFilename hook 载入, 替换真实模块.
 * 使用 module 级别的 mutable state (imported by test file) 共享可变数据.
 */

import type { AiModelConfigHistory, AiModelStoreConfig, SwitchAiModelResponse } from './types';

// ============ Mutable Mock State ============
// 测试文件直接 import {@link mockState} 并赋值

export const mockState = {
  storeConfigsData: undefined as AiModelStoreConfig[] | undefined,
  storeConfigsIsLoading: false,
  storeConfigsError: null as Error | null,
  switchMutateAsync: async (_vars: {
    configId: string;
    reason?: string;
  }): Promise<SwitchAiModelResponse> => ({
    config: { id: 'cfg-2' } as AiModelStoreConfig,
    latencyMs: 320,
    healthCheckOk: true,
  }),
  historyData: undefined as AiModelConfigHistory[] | undefined,
  historyIsLoading: false,
  historyError: null as Error | null,
  rollbackMutateAsync: async (_vars: {
    historyId: string;
    reason?: string;
  }): Promise<SwitchAiModelResponse> => ({
    config: { id: 'cfg-2' } as AiModelStoreConfig,
    latencyMs: 320,
    healthCheckOk: true,
  }),
};

/** Mock 实现: useStoreConfigs */
export function useStoreConfigs(_opts: { storeId: string; apiBase?: string }) {
  return {
    data: mockState.storeConfigsData,
    isLoading: mockState.storeConfigsIsLoading,
    error: mockState.storeConfigsError,
  };
}

/** Mock 实现: useSwitchAiModel */
export function useSwitchAiModel(_opts: { storeId: string; apiBase?: string }) {
  return {
    mutateAsync: mockState.switchMutateAsync,
    isPending: false,
    isSuccess: false,
    isError: false,
  };
}

/** Mock 实现: useConfigHistory */
export function useConfigHistory(
  _configId: string,
  _opts?: { apiBase?: string },
) {
  return {
    data: mockState.historyData,
    isLoading: mockState.historyIsLoading,
    error: mockState.historyError,
  };
}

/** Mock 实现: useRollbackAiModel */
export function useRollbackAiModel(_opts: { storeId: string; apiBase?: string }) {
  return {
    mutateAsync: mockState.rollbackMutateAsync,
    isPending: false,
    isSuccess: false,
    isError: false,
  };
}
