// runbook.role.test.ts - [C类] 8 角色视角测试
// 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
// 内联 Controller 模式 | 共 24+ 用例 | 每角色 ≥ 3 用例

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { RunbookController } from './runbook.controller'
import { RunbookService } from './runbook.service'
import type { Runbook, RunbookStep } from './runbook.entity'

// ── 8 角色定义 ──
const ROLES = {
  TenantAdmin: '👔店长',
  Reception: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 辅助工厂: 内联 Controller ──
function createController(): RunbookController {
  const service = new RunbookService()
  return new RunbookController(service)
}

// ============================================================================
// 👔店长 — 运维总览、SLA 合规、关键文档审阅
// ============================================================================
describe(`${ROLES.TenantAdmin} runbook 角色测试`, () => {
  it('店长可以查看所有活跃状态的 Runbook', () => {
    const ctrl = createController()
    const active = ctrl.list({ status: 'active' })
    assert.ok(active.length >= 10)  // 预设里所有都是 active
    assert.equal(active.every(r => r.status === 'active'), true)
  })

  it('店长可以按严重级别筛选以关注关键流程', () => {
    const ctrl = createController()
    const critical = ctrl.list({ severity: 'critical' })
    assert.ok(critical.length >= 5)
    assert.equal(critical.every(r => r.severity === 'critical'), true)
  })

  it('店长可以查看任意 Runbook 详情以了解团队营运流程', () => {
    const ctrl = createController()
    const detail = ctrl.get('deploy-api-single')
    assert.ok(detail)
    assert.equal(detail.id, 'deploy-api-single')
    assert.ok(detail.steps.length >= 4)
    assert.ok(detail.estimatedTotalMinutes > 0)
  })

  it('店长可以运行 validate 检查 Runbook 是否完备', () => {
    const ctrl = createController()
    const result = ctrl.validate('deploy-api-single')
    assert.equal(result.valid, true)
    assert.ok(Array.isArray(result.warnings))
  })
})

// ============================================================================
// 🛒前台 — 前台部署、系统可用性
// ============================================================================
describe(`${ROLES.Reception} runbook 角色测试`, () => {
  it('前台可以搜索前台部署相关文档', () => {
    const ctrl = createController()
    const result = ctrl.search('前台')
    assert.ok(result.length >= 1)
    assert.ok(result.some(r => r.id === 'deploy-frontend'))
  })

  it('前台可以查看部署类 Runbook 的关键步骤', () => {
    const ctrl = createController()
    const critical = ctrl.getCriticalSteps('deploy-frontend')
    // 包含 warningMessage 的关键步骤
    assert.ok(Array.isArray(critical))
    const hasWarnings = critical.some(s => s.warningMessage)
    assert.equal(hasWarnings, true)
  })

  it('前台可以获取前台部署文档的完整详情', () => {
    const ctrl = createController()
    const runbook = ctrl.get('deploy-frontend')
    assert.ok(runbook)
    assert.equal(runbook.title, '前台部署（Nginx/CDN 配置）')
    assert.ok(runbook.prerequisites.length > 0)
    assert.ok(runbook.steps.some(s => s.command))
  })

  it('前台通过 validate 确保部署流程可执行', () => {
    const ctrl = createController()
    const result = ctrl.validate('deploy-frontend')
    assert.equal(result.valid, true)
  })
})

// ============================================================================
// 👥HR — 安全事件响应流程、人员通知流程
// ============================================================================
describe(`${ROLES.HR} runbook 角色测试`, () => {
  it('HR 可以查看数据泄露应急响应流程', () => {
    const ctrl = createController()
    const runbook = ctrl.get('security-data-breach')
    assert.ok(runbook)
    assert.ok(runbook.steps.some(s => s.description.includes('通知')))
  })

  it('HR 可以搜索告警映射以确认通知对象', () => {
    const ctrl = createController()
    // 预设告警映射中包含 ALERT_payment_failed
    const mapping = ctrl.findByAlert('ALERT_payment_failed')
    assert.ok(mapping)
    assert.equal(mapping.severity, 'critical')
    assert.ok(mapping.possibleCauses.length > 0)
    assert.equal(mapping.autoAction, 'failover-payment-gateway')
  })

  it('HR 可以查看 SQL 注入检测流程中的人员通知步骤', () => {
    const ctrl = createController()
    const runbook = ctrl.get('security-sql-injection')
    assert.ok(runbook)
    // 第一步有 warning 提醒保留日志作为证据
    const step1 = runbook.steps.find(s => s.stepNumber === 1)
    assert.ok(step1?.warningMessage)
  })

  it('HR 可以 validate 安全事件类 Runbook 的完整性', () => {
    const ctrl = createController()
    const result = ctrl.validate('security-data-breach')
    assert.equal(result.valid, true)
  })
})

// ============================================================================
// 🔧安监 — 安全事件处置、告警隔离、审计视角
// ============================================================================
describe(`${ROLES.Safety} runbook 角色测试`, () => {
  it('安监可以搜索 SQL 注入检测 Runbook', () => {
    const ctrl = createController()
    const result = ctrl.search('SQL注入')
    assert.ok(result.length >= 1)
    assert.ok(result.some(r => r.id === 'security-sql-injection'))
  })

  it('安监可以查看安全事件 Runbook 中的 warning', () => {
    const ctrl = createController()
    const critical = ctrl.getCriticalSteps('security-sql-injection')
    // 预设中 security-sql-injection 第 1 步有 warningMessage
    assert.ok(critical.length >= 1)
    assert.ok(critical.some(s => s.warningMessage))
  })

  it('安监可以按 severity 筛选紧急安全事件', () => {
    const ctrl = createController()
    const critical = ctrl.list({ severity: 'critical', category: '安全事件' })
    assert.ok(critical.length >= 2)
  })

  it('安监可以绑定告警到 Runbook 建立应急链路', () => {
    const ctrl = createController()
    const mapping = ctrl.mapAlert({
      alertName: 'ALERT_waf_blocked',
      runbookId: 'security-sql-injection',
      possibleCauses: ['WAF 规则误报', '真实攻击', '流量异常'],
      severity: 'high',
    })
    assert.ok(mapping)
    assert.equal(mapping.alertName, 'ALERT_waf_blocked')

    // 验证持久化
    const found = ctrl.findByAlert('ALERT_waf_blocked')
    assert.ok(found)
    assert.equal(found.runbookId, 'security-sql-injection')
  })

  it('安监可以查看告警映射中 cpu_high 对应的 Runbook', () => {
    const ctrl = createController()
    const mapping = ctrl.findByAlert('ALERT_cpu_high')
    assert.ok(mapping)
    assert.equal(mapping.autoAction, 'scale-k8s-hpa')
  })
})

// ============================================================================
// 🎮导玩员 — 监控告警配置、扩容流程
// ============================================================================
describe(`${ROLES.Guide} runbook 角色测试`, () => {
  it('导玩员可以查看 HPA 自动扩容 Runbook', () => {
    const ctrl = createController()
    const runbook = ctrl.get('scale-k8s-hpa')
    assert.ok(runbook)
    assert.equal(runbook.category, 'scaling')
    assert.ok(runbook.steps.length >= 3)
  })

  it('导玩员可以搜索监控告警相关 Runbook', () => {
    const ctrl = createController()
    const result = ctrl.search('Prometheus')
    assert.ok(result.length >= 1)
    assert.ok(result.some(r => r.id === 'monitor-setup-prometheus'))
  })

  it('导玩员可以验证扩容流程可执行', () => {
    const ctrl = createController()
    const result = ctrl.validate('scale-k8s-hpa')
    assert.equal(result.valid, true)
  })

  it('导玩员可以按分类筛选监控告警文档', () => {
    const ctrl = createController()
    const monitor = ctrl.list({ category: '监控告警' })
    assert.ok(monitor.length >= 1)
    assert.ok(monitor.every(r => r.category === '监控告警'))
  })
})

// ============================================================================
// 🎯运行专员 — 故障排查、执行报告、Runbook CRUD
// ============================================================================
describe(`${ROLES.Ops} runbook 角色测试`, () => {
  it('运行专员可以搜索 API 慢查询排查文档', () => {
    const ctrl = createController()
    const result = ctrl.search('API 响应慢')
    assert.ok(result.length >= 1)
    assert.ok(result.some(r => r.id === 'troubleshoot-slow-api'))
  })

  it('运行专员可以排查 OOM 相关问题文档', () => {
    const ctrl = createController()
    const result = ctrl.search('OOM')
    assert.ok(result.length >= 1)
    assert.ok(result.some(r => r.id === 'troubleshoot-oom'))
  })

  it('运行专员可以查看故障排查 Runbook 含可执行命令的步骤', () => {
    const ctrl = createController()
    const runbook = ctrl.get('troubleshoot-slow-api')
    assert.ok(runbook)
    const hasCommands = runbook.steps.some(s => s.command)
    assert.equal(hasCommands, true)
  })

  it('运行专员可以获取故障排查文档的关键步骤（含警告）', () => {
    const ctrl = createController()
    const critical = ctrl.getCriticalSteps('troubleshoot-high-error-rate')
    assert.ok(critical.length >= 1)
    // 第 5 步有 warning
    assert.ok(critical.some(s => s.warningMessage))
  })

  it('运行专员可以 validate 故障排查文档确保可执行', () => {
    const ctrl = createController()
    const result = ctrl.validate('troubleshoot-slow-api')
    assert.equal(result.valid, true)
  })
})

// ============================================================================
// 🤝团建 — 新成员学习、团队演练、灾难恢复流程学习
// ============================================================================
describe(`${ROLES.Teambuilding} runbook 角色测试`, () => {
  it('新成员可以找到部署入门文档', () => {
    const ctrl = createController()
    const result = ctrl.search('单机部署')
    assert.ok(result.length >= 1)
    assert.ok(result.some(r => r.id === 'deploy-api-single'))
  })

  it('新成员在学习 Runbook 时每一步应有完整标题和描述', () => {
    const ctrl = createController()
    const runbook = ctrl.get('deploy-api-single')
    assert.ok(runbook)
    runbook.steps.forEach(step => {
      assert.ok(step.title, `Step ${step.stepNumber} should have title`)
      assert.ok(step.description, `Step ${step.stepNumber} should have description`)
    })
  })

  it('团建用途：灾难恢复流程可用于团队演练培训', () => {
    const ctrl = createController()
    const dr = ctrl.list({ category: '灾难恢复' })
    assert.ok(dr.length >= 2)
    assert.ok(dr.some(r => r.id === 'dr-database-failover'))
    assert.ok(dr.some(r => r.id === 'dr-full-data-loss'))
  })

  it('灾难恢复流程的每一步应有明确步骤编号', () => {
    const ctrl = createController()
    const dr = ctrl.get('dr-full-data-loss')
    assert.ok(dr)
    dr.steps.forEach((step, idx) => {
      assert.equal(step.stepNumber, idx + 1)
    })
  })
})

// ============================================================================
// 📢营销 — 系统稳定性保障、容量规划、灾备就绪
// ============================================================================
describe(`${ROLES.Marketing} runbook 角色测试`, () => {
  it('营销可以查看灾难恢复流程确保大促时系统有灾备能力', () => {
    const ctrl = createController()
    const dr = ctrl.list({ category: '灾难恢复', status: 'active' })
    assert.ok(dr.length >= 2)
  })

  it('营销可以 validate 关键灾难恢复 Runbook', () => {
    const ctrl = createController()
    const result = ctrl.validate('dr-database-failover')
    assert.equal(result.valid, true)
    const result2 = ctrl.validate('dr-full-data-loss')
    assert.equal(result2.valid, true)
  })

  it('营销可以查看扩容相关文档以评估大促容量', () => {
    const ctrl = createController()
    const scaling = ctrl.list({ category: 'scaling' })
    assert.ok(scaling.length >= 2)
    assert.ok(scaling.some(r => r.id === 'scale-k8s-hpa'))
  })

  it('营销可以搜索大促相关告警映射', () => {
    const ctrl = createController()
    const mapping = ctrl.findByAlert('ALERT_payment_failed')
    assert.ok(mapping)
    assert.equal(mapping.severity, 'critical')
    assert.equal(mapping.autoAction, 'failover-payment-gateway')
  })
})
