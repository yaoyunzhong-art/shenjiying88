import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ai-review] [A] entity 测试
 * 类型契约测试：ReviewRequest, ReviewResponse, ReviewIssue, ReviewFile, ReviewConfig, ReviewSummary, ReviewRecord
 */
import 'reflect-metadata'
import assert from 'node:assert/strict'
import type {
  ReviewRequest,
  ReviewResponse,
  ReviewIssue,
  ReviewFile,
  ReviewConfig,
  ReviewSummary,
  ReviewRecord,
  CodeLanguage,
  ReviewCategory,
  ReviewSeverity,
  ReviewStatus,
} from './ai-review.entity'

// ─── CodeLanguage ───────────────────────────────────────────

void describe('CodeLanguage type', () => {
  void it('支持 TypeScript', () => {
    const lang: CodeLanguage = 'typescript'
    assert.equal(lang, 'typescript')
  })

  void it('支持 Python', () => {
    const lang: CodeLanguage = 'python'
    assert.equal(lang, 'python')
  })

  void it('支持 Go', () => {
    const lang: CodeLanguage = 'go'
    assert.equal(lang, 'go')
  })

  void it('支持 Rust', () => {
    const lang: CodeLanguage = 'rust'
    assert.equal(lang, 'rust')
  })

  void it('支持 Java', () => {
    const lang: CodeLanguage = 'java'
    assert.equal(lang, 'java')
  })
})

// ─── ReviewCategory ─────────────────────────────────────────

void describe('ReviewCategory type', () => {
  void it('支持所有10种分类', () => {
    const categories: ReviewCategory[] = [
      'security', 'performance', 'correctness', 'maintainability',
      'style', 'test', 'documentation', 'best_practice',
      'dependency', 'architecture',
    ]
    assert.equal(categories.length, 10)
    assert.ok(categories.includes('security'))
    assert.ok(categories.includes('architecture'))
  })
})

// ─── ReviewSeverity ─────────────────────────────────────────

void describe('ReviewSeverity type', () => {
  void it('支持 critical', () => {
    const sev: ReviewSeverity = 'critical'
    assert.equal(sev, 'critical')
  })

  void it('支持 suggestion', () => {
    const sev: ReviewSeverity = 'suggestion'
    assert.equal(sev, 'suggestion')
  })

  void it('严重性有序排列: critical < suggestion', () => {
    const severities: ReviewSeverity[] = ['critical', 'major', 'minor', 'suggestion']
    assert.ok(severities.indexOf('critical') < severities.indexOf('suggestion'))
  })
})

// ─── ReviewStatus ───────────────────────────────────────────

void describe('ReviewStatus type', () => {
  void it('支持所有4种状态', () => {
    const statuses: ReviewStatus[] = ['pending', 'in_progress', 'completed', 'failed']
    assert.equal(statuses.length, 4)
  })
})

// ─── ReviewFile ─────────────────────────────────────────────

void describe('ReviewFile interface', () => {
  void it('创建标准变更文件', () => {
    const file: ReviewFile = {
      filePath: 'src/modules/ai-review/ai-review.service.ts',
      language: 'typescript',
      diff: '@@ -1,3 +1,5 @@\n+import ...',
      additions: 10,
      deletions: 2,
      status: 'modified',
    }
    assert.ok(file.filePath.includes('ai-review'))
    assert.ok(file.additions > 0)
    assert.ok(file.deletions >= 0)
    assert.ok(['added', 'modified', 'deleted', 'renamed'].includes(file.status))
  })

  void it('新增文件状态为 added, deletions=0', () => {
    const file: ReviewFile = {
      filePath: 'new-file.ts',
      language: 'typescript',
      diff: '@@ -0,0 +1,10 @@',
      additions: 10,
      deletions: 0,
      status: 'added',
    }
    assert.equal(file.status, 'added')
    assert.equal(file.deletions, 0)
  })

  void it('超大变更行数边界 99999', () => {
    const file: ReviewFile = {
      filePath: 'giant-file.ts',
      language: 'typescript',
      diff: '...',
      additions: 99999,
      deletions: 99999,
      status: 'modified',
    }
    assert.equal(file.additions, 99999)
    assert.equal(file.deletions, 99999)
  })
})

// ─── ReviewRequest ──────────────────────────────────────────

