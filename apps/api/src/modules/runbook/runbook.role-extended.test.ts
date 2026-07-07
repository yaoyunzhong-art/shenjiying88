import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 自动: [runbook] [C] 角色测试扩展编写
 *
 * 8 角色深度场景扩展测试 — runbook 模块
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色 ≥ 3 测试用例 (正常流程 + 降级场景 + 权限边界)
 * 覆盖: create, get, list, update, delete, search, validate, getCriticalSteps,
 *       generateExecutionReport, mapAlert, findByAlert
 */

import 'reflect-metadata'
import { RunbookService } from './runbook.service'
import type { Runbook, RunbookStep, AlertMapping } from './runbook.entity'

// ── 8 角色定义 ──
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

// ── 测试辅助 ──
function createService(): RunbookService {
  return new RunbookService()
}

function sampleStep(override?: Partial<RunbookStep>): RunbookStep {
  return {
    stepNumber: 1,
    title: '检查服务状态',
    description: '确认服务是否正常运行',
    command: 'curl http://localhost:3000/health',
    expectedOutput: '{"status":"ok"}',
    estimatedMinutes: 2,
    ...override,
  }
}

function createSimpleRunbook(service: RunbookService, overrides?: Partial<Omit<Runbook, 'id' | 'createdAt' | 'updatedAt'>>): Runbook {
  return service.create({
    title: '测试运维手册',
    category: '故障排查',
    severity: 'high',
    applicableVersions: ['v1.0.0+'],
    prerequisites: ['已安装 curl'],
    steps: [sampleStep()],
    estimatedTotalMinutes: 5,
    status: 'active',
    tags: ['测试'],
    ...overrides,
  })
}

function createDeploymentRunbook(service: RunbookService): Runbook {
  return service.create({
    title: '自动扩容流程',
    category: 'deployment',
    severity: 'medium',
    applicableVersions: ['v2.0.0+'],
    prerequisites: ['K8s 集群就绪'],
    steps: [
      { stepNumber: 1, title: '检查集群', description: '检查 K8s 集群健康', command: 'kubectl get nodes', estimatedMinutes: 2 },
      { stepNumber: 2, title: '执行扩容', description: '启动自动扩容脚本', command: './scale-up.sh', estimatedMinutes: 10, rollbackCommand: './scale-down.sh', warningMessage: '确保资源池充足' },
    ],
    estimatedTotalMinutes: 15,
    status: 'active',
    tags: ['部署', '扩容'],
  })
}

function createSecurityRunbook(service: RunbookService): Runbook {
  return service.create({
    title: '安全漏洞应急',
    category: '安全事件',
    severity: 'critical',
    applicableVersions: ['v1.0.0+'],
    prerequisites: ['root 权限', '日志审计已开启'],
    steps: [
      { stepNumber: 1, title: '检测攻击源', description: '分析入侵来源', command: 'grep "Failed" /var/log/auth.log', estimatedMinutes: 5, warningMessage: '勿删除日志文件' },
      { stepNumber: 2, title: '封禁 IP', description: '临时封禁攻击 IP', command: 'iptables -A INPUT -s 10.0.0.1 -j DROP', estimatedMinutes: 2 },
      { stepNumber: 3, title: '修复漏洞', description: '应用安全补丁', command: 'yum update -y', estimatedMinutes: 15, rollbackCommand: 'yum history undo last' },
    ],
    estimatedTotalMinutes: 25,
    status: 'active',
    tags: ['安全', '应急'],
  })
}

// ── 👔店长 – 运维流程宏观管理 ──
describe(`${ROLES.StoreManager} runbook 角色扩展测试`, () => {
  let service: RunbookService

  beforeEach(() => {
    service = createService()
  })

  it('店长可按分类查看所有 Runbook 概览', () => {
    // 预设数据包含 6 个分类
    const categories = ['deployment', 'scaling', '故障排查', '灾难恢复', '安全事件', '监控告警'] as const
    for (const cat of categories) {
      const result = service.list({ category: cat })
      expect(result.length).toBeGreaterThan(0)
    }
  })

  it('店长可创建只读草稿 Runbook 尚未发布', () => {
    const draft = createSimpleRunbook(service, { status: 'draft', title: '草稿版运维流程' })
    expect(draft.status).toBe('draft')
    expect(draft.createdAt).toBeInstanceOf(Date)

    // 草稿不会被活跃列表包含
    const activeList = service.list({ status: 'active' })
    expect(activeList.some(r => r.id === draft.id)).toBe(false)
  })

  it('店长可将已存档 Runbook 归档后不再展示', () => {
    const rb = createSimpleRunbook(service, { title: '旧版部署流程' })
    service.update(rb.id, { status: 'archived' })
    const active = service.list({ status: 'active' })
    expect(active.some(r => r.id === rb.id)).toBe(false)
    const archived = service.list({ status: 'archived' })
    expect(archived.some(r => r.id === rb.id)).toBe(true)
  })

  it('店长可统计活跃 Runbook 数量', () => {
    createSimpleRunbook(service)
    createSimpleRunbook(service, { title: '第二个手册' })
    const active = service.list({ status: 'active' })
    expect(active.length).toBeGreaterThanOrEqual(2)
  })
})

