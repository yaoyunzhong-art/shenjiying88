import { describe, it, expect, beforeEach, vi } from 'vitest'
/**
 * 🐜 自动: [license-renewal] [C] 角色场景测试扩展
 *
 * 8 角色深度业务场景测试：
 * 👔店长 -> 续费策略全局监控与异常干预
 * 🛒前台 -> 客户续费引导与状态查询
 * 👥HR -> 续费权限合规审计
 * 🔧安监 -> 续费失败安全降级与数据完整性
 * 🎮导玩员 -> 游戏设备License过期预警
 * 🎯运行专员 -> 批量续费调度与任务编排
 * 🤝团建 -> 团建License续费资源预留
 * 📢营销 -> 到期客户营销续费推荐
 *
 * 每个角色至少覆盖 2 个场景（正常流程 + 降级/边界）
 */
import { LicenseRenewalService } from './license-renewal.service'
import { LicenseRenewalController } from './license-renewal.controller'
import type { CreateRenewalRecordDto } from './license-renewal.dto'

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

// ── 测试工厂 ──
function createController() {
  const service = new LicenseRenewalService()
  const controller = new LicenseRenewalController(service)
  return { service, controller }
}

const sampleCreateDto: CreateRenewalRecordDto = {
  licenseId: 'lic-arcade-gw-001',
  tenantId: 't-store-sz-001',
  packageId: 'pkg-vip-annual',
  packageName: 'VIP年卡系列',
  price: 9999.00,
  status: 'pending',
}

// ═══════════════════════════════════════════════════════════════
// 👔 店长 — 续费策略全局监控与异常干预
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} 店长续费策略场景`, () => {
  let controller: LicenseRenewalController

  beforeEach(() => {
    controller = createController().controller
  })

  it('🎯 [正常] 店长查看全店License续费统计概览', async () => {
    // 先创建几条不同状态的续费记录
    await controller.createRecord({ ...sampleCreateDto, licenseId: 'lic-stats-1', status: 'success' })
    await controller.createRecord({ ...sampleCreateDto, licenseId: 'lic-stats-2', status: 'pending' })
    await controller.createRecord({ ...sampleCreateDto, licenseId: 'lic-stats-3', status: 'failed' })

    const stats = await controller.getStats('t-store-sz-001')
    expect(stats).toBeDefined()
    expect(typeof stats.totalRenewals).toBe('number')
    expect(typeof stats.pendingCount).toBe('number')
    expect(typeof stats.successCount).toBe('number')
    expect(typeof stats.failedCount).toBe('number')
    expect(typeof stats.totalRevenue).toBe('number')
    expect(stats.totalRenewals).toBeGreaterThanOrEqual(3)
  })

  it('⚠️ [边界] 店长查看空门店统计应返回零值而非报错', async () => {
    const stats = await controller.getStats('t-empty-store-999')
    expect(stats).toBeDefined()
    expect(stats.totalRenewals).toBe(0)
    expect(stats.totalRevenue).toBe(0)
    expect(stats.pendingCount).toBe(0)
    expect(stats.successCount).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════
// 🛒 前台 — 客户续费引导与状态查询
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} 前台续费引导场景`, () => {
  let controller: LicenseRenewalController

  beforeEach(() => {
    controller = createController().controller
  })

  it('🎯 [正常] 前台为客户创建续费记录并返回正确状态', async () => {
    const record = await controller.createRecord(sampleCreateDto)
    expect(record).toBeDefined()
    expect(record.licenseId).toBe('lic-arcade-gw-001')
    expect(record.tenantId).toBe('t-store-sz-001')
    expect(record.status).toBe('pending')
    expect(record.id).toBeTruthy()
  })

  it('⚠️ [边界] 前台查询不存在的续费记录应抛出错误', async () => {
    await expect(
      controller.getRecord('non-existent-id-999999'),
    ).rejects.toThrow()
  })
})

// ═══════════════════════════════════════════════════════════════
// 👥 HR — 续费权限合规审计
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.HR} HR续费合规审计场景`, () => {
  let controller: LicenseRenewalController

  beforeEach(() => {
    controller = createController().controller
  })

  it('🎯 [正常] HR查看所有失败续费记录用于审计追溯', async () => {
    // 创建一条失败续费
    await controller.createRecord({
      ...sampleCreateDto,
      licenseId: 'lic-fail-audit-001',
      status: 'failed',
    })

    const result = await controller.listRecords({
      status: 'failed',
      page: 1,
      pageSize: 10,
    } as any)
    expect(result).toBeDefined()
    expect(Array.isArray(result.data)).toBe(true)
    expect(result.data.length).toBeGreaterThanOrEqual(1)
    expect(result.data.every((r: any) => r.status === 'failed')).toBe(true)
  })

  it('⚠️ [边界] HR禁止通过状态更新伪造支付成功（不存在记录应报错）', async () => {
    await expect(
      controller.updateStatus('fake-id-999', { status: 'success' }),
    ).rejects.toThrow()
  })
})

// ═══════════════════════════════════════════════════════════════
// 🔧 安监 — 续费失败安全降级与数据完整性
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.Security} 安监续费安全场景`, () => {
  let controller: LicenseRenewalController

  beforeEach(() => {
    controller = createController().controller
  })

  it('🎯 [正常] 安监标记设备续费失败后状态更新正确', async () => {
    const record = await controller.createRecord({
      ...sampleCreateDto,
      licenseId: 'lic-security-cam-001',
      status: 'pending',
    })
    expect(record.status).toBe('pending')

    // 模拟支付失败
    const updated = await controller.updateStatus(record.id, {
      status: 'failed',
      errorMessage: '支付网关超时',
    })
    expect(updated.status).toBe('failed')
    expect(updated.errorMessage).toContain('支付')
  })

  it('⚠️ [边界] 安监检查无续费记录的设备应抛出错误', async () => {
    await expect(
      controller.getRecord('lic-security-nonexist'),
    ).rejects.toThrow()
  })
})

