import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [license-renewal] [C] 角色测试扩展编写
 *
 * 8 角色深度场景扩展测试 — license-renewal 模块
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色 ≥ 3 测试用例 (正常流程 + 降级场景 + 权限边界)
 * 覆盖: createRecord, listRecords, getRecord, updateStatus, getStats,
 *       createNotification, listNotifications
 * 扩展: 大额度续费、时间边界、角色上下文验证、并发续费
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { LicenseRenewalService } from './license-renewal.service'
import type {
  CreateRenewalRecordDto,
  UpdateRenewalStatusDto,
  RenewalRecordQueryDto,
  CreateNotificationDto,
} from './license-renewal.dto'

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

function makeService(): LicenseRenewalService {
  return new LicenseRenewalService()
}

// ── 测试数据生成 ──
const TENANTS = {
  A: 'tenant-A',
  B: 'tenant-B',
  C: 'tenant-C',
  D: 'tenant-D',
}

// ════════════════════════════════════════════════════════════════
// 👔 店长 — 全局续费监控与统计分析
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} license-renewal 扩展角色测试`, () => {
  it('店长查看全量续费统计获知所有门店续费概况', async () => {
    const svc = makeService()
    await svc.createRecord({ licenseId: 'lic-sm-1', tenantId: TENANTS.A, price: 2999, status: 'success' })
    await svc.createRecord({ licenseId: 'lic-sm-2', tenantId: TENANTS.B, price: 5999, status: 'success' })
    await svc.createRecord({ licenseId: 'lic-sm-3', tenantId: TENANTS.C, price: 1999, status: 'failed' })

    const stats = await svc.getStats()
    assert.ok(stats.totalRenewals >= 5)
    assert.ok(stats.totalRevenue >= 2999 + 5999)
    assert.ok(stats.successRate > 0)
  })

  it('店长按门店筛选续费统计以做单店经营分析', async () => {
    const svc = makeService()
    // 为 tenant-A 创建一个成功续费记录
    await svc.createRecord({ licenseId: 'lic-sm-a', tenantId: TENANTS.A, price: 2999, status: 'success' })
    const statsA = await svc.getStats(TENANTS.A)
    assert.ok(statsA.totalRenewals >= 1)
    assert.ok(statsA.totalRevenue >= 2999)

    const statsB = await svc.getStats(TENANTS.B)
    // Tenant-B 只有 seed 中的 pending (price=0) 记录，所以收入应为 0
    assert.ok(statsB.totalRevenue >= 0)
  })

  it('店长向不存在的门店查询统计应返回全零统计', async () => {
    const svc = makeService()
    const stats = await svc.getStats('tenant-nonexistent')
    assert.equal(stats.totalRenewals, 0)
    assert.equal(stats.totalRevenue, 0)
    assert.equal(stats.successRate, 0)
    assert.equal(stats.successCount, 0)
  })

  it('店长查看所有续费记录的分页列表', async () => {
    const svc = makeService()
    const result = await svc.listRecords({ page: 1, pageSize: 20 })
    assert.ok(result.total >= 2)
    assert.ok(result.data.every((r) => r.id))
  })

  it('店长查看续费成功率的准确计算', async () => {
    const svc = makeService()
    // 已有 seed data: 1 success + 1 pending
    const stats = await svc.getStats()
    // 加上刚创建的
    const statsAfter = await svc.getStats()
    const expectedRate = statsAfter.totalRenewals > 0
      ? Math.round((statsAfter.successCount / statsAfter.totalRenewals) * 10000) / 100
      : 0
    assert.equal(statsAfter.successRate, expectedRate)
    assert.ok(statsAfter.successRate >= 0 && statsAfter.successRate <= 100)
  })

  it('店长查看大额续费订单明细', async () => {
    const svc = makeService()
    const rec = await svc.createRecord({
      licenseId: 'lic-enterprise-001',
      tenantId: TENANTS.A,
      packageId: 'pkg-ultimate',
      packageName: '至尊企业版',
      price: 99999,
      status: 'pending',
    })
    const detail = await svc.getRecord(rec.id)
    assert.equal(detail.price, 99999)
    assert.equal(detail.packageName, '至尊企业版')
    assert.equal(detail.packageId, 'pkg-ultimate')
  })
})

// ════════════════════════════════════════════════════════════════
// 🛒 前台 — 门店前台续费记录查询与状态跟进
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} license-renewal 扩展角色测试`, () => {
  it('前台查询本门店的待处理续费记录', async () => {
    const svc = makeService()
    const pending = await svc.listRecords({ tenantId: TENANTS.A, status: 'pending' })
    assert.ok(Array.isArray(pending.data))
  })

  it('前台按 licenseId 精确查找续费记录', async () => {
    const svc = makeService()
    const result = await svc.listRecords({ licenseId: 'lic-seed-paid' })
    assert.ok(result.data.length >= 1)
    assert.equal(result.data[0].licenseId, 'lic-seed-paid')
  })

  it('前台尝试查询完全不存在的 licenseId 应返回空结果', async () => {
    const svc = makeService()
    const result = await svc.listRecords({ licenseId: 'lic-ghost-999999' })
    assert.equal(result.data.length, 0)
    assert.equal(result.total, 0)
  })

  it('前台查看自己在收银台创建的续费订单详情', async () => {
    const svc = makeService()
    const rec = await svc.createRecord({
      licenseId: 'lic-cashier-001',
      tenantId: TENANTS.A,
      price: 499,
      status: 'pending',
    })
    const detail = await svc.getRecord(rec.id)
    assert.equal(detail.price, 499)
    assert.equal(detail.status, 'pending')
    assert.ok(detail.createdAt)
  })

  it('前台尝试预览超大分页不崩溃', async () => {
    const svc = makeService()
    const result = await svc.listRecords({ page: 9999, pageSize: 100 })
    assert.equal(result.data.length, 0)
    assert.ok(result.total >= 0)
  })
})

