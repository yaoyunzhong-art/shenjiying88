import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ai-reviewer] [C] 角色测试
 * 
 * 8 角色视角的 ai-reviewer 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { AIReviewerController } from './ai-reviewer.controller'
import { AIReviewerService } from './ai-reviewer.service'
import { ReviewRequestDto, RegisterRuleDto } from './ai-reviewer.dto'

// ── 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 测试数据工厂 ──
function createController() {
  const service = new AIReviewerService()
  return new AIReviewerController(service)
}

/**
 * 会触发检测的代码：
 * - unsafe-catch: catch (e) {} 空 catch 块
 * - console-log-in-service: console.log(
 * - missing-tenant-guard: .findOne({ where: { ... } })
 * - quota-double-increment: quota.reserve(...) 后跟 quota.increment(...)
 * - undefined-data-source: new xxxService(...undefined...undefined)
 */

/** 有安全问题的代码 — 可触发多个检测 */
const codeWithIssues = `import { Injectable } from '@nestjs/common'

@Injectable()
export class SomeService {
  async create(data: any) {
    try {
      const result = await this.quota.reserve(data.tenantId)
    } catch (e) {} // 空 catch — unsafe-catch

    console.log('debug') // console-log-in-service

    return this.repo.findOne({ where: { id: data.id } }) // missing-tenant-guard
  }
}`

/** 干净代码 — 不匹配任何规则 */
const cleanCode = `import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class SomeService {
  private readonly logger = new Logger(SomeService.name)

  async create(data: any) {
    return { success: true }
  }

  async get(id: string) {
    this.logger.log('fetching', id)
    return this.repo.findOneBy({ id })
  }
}`

// ── 👔店长 ──
describe(`${ROLES.StoreManager} ai-reviewer 角色测试`, () => {
  it('店长提交商户代码审查 => 正常返回审查结果', () => {
    const ctrl = createController()
    const body: ReviewRequestDto = {
      files: [
        { path: 'src/stores/shop-001/quota.service.ts', content: codeWithIssues },
      ],
    }

    const res = ctrl.review(body)

    assert.equal(res.totalFiles, 1)
    assert.ok(res.totalFindings > 0)
    assert.ok(Date.parse(res.createdAt) > 0)
    assert.ok(res.sessionId.startsWith('review-'))
    assert.ok(res.findings.length > 0)
    // Should detect the empty catch
    const unsafeCatch = res.findings.find(f => f.ruleId === 'unsafe-catch')
    assert.ok(unsafeCatch, '应检测到空的 catch 块')
    assert.equal(unsafeCatch!.severity, 'warn')
  })

  it('店长审查合规代码 => 无任何发现通过 CI', () => {
    const ctrl = createController()
    const body: ReviewRequestDto = {
      files: [
        { path: 'src/stores/shop-002/secure.service.ts', content: cleanCode },
      ],
    }

    const res = ctrl.ciVerify(body)
    assert.equal(res.pass, true)
    assert.equal(res.errorCount, 0)
    assert.equal(res.findings, 0)
  })

  it('店长查询可使用规则列表 => 返回完整规则', () => {
    const ctrl = createController()
    const rules = ctrl.listRules()

    assert.ok(rules.length >= 5)
    const ruleIds = rules.map(r => r.ruleId)
    assert.ok(ruleIds.includes('unsafe-catch'))
    assert.ok(ruleIds.includes('quota-double-increment'))
    rules.forEach(r => {
      assert.ok(r.ruleId)
      assert.ok(r.ruleName)
      assert.ok(['info', 'warn', 'error'].includes(r.severity))
    })
  })
})

// ── 🛒前台 ──
describe(`${ROLES.FrontDesk} ai-reviewer 角色测试`, () => {
  it('前台提交前台收银模块代码审查 => 返回可读的审查摘要', () => {
    const ctrl = createController()
    const body: ReviewRequestDto = {
      files: [
        { path: 'src/cashier/payment.service.ts', content: codeWithIssues },
      ],
    }

    const res = ctrl.review(body)

    assert.equal(res.totalFiles, 1)
    const severitySummary = res.summary
    assert.ok(typeof severitySummary.info === 'number')
    assert.ok(typeof severitySummary.warn === 'number')
    assert.ok(typeof severitySummary.error === 'number')
    // summary severity totals should equal totalFindings
    const totalBySeverity = severitySummary.info + severitySummary.warn + severitySummary.error
    assert.equal(totalBySeverity, res.totalFindings)
  })

  it('前台审查空文件内容 => 无发现', () => {
    const ctrl = createController()
    const body: ReviewRequestDto = {
      files: [
        { path: 'src/cashier/empty.service.ts', content: '// empty file\n' },
      ],
    }
    const res = ctrl.review(body)
    assert.equal(res.totalFiles, 1)
    assert.equal(res.totalFindings, 0)
    assert.ok(res.verdict.pass)
  })
})

