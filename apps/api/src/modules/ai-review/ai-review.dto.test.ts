import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ai-review] [A] dto 测试
 * class-validator 验证：SubmitReviewDto, ReviewFileDto, CreateReviewConfigDto, TriggerOnDto, ReviewHistoryQueryDto, ReviewSummaryQueryDto
 */
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { validate } from 'class-validator'
import {
  SubmitReviewDto,
  ReviewFileDto,
  CreateReviewConfigDto,
  TriggerOnDto,
  ReviewHistoryQueryDto,
  ReviewSummaryQueryDto,
} from './ai-review.dto'

// ─── 辅助函数 ───────────────────────────────────────────────

function makeFile(overrides: Record<string, unknown> = {}): ReviewFileDto {
  const dto = new ReviewFileDto()
  dto.filePath = 'src/main.ts'
  dto.language = 'typescript'
  dto.diff = '@@ -1,3 +1,5 @@\n+export const x = 1'
  dto.additions = 5
  dto.deletions = 2
  dto.status = 'modified'
  Object.assign(dto, overrides)
  return dto
}

function makeSubmit(overrides: Record<string, unknown> = {}): SubmitReviewDto {
  const dto = new SubmitReviewDto()
  dto.repositoryType = 'github'
  dto.repository = 'shenjiying/shenjiying88'
  dto.pullRequestId = 42
  dto.title = 'Fix login validation'
  dto.description = 'Fixed token expiry check'
  dto.files = [makeFile()]
  dto.author = 'dev-user'
  Object.assign(dto, overrides)
  return dto
}

// ─── ReviewFileDto ──────────────────────────────────────────

