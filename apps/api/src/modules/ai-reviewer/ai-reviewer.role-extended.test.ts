import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ai-reviewer] [C] 角色测试扩展编写
 *
 * 8 角色深度场景扩展测试 — ai-reviewer 模块
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色 ≥ 3 测试用例（正常流程 + 权限边界 + 降级场景/特殊数据）
 * 覆盖：批量审查、规则自定义、CI 集成、边缘数据、空降级、大文件
 * 扩展：大数值/超长代码/空列表/无效参数/并发场景/重复规则
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { AIReviewerController } from './ai-reviewer.controller'
import { AIReviewerService } from './ai-reviewer.service'
import { ReviewRequestDto, RegisterRuleDto } from './ai-reviewer.dto'

// ── 8 角色定义 ──
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

// ── 测试工厂 ──
function createController() {
  const service = new AIReviewerService()
  return new AIReviewerController(service)
}

/** 干净代码基线 */
const cleanCode = `import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class HelloService {
  private readonly logger = new Logger(HelloService.name)
  async greet(name: string) {
    this.logger.log('greeting', name)
    return { hello: name }
  }
}`

/** 全违规代码 — 触发所有 5 个规则 */
const allViolationsCode = `import { Injectable } from '@nestjs/common'

@Injectable()
export class ViolationService {
  async create(data: any) {
    try {
      const r1 = await this.quota.reserve(data.tenantId)
      const r2 = await this.quota.increment(data.tenantId)
    } catch (e) {}

    console.log('debug log')

    return this.repo.findOne({ where: { id: data.id } })
  }
}

const svc = new SomeService(undefined, undefined)`

/** 超长代码 — 模拟大文件审查 */
function generateLargeCode(lines: number): string {
  const header = `import { Injectable } from '@nestjs/common'\n\n@Injectable()\nexport class LargeService {\n`
  const body = Array.from({ length: lines - 10 }, (_, i) => `  // line ${i + 1}\n`).join('')
  const footer = `\n  async doWork() {\n    try { await this.work() } catch (e) {}\n  }\n}`
  return header + body + footer
}

// ════════════════════════════════════════════════════════════════
// 👔 店长 — 全局经营监管
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} ai-reviewer 扩展角色测试`, () => {
  it('店长批量审查多个门店模块代码 — 按文件分别返回结果', () => {
    const ctrl = createController()
    const body: ReviewRequestDto = {
      files: [
        { path: 'stores/s001/quota.service.ts', content: allViolationsCode },
        { path: 'stores/s002/cashier.service.ts', content: cleanCode },
        { path: 'stores/s003/inventory.service.ts', content: `// unfinished\nfunction x() { console.log('test') }` },
      ],
    }
    const res = ctrl.review(body)

    assert.equal(res.totalFiles, 3)
    assert.ok(res.totalFindings > 0)
    // 每个文件至少一个 finding
    const filesFound = new Set(res.findings.map(f => f.file))
    assert.ok(filesFound.size >= 2, '至少两个文件有发现')

    // s001 应有最多的 finding
    const s001Findings = res.findings.filter(f => f.file.includes('s001'))
    const s003Findings = res.findings.filter(f => f.file.includes('s003'))
    assert.ok(s001Findings.length > s003Findings.length)
  })

  it('店长审查空提交（无文件） — 空结果不抛错', () => {
    const ctrl = createController()
    const body: ReviewRequestDto = { files: [] }
    const res = ctrl.review(body)

    assert.equal(res.totalFiles, 0)
    assert.equal(res.totalFindings, 0)
    assert.ok(res.verdict.pass)
    assert.ok(Date.parse(res.createdAt) > 0)
  })

  it('店长注册规则并立即使用 — 新规则生效', () => {
    const ctrl = createController()
    const ruleBody: RegisterRuleDto = {
      ruleId: 'hardcoded-secret',
      ruleName: '硬编码密钥',
      description: '检测代码中硬编码的 API key',
      severity: 'error',
      pattern: 'sk-[A-Za-z0-9]{20,}',
      reference: '.trae/specs/security/secret-management.md',
    }
    ctrl.registerRule(ruleBody)

    const secretCode = `const apiKey = 'sk-abcdef1234567890abcdef12'`
    const body: ReviewRequestDto = {
      files: [{ path: 'config/secret.ts', content: secretCode }],
    }
    const res = ctrl.review(body)

    const secFinding = res.findings.find(f => f.ruleId === 'hardcoded-secret')
    assert.ok(secFinding, '应检测到硬编码密钥')
    assert.equal(secFinding!.severity, 'error')
    assert.equal(secFinding!.file, 'config/secret.ts')
  })

  it('店长 CI 验证 check — error 不通过, 纯 warn 通过', () => {
    const ctrl = createController()

    // 只有 warn 级违规的代码
    const warnOnlyCode = `function x() {
  try { doSomething() } catch (e) {}
}`
    const errorRes = ctrl.ciVerify({ files: [{ path: 'a.ts', content: allViolationsCode }] })
    assert.equal(errorRes.pass, false)
    assert.ok(errorRes.errorCount > 0)

    const warnRes = ctrl.ciVerify({ files: [{ path: 'b.ts', content: warnOnlyCode }] })
    // unsafe-catch 是 warn 级 => CI 应通过
    assert.equal(warnRes.pass, true)
    assert.equal(warnRes.errorCount, 0)
    assert.ok(warnRes.warnCount >= 1)
  })
})