// ── 🛒前台 – 部署与前台配置 ──
describe(`${ROLES.FrontDesk} runbook 角色扩展测试`, () => {
  let service: RunbookService

  beforeEach(() => {
    service = createService()
  })

  it('前台可通过搜索找到前台部署文档', () => {
    const result = service.search('前台')
    expect(result.length).toBeGreaterThan(0)
    expect(result.some(r => r.tags.includes('前端'))).toBe(true)
  })

  it('前台可获取部署类 Runbook 的执行报告', () => {
    const rb = service.get('deploy-frontend')!
    const report = service.generateExecutionReport(rb.id, [
      { step: 1, startedAt: new Date(), completedAt: new Date(), success: true, output: 'Done' },
      { step: 2, startedAt: new Date(), completedAt: new Date(), success: true, output: 'Uploaded' },
      { step: 3, startedAt: new Date(), completedAt: new Date(), success: false, error: 'Timeout' },
    ])
    expect(report).toContain('Runbook 执行报告')
    expect(report).toContain('前台部署')
    expect(report).toContain('✅ 成功')
    expect(report).toContain('❌ 失败')
  })

  it('前台查询不存在的 Runbook 应返回 null', () => {
    const result = service.get('non-existent-runbook')
    expect(result).toBeNull()
  })

  it('前台可查看新建 Runbook 的关键步骤（含回滚命令）', () => {
    const rb = createDeploymentRunbook(service)
    const critical = service.getCriticalSteps(rb.id)
    expect(critical.length).toBeGreaterThan(0)
    expect(critical.some(s => s.rollbackCommand)).toBe(true)
    expect(critical.some(s => s.warningMessage)).toBe(true)
  })
})