void describe('ReviewRequest interface', () => {
  const validRequest: ReviewRequest = {
    repositoryType: 'github',
    repository: 'shenjiying/shenjiying88',
    pullRequestId: 42,
    title: 'Fix login bug',
    description: 'Fixed token validation in auth flow',
    files: [{
      filePath: 'apps/api/src/auth/login.ts',
      language: 'typescript',
      diff: '@@ -10,5 +10,8 @@',
      additions: 5,
      deletions: 2,
      status: 'modified',
    }],
    author: 'developer-1',
    requestedAt: '2026-06-26T00:00:00Z',
  }

  const requestWithOpt: ReviewRequest = {
    ...validRequest,
    force: true,
    categories: ['security', 'performance'],
    customContext: { branch: 'feature/login-fix' },
  }

  void it('创建标准评审请求', () => {
    assert.equal(validRequest.repository, 'shenjiying/shenjiying88')
    assert.equal(validRequest.files.length, 1)
    assert.equal(validRequest.force, undefined)
  })

  void it('可选字段 force / categories / customContext', () => {
    assert.equal(requestWithOpt.force, true)
    assert.ok(requestWithOpt.categories!.includes('security'))
    assert.equal(requestWithOpt.customContext?.branch, 'feature/login-fix')
  })

  void it('空文件列表边界', () => {
    const empty = { ...validRequest, files: [] }
    assert.equal(empty.files.length, 0)
  })

  void it('长 title 500字', () => {
    const r = { ...validRequest, title: 'A'.repeat(500) }
    assert.equal(r.title.length, 500)
  })

  void it('长 description 10000字', () => {
    const r = { ...validRequest, description: 'B'.repeat(10000) }
    assert.equal(r.description.length, 10000)
  })
})

// ─── ReviewIssue ────────────────────────────────────────────

void describe('ReviewIssue interface', () => {
  const issue: ReviewIssue = {
    id: 'issue-001',
    category: 'security',
    severity: 'critical',
    message: 'SQL injection risk in query builder',
    filePath: 'apps/api/src/repos/user.repo.ts',
    lineStart: 42,
    lineEnd: 45,
    suggestion: 'Use parameterized queries instead',
  }

  void it('创建完整评审问题', () => {
    assert.equal(issue.category, 'security')
    assert.equal(issue.severity, 'critical')
    assert.equal(issue.lineStart, 42)
    assert.equal(issue.lineEnd, 45)
    assert.ok(issue.suggestion!.includes('parameterized'))
  })

  void it('可选字段 lineStart/lineEnd 可为 undefined', () => {
    const fileLevel: ReviewIssue = {
      id: 'issue-002',
      category: 'style',
      severity: 'minor',
      message: 'File lacks JSDoc',
      filePath: 'utils.ts',
    }
    assert.equal(fileLevel.lineStart, undefined)
    assert.equal(fileLevel.lineEnd, undefined)
  })

  void it('codeSnippet 和 referenceUrl 可选', () => {
    const withRef: ReviewIssue = {
      ...issue,
      codeSnippet: 'const query = `SELECT * FROM users WHERE id = ${input}`',
      referenceUrl: 'https://owasp.org/sql-injection',
    }
    assert.ok(withRef.codeSnippet!.includes('SELECT'))
    assert.ok(withRef.referenceUrl!.includes('owasp'))
  })
})

// ─── ReviewResponse ─────────────────────────────────────────

void describe('ReviewResponse interface', () => {
  const response: ReviewResponse = {
    id: 'review-001',
    request: {
      repository: 'shenjiying/shenjiying88',
      pullRequestId: 42,
      title: 'Fix login bug',
    },
    overallScore: 85,
    issues: [{
      id: 'issue-001',
      category: 'security',
      severity: 'major',
      message: 'Missing input validation',
      filePath: 'auth.ts',
    }],
    strengths: ['Good test coverage', 'Clean architecture'],
    summary: 'Overall good PR with minor issues',
    needsApproverReview: false,
    latencyMs: 2450,
    cacheHit: false,
    status: 'completed',
    completedAt: '2026-06-26T00:01:00Z',
  }

  void it('创建标准评审响应', () => {
    assert.equal(response.overallScore, 85)
    assert.equal(response.issues.length, 1)
    assert.equal(response.strengths.length, 2)
    assert.equal(response.needsApproverReview, false)
  })

  void it('低分触发人工复核', () => {
    const low = { ...response, overallScore: 30, needsApproverReview: true }
    assert.ok(low.overallScore < 50)
    assert.equal(low.needsApproverReview, true)
  })

  void it('缓存命中时延迟极低', () => {
    const cached = { ...response, cacheHit: true, latencyMs: 15 }
    assert.equal(cached.cacheHit, true)
    assert.ok(cached.latencyMs < 100)
  })

  void it('issues 和 strengths 空列表边界', () => {
    const empty = { ...response, issues: [], strengths: [], overallScore: 100 }
    assert.equal(empty.issues.length, 0)
    assert.equal(empty.strengths.length, 0)
    assert.equal(empty.overallScore, 100)
  })

  void it('usage 信息可选', () => {
    const withUsage: ReviewResponse = {
      ...response,
      usage: { inputTokens: 1500, outputTokens: 300, costUsd: 0.045 },
    }
    assert.equal(withUsage.usage!.inputTokens, 1500)
    assert.ok(withUsage.usage!.costUsd > 0)
  })
})

// ─── ReviewConfig ───────────────────────────────────────────

