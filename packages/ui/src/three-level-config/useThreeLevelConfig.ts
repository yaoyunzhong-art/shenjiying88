/**
 * 三级独立配置 - React Query Hooks (V9 需求 4 · V10 Day 6)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  ConfigResponse,
  EffectiveConfig,
  ConfigLevel,
  WorkbenchCode,
  ConfigCategory,
} from './types'

// ============ Mock API (Day 6 占位,Day 7+ 接真实 API) ============

const MOCK_BASE_DELAY = 80

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Mock 工作台配置数据 */
const MOCK_WORKBENCH_DATA: Record<WorkbenchCode, EffectiveConfig[]> = {
  'W-S': [
    { key: 'pos.tax_rate', value: '0.13', sourceLevel: 'store', inherited: false },
    { key: 'pos.receipt_footer', value: '谢谢惠顾', sourceLevel: 'store', inherited: false },
    { key: 'print.auto_print_receipt', value: 'true', sourceLevel: 'store', inherited: false },
    { key: 'member.daily_checkin_enabled', value: 'true', sourceLevel: 'store', inherited: false },
  ],
  'W-T': [
    { key: 'member.tier_upgrade_threshold', value: '1000', sourceLevel: 'tenant', inherited: false },
    { key: 'marketing.default_campaign_budget', value: '50000', sourceLevel: 'tenant', inherited: false },
    { key: 'inventory.low_stock_threshold', value: '10', sourceLevel: 'tenant', inherited: false },
    { key: 'ai.default_model', value: 'gpt-4o-mini', sourceLevel: 'tenant', inherited: false },
    { key: 'integration.webhook_url', value: '***-abcd', sourceLevel: 'tenant', inherited: false, isMasked: true },
  ],
  'W-B': [
    { key: 'compliance.audit_retention_days', value: '180', sourceLevel: 'brand', inherited: false },
    { key: 'branding.logo_url', value: '', sourceLevel: 'brand', inherited: false },
    { key: 'branding.primary_color', value: '#1677ff', sourceLevel: 'brand', inherited: false },
    { key: 'billing.tax_id', value: '***-1234', sourceLevel: 'brand', inherited: false, isMasked: true },
  ],
}

async function fetchWorkbenchConfigsApi(
  workbench: WorkbenchCode,
  category?: ConfigCategory,
): Promise<EffectiveConfig[]> {
  await delay(MOCK_BASE_DELAY)
  let data = MOCK_WORKBENCH_DATA[workbench]
  if (category) {
    // Mock: 按 category 过滤(简单按 key 前缀匹配)
    const prefix: Record<ConfigCategory, string> = {
      pos: 'pos.',
      print: 'print.',
      member: 'member.',
      marketing: 'marketing.',
      inventory: 'inventory.',
      integration: 'integration.',
      ai: 'ai.',
      compliance: 'compliance.',
      billing: 'billing.',
      branding: 'branding.',
    }
    const p = prefix[category]
    data = data.filter((c) => c.key.startsWith(p))
  }
  return data
}

async function setConfigApi(input: { key: string; value: string }): Promise<ConfigResponse> {
  await delay(MOCK_BASE_DELAY)
  return {
    id: `cfg-${Date.now()}`,
    key: input.key,
    value: input.value,
    category: 'pos',
    level: 'tenant',
    ownerId: 'tenant-A',
    inherits: false,
    version: 1,
    updatedBy: 'admin',
    updatedAt: new Date().toISOString(),
  }
}

// ============ Public Hooks (5 端共享) ============

/** 获取工作台配置 (考虑继承链) */
export function useWorkbenchConfigs(workbench: WorkbenchCode, category?: ConfigCategory) {
  return useQuery({
    queryKey: ['workbench-configs', workbench, category],
    queryFn: () => fetchWorkbenchConfigsApi(workbench, category),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

/** 设置单个配置 */
export function useSetConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: setConfigApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workbench-configs'] })
    },
  })
}

/** 批量设置配置 */
export function useSetConfigBatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (items: { key: string; value: string }[]) => {
      await delay(MOCK_BASE_DELAY)
      return items.map((item) => ({
        id: `cfg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        key: item.key,
        value: item.value,
        category: 'tenant' as ConfigLevel,
        level: 'tenant' as ConfigLevel,
        ownerId: 'tenant-A',
        inherits: false,
        version: 1,
        updatedBy: 'admin',
        updatedAt: new Date().toISOString(),
        isMasked: false,
      }))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workbench-configs'] })
    },
  })
}

/** 获取所有级别元数据 */
export function useAllLevelsMeta() {
  return useQuery({
    queryKey: ['three-level-config', 'meta'],
    queryFn: async () => {
      await delay(50)
      return {
        totalWorkbenches: 3,
        totalConfigs: 13,
        totalCategories: 10,
      }
    },
    staleTime: 60 * 1000,
  })
}