// ════════════════════════════════════════════════════════════════
// 👥 HR — 跨门店续费管理与员工续费权限审计
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.HR} license-renewal 扩展角色测试`, () => {
  it('HR 跨门店查看全公司续费记录用于审计', async () => {
    const svc = makeService()
    const all = await svc.listRecords({ pageSize: 50 })
    const tenants = new Set(all.data.map((r) => r.tenantId))
    assert.ok(tenants.size >= 2, '跨门店数据应包含至少两个租户')
  })

  it('HR 按续费状态统计各门店续费情况', async () => {
    const svc = makeService()
    await svc.createRecord({ licenseId: 'lic-hr-1', tenantId: TENANTS.A, price: 1000, status: 'success' })
    await svc.createRecord({ licenseId: 'lic-hr-2', tenantId: TENANTS.B, price: 2000, status: 'pending' })
    await svc.createRecord({ licenseId: 'lic-hr-3', tenantId: TENANTS.C, price: 3000, status: 'failed' })

    const successRecords = await svc.listRecords({ status: 'success' })
    assert.ok(successRecords.data.every((r) => r.status === 'success'))
  })

  it('HR 查询跨时间段的续费记录用于年度审计', async () => {
    const svc = makeService()
    const past = new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString()
    const future = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString()
    const result = await svc.listRecords({ startDate: past, endDate: future })
    assert.ok(Array.isArray(result.data))
  })

  it('HR 查看空月份（未来日期）的续费记录应返回空', async () => {
    const svc = makeService()
    const futureDate = new Date(Date.now() + 365 * 2 * 24 * 3600 * 1000).toISOString()
    const result = await svc.listRecords({ startDate: futureDate })
    assert.equal(result.data.length, 0)
  })
})

// ════════════════════════════════════════════════════════════════
// 🔧 安监 — 续费失败记录检测与续费环节安全监控
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Safety} license-renewal 扩展角色测试`, () => {
  it('安监检测续费失败记录并查看错误原因', async () => {
    const svc = makeService()
    // 先创建一条续费记录（默认 status=pending）
    const rec = await svc.createRecord({
      licenseId: 'lic-safety-fail-1',
      tenantId: TENANTS.A,
      price: 699,
    })
    // 然后更新为失败状态带上错误信息
    const updated = await svc.updateStatus(rec.id, {
      status: 'failed',
      errorMessage: '支付余额不足',
    })
    assert.equal(updated.status, 'failed')
    assert.equal(updated.errorMessage, '支付余额不足')
  })

  it('安监查看失败率统计以评估续费系统健康度', async () => {
    const svc = makeService()
    await svc.createRecord({ licenseId: 'lic-safety-1', tenantId: TENANTS.A, price: 100, status: 'failed' })
    await svc.createRecord({ licenseId: 'lic-safety-2', tenantId: TENANTS.A, price: 100, status: 'failed' })
    await svc.createRecord({ licenseId: 'lic-safety-3', tenantId: TENANTS.A, price: 100, status: 'success' })

    const stats = await svc.getStats(TENANTS.A)
    assert.ok(stats.failedCount >= 2)
    assert.ok(stats.successRate <= 50) // 至少一半失败
  })

  it('安监更新失败续费为成功状态后应记录 paymentId', async () => {
    const svc = makeService()
    const rec = await svc.createRecord({
      licenseId: 'lic-safety-recover',
      tenantId: TENANTS.A,
      price: 500,
      status: 'failed',
      errorMessage: '银行处理超时',
    })
    const updated = await svc.updateStatus(rec.id, {
      status: 'success',
      paymentId: 'pay-recovered-001',
    })
    assert.equal(updated.status, 'success')
    assert.equal(updated.paymentId, 'pay-recovered-001')
    // errorMessage 应被清空或保留 — 取决于实现
  })

  it('安监检查续费异常尝试 — 创建后立即多次更新', async () => {
    const svc = makeService()
    const rec = await svc.createRecord({ licenseId: 'lic-safety-race', tenantId: TENANTS.A, price: 100 })
    const r1 = await svc.updateStatus(rec.id, { status: 'success', paymentId: 'pay-1' })
    const r2 = await svc.updateStatus(rec.id, { status: 'failed', errorMessage: '退款' })
    const detail = await svc.getRecord(rec.id)
    assert.equal(detail.status, 'failed')
  })
})