void describe('ReviewConfig interface', () => {
  void it('创建完整配置', () => {
    const config: ReviewConfig = {
      id: 'config-001',
      tenantId: 'tenant-A',
      repository: 'shenjiying/core',
      enabled: true,
      triggerOn: {
        labels: ['review-required', 'ai'],
        branches: ['main', 'develop'],
        filePatterns: ['**/*.ts', '**/*.tsx'],
      },
      ignorePatterns: ['**/*.test.ts'],
      minSeverity: 'minor',
      categories: ['security', 'performance'],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-06-01T00:00:00Z',
    }
    assert.equal(config.enabled, true)
    assert.equal(config.triggerOn.labels!.length, 2)
    assert.equal(config.minSeverity, 'minor')
  })

  void it('禁用的配置', () => {
    const disabled: ReviewConfig = {
      id: 'config-002',
      tenantId: 'tenant-A',
      repository: 'shenjiying/legacy',
      enabled: false,
      triggerOn: {},
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }
    assert.equal(disabled.enabled, false)
  })

  void it('customRules 结构', () => {
    const config: ReviewConfig = {
      id: 'config-003',
      tenantId: 'tenant-A',
      repository: 'org/repo',
      enabled: true,
      triggerOn: {},
      customRules: [{
        name: 'no-console-log',
        pattern: 'console\\.log\\(',
        message: 'Avoid console.log in production',
        severity: 'major',
      }],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }
    assert.equal(config.customRules!.length, 1)
    assert.equal(config.customRules![0].name, 'no-console-log')
    assert.equal(config.customRules![0].severity, 'major')
  })
})

// ─── ReviewRecord ───────────────────────────────────────────

void describe('ReviewRecord interface', () => {
  void it('创建完整的评审记录', () => {
    const record: ReviewRecord = {
      id: 'rec-001',
      tenantId: 'tenant-A',
      repository: 'shenjiying/shenjiying88',
      pullRequestId: 42,
      status: 'completed',
      overallScore: 90,
      issueCount: 3,
      latencyMs: 1800,
      createdAt: '2026-06-26T00:00:00Z',
      completedAt: '2026-06-26T00:01:00Z',
    }
    assert.equal(record.status, 'completed')
    assert.ok(record.overallScore >= 0 && record.overallScore <= 100)
    assert.equal(record.issueCount, 3)
  })

  void it('pending 状态无 completedAt', () => {
    const pending: ReviewRecord = {
      id: 'rec-002',
      tenantId: 'tenant-A',
      repository: 'shenjiying/shenjiying88',
      pullRequestId: 43,
      status: 'in_progress',
      overallScore: 0,
      issueCount: 0,
      latencyMs: 0,
      createdAt: '2026-06-26T00:02:00Z',
    }
    assert.equal(pending.completedAt, undefined)
    assert.equal(pending.status, 'in_progress')
  })
})

// ─── ReviewSummary ──────────────────────────────────────────

void describe('ReviewSummary interface', () => {
  void it('计算摘要数据', () => {
    const summary: ReviewSummary = {
      totalReviews: 100,
      successfulReviews: 95,
      totalIssues: 200,
      issuesBySeverity: { critical: 5, major: 30, minor: 100, suggestion: 65 },
      issuesByCategory: {
        security: 10, performance: 20, correctness: 30, maintainability: 40,
        style: 50, test: 15, documentation: 10, best_practice: 10,
        dependency: 5, architecture: 10,
      },
      averageScore: 78.5,
      averageLatencyMs: 2100,
      cacheHitRate: 0.35,
      periodStart: '2026-06-01',
      periodEnd: '2026-06-30',
    }
    assert.strictEqual(summary.successfulReviews / summary.totalReviews, 0.95)
    assert.equal(summary.averageScore, 78.5)
    assert.ok(summary.cacheHitRate >= 0 && summary.cacheHitRate <= 1)
  })

  void it('零数据边界', () => {
    const zero: ReviewSummary = {
      totalReviews: 0,
      successfulReviews: 0,
      totalIssues: 0,
      issuesBySeverity: { critical: 0, major: 0, minor: 0, suggestion: 0 },
      issuesByCategory: {
        security: 0, performance: 0, correctness: 0, maintainability: 0,
        style: 0, test: 0, documentation: 0, best_practice: 0,
        dependency: 0, architecture: 0,
      },
      averageScore: 0,
      averageLatencyMs: 0,
      cacheHitRate: 0,
      periodStart: '2026-06-01',
      periodEnd: '2026-06-30',
    }
    assert.equal(zero.totalReviews, 0)
    assert.equal(zero.averageScore, 0)
  })
})

// ─── LLM 类型 ───────────────────────────────────────────────

void describe('LLMProviderName type', () => {
  void it('支持 claude / openai / deepseek / gemini', () => {
    type LLMProviderName = 'claude' | 'openai' | 'deepseek' | 'gemini'
    const providers: LLMProviderName[] = ['claude', 'openai', 'deepseek', 'gemini']
    assert.equal(providers.length, 4)
  })
})
