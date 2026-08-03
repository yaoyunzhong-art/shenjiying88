import {
  MEMBER_CARD_STATUS_MAP,
  MEMBER_CARD_TYPE_MAP,
  MOCK_MEMBER_CARDS,
  type MemberCard,
} from '../../../members-data'

export { MEMBER_CARD_STATUS_MAP, MEMBER_CARD_TYPE_MAP, type MemberCard }

export const CARD_TYPE_OPTIONS = [
  { value: 'virtual', label: '虚拟卡' },
  { value: 'physical', label: '实体卡' },
  { value: 'digital', label: '数字卡' },
] as const

export const CARD_STATUS_OPTIONS = [
  { value: 'active', label: '正常' },
  { value: 'frozen', label: '已冻结' },
  { value: 'expired', label: '已过期' },
  { value: 'cancelled', label: '已注销' },
] as const

export interface EditCardFormData {
  pointsMultiplier: number
  designatedStore: string
  linkedWechat: boolean
  notes: string
}

export interface MemberCardDetailSnapshot {
  deliveryMode: 'fallback'
  sourceLabel: 'members-card-detail-fallback'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  cardId: string
  card: MemberCard | null
}

export function formatCardDate(value: string | null): string {
  if (!value) {
    return '—'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatCardDateShort(value: string | null): string {
  if (!value) {
    return '—'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function formatCardCurrency(amount: number): string {
  if (amount >= 10000) {
    return `¥${(amount / 10000).toFixed(1)}万`
  }

  return `¥${amount.toLocaleString()}`
}

export function cardTypeColor(type: MemberCard['cardType']): string {
  const colors: Record<MemberCard['cardType'], string> = {
    physical: '#86efac',
    virtual: '#93c5fd',
    digital: '#fde68a',
  }

  return colors[type]
}

export async function loadMemberCardDetailSnapshot(
  cardId: string
): Promise<MemberCardDetailSnapshot> {
  const card = MOCK_MEMBER_CARDS.find((item) => item.id === cardId) ?? null

  return {
    deliveryMode: 'fallback',
    sourceLabel: 'members-card-detail-fallback',
    generatedAt: '2026-07-27T16:40:00.000Z',
    controlPlaneSource: 'loadMemberCardDetailSnapshot -> MOCK_MEMBER_CARDS',
    businessDataSource: 'local member card samples',
    refreshPath: `MemberCardDetailPage -> loadMemberCardDetailSnapshot(${cardId})`,
    note:
      '当前会员卡详情页使用本地卡片快照，已显式暴露来源态与刷新路径，编辑与状态流转仍为 mock 演示。',
    cardId,
    card: card ? { ...card } : null,
  }
}
