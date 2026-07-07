/**
 * useThreeLevelConfig Mock (V10 Day 6)
 *
 * 简化版 hook,直接返回 mock 数据,避免 react-query 依赖
 * 用于 ThreeLevelConfigPanel.test.tsx
 */

import type { EffectiveConfig, WorkbenchCode, ConfigCategory } from './types'

const MOCK_DATA: Record<WorkbenchCode, EffectiveConfig[]> = {
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

export function useWorkbenchConfigs(workbench: WorkbenchCode, _category?: ConfigCategory) {
  return {
    data: MOCK_DATA[workbench] ?? [],
    isLoading: false,
    error: null,
    isError: false,
    refetch: () => Promise.resolve(),
  }
}

export function useSetConfig() {
  return {
    mutate: () => undefined,
    mutateAsync: () => Promise.resolve({} as any),
    isPending: false,
  }
}

export function useSetConfigBatch() {
  return {
    mutate: () => undefined,
    mutateAsync: () => Promise.resolve([]),
    isPending: false,
  }
}

export function useAllLevelsMeta() {
  return {
    data: { totalWorkbenches: 3, totalConfigs: 13, totalCategories: 10 },
    isLoading: false,
  }
}
