/**
 * prompt-templates.ts · AI Code Reviewer 提示词模板 (Phase-19)
 *
 * 设计依据:
 *   - debt.md TD-002 (AI Review 准确率 ≥70%)
 *   - knowledge/patterns/quota-guard.md (跨领域知识注入)
 *
 * 设计原则:
 *   1. 角色定义清晰 (expert role + domain context)
 *   2. Few-shot examples ≥2 (提升一致性)
 *   3. 输出 JSON 严格 schema (便于解析)
 *   4. 温度 ≤0.3 (降低随机性)
 *
 * 模板分类:
 *   - REVIEW_DIFF: PR diff 评审
 *   - REVIEW_TEST: 测试覆盖建议
 *   - REVIEW_PERFORMANCE: 性能瓶颈识别
 *   - RFC_DRAFT: RFC 起草
 *   - LESSON_APPLY: 教训套用检查
 */

import type { LLMRequest } from './types'

// ─── 通用 Schema ────────────────────────────────────────────────────────

/**
 * Review 输出 Schema (强制 JSON)
 */
export interface ReviewOutput {
  /** 总体评分 1-10 */
  overallScore: number
  /** 问题列表 */
  issues: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
    category: 'security' | 'performance' | 'correctness' | 'maintainability' | 'style' | 'test' | 'arch'
    filePath: string
    lineRange?: [number, number]
    message: string
    suggestion?: string
    /** 引用教训 (从 knowledge/patterns/anti-patterns) */
    referencedLesson?: string
  }>
  /** 优点 */
  strengths: string[]
  /** 总结 */
  summary: string
  /** 是否需要 Approver 复审 */
  needsApproverReview: boolean
}

// ─── 模板: PR Diff 评审 ────────────────────────────────────────────────

export const REVIEW_DIFF_SYSTEM = `你是 shenjiying88 SaaS 平台的资深代码评审专家,具备以下背景:
- 10 年 NestJS / TypeScript 后端经验
- 熟悉多租户 SaaS 架构 (tenant isolation, quota, lifecycle)
- 熟悉神机营业务: 龙岩通关 (LYT), 跨门店优惠券, 会员积分, 营销活动
- 严格遵守 OWASP Top 10 安全规范
- 重视测试覆盖 (单测 ≥80%)

你的评审输出必须满足:
1. JSON 格式,严格符合 schema
2. 问题分级: critical > high > medium > low > info
3. 每个问题引用相关教训文件 (knowledge/patterns/knowledge/anti-patterns)
4. 中文回复 (代码注释保留英文)
5. 温度 ≤0.3 (确定性输出)
`

export const REVIEW_DIFF_USER_TEMPLATE = `请评审以下 PR diff:

**PR 标题**: {prTitle}
**PR 描述**: {prDescription}
**变更文件** ({fileCount} 个):

{filesContext}

**关联领域知识** (从 RAG 检索):
{knowledgeContext}

**评审要求**:
1. 识别安全漏洞 (OWASP Top 10)
2. 识别多租户违规 (cross-tenant data leak)
3. 识别 quota 守卫缺失 (knowledge/patterns/quota-guard.md)
4. 识别 reserve-rollback 缺失 (knowledge/patterns/reserve-rollback.md)
5. 评估测试覆盖 (单测 ≥80% 必要)
6. 评估性能影响 (响应时间 / 内存)
7. 输出 JSON,严格按 schema

**输出格式** (JSON):
{
  "overallScore": <1-10>,
  "issues": [
    {
      "severity": "<critical|high|medium|low|info>",
      "category": "<security|performance|correctness|maintainability|style|test|arch>",
      "filePath": "<path>",
      "lineRange": [<start>, <end>],
      "message": "<中文, ≤200 字>",
      "suggestion": "<修复建议, ≤200 字>",
      "referencedLesson": "<knowledge/patterns/...>"
    }
  ],
  "strengths": ["<优点 1>", "<优点 2>"],
  "summary": "<总评, ≤300 字>",
  "needsApproverReview": <boolean>
}
`

// ─── 模板: 测试覆盖建议 ────────────────────────────────────────────────

export const REVIEW_TEST_SYSTEM = `你是 shenjiying88 测试设计专家,专注于:
- NestJS 单测 (vitest + NestJS Testing Module)
- e2e 测试 (supertest)
- 边界条件 + 异常路径
- 测试金字塔: 70% 单测 + 20% 集成 + 10% e2e
`

export const REVIEW_TEST_USER_TEMPLATE = `请评审以下代码并生成测试用例建议:

**代码路径**: {filePath}
**代码摘要**: {codeSummary}

**当前测试覆盖**: {currentCoverage}%

**评审要求**:
1. 识别未覆盖分支 (if/else, switch, early return)
2. 识别未覆盖异常 (throw / Promise.reject)
3. 识别边界条件 (null, undefined, 空数组, 极大值)
4. 生成 ≥5 个单测 case + ≥2 个 e2e case
5. 估算覆盖率提升

**输出**: JSON { testCases: [{ type, name, setup, expect }], estimatedCoverage: number }
`

// ─── 模板: 性能瓶颈识别 ────────────────────────────────────────────────

export const REVIEW_PERFORMANCE_SYSTEM = `你是性能优化专家,擅长:
- 数据库查询优化 (N+1, index)
- NestJS 异步流 (Promise.all, BullMQ)
- Redis 缓存策略
- 响应时间预算 (< 200ms P95)
`

