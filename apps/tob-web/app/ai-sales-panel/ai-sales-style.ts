// AI Sales Panel 视觉契约集中点
// 所有颜色 / 圆角 / padding / 字号契约在此维护，page.tsx 只做组合。

// ─── 颜色 token ─────────────────────────────────────────────────────────────

export const PRIORITY_COLORS: Record<'high' | 'medium' | 'low', string> = {
  high: '#ef4444',
  medium: '#eab308',
  low: '#22c55e',
}

export const PRIORITY_LABELS: Record<'high' | 'medium' | 'low', string> = {
  high: '高',
  medium: '中',
  low: '低',
}

const COLOR_BLUE = '#60a5fa'
const COLOR_GREEN = '#22c55e'
const COLOR_YELLOW = '#eab308'
const COLOR_GRAY = '#64748b'
const COLOR_RED = '#ef4444'

const BG_ACTIVE_BLUE = 'rgba(59,130,246,0.15)'
const BG_ACTIVE_BLUE_LIGHT = 'rgba(59,130,246,0.1)'
const BG_TOGGLE_BLUE_CHIP = 'rgba(59,130,246,0.15)'
const BG_INACTIVE = 'transparent'
const BORDER_ACTIVE = '1px solid rgba(59,130,246,0.5)'
const BORDER_INACTIVE = '1px solid rgba(148,163,184,0.2)'

const CARD_BG = 'rgba(30,41,59,0.9)'
const CARD_BORDER = '1px solid rgba(148,163,184,0.12)'

const TEXT_ACTIVE = '#60a5fa'
const TEXT_INACTIVE = '#94a3b8'
const TEXT_PRIMARY = '#f8fafc'
const TEXT_SECONDARY = '#94a3b8'

// ─── 通用 type ───────────────────────────────────────────────────────────────

export interface ChipStyle {
  padding: string
  fontSize: number
  fontWeight: number
  borderRadius: number
  background: string
  color: string
}

export interface ButtonStyle {
  padding: string
  fontSize: number
  fontWeight: number
  borderRadius: number
  border: string
  background: string
  color: string
  cursor: 'pointer'
}

export interface CardStyle {
  background: string
  border: string
  borderRadius: number
  padding: number
}

// ─── 按钮 helper ────────────────────────────────────────────────────────────

/**
 * 顶部 Tab 导航按钮（无 border，背景以 alpha 15 渲染）
 */
export function getTabButtonStyle(isActive: boolean): ButtonStyle {
  return {
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: 500,
    borderRadius: 6,
    border: 'none',
    background: isActive ? BG_ACTIVE_BLUE : BG_INACTIVE,
    color: isActive ? TEXT_ACTIVE : TEXT_INACTIVE,
    cursor: 'pointer',
  }
}

/**
 * Toggle 类按钮（带 1px border，alpha 10 蓝调 active / 灰调 inactive）
 */
export function getToggleButtonStyle(isActive: boolean): ButtonStyle {
  return {
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 500,
    borderRadius: 6,
    border: isActive ? BORDER_ACTIVE : BORDER_INACTIVE,
    background: isActive ? BG_ACTIVE_BLUE_LIGHT : BG_INACTIVE,
    color: isActive ? TEXT_ACTIVE : TEXT_INACTIVE,
    cursor: 'pointer',
  }
}

// ─── 卡片外壳 helper ────────────────────────────────────────────────────────

/**
 * 标准卡片外壳（深色背景 + 灰边 + 圆角 12）
 * @param padding 内边距，常用 16（紧凑）或 20（宽松）
 */
export function getCardStyle(padding: 16 | 20 = 16): CardStyle {
  return {
    background: CARD_BG,
    border: CARD_BORDER,
    borderRadius: 12,
    padding,
  }
}

// ─── 颜色阈值 helper ────────────────────────────────────────────────────────

/**
 * matchScore 阈值配色：>85 绿 / >75 黄 / 其他灰
 */
export function getMatchScoreColor(score: number): string {
  if (score > 85) return COLOR_GREEN
  if (score > 75) return COLOR_YELLOW
  return COLOR_GRAY
}