// ── 👥HR ──
describe(`${ROLES.HR} ai-reviewer 角色测试`, () => {
  it('HR 审查新人代码质量 => 审查结果包含具体信息', () => {
    const ctrl = createController()
    const body: ReviewRequestDto = {
      files: [
        { path: 'src/hr/onboarding/badge.service.ts', content: codeWithIssues },
      ],
    }

    const res = ctrl.review(body)

    res.findings.forEach(f => {
      assert.ok(f.file)
      assert.ok(f.ruleId)
      assert.ok(f.ruleName)
      assert.ok(f.severity)
      assert.ok(f.snippet)
      assert.ok(f.message)
    })
  })

  it('HR 注册新审查规则 => 注册成功且规则出现在列表中', () => {
    const ctrl = createController()
    const ruleBody: RegisterRuleDto = {
      ruleId: 'onboarding-missing-tests',
      ruleName: '缺少单元测试',
      description: '新人模块校验文件是否对应有 .test.ts',
      severity: 'warn',
      pattern: 'spec\\.ts',
      reference: '.trae/specs/hr/onboarding-standards.md',
    }

    const regRes = ctrl.registerRule(ruleBody)
    assert.equal(regRes.ruleId, 'onboarding-missing-tests')
    assert.ok(regRes.message.includes('registered successfully'))

    const rules = ctrl.listRules()
    const found = rules.find(r => r.ruleId === 'onboarding-missing-tests')
    assert.ok(found)
    assert.equal(found!.ruleName, '缺少单元测试')
    assert.equal(found!.severity, 'warn')
  })
})

// ── 🔧安监 ──
describe(`${ROLES.Security} ai-reviewer 角色测试`, () => {
  it('安监审查安全敏感代码 => 检测到跨租户安全问题', () => {
    const ctrl = createController()
    // 触发 missing-tenant-guard: .findOne({ where: { ... } })
    const unsafeContent = `async function getUser(userId: string) {
  const user = await this.repo.findOne({ where: { id: userId } })
  return user
}`
    const body: ReviewRequestDto = {
      files: [
        { path: 'src/auth/user.service.ts', content: unsafeContent },
      ],
    }

    const res = ctrl.review(body)
    const tenantFinding = res.findings.find(f => f.ruleId === 'missing-tenant-guard')
    assert.ok(tenantFinding, '应检测到 missing-tenant-guard')
    assert.equal(tenantFinding!.severity, 'error')
    assert.ok(tenantFinding!.message)
  })

  it('安监运行 CI 验证 => error 级问题导致 CI 不通过', () => {
    const ctrl = createController()
    const body: ReviewRequestDto = {
      files: [
        { path: 'src/auth/unsafe.service.ts', content: codeWithIssues },
      ],
    }

    const ciRes = ctrl.ciVerify(body)
    // missing-tenant-guard is error-level => CI should fail
    assert.equal(ciRes.pass, false)
    assert.ok(ciRes.errorCount > 0)
    assert.ok(ciRes.findings > 0)
  })

  it('安监查询不存在的规则 => 返回错误信息', () => {
    const ctrl = createController()
    const res = ctrl.getRule('non-existent-rule-id')
    assert.ok(typeof res === 'object' && 'error' in res)
    assert.ok((res as { error: string }).error.includes('not found'))
  })
})

// ── 🎮导玩员 ──
describe(`${ROLES.Guide} ai-reviewer 角色测试`, () => {
  it('导玩员审查游戏模块代码 => 返回审查结果且有统计', () => {
    const ctrl = createController()
    const body: ReviewRequestDto = {
      files: [
        { path: 'src/game/tournament/scoring.service.ts', content: codeWithIssues },
        { path: 'src/game/matching/match.service.ts', content: cleanCode },
      ],
    }

    const res = ctrl.review(body)

    assert.equal(res.totalFiles, 2)
    assert.ok(res.totalFindings > 0)
    assert.ok(res.sessionId.startsWith('review-'))
  })

  it('导玩员查看规则详情 => 正常返回规则定义', () => {
    const ctrl = createController()
    const rule = ctrl.getRule('unsafe-catch')

    assert.ok(!('error' in rule))
    const safeRule = rule as Exclude<ReturnType<typeof ctrl.getRule>, { error: string }>
    assert.equal(safeRule.ruleId, 'unsafe-catch')
    assert.equal(safeRule.ruleName, '吞掉错误的 catch')
    assert.equal(safeRule.severity, 'warn')
    assert.ok(safeRule.description)
    assert.ok(safeRule.reference)
  })
})