export const REVIEW_PERFORMANCE_USER_TEMPLATE = `请识别以下代码的性能瓶颈:

**代码路径**: {filePath}
**响应时间预算**: P95 < {budgetMs}ms
**预期 QPS**: {qps}

**评审要求**:
1. 识别 N+1 查询
2. 识别同步阻塞 (sync vs async)
3. 识别未使用缓存
4. 识别未使用 index
5. 给出优化方案 + 预期收益

**输出**: JSON { bottlenecks: [...], optimizations: [...], expectedImprovement: string }
`

// ─── 模板: RFC 起草 ─────────────────────────────────────────────────────

export const RFC_DRAFT_SYSTEM = `你是 RFC 起草助手,基于 V5.1 40 专家团机制编写 RFC:
- 5 级评级体系 (Observer/Reviewer/Approver/Owner/Champion)
- RFC 投票门槛: ≥3 Approver 同意 + 0 Champion 否决
- 时间窗口: 72 小时
- 关联教训: 引用 knowledge/lessons-learned + patterns
`

export const RFC_DRAFT_USER_TEMPLATE = `请根据以下需求起草 RFC:

**主题**: {topic}
**背景**: {background}
**提议方案**: {proposal}

**要求**:
1. 列出影响范围 (受影响的 phase / module)
2. 列出风险 + 缓解
3. 列出验收标准 (AC ≥3)
4. 列出关联文档
5. 列出 Approver 推荐候选
6. 引用相关教训

**输出**: 完整 RFC 草案 (Markdown)
`

// ─── 模板构造函数 ──────────────────────────────────────────────────────

/**
 * 构造 PR Diff 评审请求
 */
export function buildDiffReviewRequest(params: {
  prTitle: string
  prDescription: string
  filesContext: string
  fileCount: number
  knowledgeContext?: string
  cacheKey?: string
}): LLMRequest {
  const userPrompt = REVIEW_DIFF_USER_TEMPLATE
    .replace('{prTitle}', params.prTitle)
    .replace('{prDescription}', params.prDescription)
    .replace('{fileCount}', String(params.fileCount))
    .replace('{filesContext}', params.filesContext)
    .replace('{knowledgeContext}', params.knowledgeContext ?? '(无)')

  return {
    systemPrompt: REVIEW_DIFF_SYSTEM,
    userPrompt,
    maxOutputTokens: 4096,
    temperature: 0.2,
    cacheKey: params.cacheKey,
    metadata: { intent: 'review-diff' },
  }
}

/**
 * 构造测试评审请求
 */
export function buildTestReviewRequest(params: {
  filePath: string
  codeSummary: string
  currentCoverage: number
}): LLMRequest {
  const userPrompt = REVIEW_TEST_USER_TEMPLATE
    .replace('{filePath}', params.filePath)
    .replace('{codeSummary}', params.codeSummary)
    .replace('{currentCoverage}', String(params.currentCoverage))

  return {
    systemPrompt: REVIEW_TEST_SYSTEM,
    userPrompt,
    maxOutputTokens: 2048,
    temperature: 0.3,
    metadata: { intent: 'review-test' },
  }
}

/**
 * 构造性能评审请求
 */
export function buildPerformanceReviewRequest(params: {
  filePath: string
  budgetMs: number
  qps: number
}): LLMRequest {
  const userPrompt = REVIEW_PERFORMANCE_USER_TEMPLATE
    .replace('{filePath}', params.filePath)
    .replace('{budgetMs}', String(params.budgetMs))
    .replace('{qps}', String(params.qps))

  return {
    systemPrompt: REVIEW_PERFORMANCE_SYSTEM,
    userPrompt,
    maxOutputTokens: 2048,
    temperature: 0.2,
    metadata: { intent: 'review-performance' },
  }
}

/**
 * 构造 RFC 起草请求
 */
export function buildRFCDraftRequest(params: {
  topic: string
  background: string
  proposal: string
}): LLMRequest {
  const userPrompt = RFC_DRAFT_USER_TEMPLATE
    .replace('{topic}', params.topic)
    .replace('{background}', params.background)
    .replace('{proposal}', params.proposal)

  return {
    systemPrompt: RFC_DRAFT_SYSTEM,
    userPrompt,
    maxOutputTokens: 4096,
    temperature: 0.4,
    metadata: { intent: 'rfc-draft' },
  }
}

// ─── Few-shot Examples ─────────────────────────────────────────────────

/**
 * PR Diff 评审 Few-shot Example
 * (提升模型一致性,降低幻觉)
 */
export const REVIEW_DIFF_EXAMPLE: ReviewOutput = {
  overallScore: 6,
  issues: [
    {
      severity: 'high',
      category: 'security',
      filePath: 'apps/api/src/modules/member/member.service.ts',
      lineRange: [45, 52],
      message: 'registerPersistent 缺少 tenant 隔离校验,可能导致跨租户数据泄漏',
      suggestion: '头部添加 assertTenantContext(tenantId) + 数据库查询强制 tenantId WHERE',
      referencedLesson: 'knowledge/patterns/quota-guard.md',
    },
    {
      severity: 'medium',
      category: 'arch',
      filePath: 'apps/api/src/modules/campaign/campaign.service.ts',
      lineRange: [88, 95],
      message: '创建 campaign 未通过 quota 守卫,可能导致超额',
      suggestion: '头部调用 assertCanWriteResource(tenantId, Campaign)',
      referencedLesson: 'knowledge/patterns/reserve-rollback.md',
    },
  ],
  strengths: [
    '使用 class-validator 完整校验 DTO',
    'Pulse-15E 已集成 lifecycle + quota 守卫',
  ],
  summary: '整体架构清晰,但 registerPersistent 缺 tenant 隔离 + quota 守卫,需 Approver 复审',
  needsApproverReview: true,
}
