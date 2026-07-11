/**
 * db-knowledge.entity.ts — 数据库知识库实体类型定义
 */

/**
 * 知识文档
 */
export interface KnowledgeDoc {
  id: string
  sourcePath: string
  title: string
  kind: string
  tags: string[]
  content: string
  summary?: string
  chunkCount: number
  isArchive: boolean
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

/**
 * 专家画像
 */
export interface ExpertProfile {
  id: string
  code: string
  name: string
  groupId: string
  role: string
  specialization: string[]
  activePhases: string[]
  activityLevel: string
  insights: unknown[]
  learningNotes: unknown[]
  feedbackLog: unknown[]
  evolutionLog: unknown[]
}

/**
 * 验收脉冲
 */
export interface AcceptancePulse {
  id: string
  pulseNumber: number
  module: string
  status: string
  basePass: boolean
  servicePass: boolean
  controllerPass: boolean
  ctestPass: boolean
  streakCount: number
  fixCount: number
  closedPulse?: number
  createdAt: string
}

/**
 * 模式记录（反模式 / 正向模式）
 */
export interface PatternRecord {
  id: string
  patternType: 'anti-pattern' | 'positive-pattern'
  code: string
  title: string
  description: string
  discoveryDate: string
  rootCause?: string
  fixDescription?: string
  relatedPhases: string[]
  severity?: string
  resolved: boolean
}

/**
 * 阶段进度
 */
export interface PhaseRecord {
  id: string
  phaseCode: string
  name: string
  owner: string
  deadline?: string
  completionPct: number
  status: string
  storeARequired: boolean
  frontendDone: boolean
  backendDone: boolean
  testDone: boolean
  acceptanceDone: boolean
  notes?: string
}

/**
 * 每日简报
 */
export interface DailyBrief {
  id: string
  date: string
  commits: number
  treeCommits: number
  lobsterCommits: number
  expertCommits: number
  acceptancePulses: number
  streakMax: number
  testsPass: number
  testsFail: number
  tscModules: number
  tscPassed: number
  cronsEnabled: number
  balance?: number
  summary?: string
  highlights: unknown[]
  issues: unknown[]
}

/**
 * 竞品场馆
 */
export interface CompetitorVenue {
  id: string
  city: string
  venueName: string
  venueType?: string
  sourcePlatform?: string
  data9dims: Record<string, unknown>
  scoutNotes?: string
}

/**
 * 演进日志
 */
export interface EvolutionLog {
  id: string
  date: string
  eventType: string
  title: string
  description: string
  rootCause?: string
  resolution?: string
  affectedCrons: string[]
}

/**
 * 搜索结果
 */
export interface SearchResult {
  id: string
  sourcePath: string
  title: string
  kind: string
  content: string
  score: number
  summary?: string
}