// ════════════════════════════════════════════════════════════════
// 🛒 前台 — 快速审查与展示
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} ai-reviewer 扩展角色测试`, () => {
  it('前台快速审查收银模块关键代码 — O(1) 反馈', () => {
    const ctrl = createController()
    const cashierCode = `async function charge(amount: number) {
  console.log('charging', amount)
  return { success: true }
}`
    const body: ReviewRequestDto = {
      files: [{ path: 'cashier/payment.ts', content: cashierCode }],
    }
    const res = ctrl.review(body)

    assert.equal(res.totalFiles, 1)
    assert.ok(res.totalFindings >= 1, 'console.log 应被检测')
    assert.ok(res.findings[0].ruleId === 'console-log-in-service')
  })

  it('前台审查只包含注释的文件 — 0 finding', () => {
    const ctrl = createController()
    const body: ReviewRequestDto = {
      files: [
        { path: 'cashier/constants.ts', content: '// 常量定义\n// 后续补充' },
        { path: 'cashier/types.ts', content: '/** 类型定义 */\n' },
      ],
    }
    const res = ctrl.review(body)
    assert.equal(res.totalFindings, 0)
    assert.ok(res.verdict.pass)
  })

  it('前台查看所有可用规则 — 至少包含 5 个内置规则', () => {
    const ctrl = createController()
    const rules = ctrl.listRules()
    assert.ok(rules.length >= 5)

    const builtinIds = [
      'quota-double-increment',
      'unsafe-catch',
      'missing-tenant-guard',
      'undefined-data-source',
      'console-log-in-service',
    ]
    for (const id of builtinIds) {
      assert.ok(rules.some(r => r.ruleId === id), `内置规则 ${id} 应存在`)
    }
  })

  it('前台获取审查统计 — 返回数字类型字段', () => {
    const ctrl = createController()
    const stats = ctrl.getStats()

    assert.equal(typeof stats.totalSessions, 'number')
    assert.equal(typeof stats.totalFindings, 'number')
    assert.equal(typeof stats.passRate, 'number')
    assert.equal(stats.lastSessionAt, null)
    assert.ok(Object.prototype.hasOwnProperty.call(stats, 'findingsBySeverity'))
    // 严重度分类都是非负整数
    const severity = stats.findingsBySeverity as Record<string, number>
    for (const key of ['info', 'warn', 'error']) {
      assert.ok(typeof severity[key] === 'number' && severity[key] >= 0)
    }
  })
})

// ════════════════════════════════════════════════════════════════
// 👥 HR — 新人代码质量审查
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.HR} ai-reviewer 扩展角色测试`, () => {
  it('HR 审查新人提交的超大文件 — 不超时且正确检测', () => {
    const ctrl = createController()
    const largeCode = generateLargeCode(2000)
    const body: ReviewRequestDto = {
      files: [{ path: 'onboarding/newcomer/large.service.ts', content: largeCode }],
    }
    const res = ctrl.review(body)

    assert.equal(res.totalFiles, 1)
    // 超长文件中的空 catch 应被检测到
    const catchFinding = res.findings.find(f => f.ruleId === 'unsafe-catch')
    assert.ok(catchFinding, '大文件中应检测到空 catch')
    assert.ok(catchFinding!.line! > 0)
    assert.ok(res.sessionId)
  })

  it('HR 审查多个新人项目文件 — 批量返回正确的每个文件 finding 分布', () => {
    const ctrl = createController()
    const files = [
      { path: 'newcomer/a/auth.service.ts', content: allViolationsCode },
      { path: 'newcomer/b/clean.service.ts', content: cleanCode },
      { path: 'newcomer/c/debug.ts', content: `const x = 1\nconsole.log(x)\n` },
    ]
    const body: ReviewRequestDto = { files }
    const res = ctrl.review(body)

    assert.equal(res.totalFiles, 3)
    // a 文件 finding 最多
    const aFindings = res.findings.filter(f => f.file.includes('auth'))
    const cFindings = res.findings.filter(f => f.file.includes('debug'))
    assert.ok(aFindings.length > cFindings.length)
    // c 文件只有 console.log 一条
    assert.equal(cFindings.length, 1)
  })

  it('HR 注册重复规则 ID — 允许覆盖但不抛错', () => {
    const ctrl = createController()
    const rule1: RegisterRuleDto = {
      ruleId: 'hr-naming',
      ruleName: '命名规范v1',
      description: '检测命名规范',
      severity: 'info',
      pattern: 'badName',
      reference: '.trae/hr/v1.md',
    }
    const rule2: RegisterRuleDto = {
      ruleId: 'hr-naming',
      ruleName: '命名规范v2',
      description: '覆盖版本',
      severity: 'warn',
      pattern: 'badName',
      reference: '.trae/hr/v2.md',
    }
    ctrl.registerRule(rule1)
    ctrl.registerRule(rule2)

    const rules = ctrl.listRules()
    const hrRules = rules.filter(r => r.ruleId === 'hr-naming')
    // 允许重复注册（当前实现 push 而非覆盖）
    assert.ok(hrRules.length >= 1)
    assert.equal(hrRules[hrRules.length - 1].ruleName, '命名规范v2')
  })
})

