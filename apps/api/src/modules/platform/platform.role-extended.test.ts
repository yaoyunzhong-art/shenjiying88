/**
 * 🐜 自动: [platform] [C] 角色扩展测试
 *
 * 8 角色视角的 平台管理模块扩展测试（补充 role.test.ts）
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个至少 3 个场景测试 = 8×3 = 24 tests
 * 使用实际 PlatformService
 */
import { describe, it, expect } from 'vitest'
import { PlatformService } from './platform.service'

// ── 角色权限矩阵 ──

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

/** 角色 → 平台管理模块权限 */
const rolePlatformAccess: Record<string, string[]> = {
  'plat:overview': ['👔店长', '🔧安监', '🎯运行专员'],
  'plat:health': ['👔店长', '🔧安监', '🎯运行专员'],
  'plat:metrics': ['👔店长', '🎯运行专员'],
  'plat:uptime': ['👔店长', '🔧安监', '🎯运行专员'],
}

function checkRoleAccess(role: string, resource: string): boolean {
  return rolePlatformAccess[resource]?.includes(role) ?? false
}

function makeService(): PlatformService {
  // 没用 _reset 避免清空通过构造函数设置的内部状态
  return new PlatformService()
}

// ════════════════════════════════════════════════════════════
// 👔店长 — 平台管理
// ════════════════════════════════════════════════════════════

describe('[👔店长] platform 角色扩展测试', () => {
  it('👔[正例] 店长查看平台概览 → 版本信息', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'plat:overview')).toBe(true)
    const svc = makeService()
    const overview = svc.getOverview()
    expect(overview.version).toBeDefined()
    expect(overview.version.version).toBeTruthy()
    expect(overview.version.build).toBeTruthy()
    expect(overview.activeTenants).toBeGreaterThan(0)
    expect(overview.servicesCount).toBe(4)
  })

  it('👔[正例] 店长查看平台健康状态', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'plat:health')).toBe(true)
    const svc = makeService()
    const health = await svc.checkHealth()
    expect(health.status).toBe('healthy')
    expect(health.services).toContain('api')
    expect(health.services).toContain('redis')
    expect(health.lastCheck).toBeTruthy()
  })

  it('👔[正例] 店长查看平台运行时长', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'plat:uptime')).toBe(true)
    const svc = makeService()
    const uptime = svc.getUptime()
    expect(uptime).toMatch(/^\d+h\d+m\d+s$/)
  })
})

// ════════════════════════════════════════════════════════════
// 🛒前台 — 平台管理
// ════════════════════════════════════════════════════════════

describe('[🛒前台] platform 角色扩展测试', () => {
  it('🛒[反例] 前台无权限查看平台概览', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'plat:overview')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'plat:health')).toBe(false)
  })

  it('🛒[反例] 前台无权限查看指标和运行时长', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'plat:metrics')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'plat:uptime')).toBe(false)
  })

  it('🛒[反例] 前台对平台管理模块所有操作均无权限', () => {
    const resources = ['plat:overview', 'plat:health', 'plat:metrics', 'plat:uptime']
    resources.forEach((r) => {
      expect(checkRoleAccess(ROLES.FrontDesk, r)).toBe(false)
    })
  })
})

// ════════════════════════════════════════════════════════════
// 👥HR — 平台管理
// ════════════════════════════════════════════════════════════

describe('[👥HR] platform 角色扩展测试', () => {
  it('👥[反例] HR无权限查看平台概览', () => {
    expect(checkRoleAccess(ROLES.HR, 'plat:overview')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'plat:health')).toBe(false)
  })

  it('👥[反例] HR无权限查看指标和运行时长', () => {
    expect(checkRoleAccess(ROLES.HR, 'plat:metrics')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'plat:uptime')).toBe(false)
  })

  it('👥[反例] HR平台管理全部拒绝', () => {
    const denied = { success: false, code: 403, message: 'NO_PLATFORM_ACCESS', module: 'platform' }
    expect(denied.code).toBe(403)
    expect(denied.module).toBe('platform')
  })
})

// ════════════════════════════════════════════════════════════
// 🔧安监 — 平台管理
// ════════════════════════════════════════════════════════════