// ── 🎯运行专员 ──
describe(`${ROLES.Operations} ai-reviewer 角色测试`, () => {
  it('运行专员执行 CI 验证 => 返回精确的错误计数', () => {
    const ctrl = createController()
    const body: ReviewRequestDto = {
      files: [
        { path: 'src/infra/deploy.service.ts', content: codeWithIssues },
      ],
    }

    const ciRes = ctrl.ciVerify(body)

    assert.equal(typeof ciRes.pass, 'boolean')
    assert.equal(typeof ciRes.errorCount, 'number')
    assert.equal(typeof ciRes.warnCount, 'number')
    assert.equal(typeof ciRes.findings, 'number')
    assert.ok(ciRes.errorCount > 0)
    assert.ok(ciRes.warnCount > 0)
  })

  it('运行专员审查无问题代码 => CI 通过', () => {
    const ctrl = createController()
    const body: ReviewRequestDto = {
      files: [
        { path: 'src/infra/clean.service.ts', content: cleanCode },
      ],
    }

    const ciRes = ctrl.ciVerify(body)
    assert.equal(ciRes.pass, true)
    assert.equal(ciRes.errorCount, 0)
    assert.equal(ciRes.warnCount, 0)
    assert.equal(ciRes.findings, 0)
  })
})

// ── 🤝团建 ──
describe(`${ROLES.Teambuilding} ai-reviewer 角色测试`, () => {
  it('团建审查团队项目代码 => 审查结果可供团队改进', () => {
    const ctrl = createController()
    const body: ReviewRequestDto = {
      files: [
        { path: 'src/team-building/activity.service.ts', content: codeWithIssues },
      ],
    }

    const res = ctrl.review(body)

    assert.ok(res.totalFindings > 0)
    // 每个 finding 都要有消息
    res.findings.forEach(f => {
      assert.ok(f.message, '每个 finding 必须有消息')
      assert.ok(f.ruleId, '每个 finding 必须有规则 ID')
    })
  })

  it('团建注册团队自定义规则 => 规则可被列出且严重度正确', () => {
    const ctrl = createController()
    const ruleBody: RegisterRuleDto = {
      ruleId: 'team-naming-convention',
      ruleName: '团队命名规范',
      description: '文件命名需遵循 kebab-case',
      severity: 'info',
      pattern: '[A-Z][a-z]+Service',
      reference: '.trae/specs/team/naming-convention.md',
    }

    ctrl.registerRule(ruleBody)
    const rules = ctrl.listRules()
    const rule = rules.find(r => r.ruleId === 'team-naming-convention')
    assert.ok(rule)
    assert.equal(rule!.severity, 'info')
    assert.equal(rule!.description, '文件命名需遵循 kebab-case')
  })
})

// ── 📢营销 ──
describe(`${ROLES.Marketing} ai-reviewer 角色测试`, () => {
  it('营销审查营销活动代码 => 发现空 catch 块', () => {
    const ctrl = createController()
    const marketingCode = `// 营销活动追踪
try {
  await trackCampaign(campaignId)
} catch (e) {} // 空 catch
console.log('campaign tracked')`

    const body: ReviewRequestDto = {
      files: [
        { path: 'src/marketing/campaign-tracking.service.ts', content: marketingCode },
      ],
    }

    const res = ctrl.review(body)
    const catchFinding = res.findings.find(f => f.ruleId === 'unsafe-catch')
    assert.ok(catchFinding, '应检测到空 catch')
    assert.equal(catchFinding!.severity, 'warn')
  })

  it('营销查询审查统计 => 即使无会话也有基础统计', () => {
    const ctrl = createController()
    const stats = ctrl.getStats()

    assert.ok(typeof stats.totalSessions === 'number')
    assert.ok(typeof stats.totalFindings === 'number')
    assert.ok(stats.passRate >= 0 && stats.passRate <= 1)
    assert.ok(typeof stats.findingsBySeverity === 'object')
    assert.ok(stats.lastSessionAt === null)
  })
})
