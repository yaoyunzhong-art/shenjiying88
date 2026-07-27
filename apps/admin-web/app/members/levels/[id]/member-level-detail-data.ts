import { MOCK_MEMBER_LEVEL_CONFIGS, type MemberLevelConfig } from '../../../members-data'
import {
  LEVEL_STATUS_MAP,
  formatLevelCurrency,
  levelColor,
  normalizeLevelConfig,
} from '../member-levels-data'

export { formatLevelCurrency, levelColor, LEVEL_STATUS_MAP }
export type { MemberLevelConfig }

export interface EditLevelFormData {
  name: string
  minPoints: number
  maxPoints: number
  discountRate: number
  annualFee: number
  benefits: string
  renewalCondition: string
  upgradeCondition: string
  downgradeCondition: string
  notes: string
}

export interface EditLevelErrors {
  name?: string
  minPoints?: string
  maxPoints?: string
  discountRate?: string
  annualFee?: string
}

export interface MemberLevelDetailSnapshot {
  deliveryMode: 'fallback'
  sourceLabel: 'member-level-detail-fallback'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  levelId: string
  level: MemberLevelConfig | null
}

export const STATUS_OPTIONS = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'inactive' },
  { label: '仅内部可见', value: 'hidden' },
] as const

export function formatLevelDate(value: string): string {
  return new Date(value).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function validateEditLevelForm(data: EditLevelFormData): EditLevelErrors {
  const errors: EditLevelErrors = {}
  if (!data.name.trim()) {
    errors.name = '等级名称不能为空'
  }
  if (data.minPoints < 0) {
    errors.minPoints = '最低积分不能为负'
  }
  if (data.maxPoints < data.minPoints) {
    errors.maxPoints = '上限必须大于下限'
  }
  if (data.discountRate < 0 || data.discountRate > 100) {
    errors.discountRate = '折扣率范围为0-100'
  }
  if (data.annualFee < 0) {
    errors.annualFee = '年费不能为负'
  }
  return errors
}

export async function loadMemberLevelDetailSnapshot(
  levelId: string
): Promise<MemberLevelDetailSnapshot> {
  const level = MOCK_MEMBER_LEVEL_CONFIGS.find((item) => item.id === levelId)

  return {
    deliveryMode: 'fallback',
    sourceLabel: 'member-level-detail-fallback',
    generatedAt: '2026-07-27T17:10:00.000Z',
    controlPlaneSource: 'loadMemberLevelDetailSnapshot -> MOCK_MEMBER_LEVEL_CONFIGS',
    businessDataSource: 'local member level configs',
    refreshPath: `MemberLevelDetailPage -> loadMemberLevelDetailSnapshot(${levelId})`,
    note:
      '当前会员等级详情页使用本地等级配置快照，已显式暴露来源态与刷新路径，编辑、状态变更与删除仍为 mock 演示。',
    levelId,
    level: level ? normalizeLevelConfig(level) : null,
  }
}