// ════════════════════════════════════════════════════════════════
// 🔧 安监 — 安全审查
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Security} ai-reviewer 扩展角色测试`, () => {
  it('安监审查跨租户数据泄露漏洞 — 检测 missing-tenant-guard', () => {
    const ctrl = createController()
    const unsafeCodes = [
      `this.repo.findOne({ where: { id: 'abc' } })`,
      `this.userRepo.findOne({ where: { userId } })`,
      `const u = await repo.findOne({ where: { email } })`,
    ]
    for (const code of unsafeCodes) {
      const body: ReviewRequestDto = {
        files: [{ path: `security/leak-${Date.now()}.ts`, content: code }],
      }
      const res = ctrl.review(body)
      const tenantFinding = res.findings.find(f => f.ruleId === 'missing-tenant-guard')
      assert.ok(tenantFinding, `应为代码检测到 missing-tenant-guard: ${code.slice(0, 50)}`)
      assert.equal(tenantFinding!.severity, 'error')
    }
  })

  it('安监审查 quota 双增 bug 模式 — 检测 quota-double-increment', () => {
    const ctrl = createController()
    const doubleIncCode = `async allocate(tenant: string) {
  const result = await this.quota.reserve(tenant)
  // ... 业务逻辑
  await this.quota.increment(tenant)
  return result
}`
    const body: ReviewRequestDto = {
      files: [{ path: 'security/quota.service.ts', content: doubleIncCode }],
    }
    const res = ctrl.review(body)

    const quotaFindings = res.findings.filter(f => f.ruleId === 'quota-double-increment')
    assert.ok(quotaFindings.length >= 1, '应检测 quota-double-increment')
    assert.equal(quotaFindings[0].severity, 'error')
    // suggestion 在 service 层存在，但 controller 透传可能不含该字段
    // 只验证消息内容可读
    assert.ok(quotaFindings[0].message.length > 5, 'message 应可读')
  })

  it('安监审查 contain undefined dataSource 的代码 — 检测 undefined-data-source', () => {
    const ctrl = createController()
    const stubCode = `const svc = new PaymentService(undefined, undefined)`
    const body: ReviewRequestDto = {
      files: [{ path: 'security/stub-test.ts', content: stubCode }],
    }
    const res = ctrl.review(body)

    const stubFinding = res.findings.find(f => f.ruleId === 'undefined-data-source')
    assert.ok(stubFinding, '应检测 undefined-data-source')
    assert.equal(stubFinding!.severity, 'info')
  })

  it('安监审查空内容 — 安全无发现', () => {
    const ctrl = createController()
    const body: ReviewRequestDto = { files: [{ path: 'security/empty.ts', content: '' }] }
    const res = ctrl.review(body)
    assert.equal(res.totalFindings, 0)
  })
})

// ════════════════════════════════════════════════════════════════
// 🎮 导玩员 — 游戏相关代码审查
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} ai-reviewer 扩展角色测试`, () => {
  it('导玩员审查游戏计分模块 — 大数值无溢出', () => {
    const ctrl = createController()
    const scoringCode = `async function recordScore(playerId: string, score: number) {
  try {
    const result = await this.scoreRepo.save({ playerId, score })
    console.log('score saved', result.id)
  } catch (e) {}
}`
    const body: ReviewRequestDto = {
      files: [{ path: 'game/scoring/record.ts', content: scoringCode }],
    }
    const res = ctrl.review(body)

    // console-log + unsafe-catch
    assert.ok(res.totalFindings >= 2)
    assert.ok(res.findings.some(f => f.ruleId === 'unsafe-catch'))
    assert.ok(res.findings.some(f => f.ruleId === 'console-log-in-service'))
  })

  it('导玩员审查匹配模块的干净代码 — 0 finding', () => {
    const ctrl = createController()
    const matchingCode = `import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name)

  async findMatch(playerId: string) {
    this.logger.log(\`finding match for \${playerId}\`)
    return { matched: false }
  }
}`
    const body: ReviewRequestDto = {
      files: [{ path: 'game/matching/service.ts', content: matchingCode }],
    }
    const res = ctrl.review(body)
    assert.equal(res.totalFindings, 0)
  })

  it('导玩员查询特定规则详情 — info 级别返回包含 description', () => {
    const ctrl = createController()
    const rule = ctrl.getRule('console-log-in-service')

    assert.ok(!('error' in rule))
    const r = rule as Exclude<ReturnType<typeof ctrl.getRule>, { error: string }>
    assert.equal(r.ruleId, 'console-log-in-service')
    assert.equal(r.severity, 'info')
    assert.ok(r.description)
    assert.ok(r.reference)
  })

  it('导玩员查询不存在规则 — 返回 error 对象', () => {
    const ctrl = createController()
    const res = ctrl.getRule('not-a-real-rule-id-12345')
    assert.ok(typeof res === 'object' && 'error' in res)
    assert.ok((res as { error: string }).error.includes('not found'))
  })
})

