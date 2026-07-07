/**
 * Phase 94 智能分析 Entity (V10 Sprint 2 Day 16)
 *
 * 复用 Phase 87 AI 模型配置,LLM 读取报表数据 → 生成自然语言洞察
 * - InsightReport: 单次洞察报告 (含 markdown 内容 + 元数据)
 * - InsightSource: 数据源引用 (Phase 91 报表 ID)
 * - InsightStatus: 状态机 (pending/generating/completed/failed)
 * - InsightTemplate: 提示词模板 (5 报表类型)
 */

export type InsightStatus = 'pending' | 'generating' | 'completed' | 'failed'

export type InsightTemplateType =
  | 'sales'      // 销售报表
  | 'inventory'  // 库存报表
  | 'finance'    // 财务报表
  | 'marketing'  // 营销报表
  | 'customer'   // 客户报表

export interface InsightSource {
  /** 数据源类型 (phase91_report / phase92_canary / phase93_monitoring) */
  type: 'report' | 'canary' | 'monitoring'
  /** 数据源 ID (例如 Phase 91 reportId) */
  refId: string
  /** 数据快照 (LLM 输入, JSON 序列化) */
  dataSnapshot: Record<string, unknown>
  /** 数据时间窗 */
  period: { from: string; to: string }
}

export interface InsightReport {
  id: string
  tenantId: string
  storeId?: string
  templateType: InsightTemplateType
  status: InsightStatus
  /** 提示词 (含数据) */
  prompt: string
  /** LLM 生成的 markdown 内容 */
  content?: string
  /** Token 用量 (prompt + completion) */
  tokenUsage?: { prompt: number; completion: number; total: number }
  /** 调用的 LLM 模型 ID (Phase 87 preset) */
  modelId: string
  /** 数据源 (1 个或多个) */
  sources: InsightSource[]
  /** 错误信息 (status=failed 时) */
  error?: string
  /** 创建时间 */
  createdAt: string
  /** 完成时间 */
  completedAt?: string
  /** 创建人 */
  createdBy: string
  /** 缓存 TTL (秒) - 默认 24h */
  cacheTtlSec: number
}

export interface InsightTemplate {
  type: InsightTemplateType
  /** 模板名 (中文) */
  name: string
  /** 模板描述 */
  description: string
  /** 系统提示词 */
  systemPrompt: string
  /** 用户提示词模板 (含 {data} 占位符) */
  userPromptTemplate: string
  /** 推荐 maxTokens */
  maxTokens: number
  /** 推荐 temperature (0-1) */
  temperature: number
}

/**
 * 5 个内置模板 (V10 Day 16 内置)
 */
export const BUILTIN_INSIGHT_TEMPLATES: InsightTemplate[] = [
  {
    type: 'sales',
    name: '销售洞察',
    description: '分析销售额/客单价/转化率,识别增长机会与异常',
    systemPrompt:
      '你是一位资深零售分析师,擅长从销售数据中提炼洞察。请用 markdown 格式输出,包含 3-5 条关键发现 + 2-3 条行动建议。',
    userPromptTemplate:
      '请分析以下销售数据并生成洞察:\n\n{data}\n\n输出格式:\n## 关键发现\n- ...\n\n## 行动建议\n- ...\n\n## 风险提示\n- ...',
    maxTokens: 1024,
    temperature: 0.3,
  },
  {
    type: 'inventory',
    name: '库存洞察',
    description: '识别滞销品/缺货风险/周转率异常',
    systemPrompt: '你是一位供应链管理专家。请从库存数据中识别风险并给出建议。',
    userPromptTemplate:
      '请分析以下库存数据:\n\n{data}\n\n输出格式:\n## 库存健康度\n- ...\n\n## 滞销预警\n- ...\n\n## 补货建议\n- ...',
    maxTokens: 1024,
    temperature: 0.3,
  },
  {
    type: 'finance',
    name: '财务洞察',
    description: '分析收入/成本/利润,识别成本异常与盈利机会',
    systemPrompt: '你是一位 CFO 顾问。请从财务数据中提炼经营洞察。',
    userPromptTemplate:
      '请分析以下财务数据:\n\n{data}\n\n输出格式:\n## 盈利分析\n- ...\n\n## 成本异常\n- ...\n\n## 现金流风险\n- ...',
    maxTokens: 1024,
    temperature: 0.2,
  },
  {
    type: 'marketing',
    name: '营销洞察',
    description: '分析活动 ROI/转化漏斗/客户分群',
    systemPrompt: '你是一位增长黑客。请从营销数据中识别高 ROI 渠道。',
    userPromptTemplate:
      '请分析以下营销数据:\n\n{data}\n\n输出格式:\n## ROI 排名\n- ...\n\n## 高价值人群\n- ...\n\n## 投放优化建议\n- ...',
    maxTokens: 1024,
    temperature: 0.4,
  },
  {
    type: 'customer',
    name: '客户洞察',
    description: '分析复购率/客单价分布/流失风险',
    systemPrompt: '你是一位客户成功专家。请从客户数据中识别忠诚与流失模式。',
    userPromptTemplate:
      '请分析以下客户数据:\n\n{data}\n\n输出格式:\n## 客户分群\n- ...\n\n## 复购洞察\n- ...\n\n## 流失预警\n- ...',
    maxTokens: 1024,
    temperature: 0.3,
  },
]

/**
 * 缓存键 (用于内存 LRU)
 */
export function buildInsightCacheKey(
  tenantId: string,
  templateType: InsightTemplateType,
  sourcesHash: string,
): string {
  return `insight:${tenantId}:${templateType}:${sourcesHash}`
}

/**
 * 数据源哈希 (用于缓存键)
 */
export function hashSources(sources: InsightSource[]): string {
  // 简单稳定序列化 + SHA256 (避免循环依赖到 crypto)
  const sorted = [...sources].sort((a, b) =>
    `${a.type}:${a.refId}`.localeCompare(`${b.type}:${b.refId}`),
  )
  const normalized = JSON.stringify(sorted.map((s) => ({
    type: s.type,
    refId: s.refId,
    period: s.period,
    data: s.dataSnapshot,
  })))
  // 用 djb2 哈希 (32-bit) 转 hex
  let hash = 5381
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) + hash + normalized.charCodeAt(i)) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}