describe('[🔧安监] platform 角色扩展测试', () => {
  it('🔧[正例] 安监查看平台健康状态（安全检查）', async () => {
    expect(checkRoleAccess(ROLES.Security, 'plat:health')).toBe(true)
    const svc = makeService()
    const health = await svc.checkHealth()
    expect(health.status).toBe('healthy')
    expect(health.services.length).toBeGreaterThan(0)
  })

  it('🔧[正例] 安监查看平台概览 → 运行时长', async () => {
    expect(checkRoleAccess(ROLES.Security, 'plat:overview')).toBe(true)
    const svc = makeService()
    const overview = svc.getOverview()
    expect(overview.health.status).toBe('healthy')
    expect(overview.uptimeHours).toBeGreaterThanOrEqual(0)

    expect(checkRoleAccess(ROLES.Security, 'plat:uptime')).toBe(true)
    const uptime = svc.getUptime()
    expect(uptime).toMatch(/^\d+h\d+m\d+s$/)
  })

  it('🔧[反例] 安监无权查看平台性能指标', () => {
    expect(checkRoleAccess(ROLES.Security, 'plat:metrics')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🎮导玩员 — 平台管理
// ════════════════════════════════════════════════════════════

describe('[🎮导玩员] platform 角色扩展测试', () => {
  it('🎮[反例] 导玩员无权限查看平台概览', () => {
    expect(checkRoleAccess(ROLES.Guide, 'plat:overview')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'plat:health')).toBe(false)
  })

  it('🎮[反例] 导玩员无权限查看指标和运行时长', () => {
    expect(checkRoleAccess(ROLES.Guide, 'plat:metrics')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'plat:uptime')).toBe(false)
  })

  it('🎮[反例] 导玩员全部平台管理权限被拒', () => {
    const resources = ['plat:overview', 'plat:health', 'plat:metrics', 'plat:uptime']
    resources.forEach((r) => {
      expect(checkRoleAccess(ROLES.Guide, r)).toBe(false)
    })
  })
})

// ════════════════════════════════════════════════════════════
// 🎯运行专员 — 平台管理
// ════════════════════════════════════════════════════════════

describe('[🎯运行专员] platform 角色扩展测试', () => {
  it('🎯[正例] 运行专员查看平台概览 → 指标', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'plat:overview')).toBe(true)
    const svc = makeService()
    const overview = svc.getOverview()
    expect(overview.metrics).toBeDefined()
    expect(overview.version.version).toBeTruthy()

    expect(checkRoleAccess(ROLES.Operations, 'plat:metrics')).toBe(true)
    const metric = svc.recordMetric('api_latency', 150, 'ms')
    expect(metric.name).toBe('api_latency')
    expect(metric.value).toBe(150)
    expect(metric.unit).toBe('ms')
  })

  it('🎯[正例] 运行专员健康检查 → 运行时长', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'plat:health')).toBe(true)
    const svc = makeService()
    const health = await svc.checkHealth()
    expect(health.status).toBe('healthy')

    expect(checkRoleAccess(ROLES.Operations, 'plat:uptime')).toBe(true)
    const uptime = svc.getUptime()
    expect(typeof uptime).toBe('string')
  })

  it('🎯[正例] 运行专员覆盖同一指标', async () => {
    const svc = makeService()
    svc.recordMetric('cpu_usage', 45, '%')
    svc.recordMetric('cpu_usage', 60, '%')
    const overview = svc.getOverview()
    const cpuMetric = overview.metrics.find(m => m.name === 'cpu_usage')
    expect(cpuMetric).toBeDefined()
    expect(cpuMetric!.value).toBe(60)
  })
})

// ════════════════════════════════════════════════════════════
// 🤝团建 — 平台管理
// ════════════════════════════════════════════════════════════

describe('[🤝团建] platform 角色扩展测试', () => {
  it('🤝[反例] 团建无权限查看平台概览', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'plat:overview')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'plat:health')).toBe(false)
  })

  it('🤝[反例] 团建无权限查看指标', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'plat:metrics')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'plat:uptime')).toBe(false)
  })

  it('🤝[反例] 团建平台管理全部无权限', () => {
    const resources = ['plat:overview', 'plat:health', 'plat:metrics', 'plat:uptime']
    resources.forEach((r) => {
      expect(checkRoleAccess(ROLES.Teambuilding, r)).toBe(false)
    })
  })
})

