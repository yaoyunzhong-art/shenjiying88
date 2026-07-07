'use client';

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import type {
  AiModelPreset,
  AiModelStoreConfig,
  AiModelConfigHistory,
  SwitchAiModelRequest,
  SwitchAiModelResponse,
  CreateAiModelConfigRequest,
  RollbackAiModelRequest,
} from './types';

// ============ 默认 API base ============

const DEFAULT_API_BASE =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_BASE) ||
  '/api/v9';

// ============ 内部 fetch 包装 ============

async function httpGet<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`GET ${url} failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

async function httpPost<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`POST ${url} failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// ============ 1. 列出系统预设 (4 个包) ============

export interface UseAiModelPresetsOptions {
  apiBase?: string;
  queryOptions?: Omit<UseQueryOptions<AiModelPreset[], Error>, 'queryKey' | 'queryFn'>;
}

/**
 * 拉取系统预设 (4 个: gpt4o-general / claude-game / qwen-family / custom)
 * 缓存 5 分钟,5 端共享
 */
export function useAiModelPresets(options: UseAiModelPresetsOptions = {}) {
  const { apiBase = DEFAULT_API_BASE, queryOptions } = options;
  return useQuery<AiModelPreset[], Error>({
    queryKey: ['ai-model-presets'],
    queryFn: () => httpGet<AiModelPreset[]>(`${apiBase}/ai-model-config/presets`),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });
}

// ============ 2. 列出门店当前所有配置 ============

export interface UseStoreConfigsOptions {
  storeId: string;
  apiBase?: string;
  queryOptions?: Omit<UseQueryOptions<AiModelStoreConfig[], Error>, 'queryKey' | 'queryFn'>;
}

/**
 * 拉取门店的所有配置 (含历史 isCurrent=false)
 */
export function useStoreConfigs({ storeId, apiBase = DEFAULT_API_BASE, queryOptions }: UseStoreConfigsOptions) {
  return useQuery<AiModelStoreConfig[], Error>({
    queryKey: ['ai-model-store-configs', storeId],
    queryFn: () => httpGet<AiModelStoreConfig[]>(`${apiBase}/ai-model-config/store-configs?storeId=${encodeURIComponent(storeId)}`),
    staleTime: 60 * 1000,
    enabled: !!storeId,
    ...queryOptions,
  });
}

// ============ 3. 一键切换 (乐观更新) ============

export interface UseSwitchAiModelOptions {
  storeId: string;
  apiBase?: string;
}

/**
 * 切换大模型配置
 * - 乐观更新: 立即把目标 configId 标记为 isCurrent
 * - 切换失败: 回滚乐观状态
 * - 切换目标: < 500ms (V9 硬约束)
 */
export function useSwitchAiModel({ storeId, apiBase = DEFAULT_API_BASE }: UseSwitchAiModelOptions) {
  const queryClient = useQueryClient();

  return useMutation<SwitchAiModelResponse, Error, SwitchAiModelRequest, { previousConfigs: AiModelStoreConfig[] | undefined }>({
    mutationFn: (vars) =>
      httpPost<SwitchAiModelResponse>(`${apiBase}/ai-model-config/switch`, { ...vars, storeId }),
    onMutate: async (vars) => {
      // 取消进行中的重新获取
      await queryClient.cancelQueries({ queryKey: ['ai-model-store-configs', storeId] });
      // 快照
      const previousConfigs = queryClient.getQueryData<AiModelStoreConfig[]>(['ai-model-store-configs', storeId]);
      // 乐观更新
      if (previousConfigs) {
        queryClient.setQueryData<AiModelStoreConfig[]>(
          ['ai-model-store-configs', storeId],
          previousConfigs.map((c) => ({ ...c, isCurrent: c.id === vars.configId })),
        );
      }
      return { previousConfigs };
    },
    onError: (_err, _vars, context) => {
      // 回滚
      if (context?.previousConfigs) {
        queryClient.setQueryData(['ai-model-store-configs', storeId], context.previousConfigs);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-model-store-configs', storeId] });
    },
  });
}

// ============ 4. 创建新配置 ============

export function useCreateAiModelConfig({ storeId, apiBase = DEFAULT_API_BASE }: UseSwitchAiModelOptions) {
  const queryClient = useQueryClient();
  return useMutation<AiModelStoreConfig, Error, CreateAiModelConfigRequest>({
    mutationFn: (vars) =>
      httpPost<AiModelStoreConfig>(`${apiBase}/ai-model-config/store-configs`, { ...vars, storeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-model-store-configs', storeId] });
    },
  });
}

// ============ 5. 列出历史版本 ============

export function useConfigHistory(configId: string, { apiBase = DEFAULT_API_BASE }: { apiBase?: string } = {}) {
  return useQuery<AiModelConfigHistory[], Error>({
    queryKey: ['ai-model-config-history', configId],
    queryFn: () => httpGet<AiModelConfigHistory[]>(`${apiBase}/ai-model-config/history/${encodeURIComponent(configId)}`),
    enabled: !!configId,
    staleTime: 60 * 1000,
  });
}

// ============ 6. 回滚到指定历史版本 ============

export function useRollbackAiModel({ storeId, apiBase = DEFAULT_API_BASE }: UseSwitchAiModelOptions) {
  const queryClient = useQueryClient();
  return useMutation<SwitchAiModelResponse, Error, RollbackAiModelRequest>({
    mutationFn: (vars) =>
      httpPost<SwitchAiModelResponse>(`${apiBase}/ai-model-config/rollback`, { ...vars, storeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-model-store-configs', storeId] });
      queryClient.invalidateQueries({ queryKey: ['ai-model-config-history'] });
    },
  });
}