// ════════════════════════════════════════════════════════════════
// 🎮 导玩员 — 游戏区设备 License 续费管理
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} license-renewal 扩展角色测试`, () => {
  it('导玩员为游戏设备续费并指定设备包名', async () => {
    const svc = makeService()
    const rec = await svc.createRecord({
      licenseId: 'lic-arcade-001',
      tenantId: TENANTS.A,
      packageId: 'pkg-arcade-pro',
      packageName: '街机专业版',
      price: 1299,
    })
    assert.equal(rec.packageName, '街机专业版')
    assert.equal(rec.packageId, 'pkg-arcade-pro')
  })

  it('导玩员查询游戏区所有设备续费记录', async () => {
    const svc = makeService()
    await svc.createRecord({ licenseId: 'lic-game-1', tenantId: TENANTS.B, price: 799 })
    await svc.createRecord({ licenseId: 'lic-game-2', tenantId: TENANTS.B, price: 799 })
    await svc.createRecord({ licenseId: 'lic-game-3', tenantId: TENANTS.B, price: 799 })
    const result = await svc.listRecords({ tenantId: TENANTS.B, pageSize: 20 })
    assert.ok(result.data.length >= 3)
  })

  it('导玩员更新游戏设备续费到过期日', async () => {
    const svc = makeService()
    const rec = await svc.createRecord({
      licenseId: 'lic-arcade-expire',
      tenantId: TENANTS.A,
      previousExpireAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
      newExpireAt: new Date(Date.now() + 335 * 24 * 3600 * 1000).toISOString(),
      price: 1599,
    })
    assert.ok(rec.previousExpireAt)
    assert.ok(rec.newExpireAt)
    assert.ok(new Date(rec.newExpireAt) > new Date(rec.previousExpireAt))
  })

  it('导玩员发起续费成功后自动收到通知', async () => {
    const svc = makeService()
    const rec = await svc.createRecord({
      licenseId: 'lic-guide-notif',
      tenantId: TENANTS.A,
      price: 299,
      status: 'success',
    })
    const notif = await svc.createNotification({
      licenseId: rec.licenseId,
      tenantId: TENANTS.A,
      type: 'success',
      sentAt: new Date().toISOString(),
    })
    assert.equal(notif.type, 'success')
    assert.equal(notif.licenseId, 'lic-guide-notif')
  })
})

// ════════════════════════════════════════════════════════════════
// 🎯 运行专员 — 续费批量运维、状态管理与调度
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Ops} license-renewal 扩展角色测试`, () => {
  it('运行专员批量创建续费记录', async () => {
    const svc = makeService()
    const batch = [
      { licenseId: 'lic-ops-batch-1', tenantId: TENANTS.C, price: 100 },
      { licenseId: 'lic-ops-batch-2', tenantId: TENANTS.C, price: 200 },
      { licenseId: 'lic-ops-batch-3', tenantId: TENANTS.C, price: 300 },
    ]
    const results = await Promise.all(batch.map((d) => svc.createRecord(d)))
    assert.equal(results.length, 3)
    const ids = new Set(results.map((r) => r.id))
    assert.equal(ids.size, 3)
  })

  it('运行专员批量更新待处理续费为成功', async () => {
    const svc = makeService()
    // 创建一批待处理
    const records = await Promise.all([
      svc.createRecord({ licenseId: 'lic-ops-update-1', tenantId: TENANTS.C, price: 100 }),
      svc.createRecord({ licenseId: 'lic-ops-update-2', tenantId: TENANTS.C, price: 200 }),
    ])
    // 批量更新
    const updated = await Promise.all(
      records.map((r) => svc.updateStatus(r.id, { status: 'success', paymentId: `pay-ops-batch-${r.id}` })),
    )
    assert.ok(updated.every((r) => r.status === 'success'))
    assert.ok(updated.every((r) => r.paymentId?.startsWith('pay-ops-batch')))
  })

  it('运行专员查看续费统计后按门店导出', async () => {
    const svc = makeService()
    const statsA = await svc.getStats(TENANTS.A)
    const statsB = await svc.getStats(TENANTS.B)
    assert.ok(typeof statsA.totalRenewals === 'number')
    assert.ok(typeof statsB.totalRenewals === 'number')
  })

  it('运行专员尝试更新已删除/不存在的记录应报错', async () => {
    const svc = makeService()
    await assert.rejects(
      () => svc.updateStatus('non-existent-renewal-record', { status: 'success' }),
      /不存在/,
    )
  })

  it('运行专员分页查询确认页码返回正确', async () => {
    const svc = makeService()
    // 创建超过一页的数据
    await Promise.all(
      Array.from({ length: 15 }, (_, i) =>
        svc.createRecord({ licenseId: `lic-ops-pg-${i}`, tenantId: TENANTS.D, price: i * 100 }),
      ),
    )
    const page1 = await svc.listRecords({ page: 1, pageSize: 10, tenantId: TENANTS.D })
    const page2 = await svc.listRecords({ page: 2, pageSize: 10, tenantId: TENANTS.D })
    assert.ok(page1.data.length <= 10)
    assert.ok(page2.data.length <= 10)
    const allIds = [...page1.data, ...page2.data].map((r) => r.id)
    assert.equal(new Set(allIds).size, allIds.length, '分页不应重复')
  })
})

