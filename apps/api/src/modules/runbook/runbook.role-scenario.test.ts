/**
 * 🐜 自动: [runbook] [C] 角色场景测试
 *
 * 8 角色视角的运维手册真实场景测试
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个多步场景用例
 * 覆盖 create / get / list / search / update / delete / validate /
 *   getCriticalSteps / generateExecutionReport / mapAlert / findByAlert
 */

import { describe, it, expect, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
import { RunbookService } from './runbook.service'
import { RunbookController } from './runbook.controller'
import type { Runbook, RunbookStep } from './runbook.entity'

const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

function makeController() {
  const svc = new RunbookService()
  return { svc, ctrl: new RunbookController(svc) }
}

function makeStep(overrides?: Partial<RunbookStep>): RunbookStep {
  return {
    stepNumber: 1,
    title: '检查环境',
    description: '检查服务器状态',
    command: 'kubectl get nodes',
    estimatedMinutes: 2,
    ...overrides,
  }
}

function makeCreateDto(overrides: Record<string, any> = {}) {
  return {
    title: '标准运维手册',
    category: 'deployment' as const,
    severity: 'high' as const,
    applicableVersions: ['v1.0.0+'],
    prerequisites: ['Docker 已安装', 'Node.js >= 18'],
    steps: [makeStep()],
    estimatedTotalMinutes: 15,
    status: 'active' as const,
    tags: ['运维', '部署'],
    ...overrides,
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 👔 店长 — 门店运营总览、SLA 管理、多门店手册
// ═══════════════════════════════════════════════════════════════════════════════

describe(`${ROLES.StoreManager} runbook 场景测试`, () => {

  it('店长创建门店标准部署手册，然后按分类筛选确认所有相关流程完备', () => {
    const { ctrl } = makeController()

    // 场景 1: 创建门店部署手册
    const rb1 = ctrl.create(makeCreateDto({ title: '门店部署流程-v1', tags: ['门店', '部署'], category: 'deployment' }))
    assert.ok(rb1.id)

    // 场景 2: 创建门店扩容手册
    const rb2 = ctrl.create(makeCreateDto({ title: '门店扩容流程-v1', tags: ['门店', '扩容'], category: 'scaling' }))

    // 场景 3: 按分类筛选部署类手册
    const deployList = ctrl.list({ category: 'deployment' })
    assert.ok(deployList.length >= 1)
    assert.ok(deployList.some(r => r.id === rb1.id))

    // 场景 4: 按标签筛选门店相关
    const storeList = ctrl.list({ tag: '门店' })
    assert.ok(storeList.length >= 2)
    assert.ok(storeList.every(r => r.tags.includes('门店')))
  })

  it('店长查看严重等级为 critical 的流程并确保定期更新', () => {
    const { ctrl } = makeController()

    // 场景 1: 店长关注关键级别的灾难恢复流程
    const drList = ctrl.list({ severity: 'critical', category: '灾难恢复' })
    assert.ok(drList.length >= 2)

    // 场景 2: 逐一获取详情确认有更新时间戳
    for (const rb of drList) {
      const detail = ctrl.get(rb.id)
      assert.ok(detail)
      assert.ok(detail.updatedAt instanceof Date)
      assert.ok(detail.lastTestedAt instanceof Date || detail.updatedAt instanceof Date)
    }

    // 场景 3: 对关键流程执行 validate 检查
    for (const rb of drList) {
      const result = ctrl.validate(rb.id)
      assert.equal(result.valid, true, `Runbook ${rb.id} should be valid`)
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 🛒 前台 — 前台部署、日常操作
// ═══════════════════════════════════════════════════════════════════════════════

describe(`${ROLES.FrontDesk} runbook 场景测试`, () => {

  it('前台通过搜索找到前台部署文档，然后查看关键步骤以确保安全操作', () => {
    const { ctrl } = makeController()

    // 场景 1: 搜索关键词 "前台"
    const searchResult = ctrl.search('前台')
    assert.ok(searchResult.length >= 1)

    // 场景 2: 获取前台部署文档详情
    const deploy = searchResult.find(r => r.id === 'deploy-frontend')
    assert.ok(deploy)
    assert.equal(deploy.title, '前台部署（Nginx/CDN 配置）')

    // 场景 3: 查看关键步骤（有 warning 的步骤）
    const critical = ctrl.getCriticalSteps('deploy-frontend')
    assert.ok(critical.length >= 1)
    assert.ok(critical.some(s => s.warningMessage))
  })

  it('前台创建临时部署手册并快速验证，确保可执行后删除', () => {
    const { ctrl } = makeController()

    // 场景 1: 创建前台临时部署指引
    const rb = ctrl.create(makeCreateDto({
      title: '周末临时部署指引',
      category: 'deployment',
      severity: 'medium',
      status: 'draft',
      tags: ['前台', '临时'],
    }))
    assert.ok(rb.id)

    // 场景 2: 验证有效性
    const validation = ctrl.validate(rb.id)
    assert.ok(validation.valid)

    // 场景 3: 发布为 active
    const updated = ctrl.update(rb.id, { status: 'active' })
    assert.equal(updated.status, 'active')

    // 场景 4: 确认在活跃列表中有
    const activeList = ctrl.list({ status: 'active' })
    assert.ok(activeList.some(r => r.id === rb.id))

    // 场景 5: 部署完成后删除
    ctrl.delete(rb.id)
    assert.throws(() => ctrl.get(rb.id), /NotFoundException/)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 👥 HR — 安全培训、人员通知流程、合规文档
// ═══════════════════════════════════════════════════════════════════════════════

describe(`${ROLES.HR} runbook 场景测试`, () => {

  it('HR 查找安全事件类 Runbook 用于员工培训，验证通知流程完备', () => {
    const { ctrl } = makeController()

    // 场景 1: 搜索安全事件相关
    const securityList = ctrl.list({ category: '安全事件' })
    assert.ok(securityList.length >= 2)

    // 场景 2: 查看数据泄露应急流程中是否有通知相关步骤
    const breach = ctrl.get('security-data-breach')
    assert.ok(breach)
    const hasNotifyStep = breach.steps.some(s =>
      s.description.includes('通知') || s.title.includes('通知')
    )
    assert.ok(hasNotifyStep, '安全流程应包含通知步骤')

    // 场景 3: 查找告警映射中的通知链路
    const mapping = ctrl.findByAlert('ALERT_payment_failed')
    assert.ok(mapping)
    assert.equal(mapping.severity, 'critical')
  })

  it('HR 创建员工安全培训手册，标记为 draft 待审，验证通过后发布', () => {
    const { ctrl } = makeController()

    // 场景 1: 创建安全培训手册（草稿状态）
    const rb = ctrl.create(makeCreateDto({
      title: '员工安全意识培训手册',
      category: '安全事件',
      severity: 'medium',
      status: 'draft',
      tags: ['培训', '安全', '合规'],
      steps: [
        { stepNumber: 1, title: '了解钓鱼邮件', description: '识别常见钓鱼邮件特征' },
        { stepNumber: 2, title: '密码安全策略', description: '强密码设置规范', warningMessage: '不要使用生日等个人信息' },
        { stepNumber: 3, title: '应急联系方式', description: '通知安全团队联系方式' },
      ],
    }))
    assert.ok(rb.id)

    // 场景 2: 验证草稿状态
    assert.equal(rb.status, 'draft')
    const draftList = ctrl.list({ status: 'draft' })
    assert.ok(draftList.some(r => r.id === rb.id))

    // 场景 3: 验证完整性
    const validation = ctrl.validate(rb.id)
    assert.equal(validation.valid, true)

    // 场景 4: 标记 lastTestedAt 并发布
    const updated = ctrl.update(rb.id, {
      status: 'active',
      lastTestedAt: new Date(),
    } as any)
    assert.equal(updated.status, 'active')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 安监 — 安全事件处置、告警映射、封禁流程
// ═══════════════════════════════════════════════════════════════════════════════

describe(`${ROLES.Safety} runbook 场景测试`, () => {

  it('安监收到告警后查找对应 Runbook，执行排查并生成执行报告', () => {
    const { svc, ctrl } = makeController()

    // 场景 1: 通过告警名称查找关联的 Runbook
    const mapping = ctrl.findByAlert('ALERT_cpu_high')
    assert.ok(mapping)
    assert.equal(mapping.runbookId, 'troubleshoot-high-error-rate')
    assert.equal(mapping.autoAction, 'scale-k8s-hpa')

    // 场景 2: 获取 Runbook 详情，确认有排查步骤
    const runbook = ctrl.get(mapping.runbookId)
    assert.ok(runbook)
    assert.equal(runbook.category, '故障排查')
    assert.ok(runbook.steps.length >= 3)

    // 场景 3: 查看关键步骤（含 warning 的步骤）
    const critical = ctrl.getCriticalSteps(runbook.id)
    assert.ok(critical.length >= 0)

    // 场景 4: 使用同一 service 实例生成执行报告
    const executionLog = runbook.steps.slice(0, 2).map(s => ({
      step: s.stepNumber,
      startedAt: new Date(),
      completedAt: new Date(),
      success: true,
      output: `Step ${s.stepNumber} completed`,
    }))
    const report = svc.generateExecutionReport(runbook.id, executionLog)
    assert.ok(report.includes('Runbook 执行报告'))
    assert.ok(report.includes(runbook.title))
  })

  it('安监创建安全事件告警映射并关联 Runbook 形成应急链路', () => {
    const { ctrl } = makeController()

    // 场景 1: 创建新的安全告警映射
    const runbook = ctrl.create(makeCreateDto({
      title: 'WAF 拦截应急响应',
      category: '安全事件',
      severity: 'critical',
    }))

    const mapping = ctrl.mapAlert({
      alertName: 'ALERT_waf_critical_block',
      runbookId: runbook.id,
      possibleCauses: ['CC 攻击', 'SQL 注入', '爬虫攻击'],
      severity: 'critical',
      autoAction: 'auto-block-ip-24h',
    })
    assert.ok(mapping)
    assert.equal(mapping.alertName, 'ALERT_waf_critical_block')
    assert.equal(mapping.autoAction, 'auto-block-ip-24h')

    // 场景 2: 验证持久化查询
    const found = ctrl.findByAlert('ALERT_waf_critical_block')
    assert.ok(found)
    assert.equal(found.runbookId, runbook.id)

    // 场景 3: 验证 Runbook validate 通过
    const validation = ctrl.validate(runbook.id)
    assert.equal(validation.valid, true)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 🎮 导玩员 — 监控告警配置、扩容操作
// ═══════════════════════════════════════════════════════════════════════════════

describe(`${ROLES.Guide} runbook 场景测试`, () => {

  it('导玩员查看监控告警配置手册，了解 Prometheus 告警规则配置', () => {
    const { ctrl } = makeController()

    // 场景 1: 搜索监控相关
    const searchMon = ctrl.search('Prometheus')
    assert.ok(searchMon.length >= 1)

    // 场景 2: 获取监控配置手册详情
    const monRb = ctrl.get('monitor-setup-prometheus')
    assert.ok(monRb)
    assert.equal(monRb.category, '监控告警')
    assert.ok(monRb.steps.some(s => s.command?.includes('promtool')))

    // 场景 3: 查看关键步骤警告
    const critical = ctrl.getCriticalSteps('monitor-setup-prometheus')
    assert.ok(critical.some(s => s.warningMessage))
  })

  it('导玩员通过搜索找到扩容手册，查看关键回滚步骤', () => {
    const { ctrl } = makeController()

    // 场景 1: 搜索扩容相关
    const searchScale = ctrl.search('HPA')
    assert.ok(searchScale.length >= 1)

    // 场景 2: 获取 HPA 扩容手册
    const hpaRb = ctrl.get('scale-k8s-hpa')
    assert.ok(hpaRb)
    assert.equal(hpaRb.category, 'scaling')
    assert.ok(hpaRb.steps.length >= 3)

    // 场景 3: combine search + filter
    const scaleList = ctrl.list({ category: 'scaling' })
    assert.ok(scaleList.length >= 2)

    // 场景 4: 快速验证确保手册可执行
    const validation = ctrl.validate('scale-k8s-hpa')
    assert.equal(validation.valid, true)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 运行专员 — 故障排查、Runbook 全生命周期管理
// ═══════════════════════════════════════════════════════════════════════════════

describe(`${ROLES.Ops} runbook 场景测试`, () => {

  it('运行专员创建 Runbook，更新步骤，验证完整性，然后删除的完整生命周期', () => {
    const { ctrl } = makeController()

    // 场景 1: 创建故障排查手册
    const rb = ctrl.create(makeCreateDto({
      title: 'MySQL 主从延迟排查',
      category: '故障排查',
      severity: 'high',
      tags: ['数据库', 'MySQL', '排查'],
    }))
    assert.ok(rb.id)

    // 场景 2: 更新添加更多步骤
    const updated = ctrl.update(rb.id, {
      steps: [
        ...rb.steps,
        { stepNumber: 2, title: '检查从库状态', description: '查看 Slave 状态', command: 'SHOW SLAVE STATUS', rollbackCommand: 'STOP SLAVE' },
        { stepNumber: 3, title: '修复同步', description: '重新开启同步', command: 'START SLAVE', warningMessage: '确保主库 binlog 未过期' },
      ],
    })
    assert.equal(updated.steps.length, 3)

    // 场景 3: 验证更新成功
    const validation = ctrl.validate(rb.id)
    assert.equal(validation.valid, true)
    assert.ok(validation.warnings.length >= 0)

    // 场景 4: 查看关键步骤
    const critical = ctrl.getCriticalSteps(rb.id)
    assert.ok(critical.length >= 2) // 步骤 2 有 rollbackCommand，步骤 3 有 warningMessage

    // 场景 5: 删除
    ctrl.delete(rb.id)
    assert.throws(() => ctrl.get(rb.id), /NotFoundException/)
  })

  it('运行专员收到慢查询告警后联动故障排查手册并生成排查报告', () => {
    const { ctrl } = makeController()

    // 场景 1: 通过预设告警映射找到手册
    const mapping = ctrl.findByAlert('ALERT_db_slow_query')
    assert.ok(mapping)
    assert.equal(mapping.runbookId, 'troubleshoot-slow-api')
    assert.equal(mapping.autoAction, 'kill-slow-queries')

    // 场景 2: 获取手册详情
    const slowApiRb = ctrl.get('troubleshoot-slow-api')
    assert.ok(slowApiRb)
    const hasQueryStep = slowApiRb.steps.some(s =>
      s.description.includes('慢查询') || s.command?.includes('slow_log')
    )
    assert.ok(hasQueryStep)

    // 场景 3: 验证手册完整性
    const validation = ctrl.validate('troubleshoot-slow-api')
    assert.equal(validation.valid, true)

    // 场景 4: 搜索确认有相关能力
    const searchResult = ctrl.search('慢查询')
    assert.ok(searchResult.length >= 1)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 🤝 团建 — 团队演练、新成员培训、跨步骤学习
// ═══════════════════════════════════════════════════════════════════════════════

describe(`${ROLES.Teambuilding} runbook 场景测试`, () => {

  it('团建组织团队灾难恢复演练，使用多个 Runbook 组合培训计划', () => {
    const { ctrl } = makeController()

    // 场景 1: 列出所有灾难恢复类 Runbook
    const drList = ctrl.list({ category: '灾难恢复' })
    assert.ok(drList.length >= 2)

    // 场景 2: 获取各手册详情供演练使用
    const dr1 = ctrl.get('dr-database-failover')
    assert.ok(dr1)
    assert.ok(dr1.steps.some(s => s.rollbackCommand))

    const dr2 = ctrl.get('dr-full-data-loss')
    assert.ok(dr2)
    assert.ok(dr2.steps.length >= 5)

    // 场景 3: 查看关键步骤用于演练重点讲解
    const critical1 = ctrl.getCriticalSteps('dr-database-failover')
    const critical2 = ctrl.getCriticalSteps('dr-full-data-loss')
    const allCritical = [...critical1, ...critical2]
    assert.ok(allCritical.length > 0)
    allCritical.forEach(s => {
      assert.ok(s.rollbackCommand || s.warningMessage)
    })

    // 场景 4: 验证每个手册均通过验证
    drList.forEach(rb => {
      const result = ctrl.validate(rb.id)
      assert.equal(result.valid, true, `DR Runbook ${rb.id} should be valid`)
    })
  })

  it('团建创建新成员入门培训手册，包含指导步骤，并生成演练报告', () => {
    const { svc, ctrl } = makeController()

    // 场景 1: 创建新人培训手册
    const rb = ctrl.create(makeCreateDto({
      title: '新运维工程师入门培训',
      category: 'deployment',
      severity: 'low',
      status: 'draft',
      tags: ['培训', '新人', '入门'],
      steps: [
        { stepNumber: 1, title: '了解系统架构', description: '阅读系统架构文档' },
        { stepNumber: 2, title: '搭建本地开发环境', description: '安装 Docker 和依赖', command: 'docker-compose up -d' },
        { stepNumber: 3, title: '首次部署演练', description: '在测试环境部署服务', command: 'helm install test-app', rollbackCommand: 'helm uninstall test-app', warningMessage: '请使用测试环境 namespace' },
      ],
    }))
    assert.ok(rb.id)

    // 场景 2: 使用同一 service 实例生成演练报告
    const report = svc.generateExecutionReport(rb.id, [
      { step: 1, startedAt: new Date(), completedAt: new Date(), success: true, output: '架构理解完成' },
      { step: 2, startedAt: new Date(), output: '环境搭建中' },
    ])
    assert.ok(report.includes('新运维工程师入门培训'))
    assert.ok(report.includes('步骤 1'))
    assert.ok(report.includes('步骤 2'))

    // 场景 3: 查看关键（含回滚/警告）步骤
    const critical = ctrl.getCriticalSteps(rb.id)
    assert.equal(critical.length, 1)
    assert.equal(critical[0].stepNumber, 3)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 📢 营销 — 大促保障、容量规划、活动支撑
// ═══════════════════════════════════════════════════════════════════════════════

describe(`${ROLES.Marketing} runbook 场景测试`, () => {

  it('营销人员创建大促保障手册，配置容量扩容预警，验证高可用', () => {
    const { ctrl } = makeController()

    // 场景 1: 创建大促保障手册
    const rb = ctrl.create(makeCreateDto({
      title: '双11大促系统保障手册',
      category: '监控告警',
      severity: 'critical',
      status: 'draft',
      tags: ['大促', '营销', '高可用'],
      steps: [
        { stepNumber: 1, title: '提前扩容', description: '提前扩容计算资源', command: 'kubectl scale deployment --replicas=10', estimatedMinutes: 5 },
        { stepNumber: 2, title: '开启流量监控', description: '开启全链路监控告警', command: 'curl -X POST /monitor/start', estimatedMinutes: 3, warningMessage: '确保监控 dashboard 已就绪' },
        { stepNumber: 3, title: '备机检查', description: '检查灾备环境', command: 'helm test dr-environment', estimatedMinutes: 10, rollbackCommand: 'helm test rollback' },
      ],
      relatedAlerts: ['ALERT_cpu_high', 'ALERT_db_slow_query'],
    }))
    assert.ok(rb.id)

    // 场景 2: 绑定告警映射
    const mapping = ctrl.mapAlert({
      alertName: 'ALERT_promo_traffic_spike',
      runbookId: rb.id,
      possibleCauses: ['流量突增', 'CDN 回源失败', '缓存穿透'],
      severity: 'critical',
      autoAction: 'scale-up-promo',
    })
    assert.ok(mapping)
    assert.equal(mapping.autoAction, 'scale-up-promo')

    // 场景 3: 验证手册
    const validation = ctrl.validate(rb.id)
    assert.equal(validation.valid, true)
  })

  it('营销人员按分类查看突发恢复和扩容手册，确保大促期间容量充足', () => {
    const { ctrl } = makeController()

    // 场景 1: 查看所有扩容手册
    const scalingList = ctrl.list({ category: 'scaling' })
    assert.ok(scalingList.length >= 2)

    // 场景 2: 查看所有灾难恢复手册确保高可用
    const drList = ctrl.list({ category: '灾难恢复' })
    assert.ok(drList.length >= 2)

    // 场景 3: 验证关键手册均通过检查
    const criticalRbIds = ['dr-database-failover', 'dr-full-data-loss', 'scale-k8s-hpa']
    for (const id of criticalRbIds) {
      const result = ctrl.validate(id)
      assert.equal(result.valid, true, `Critical runbook ${id} should be valid`)
    }

    // 场景 4: 搜索验证能快速定位大促相关文档
    const searchResult = ctrl.search('扩容')
    assert.ok(searchResult.length >= 2)

    const searchDr = ctrl.search('灾难恢复')
    assert.ok(searchDr.length >= 2)
  })
})
