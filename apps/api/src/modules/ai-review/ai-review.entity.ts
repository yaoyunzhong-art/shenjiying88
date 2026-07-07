/**
 * ai-review.entity.ts · AI Code Review 实体/接口定义 (Phase-19)
 *
 * 定义 AI Review 模块的核心数据类型:
 *   - ReviewRequest/ReviewResponse (PR评审请求/响应)
 *   - ReviewIssue/ReviewSummary (评审问题/摘要)
 *   - ReviewFile (变更文件模型)
 *   - ReviewConfig (评审配置)
 *   - CodeLanguage (支持的语言枚举)
 *   - ReviewSeverity/ReviewCategory (问题严重性/分类)
 */

// ─── 语言枚举 ──────────────────────────────────────────────────────────

/** 支持评审的代码语言 */
export type CodeLanguage =
  | 'typescript'
  | 'javascript'
  | 'python'
  | 'go'
  | 'rust'
  | 'java'
  | 'kotlin'
  | 'swift'
  | 'ruby'
  | 'php'
  | 'csharp'
  | 'cpp'
  | 'c'
  | 'sql'
  | 'yaml'
  | 'json'
  | 'markdown'
  | 'dockerfile'
  | 'shell'

// ─── 评审分类与严重性 ───────────────────────────────────────────────────

/** 评审问题分类 */
export type ReviewCategory =
  | 'security'       // 安全漏洞
  | 'performance'    // 性能问题
  | 'correctness'    // 逻辑正确性
  | 'maintainability' // 可维护性
  | 'style'          // 代码风格
  | 'test'           // 测试覆盖
  | 'documentation'  // 文档缺失
  | 'best_practice'  // 最佳实践
  | 'dependency'     // 依赖问题
  | 'architecture'   // 架构问题

/** 评审问题严重性 */
export type ReviewSeverity = 'critical' | 'major' | 'minor' | 'suggestion'

/** 评审状态 */
export type ReviewStatus = 'pending' | 'in_progress' | 'completed' | 'failed'

/** 评审代码库类型 */
export type ReviewRepositoryType = 'github' | 'gitlab' | 'bitbucket' | 'local'

// ─── 核心实体 ──────────────────────────────────────────────────────────

/**
 * 评审请求
 */
export interface ReviewRequest {
  /** 仓库类型 */
  repositoryType: ReviewRepositoryType
  /** 仓库名称 (org/repo) */
  repository: string
  /** PR/MR 编号 */
  pullRequestId: string | number
  /** PR 标题 */
  title: string
  /** PR 描述 */
  description: string
  /** 变更文件列表 */
  files: ReviewFile[]
  /** 发起人 */
  author: string
  /** 请求时间 (ISO string) */
  requestedAt: string
  /** 是否强制评审 (越过缓存) */
  force?: boolean
  /** 评审类别偏好 (可选筛选项) */
  categories?: ReviewCategory[]
  /** 自定义上下文 */
  customContext?: Record<string, unknown>
}

/**
 * 变更文件
 */
export interface ReviewFile {
  /** 文件路径 */
  filePath: string
  /** 文件语言 */
  language: CodeLanguage
  /** Diff 文本 */
  diff: string
  /** 新增行数 */
  additions: number
  /** 删除行数 */
  deletions: number
  /** 变更状态 */
  status: 'added' | 'modified' | 'deleted' | 'renamed'
}

/**
 * 评审响应
 */
export interface ReviewResponse {
  /** 评审唯一标识 */
  id: string
  /** 关联请求 */
  request: Pick<ReviewRequest, 'repository' | 'pullRequestId' | 'title'>
  /** 总体评分 (0-100) */
  overallScore: number
  /** 评审发现的问题 */
  issues: ReviewIssue[]
  /** 评审亮点 */
  strengths: string[]
  /** 评审摘要 */
  summary: string
  /** 是否需要人工复核 */
  needsApproverReview: boolean
  /** 耗时 (ms) */
  latencyMs: number
  /** 缓存命中 */
  cacheHit: boolean
  /** LLM 使用量 */
  usage?: {
    /** 输入 tokens */
    inputTokens: number
    /** 输出 tokens */
    outputTokens: number
    /** 花费 (USD) */
    costUsd: number
  }
  /** 评审状态 */
  status: ReviewStatus
  /** 评审完成时间 */
  completedAt: string
}