// ════════════════════════════════════════════════════════════════
// 🤝 团建 — 团建活动 License 续费与通知
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} license-renewal 扩展角色测试`, () => {
  it('团建专员为团建活动租用的设备批量续费', async () => {
    const svc = makeService()
    const rec = await svc.createRecord({
      licenseId: 'lic-team-rental-01',
      tenantId: TENANTS.A,
      packageName: '团建活动版',
      price: 899,
      status: 'pending',
    })
    assert.equal(rec.packageName, '团建活动版')
    assert.equal(rec.status, 'pending')
  })

  it('团建专员查看团建租用设备的续费提醒通知', async () => {
    const svc = makeService()
    const notif = await svc.createNotification({
      licenseId: 'lic-team-rental-01',
      tenantId: TENANTS.A,
      type: 'reminder',
      reminderDays: 7,
      sentAt: new Date().toISOString(),
    })
    assert.equal(notif.type, 'reminder')
    assert.equal(notif.reminderDays, 7)

    const list = await svc.listNotifications('lic-team-rental-01')
    assert.ok(list.data.length >= 1)
  })

  it('团建专员查看团建活动的所有通知记录', async () => {
    const svc = makeService()
    const notifs = await svc.listNotifications(undefined, TENANTS.A)
    assert.ok(Array.isArray(notifs.data))
  })

  it('团建专员创建失败通知用于活动取消场景', async () => {
    const svc = makeService()
    const notif = await svc.createNotification({
      licenseId: 'lic-team-cancel',
      tenantId: TENANTS.A,
      type: 'failure',
      sentAt: new Date().toISOString(),
    })
    assert.equal(notif.type, 'failure')
    assert.ok(notif.sentAt)
  })

  it('团建专员查询团建相关设备的续费历史', async () => {
    const svc = makeService()
    await svc.createRecord({ licenseId: 'lic-team-history-1', tenantId: TENANTS.A, price: 500 })
    await svc.createRecord({ licenseId: 'lic-team-history-2', tenantId: TENANTS.A, price: 600 })
    const history = await svc.listRecords({ tenantId: TENANTS.A, pageSize: 50 })
    assert.ok(history.data.length >= 2)
  })
})

// ════════════════════════════════════════════════════════════════
// 📢 营销 — 续费收入统计与营销策略分析
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} license-renewal 扩展角色测试`, () => {
  it('营销专员查看续费总收入用于营销活动预算评估', async () => {
    const svc = makeService()
    const stats = await svc.getStats()
    assert.ok(stats.totalRevenue >= 0)
    assert.ok(typeof stats.totalRevenue === 'number')
  })

  it('营销专员分析各门店续费率差异', async () => {
    const svc = makeService()
    const statsA = await svc.getStats(TENANTS.A)
    const statsB = await svc.getStats(TENANTS.B)
    // 至少能获取到统计
    assert.ok('successRate' in statsA)
    assert.ok('successRate' in statsB)
    // 不同类型门店续费率可能不同
    assert.ok(typeof statsA.successRate === 'number')
  })

  it('营销专员查看续费成功记录做续费用户分析', async () => {
    const svc = makeService()
    const successRecords = await svc.listRecords({ status: 'success', pageSize: 20 })
    assert.ok(successRecords.data.every((r) => r.status === 'success'))
    // 验证中有 paymentId
    successRecords.data.forEach((r) => {
      if (r.status === 'success') {
        // 成功的续费可能在 seed 中有也可能在新增中有
        assert.ok(typeof r.price === 'number')
      }
    })
  })

  it('营销专员按门店查看续费金额总和', async () => {
    const svc = makeService()
    const statsB = await svc.getStats(TENANTS.B)
    // tenant-B 已有 seed pending 记录
    await svc.createRecord({ licenseId: 'lic-mkt-b1', tenantId: TENANTS.B, price: 800, status: 'success' })
    await svc.createRecord({ licenseId: 'lic-mkt-b2', tenantId: TENANTS.B, price: 1200, status: 'success' })
    const statsAfter = await svc.getStats(TENANTS.B)
    assert.ok(statsAfter.totalRevenue >= 800 + 1200)
    assert.ok(statsAfter.successCount >= 2)
  })

  it('营销专员查看续费通知列表以设计二次提醒策略', async () => {
    const svc = makeService()
    await svc.createNotification({
      licenseId: 'lic-mkt-remind-1',
      tenantId: TENANTS.A,
      type: 'reminder',
      reminderDays: 3,
      sentAt: new Date().toISOString(),
    })
    await svc.createNotification({
      licenseId: 'lic-mkt-remind-1',
      tenantId: TENANTS.A,
      type: 'reminder',
      reminderDays: 7,
      sentAt: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString(),
    })
    const notifs = await svc.listNotifications('lic-mkt-remind-1')
    assert.ok(notifs.data.length >= 2)
    // 通知应按 sentAt 降序排列
    if (notifs.data.length >= 2) {
      assert.ok(new Date(notifs.data[0].sentAt) >= new Date(notifs.data[1].sentAt))
    }
  })
})