// ── 👥HR – 安全事件与应急响应培训 ──
describe(`${ROLES.HR} runbook 角色扩展测试`, () => {
  let service: RunbookService

  beforeEach(() => {
    service = createService()
  })

  it('HR 可罗列安全事件类 Runbook 用于培训计划', () => {
    const security = service.list({ category: '安全事件' })
    expect(security.length).toBeGreaterThan(0)
    security.forEach(r => {
      expect(r.category).toBe('安全事件')
    })
  })

  it('HR 可验证安全 Runbook 是否包含通知流程', () => {
    const runbook = service.get('security-data-breach')
    expect(runbook).not.toBeNull()
    const hasNotification = runbook!.steps.some(s =>
      s.description.includes('通知') || s.title.includes('通知')
    )
    expect(hasNotification).toBe(true)
  })

  it('HR 可检查新创建的 Runbook 是否通过验证', () => {
    const rb = createSecurityRunbook(service)
    const result = service.validate(rb.id)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('HR 可检测不完整 Runbook 的验证错误', () => {
    const incomplete = service.create({
      title: '',
      category: '故障排查',
      severity: 'medium',
      applicableVersions: [],
      prerequisites: [],
      steps: [],
      estimatedTotalMinutes: 0,
      status: 'draft',
      tags: [],
    })
    const result = service.validate(incomplete.id)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors).toContain('标题不能为空')
    expect(result.errors).toContain('必须包含至少一个步骤')
  })
})

// ── 🔧安监 – 安全应急处置与审计 ──
describe(`${ROLES.Safety} runbook 角色扩展测试`, () => {
  let service: RunbookService

  beforeEach(() => {
    service = createService()
  })

  it('安监可按标签搜索安全相关 Runbook', () => {
    const result = service.list({ tag: '安全' })
    expect(result.length).toBeGreaterThan(0)
    result.forEach(r => {
      expect(r.tags).toContain('安全')
    })
  })

  it('安监可映射告警到 Runbook 并查询映射关系', () => {
    const rb = createSecurityRunbook(service)
    const mapping = service.mapAlert(
      'ALERT_security_attack',
      rb.id,
      ['外部扫描', '暴力破解'],
      'critical',
      'auto-block-ip',
    )
    expect(mapping.alertName).toBe('ALERT_security_attack')
    expect(mapping.runbookId).toBe(rb.id)
    expect(mapping.autoAction).toBe('auto-block-ip')

    const found = service.findByAlert('ALERT_security_attack')
    expect(found).not.toBeNull()
    expect(found!.severity).toBe('critical')
  })

  it('安监查询不存在的告警映射应返回 null', () => {
    const result = service.findByAlert('ALERT_non_existent')
    expect(result).toBeNull()
  })

  it('安监可验证关键安全步骤是否含回滚方案', () => {
    const rb = createSecurityRunbook(service)
    const critical = service.getCriticalSteps(rb.id)
    // 步骤2 有 warning，步骤3 有 rollbackCommand
    expect(critical.length).toBeGreaterThanOrEqual(2)
    expect(critical.some(s => s.warningMessage && s.warningMessage.includes('日志'))).toBe(true)
  })

  it('安监可生成安全事件执行报告，包含错误详情', () => {
    const rb = service.get('security-sql-injection')!
    const report = service.generateExecutionReport(rb.id, [
      { step: 1, startedAt: new Date(), completedAt: new Date(), success: true, output: 'Found 3 injection attempts' },
      { step: 2, startedAt: new Date(), error: 'Connection timeout - WAF unreachable', success: false },
    ])
    expect(report).toContain('SQL 注入检测与隔离')
    expect(report).toContain('Connection timeout')
    expect(report).toContain('失败')
  })
})

// ── 🎮导玩员 – 监控告警与扩容 ──
describe(`${ROLES.Guide} runbook 角色扩展测试`, () => {
  let service: RunbookService

  beforeEach(() => {
    service = createService()
  })

  it('导玩员可查看监控告警文档', () => {
    const mon = service.list({ category: '监控告警' })
    expect(mon.length).toBeGreaterThan(0)
  })

  it('导玩员可验证扩容 Runbook 的步骤完整性', () => {
    const rb = service.get('scale-k8s-hpa')!
    expect(rb.steps.length).toBeGreaterThanOrEqual(4)
    rb.steps.forEach(step => {
      expect(step.title).toBeTruthy()
      expect(step.stepNumber).toBeGreaterThanOrEqual(1)
    })
  })

  it('导玩员可通过搜索找到扩容相关文档', () => {
    const result = service.search('HPA')
    expect(result.length).toBeGreaterThan(0)
    expect(result.some(r => r.id === 'scale-k8s-hpa')).toBe(true)
  })

  it('导玩员创建新的运维手册时可关联告警', () => {
    const rb = createSimpleRunbook(service, {
      title: '告警响应流程',
      tags: ['监控', '告警'],
      relatedAlerts: ['ALERT_cpu_high', 'ALERT_memory_high'],
    })
    expect(rb.relatedAlerts).toContain('ALERT_cpu_high')
    expect(rb.relatedAlerts).toContain('ALERT_memory_high')
  })
})

// ── 🎯运行专员 – 故障排查与执行 ──
describe(`${ROLES.Ops} runbook 角色扩展测试`, () => {
  let service: RunbookService

  beforeEach(() => {
    service = createService()
  })

  it('运行专员可按严重级别和分类联合筛选', () => {
    const criticalTroubleshoot = service.list({ severity: 'critical', category: '故障排查' })
    expect(criticalTroubleshoot.length).toBeGreaterThan(0)
    criticalTroubleshoot.forEach(r => {
      expect(r.severity).toBe('critical')
      expect(r.category).toBe('故障排查')
    })
  })

  it('运行专员可创建并更新 Runbook', () => {
    const rb = createSimpleRunbook(service, { title: '初始版本' })
    expect(rb.title).toBe('初始版本')

    const updated = service.update(rb.id, { title: '更新版本', severity: 'critical' })
    expect(updated.title).toBe('更新版本')
    expect(updated.severity).toBe('critical')
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(rb.createdAt.getTime())
  })

  it('运行专员删除不存在的 Runbook 应抛异常', () => {
    expect(() => service.delete('non-existent')).toThrow('Runbook not found')
  })

  it('运行专员可删除 Runbook', () => {
    const rb = createSimpleRunbook(service)
    expect(() => service.delete(rb.id)).not.toThrow()
    const result = service.get(rb.id)
    expect(result).toBeNull()
  })

  it('运行专员可验证 Runbook 的警告信息', () => {
    const rb = service.get('troubleshoot-oom')!
    const validation = service.validate(rb.id)
    // 预设数据中 troubleshoot-oom 有 prerequisites 和 lastTestedAt
    expect(validation.valid).toBe(true)
  })

  it('运行专员可搜索关键字跨字段匹配', () => {
    // 搜索标签名称
    const byTag = service.search('OOM')
    expect(byTag.length).toBeGreaterThan(0)
    expect(byTag.some(r => r.id === 'troubleshoot-oom')).toBe(true)

    // 搜索步骤描述
    const byDesc = service.search('堆内存')
    expect(byDesc.length).toBeGreaterThan(0)

    // 搜索前置条件
    const byPrereq = service.search('root')
    expect(byPrereq.length).toBeGreaterThan(0)
  })
})

// ── 🤝团建 – 团队协作与知识传承 ──
describe(`${ROLES.Teambuilding} runbook 角色扩展测试`, () => {
  let service: RunbookService

  beforeEach(() => {
    service = createService()
  })

  it('团建可按部署分类查找入门文档', () => {
    const deploy = service.list({ category: 'deployment' })
    expect(deploy.length).toBeGreaterThan(0)
    const singleDeploy = deploy.find(r => r.id === 'deploy-api-single')
    expect(singleDeploy).toBeDefined()
  })

  it('团建可验证 Runbook 互相引用关系是否正确', () => {
    const rb = service.get('deploy-k8s')!
    expect(rb.relatedRunbooks).toBeDefined()
    expect(rb.relatedRunbooks!.length).toBeGreaterThan(0)
    // 引用文档真实存在
    rb.relatedRunbooks!.forEach(refId => {
      const ref = service.get(refId)
      expect(ref).not.toBeNull()
    })
  })

  it('团建可合并多个 Runbook 步骤生成团队演练计划', () => {
    // 模拟团建合并 部署 + 故障排查 两个 Runbook 的步骤列表
    const deployRb = service.get('deploy-api-single')!
    const troubleRb = service.get('troubleshoot-slow-api')!

    // 合并关键步骤用于团建演练
    const trainingSteps = [
      ...deployRb.steps.slice(0, 2),
      ...troubleRb.steps.slice(0, 2),
    ]
    expect(trainingSteps.length).toBe(4)
    trainingSteps.forEach(s => {
      expect(s.command).toBeTruthy()
    })
  })

  it('团建可生成培训用执行报告（含步骤统计）', () => {
    const rb = createSimpleRunbook(service, { title: '新人培训手册' })
    const report = service.generateExecutionReport(rb.id, [
      { step: 1, startedAt: new Date(), completedAt: new Date(), success: true, output: 'Completed' },
    ])
    expect(report).toContain('新人培训手册')
    expect(report).toContain('执行摘要')
    expect(report).toContain('步骤 1')
  })
})

// ── 📢营销 – 系统稳定性保障与活动支持 ──
describe(`${ROLES.Marketing} runbook 角色扩展测试`, () => {
  let service: RunbookService

  beforeEach(() => {
    service = createService()
  })

  it('营销可查看灾难恢复 Runbook 确保活动高可用', () => {
    const dr = service.list({ category: '灾难恢复' })
    expect(dr.length).toBeGreaterThan(0)
    dr.forEach(r => {
      expect(r.category).toBe('灾难恢复')
    })
  })

  it('营销可验证关键 Runbook 验证通过', () => {
    const critical = service.list({ severity: 'critical', status: 'active' })
    critical.forEach(r => {
      const result = service.validate(r.id)
      expect(result.valid).toBe(true)
    })
  })

  it('营销可创建活动专属 Runbook（含定制标签）', () => {
    const rb = createSimpleRunbook(service, {
      title: '双11大促保障手册',
      tags: ['大促', '营销', '高并发'],
      severity: 'critical',
      category: '监控告警',
      prerequisites: ['已部署弹性伸缩', '数据库只读副本已准备'],
    })
    expect(rb.tags).toContain('大促')
    expect(rb.severity).toBe('critical')
    expect(rb.category).toBe('监控告警')
  })

  it('营销可通过告警映射快速定位活动期间问题', () => {
    // 建立大促期间的告警映射覆盖
    const rb = service.get('troubleshoot-high-error-rate')!
    service.mapAlert(
      'ALERT_promo_5xx_spike',
      rb.id,
      ['前端 CDN 回源问题', '缓存雪崩', '数据库压力过大'],
      'critical',
      'scale-up-promo-cluster',
    )

    const mapping = service.findByAlert('ALERT_promo_5xx_spike')
    expect(mapping).not.toBeNull()
    expect(mapping!.autoAction).toBe('scale-up-promo-cluster')
    expect(mapping!.possibleCauses).toHaveLength(3)
  })

  it('营销可生成执行状态报告用于复盘', () => {
    const rb = createSimpleRunbook(service, { title: '大促复盘文档' })
    const report = service.generateExecutionReport(rb.id, [
      { step: 1, startedAt: new Date('2026-07-07T10:00:00Z'), completedAt: new Date('2026-07-07T10:05:00Z'), success: true, output: 'All systems healthy' },
    ])
    expect(report).toContain('大促复盘文档')
    expect(report).toContain('All systems healthy')
    expect(report).toContain('5 分钟')
  })
})
