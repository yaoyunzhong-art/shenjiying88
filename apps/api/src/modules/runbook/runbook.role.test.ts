// runbook.role.test.ts - 8 角色视角的运维手册测试
import { describe, it, expect, beforeEach } from 'vitest'
import { RunbookService } from './runbook.service'

let service: RunbookService

beforeEach(() => {
  service = new RunbookService()
})

describe('👔 店长视角 - 运维流程概览', () => {
  it('应能看到所有活跃的 Runbook 列表', () => {
    const active = service.list({ status: 'active' })
    expect(active.length).toBeGreaterThan(0)
    expect(active.every(r => r.status === 'active')).toBe(true)
  })

  it('应能按严重级别筛选查看关键运维文档', () => {
    const critical = service.list({ severity: 'critical' })
    expect(critical.length).toBeGreaterThan(0)
    expect(critical.every(r => r.severity === 'critical')).toBe(true)
  })
})

describe('🛒 前台视角 - 部署与前台配置', () => {
  it('应能查找前台部署相关的 Runbook', () => {
    const result = service.search('前台')
    expect(result.length).toBeGreaterThan(0)
  })

  it('应能获取部署类 Runbook 的关键步骤（含警告）', () => {
    const runbook = service.get('deploy-frontend')
    expect(runbook).not.toBeNull()
    const critical = service.getCriticalSteps('deploy-frontend')
    expect(critical.length).toBeGreaterThan(0)
    expect(critical.some(s => s.warningMessage)).toBe(true)
  })
})

describe('👥 HR 视角 - 安全事件与应急响应流程', () => {
  it('应能查看安全事件类 Runbook', () => {
    const security = service.list({ category: '安全事件' })
    expect(security.length).toBeGreaterThan(0)
  })

  it('安全事件 Runbook 应包含通知步骤', () => {
    const runbook = service.get('security-data-breach')
    expect(runbook).not.toBeNull()
    const notificationStep = runbook!.steps.find(s =>
      s.description.includes('通知') || s.title.includes('通知')
    )
    expect(notificationStep).toBeDefined()
  })
})

describe('🔧 安监视角 - 安全应急处置', () => {
  it('应能搜索到 SQL 注入检测文档', () => {
    const result = service.search('SQL注入')
    expect(result.length).toBeGreaterThan(0)
  })

  it('关键安全事件应包含警告或回滚方案', () => {
    const runbook = service.get('security-sql-injection')
    expect(runbook).not.toBeNull()
    const hasProtection = runbook!.steps.some(s => s.rollbackCommand || s.warningMessage)
    expect(hasProtection).toBe(true)
  })
})

describe('🎮 导玩员视角 - 监控告警与扩容', () => {
  it('应能查看监控告警配置文档', () => {
    const monitor = service.list({ category: '监控告警' })
    expect(monitor.length).toBeGreaterThan(0)
  })

  it('应能获取扩容流程的关键步骤', () => {
    const runbook = service.get('scale-k8s-hpa')
    expect(runbook).not.toBeNull()
    expect(runbook!.steps.length).toBeGreaterThan(0)
  })
})

describe('🎯 运行专员视角 - 故障排查', () => {
  it('应能搜索 API 慢查询排查文档', () => {
    const result = service.search('API 响应慢')
    expect(result.length).toBeGreaterThan(0)
  })

  it('故障排查 Runbook 应包含可执行的命令步骤', () => {
    const runbook = service.get('troubleshoot-slow-api')
    expect(runbook).not.toBeNull()
    const hasCommands = runbook!.steps.some(s => s.command)
    expect(hasCommands).toBe(true)
    // 应有步骤带警告信息
    const hasWarning = runbook!.steps.some(s => s.warningMessage)
    expect(hasWarning).toBe(true)
  })
})

describe('🤝 团建视角 - 团队协作与新成员学习', () => {
  it('新成员应能找到部署入门文档', () => {
    const deploy = service.list({ category: 'deployment' })
    expect(deploy.length).toBeGreaterThan(0)
    // 应该有单机部署教学
    const simpleDeploy = deploy.find(r => r.id === 'deploy-api-single')
    expect(simpleDeploy).toBeDefined()
  })

  it('Runbook 应包含足够详细的步骤说明供学习', () => {
    const runbook = service.get('deploy-api-single')
    expect(runbook).not.toBeNull()
    runbook!.steps.forEach(step => {
      expect(step.title).toBeTruthy()
      expect(step.description).toBeTruthy()
    })
  })
})

describe('📢 营销视角 - 系统稳定性保障', () => {
  it('灾难恢复类 Runbook 应准备就绪', () => {
    const dr = service.list({ category: '灾难恢复' })
    expect(dr.length).toBeGreaterThan(0)
  })

  it('关键 Runbook 应通过验证', () => {
    const critical = service.list({ severity: 'critical', status: 'active' })
    critical.forEach(r => {
      const result = service.validate(r.id)
      expect(result.valid).toBe(true)
    })
  })
})