// ═══════════════════════════════════════════════════════════════
// 🎮 导玩员 — 游戏设备License过期预警
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} 导玩员设备License场景`, () => {
  let controller: LicenseRenewalController

  beforeEach(() => {
    controller = createController().controller
  })

  it('🎯 [正常] 导玩员查询特定游戏设备的续费记录', async () => {
    await controller.createRecord({
      ...sampleCreateDto,
      licenseId: 'lic-vr-booth-003',
    })

    const result = await controller.listRecords({
      licenseId: 'lic-vr-booth-003',
      page: 1,
      pageSize: 10,
    } as any)
    expect(result).toBeDefined()
    expect(result.data.some((r: any) => r.licenseId === 'lic-vr-booth-003')).toBe(true)
  })

  it('⚠️ [边界] 导玩员查询已过期设备无续费记录应返回空列表', async () => {
    const result = await controller.listRecords({
      licenseId: 'lic-old-machine-outdated',
      page: 1,
      pageSize: 10,
    } as any)
    expect(result.data.length).toBe(0)
    expect(result.total).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════
// 🎯 运行专员 — 批量续费调度与任务编排
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.Operations} 运行专员批量续费场景`, () => {
  let controller: LicenseRenewalController

  beforeEach(() => {
    controller = createController().controller
  })

  it('🎯 [正常] 运行专员创建多条续费记录并分页查询', async () => {
    for (let i = 0; i < 5; i++) {
      await controller.createRecord({
        ...sampleCreateDto,
        licenseId: `lic-batch-${i}`,
        status: i % 2 === 0 ? 'success' : 'pending',
      })
    }

    const result = await controller.listRecords({ page: 1, pageSize: 3 } as any)
    expect(result.data.length).toBeLessThanOrEqual(3)
    expect(result.total).toBeGreaterThanOrEqual(5)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(3)
  })

  it('⚠️ [边界] 运行专员查询超大页码应返回空数据而非报错', async () => {
    const result = await controller.listRecords({ page: 999, pageSize: 100 } as any)
    expect(result).toBeDefined()
    expect(Array.isArray(result.data)).toBe(true)
    expect(result.data.length).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════
// 🤝 团建 — 团建License续费资源预留
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} 团建License续费场景`, () => {
  let controller: LicenseRenewalController

  beforeEach(() => {
    controller = createController().controller
  })

  it('🎯 [正常] 团建专员为团建场地创建License续费', async () => {
    const record = await controller.createRecord({
      ...sampleCreateDto,
      licenseId: 'lic-team-building-hall-001',
      packageName: '团建场地月卡',
      price: 2999.00,
    })
    expect(record.licenseId).toBe('lic-team-building-hall-001')
    expect(record.packageName).toBe('团建场地月卡')
    expect(record.price).toBe(2999.00)
  })

  it('⚠️ [边界] 团建查询已有续费记录确认资源可用', async () => {
    await controller.createRecord({
      ...sampleCreateDto,
      licenseId: 'lic-team-building-hall-002',
    })
    const result = await controller.listRecords({
      licenseId: 'lic-team-building-hall-002',
      page: 1,
      pageSize: 10,
    } as any)
    expect(result.data.length).toBeGreaterThanOrEqual(1)
  })
})

// ═══════════════════════════════════════════════════════════════
// 📢 营销 — 到期客户营销续费推荐
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} 营销续费推荐场景`, () => {
  let controller: LicenseRenewalController

  beforeEach(() => {
    controller = createController().controller
  })

  it('🎯 [正常] 营销查询所有待续费记录导出营销清单', async () => {
    await controller.createRecord({
      ...sampleCreateDto,
      licenseId: 'lic-marketing-target-001',
      status: 'pending',
    })
    const result = await controller.listRecords({
      status: 'pending',
      page: 1,
      pageSize: 100,
    } as any)
    expect(result.data.some((r: any) => r.status === 'pending')).toBe(true)
  })

  it('⚠️ [边界] 营销查看门店续费统计数据完整性', async () => {
    await controller.createRecord({ ...sampleCreateDto, licenseId: 'lic-mkt-1', status: 'success' })
    await controller.createRecord({ ...sampleCreateDto, licenseId: 'lic-mkt-2', status: 'pending' })

    const stats = await controller.getStats('t-store-sz-001')
    expect(stats.pendingCount + stats.successCount + stats.failedCount).toBe(stats.totalRenewals)
  })
})