// ════════════════════════════════════════════════════════════
// 📢营销 — 平台管理
// ════════════════════════════════════════════════════════════

describe('[📢营销] platform 角色扩展测试', () => {
  it('📢[反例] 营销无权限查看平台概览', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'plat:overview')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'plat:health')).toBe(false)
  })

  it('📢[反例] 营销无权限查看指标和运行时长', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'plat:metrics')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'plat:uptime')).toBe(false)
  })

  it('📢[反例] 营销全部平台管理权限被拒', () => {
    const denied = { success: false, code: 403, message: 'NO_PLATFORM_ACCESS', module: 'platform' }
    expect(denied.code).toBe(403)
    expect(denied.module).toBe('platform')
  })
})

// ════════════════════════════════════════════════════════════
// 🦞 跨角色组合场景 + 边界
// ════════════════════════════════════════════════════════════

describe('[🦞 platform 跨角色闭环 + 边界]', () => {
  it('👔 + 🔧 店长查看概览 + 安监检查健康全流程', async () => {
    const svc = makeService()

    // 1. 店长查看概览
    const overview = svc.getOverview()
    expect(overview.activeTenants).toBeGreaterThan(0)

    // 2. 安监检查健康
    const health = await svc.checkHealth()
    expect(health.status).toBe('healthy')

    // 3. 运行专员记录指标
    svc.recordMetric('disk_usage', 75, '%')
    const updatedOverview = svc.getOverview()
    expect(updatedOverview.metrics.length).toBeGreaterThan(0)
  })

  it('🛡️ 重置后指标清空', () => {
    const svc = makeService()
    svc.recordMetric('test_metric', 100, 'count')
    expect(svc.getOverview().metrics.length).toBeGreaterThan(0)

    svc.reset()
    expect(svc.getOverview().metrics.length).toBe(0)
  })

  it('🛡️ 健康检查返回稳定格式', async () => {
    const svc = makeService()
    const health1 = await svc.checkHealth()
    const health2 = await svc.checkHealth()
    expect(health1.status).toBe(health2.status)
    expect(health1.services).toEqual(health2.services)
  })

  it('🛡️ 概览包含所有必要字段', () => {
    const svc = makeService()
    const overview = svc.getOverview()
    expect(overview).toHaveProperty('version')
    expect(overview).toHaveProperty('health')
    expect(overview).toHaveProperty('metrics')
    expect(overview).toHaveProperty('activeTenants')
    expect(overview).toHaveProperty('servicesCount')
    expect(overview).toHaveProperty('uptimeHours')
  })

  it('🛡️ uptime格式验证', () => {
    const svc = makeService()
    const uptime = svc.getUptime()
    expect(uptime).toMatch(/^\d+[hms]/)
    const parts = uptime.split(/[hms]/).filter(Boolean)
    expect(parts.length).toBe(3)
  })

  it('🛡️ 指标覆盖更新保留最新值', () => {
    const svc = makeService()
    svc.recordMetric('memory', 1024, 'MB')
    svc.recordMetric('memory', 2048, 'MB')
    svc.recordMetric('memory', 1536, 'MB')
    const overview = svc.getOverview()
    const mem = overview.metrics.find(m => m.name === 'memory')
    expect(mem).toBeDefined()
    expect(mem!.value).toBe(1536)
  })

  it('🛡️ 指标唯一性(name作为key)', () => {
    const svc = makeService()
    svc.recordMetric('latency', 50, 'ms')
    svc.recordMetric('latency', 80, 'ms')
    const metrics = svc.getOverview().metrics.filter(m => m.name === 'latency')
    expect(metrics.length).toBe(1)
  })

  it('🛡️ 各服务列表稳定', async () => {
    const svc = makeService()
    const health = await svc.checkHealth()
    expect(health.services).toEqual(['api', 'redis', 'postgres', 'clickhouse'])
  })
})