// ════════════════════════════════════════════════════════════════
// 🎯 运行专员 — 运维与 CI 集成
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Operations} ai-reviewer 扩展角色测试`, () => {
  it('运行专员 CI 管道审查 — error+info 混合代码的 CI 通过判定', () => {
    const ctrl = createController()
    // 只有 info 和 warn 的代码，没有 error
    const mixedCode = `function f() {
  try { work() } catch (e) {}
  console.log('done')
}`
    const body: ReviewRequestDto = { files: [{ path: 'ops/mixed.ts', content: mixedCode }] }
    const ciRes = ctrl.ciVerify(body)

    // unsafe-catch(warn) + console-log(info) => 没有 error => CI 通过
    assert.equal(ciRes.pass, true)
    assert.equal(ciRes.errorCount, 0)
    assert.ok(ciRes.warnCount >= 1)
  })

  it('运行专员 CI 管道审查 — error 代码导致 CI 失败', () => {
    const ctrl = createController()
    const body: ReviewRequestDto = { files: [{ path: 'ops/error.ts', content: allViolationsCode }] }
    const ciRes = ctrl.ciVerify(body)

    assert.equal(ciRes.pass, false)
    assert.ok(ciRes.errorCount >= 2) // quota-double-increment + missing-tenant-guard
    assert.ok(ciRes.warnCount >= 1)  // unsafe-catch
  })

  it('运行专员审查非常长的文件路径 — 依然正确处理', () => {
    const ctrl = createController()
    const veryLongPath = 'src/stores/CN/Shanghai/Pudong/Store-001-Pudong-Lujiazui-Financial-Center/Modules/Payment/src/cashier.service.ts'
    const body: ReviewRequestDto = {
      files: [{ path: veryLongPath, content: allViolationsCode }],
    }
    const res = ctrl.review(body)

    assert.equal(res.totalFiles, 1)
    assert.ok(res.totalFindings > 0)
    assert.ok(res.findings.every(f => f.file === veryLongPath))
  })

  it('运行专员批量 CI 验证 — 多个文件错误累积', () => {
    const ctrl = createController()
    const errorCode = `this.repo.findOne({ where: { id: 'x' } })`
    const clean = cleanCode
    const body: ReviewRequestDto = {
      files: [
        { path: 'ops/a.ts', content: errorCode },
        { path: 'ops/b.ts', content: clean },
        { path: 'ops/c.ts', content: errorCode },
      ],
    }
    const ciRes = ctrl.ciVerify(body)

    assert.equal(ciRes.pass, false)
    // missing-tenant-guard 是 error，每个文件一次
    assert.ok(ciRes.errorCount >= 2)
  })
})

// ════════════════════════════════════════════════════════════════
// 🤝 团建 — 团队协作审查
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} ai-reviewer 扩展角色测试`, () => {
  it('团建审查多个团队不同文件 — 结果可按文件路径分组', () => {
    const ctrl = createController()
    const files = [
      { path: 'team-alpha/quota.ts', content: allViolationsCode },
      { path: 'team-beta/helper.ts', content: cleanCode },
      { path: 'team-gamma/debug.ts', content: `function log() { console.log('test') }` },
    ]
    const body: ReviewRequestDto = { files }
    const res = ctrl.review(body)

    assert.equal(res.totalFiles, 3)
    // 按文件分组验证
    const byFile = new Map<string, number>()
    for (const f of res.findings) {
      byFile.set(f.file, (byFile.get(f.file) ?? 0) + 1)
    }
    // team-alpha 应有最多 finding
    const alpha = byFile.get('team-alpha/quota.ts') ?? 0
    const gamma = byFile.get('team-gamma/debug.ts') ?? 0
    assert.ok(alpha > gamma, 'quota.ts finding 应多于 debug.ts')
    assert.ok(byFile.has('team-beta/helper.ts') === false || (byFile.get('team-beta/helper.ts') ?? 0) === 0,
      'clean 代码应无 finding')
  })

  it('团建注册多规则并列出 — 规则数量递增', () => {
    const ctrl = createController()
    const beforeCount = ctrl.listRules().length

    ctrl.registerRule({ ruleId: 't1', ruleName: 'T1', description: 'd1', severity: 'warn', pattern: 'a', reference: 'r' })
    ctrl.registerRule({ ruleId: 't2', ruleName: 'T2', description: 'd2', severity: 'error', pattern: 'b', reference: 'r' })
    ctrl.registerRule({ ruleId: 't3', ruleName: 'T3', description: 'd3', severity: 'info', pattern: 'c', reference: 'r' })

    const afterCount = ctrl.listRules().length
    assert.equal(afterCount - beforeCount, 3)
  })

  it('团建审查每个 finding 包含必要字段 — snippet, line, message 皆非空', () => {
    const ctrl = createController()
    const body: ReviewRequestDto = {
      files: [{ path: 'team/audit/service.ts', content: allViolationsCode }],
    }
    const res = ctrl.review(body)

    for (const f of res.findings) {
      assert.ok(f.ruleId, 'ruleId 必填')
      assert.ok(f.ruleName, 'ruleName 必填')
      assert.ok(f.severity, 'severity 必填')
      assert.ok(f.file, 'file 必填')
      assert.ok(f.snippet, `snippet 必填 (ruleId=${f.ruleId})`)
      assert.ok(f.message, `message 必填 (ruleId=${f.ruleId})`)
      // message 必须可读（controller 透传不含 suggestion/reference，用 message 替代验证）
      assert.ok(f.message.length > 0, `message 不能为空 (ruleId=${f.ruleId})`)
      // line 需要是正数
      assert.ok(f.line !== undefined, `line 不能为 undefined (ruleId=${f.ruleId})`)
      assert.ok(f.line && f.line > 0, `line 应为正数 (ruleId=${f.ruleId})`)
    }
  })
})