void describe('ReviewFileDto', () => {
  void it('有效文件通过验证', async () => {
    const dto = makeFile()
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  void it('空 filePath 报错', async () => {
    const dto = makeFile({ filePath: '' })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.equal(errors[0].property, 'filePath')
  })

  void it('无效 language 报错', async () => {
    const dto = makeFile({ language: 'invalid-lang' })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.equal(errors[0].property, 'language')
  })

  void it('负值 additions 报错', async () => {
    const dto = makeFile({ additions: -1 })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  void it('超大 additions (100000) 报错', async () => {
    const dto = makeFile({ additions: 100000 })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  void it('无效 status 报错', async () => {
    const dto = makeFile({ status: 'invalid' })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  void it('空 diff 报错', async () => {
    const dto = makeFile({ diff: '' })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  void it('deleted 状态通过验证', async () => {
    const dto = makeFile({ status: 'deleted', additions: 0, deletions: 100 })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  void it('added 状态通过验证', async () => {
    const dto = makeFile({ status: 'added', deletions: 0 })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  void it('超长 filePath (501) 报错', async () => {
    const dto = makeFile({ filePath: 'x'.repeat(501) })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })
})

// ─── SubmitReviewDto ────────────────────────────────────────

void describe('SubmitReviewDto', () => {
  void it('有效请求通过验证', async () => {
    const dto = makeSubmit()
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  void it('空 repositoryType 报错', async () => {
    const dto = makeSubmit({ repositoryType: '' })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  void it('无效 repositoryType 报错', async () => {
    const dto = makeSubmit({ repositoryType: 'gitlab' })  // 'gitlab' is valid actually
    const errors = await validate(dto)
    assert.equal(errors.length, 0)  // gitlab is valid
  })

  void it('完全无效 repositoryType 报错', async () => {
    const dto = makeSubmit({ repositoryType: 'svn' })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  void it('空 repository 报错', async () => {
    const dto = makeSubmit({ repository: '' })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  void it('空 title 报错', async () => {
    const dto = makeSubmit({ title: '' })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  void it('空 description 报错', async () => {
    const dto = makeSubmit({ description: '' })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  void it('空 author 报错', async () => {
    const dto = makeSubmit({ author: '' })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  void it('pullRequestId=0 报错', async () => {
    const dto = makeSubmit({ pullRequestId: 0 })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  void it('pullRequestId=1000000 报错', async () => {
    const dto = makeSubmit({ pullRequestId: 1000000 })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  void it('空 files 列表报错', async () => {
    const dto = makeSubmit({ files: [] })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  void it('force=true 通过验证', async () => {
    const dto = makeSubmit({ force: true })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  void it('有效 categories 通过验证', async () => {
    const dto = makeSubmit({ categories: ['security', 'performance'] })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  void it('无效 categories 报错', async () => {
    const dto = makeSubmit({ categories: ['invalid-cat'] })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })
})

// ─── TriggerOnDto ───────────────────────────────────────────

void describe('TriggerOnDto', () => {
  void it('空对象通过验证', async () => {
    const dto = new TriggerOnDto()
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  void it('有效标签/分支/文件模式', async () => {
    const dto = new TriggerOnDto()
    dto.labels = ['review-required', 'ai-review']
    dto.branches = ['main', 'develop']
    dto.filePatterns = ['**/*.ts']
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })
})

// ─── CreateReviewConfigDto ──────────────────────────────────

void describe('CreateReviewConfigDto', () => {
  void it('有效配置通过验证', async () => {
    const dto = new CreateReviewConfigDto()
    dto.tenantId = 'tenant-A'
    dto.repository = 'shenjiying/core'
    dto.enabled = true
    dto.minSeverity = 'major'
    dto.categories = ['security']
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  void it('空 tenantId 报错', async () => {
    const dto = new CreateReviewConfigDto()
    dto.tenantId = ''
    dto.repository = 'org/repo'
    dto.enabled = true
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  void it('空 repository 报错', async () => {
    const dto = new CreateReviewConfigDto()
    dto.tenantId = 'tenant-A'
    dto.repository = ''
    dto.enabled = true
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  void it('无效 minSeverity 报错', async () => {
    const dto = new CreateReviewConfigDto()
    dto.tenantId = 'tenant-A'
    dto.repository = 'org/repo'
    dto.enabled = true
    dto.minSeverity = 'super-critical' as any
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  void it('disabled 配置通过验证', async () => {
    const dto = new CreateReviewConfigDto()
    dto.tenantId = 'tenant-A'
    dto.repository = 'org/repo'
    dto.enabled = false
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  void it('triggerOn 嵌套验证', async () => {
    const dto = new CreateReviewConfigDto()
    dto.tenantId = 'tenant-A'
    dto.repository = 'org/repo'
    dto.enabled = true
    dto.triggerOn = new TriggerOnDto()
    dto.triggerOn.labels = ['review']
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })
})

// ─── ReviewHistoryQueryDto ──────────────────────────────────

void describe('ReviewHistoryQueryDto', () => {
  void it('空查询通过验证 (全部可选)', async () => {
    const dto = new ReviewHistoryQueryDto()
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  void it('repository 过滤', async () => {
    const dto = new ReviewHistoryQueryDto()
    dto.repository = 'shenjiying/shenjiying88'
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  void it('limit=50 通过验证', async () => {
    const dto = new ReviewHistoryQueryDto()
    dto.limit = 50
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  void it('limit=200 超出范围报错', async () => {
    const dto = new ReviewHistoryQueryDto()
    dto.limit = 200
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  void it('无效 status 报错', async () => {
    const dto = new ReviewHistoryQueryDto()
    dto.status = 'unknown' as any
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })
})

// ─── ReviewSummaryQueryDto ──────────────────────────────────

void describe('ReviewSummaryQueryDto', () => {
  void it('有效请求通过验证', async () => {
    const dto = new ReviewSummaryQueryDto()
    dto.tenantId = 'tenant-A'
    dto.periodStart = '2026-06-01'
    dto.periodEnd = '2026-06-30'
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  void it('空 tenantId 报错', async () => {
    const dto = new ReviewSummaryQueryDto()
    dto.tenantId = ''
    dto.periodStart = '2026-06-01'
    dto.periodEnd = '2026-06-30'
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  void it('空 periodStart 报错', async () => {
    const dto = new ReviewSummaryQueryDto()
    dto.tenantId = 'tenant-A'
    dto.periodStart = ''
    dto.periodEnd = '2026-06-30'
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  void it('空 periodEnd 报错', async () => {
    const dto = new ReviewSummaryQueryDto()
    dto.tenantId = 'tenant-A'
    dto.periodStart = '2026-06-01'
    dto.periodEnd = ''
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })
})
