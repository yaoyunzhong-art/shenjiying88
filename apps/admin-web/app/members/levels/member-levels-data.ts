import { MOCK_MEMBER_LEVEL_CONFIGS, type MemberLevelConfig } from '../../members-data'

export type { MemberLevelConfig }

export interface CreateLevelFormData {
  name: string
  key: string
  level: number
  minPoints: number
  maxPoints: number
  discountRate: number
  annualFee: number
  benefits: string
  status: 'active' | 'inactive' | 'hidden'
}

export interface CreateLevelErrors {
  name?: string
  key?: string
  minPoints?: string
  maxPoints?: string
  discountRate?: string
  annualFee?: string
}

export interface MemberLevelsSnapshot {
  deliveryMode: 'fallback'
  sourceLabel: 'members-levels-fallback'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  levels: MemberLevelConfig[]
}

export const LEVEL_STATUS_MAP: Record<
  string,
  { label: string; variant: 'success' | 'warning' | 'neutral' }
> = {
  active: { label: '启用', variant: 'success' },
  inactive: { label: '停用', variant: 'warning' },
  hidden: { label: '仅内部可见', variant: 'neutral' },
}

export const DEFAULT_CREATE_FORM: CreateLevelFormData = {
  name: '',
  key: '',
  level: 5,
  minPoints: 0,
  maxPoints: 9999,
  discountRate: 100,
  annualFee: 0,
  benefits: '',
  status: 'active',
}

export function levelColor(level: number): string {
  const colors = ['#f0abfc', '#fbbf24', '#94a3b8', '#d97706', '#64748b']
  return colors[Math.min(level - 1, colors.length - 1)]
}

export function formatLevelCurrency(amount: number): string {
  if (amount >= 10000) {
    return `¥${(amount / 10000).toFixed(1)}万`
  }

  return `¥${amount.toLocaleString()}`
}

export function normalizeLevelConfig(level: MemberLevelConfig): MemberLevelConfig {
  return {
    ...level,
    benefits: [...level.benefits],
    discountRate: level.discountRate <= 1 ? Math.round(level.discountRate * 100) : level.discountRate,
  }
}

export function validateCreateLevelForm(data: CreateLevelFormData): CreateLevelErrors {
  const errors: CreateLevelErrors = {}
  if (!data.name.trim()) {
    errors.name = '等级名称不能为空'
  }
  if (!data.key.trim()) {
    errors.key = '等级标识不能为空'
  } else if (!/^[a-z_]{2,20}$/.test(data.key)) {
    errors.key = '标识格式：2-20位小写字母和下划线'
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

export async function loadMemberLevelsSnapshot(): Promise<MemberLevelsSnapshot> {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'members-levels-fallback',
    generatedAt: '2026-07-27T16:45:00.000Z',
    controlPlaneSource: 'loadMemberLevelsSnapshot -> MOCK_MEMBER_LEVEL_CONFIGS',
    businessDataSource: 'local member level configs',
    refreshPath: 'MemberLevelsPage -> loadMemberLevelsSnapshot()',
    note:
      '当前会员等级管理页使用本地等级配置快照，已显式暴露来源态与刷新路径，新增与删除仍为 mock 演示。',
    levels: MOCK_MEMBER_LEVEL_CONFIGS.map(normalizeLevelConfig),
  }
}