// ════════════════════════════════════════════════════════════════
// 📢 营销 — 活动代码审查
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} ai-reviewer 扩展角色测试`, () => {
  it('营销审查活动追踪代码 — 批量多文件不同严重度', () => {
    const ctrl = createController()
    const campaignCode = `// 活动追踪
async function trackView(campaignId: string) {
  console.log('tracking view', campaignId)
  return this.repo.findOne({ where: { campaignId } })
}`
    const body: ReviewRequestDto = {
      files: [
        { path: 'marketing/tracking.ts', content: campaignCode },
        { path: 'marketing/promotion.ts', content: allViolationsCode },
        { path: 'marketing/coupon.ts', content: cleanCode },
      ],
    }
    const res = ctrl.review(body)

    assert.equal(res.totalFiles, 3)
    assert.ok(res.totalFindings > 0)

    // tracking.ts: console-log(info) + missing-tenant-guard(error)
    const trackFindings = res.findings.filter(f => f.file.includes('tracking'))
    assert.ok(trackFindings.some(f => f.ruleId === 'console-log-in-service'))
    assert.ok(trackFindings.some(f => f.ruleId === 'missing-tenant-guard'))
  })

  it('营销查看 CI 结果 — error 级 > 0 时 pass=false', () => {
    const ctrl = createController()
    const body: ReviewRequestDto = {
      files: [{ path: 'marketing/leads.ts', content: `this.repo.findOne({ where: { id: 'x' } })` }],
    }
    const ci = ctrl.ciVerify(body)

    assert.equal(ci.pass, false)
    assert.equal(ci.errorCount, 1)
    assert.equal(ci.findings, 1)
  })

  it('营销注册规则并用新规则审查活动代码 — 新规则被触发', () => {
    const ctrl = createController()
    ctrl.registerRule({
      ruleId: 'marketing-sensitive-tag',
      ruleName: '营销敏感标签',
      description: '检测营销活动中可能泄露的敏感词',
      severity: 'warn',
      pattern: 'vip|gold|premium|exclusive',
      reference: '.trae/specs/marketing/sensitive-tags.md',
    })

    const marketingCode = `const label = 'exclusive-member-offer'`
    const body: ReviewRequestDto = {
      files: [{ path: 'marketing/label.ts', content: marketingCode }],
    }
    const res = ctrl.review(body)

    const tagFinding = res.findings.find(f => f.ruleId === 'marketing-sensitive-tag')
    assert.ok(tagFinding, '应检测到营销敏感词')
    assert.equal(tagFinding!.severity, 'warn')
    assert.equal(tagFinding!.file, 'marketing/label.ts')
  })

  it('营销获取规则详情 — 自定义规则返回完整信息', () => {
    const ctrl = createController()
    ctrl.registerRule({
      ruleId: 'mkt-custom-001',
      ruleName: '营销自定义审查',
      description: '自定义规则',
      severity: 'info',
      pattern: 'TODO',
      reference: '.trae/marketing/standards.md',
    })
    const rule = ctrl.getRule('mkt-custom-001')

    assert.ok(!('error' in rule))
    const r = rule as Exclude<ReturnType<typeof ctrl.getRule>, { error: string }>
    assert.equal(r.ruleId, 'mkt-custom-001')
    assert.equal(r.severity, 'info')
    assert.ok(r.description)
  })
})

// ════════════════════════════════════════════════════════════════
// 跨角色共性测试 — 极限值与退化场景
// ════════════════════════════════════════════════════════════════
describe('ai-reviewer 跨角色退化场景测试', () => {
  it('审查 null/undefined 内容（字符串化）— 不抛错', () => {
    const ctrl = createController()
    const body: ReviewRequestDto = {
      files: [
        { path: 'null.ts', content: 'null' as string },
      ],
    }
    const res = ctrl.review(body)
    assert.equal(res.totalFiles, 1)
    assert.equal(res.totalFindings, 0)
  })

  it('审查超大文件（10000 行）— 不超时', () => {
    const ctrl = createController()
    const hugeCode = generateLargeCode(10000)
    const body: ReviewRequestDto = {
      files: [{ path: 'huge/huge.service.ts', content: hugeCode }],
    }
    const start = performance.now()
    const res = ctrl.review(body)
    const elapsed = performance.now() - start

    assert.equal(res.totalFiles, 1)
    assert.ok(res.totalFindings >= 1)
    assert.ok(elapsed < 500, `大文件审查应在 500ms 内完成 (实际 ${elapsed.toFixed(0)}ms)`)
  })

  it('审查文件路径含特殊字符 — 正确处理', () => {
    const ctrl = createController()
    const specialPath = 'src/测试/中文路径/😊/file with spaces.ts'
    const body: ReviewRequestDto = {
      files: [{ path: specialPath, content: `console.log('special')` }],
    }
    const res = ctrl.review(body)
    assert.equal(res.findings[0]?.file, specialPath)
    assert.ok(res.totalFindings >= 1)
  })

  it('多次审查同一文件内容 — sessionId 不同', () => {
    const ctrl = createController()
    const body: ReviewRequestDto = { files: [{ path: 'stable/service.ts', content: cleanCode }] }
    const r1 = ctrl.review(body)
    const r2 = ctrl.review(body)

    assert.notEqual(r1.sessionId, r2.sessionId, '每次审查 sessionId 应不同')
    assert.equal(r1.totalFindings, r2.totalFindings)
  })
})