/**
 * matchScore chip 样式（颜色 + 20 alpha 背景）
 */
export function getMatchScoreChipStyle(score: number): ChipStyle {
  const color = getMatchScoreColor(score)
  return {
    padding: '4px 8px',
    fontSize: 11,
    fontWeight: 600,
    borderRadius: 4,
    background: `${color}20`,
    color,
  }
}

// ─── priority helper ────────────────────────────────────────────────────────

export type Priority = 'high' | 'medium' | 'low'

export function getPriorityColor(priority: Priority): string {
  return PRIORITY_COLORS[priority]
}

export function getPriorityLabel(priority: Priority): string {
  return PRIORITY_LABELS[priority]
}

/**
 * 优先级圆角方块（48x48，背景 20 alpha）
 */
export function getPriorityBlockStyle(priority: Priority): {
  width: number
  height: number
  borderRadius: number
  background: string
  display: 'flex'
  alignItems: 'center'
  justifyContent: 'center'
  fontSize: number
  fontWeight: number
  color: string
} {
  return {
    width: 48,
    height: 48,
    borderRadius: 10,
    background: `${PRIORITY_COLORS[priority]}20`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 700,
    color: PRIORITY_COLORS[priority],
  }
}

// ─── status chip helper ─────────────────────────────────────────────────────

export type TaskStatus = 'pending' | 'completed'

export function getStatusChipStyle(status: TaskStatus): ChipStyle {
  if (status === 'completed') {
    return {
      padding: '2px 8px',
      fontSize: 10,
      fontWeight: 600,
      borderRadius: 3,
      background: 'rgba(34,197,94,0.15)',
      color: COLOR_GREEN,
    }
  }
  return {
    padding: '2px 8px',
    fontSize: 10,
    fontWeight: 600,
    borderRadius: 3,
    background: 'rgba(234,179,8,0.15)',
    color: COLOR_YELLOW,
  }
}

export function getStatusLabel(status: TaskStatus): string {
  return status === 'completed' ? '已完成' : '待处理'
}

// ─── tone chip helper ───────────────────────────────────────────────────────

export type Tone = 'professional' | 'friendly' | 'urgent'

export const TONE_LABELS: Record<Tone, string> = {
  professional: '专业',
  friendly: '友好',
  urgent: '紧迫',
}

export function getToneLabel(tone: Tone): string {
  return TONE_LABELS[tone]
}

/**
 * tone chip 样式：urgent=红 / 其他=绿
 */
export function getToneChipStyle(tone: Tone): ChipStyle {
  if (tone === 'urgent') {
    return {
      padding: '4px 10px',
      fontSize: 11,
      fontWeight: 600,
      borderRadius: 4,
      background: 'rgba(239,68,68,0.15)',
      color: COLOR_RED,
    }
  }
  return {
    padding: '4px 10px',
    fontSize: 11,
    fontWeight: 600,
    borderRadius: 4,
    background: 'rgba(34,197,94,0.15)',
    color: COLOR_GREEN,
  }
}

// ─── productName chip helper ────────────────────────────────────────────────

/**
 * 商品名 chip 样式（蓝调）
 */
export function getProductNameChipStyle(): ChipStyle {
  return {
    padding: '4px 10px',
    fontSize: 11,
    fontWeight: 600,
    borderRadius: 4,
    background: BG_TOGGLE_BLUE_CHIP,
    color: COLOR_BLUE,
  }
}

// ─── 文本样式 helper ────────────────────────────────────────────────────────

export const HEADING_STYLE = {
  fontSize: 14,
  fontWeight: 600,
  color: TEXT_PRIMARY,
  margin: 0,
} as const

export const SUBHEADING_STYLE = {
  fontSize: 13,
  fontWeight: 600,
  color: TEXT_PRIMARY,
  margin: 0,
} as const

export const BODY_TEXT_STYLE = {
  fontSize: 13,
  color: TEXT_SECONDARY,
  margin: 0,
} as const