/**
 * 评审问题
 */
export interface ReviewIssue {
  /** 问题唯一标识 */
  id: string
  /** 分类 */
  category: ReviewCategory
  /** 严重性 */
  severity: ReviewSeverity
  /** 问题描述 */
  message: string
  /** 关联文件 */
  filePath: string
  /** 起始行号 */
  lineStart?: number
  /** 结束行号 */
  lineEnd?: number
  /** 建议修复 */
  suggestion?: string
  /** 代码片段 */
  codeSnippet?: string
  /** 参考链接 */
  referenceUrl?: string
}

/**
 * 评审配置
 */
export interface ReviewConfig {
  /** 配置唯一标识 */
  id: string
  /** 租户 ID */
  tenantId: string
  /** 仓库标识 */
  repository: string
  /** 是否启用自动评审 */
  enabled: boolean
  /** 评审触发条件 */
  triggerOn: {
    /** 标签匹配 (任一匹配即触发) */
    labels?: string[]
    /** 分支匹配 (glob) */
    branches?: string[]
    /** 文件路径匹配 (glob, 任一匹配即触发) */
    filePatterns?: string[]
  }
  /** 忽略文件模式 (glob) */
  ignorePatterns?: string[]
  /** 最低严重性 (低于此级别的跳过) */
  minSeverity?: ReviewSeverity
  /** 需要评审的分类 */
  categories?: ReviewCategory[]
  /** 自定义规则 */
  customRules?: Array<{
    name: string
    pattern: string
    message: string
    severity: ReviewSeverity
  }>
  /** 创建/更新时间 */
  createdAt: string
  updatedAt: string
}

/**
 * 评审摘要统计
 */
export interface ReviewSummary {
  /** 总计评审数 */
  totalReviews: number
  /** 成功评审数 */
  successfulReviews: number
  /** 总发现问题数 */
  totalIssues: number
  /** 各严重性问题计数 */
  issuesBySeverity: Record<ReviewSeverity, number>
  /** 各分类问题计数 */
  issuesByCategory: Record<ReviewCategory, number>
  /** 平均评分 */
  averageScore: number
  /** 平均延迟 (ms) */
  averageLatencyMs: number
  /** 缓存命中率 */
  cacheHitRate: number
  /** 统计周期起始 */
  periodStart: string
  /** 统计周期结束 */
  periodEnd: string
}

/**
 * 评审历史记录
 */
export interface ReviewRecord {
  /** 记录唯一标识 */
  id: string
  /** 租户 ID */
  tenantId: string
  /** 仓库 */
  repository: string
  /** PR 编号 */
  pullRequestId: string | number
  /** 评审状态 */
  status: ReviewStatus
  /** 总体评分 */
  overallScore: number
  /** 问题数 */
  issueCount: number
  /** 耗时 (ms) */
  latencyMs: number
  /** 创建时间 */
  createdAt: string
  /** 完成时间 */
  completedAt?: string
}

// ─── LLM 服务类型 ──────────────────────────────────────────────────────

/**
 * LLM Provider 名称
 */
export type LLMProviderName = 'claude' | 'openai' | 'deepseek' | 'gemini'

/**
 * LLM Provider 配置
 */
export interface LLMProviderConfig {
  /** Provider 名称 */
  name: LLMProviderName
  /** API Key (加密存储) */
  apiKey: string
  /** 模型名称 */
  model: string
  /** 最大 tokens */
  maxTokens: number
  /** 温度 */
  temperature: number
  /** 是否启用 */
  enabled: boolean
  /** 每月预算上限 (USD) */
  monthlyBudgetUsd: number
}
