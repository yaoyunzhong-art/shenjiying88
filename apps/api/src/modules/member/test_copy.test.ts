import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [member-dormancy] [D] cron 测试补全
 *
 * 覆盖 MemberDormancyCron 的:
 *  - hourlyScan() - 正常执行 / 重入 / 空数据 / 服务未提供
 *  - getMetrics() - 指标累积
 *  - resetMetrics() - 重置
 *
 * 正例 + 反例 + 边界
 */

import assert from 'node:assert/strict'
import { MemberDormancyCron } from './member-dormancy.cron'
import { MemberDormancyService } from './member-dormancy.service'
import { MemberConfigService } from './member-config'

function makeMember(overrides: any = {}) {
  return {
    memberId: `m-${Math.random().toString(36).slice(2, 8)}`,
    nickname: 'test',
    level: 'BRONZE',
    tenantContext: { tenantId: 't1' },
    status: 'ACTIVE',
    points: 0,
    registeredAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    ...overrides
  }
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

describe('MemberDormancyCron', () => {
  let config: MemberConfigService
  let dormancy: MemberDormancyService
  let cron: MemberDormancyCron

  beforeEach(() => {
    config = new MemberConfigService()
    dormancy = new MemberDormancyService(undefined, config)
    cron = new MemberDormancyCron(dormancy)
  })

  describe('hourlyScan', () => {
    it('正例: 空数据返回 scannedCount=0', async () => {
      (dormancy as any)['memberService'] = { listProfiles: () => [], getProfile: () => undefined }
      const result = await cron.hourlyScan()
      assert.ok(result !== null)
      assert.equal(result!.scannedCount, 0)
      assert.equal(result!.dormantPromoted, 0)
      assert.equal(result!.churnedPromoted, 0)
    })

    it('正例: 有会员进入 DORMANT 阶段', async () => {
      (dormancy as any)['memberService'] = {
        listProfiles: () => [makeMember({ memberId: 'm1', lastActiveAt: daysAgo(91) })],
        getProfile: () => undefined
      }
      const result = await cron.hourlyScan()
      assert.equal(result!.dormantPromoted, 1)
      assert.equal(result!.scannedCount, 1)
    })

    it('正例: 扫描结果含 configSnapshot', async () => {
      (dormancy as any)['memberService'] = {
        listProfiles: () => [makeMember({ memberId: 'm2', lastActiveAt: daysAgo(91) })],
        getProfile: () => undefined
      }
      const result = await cron.hourlyScan()
      assert.deepEqual(result!.configSnapshot, { dormantDays: 90, churnedDays: 180 })
    })

    it('防御: dormancy 未提供返回 null', async () => {
      cron = new MemberDormancyCron(undefined)
      const result = await cron.hourlyScan()
      assert.equal(result, null)
    })
  })

  describe('getMetrics', () => {
    it('正例: 初始指标全 0', () => {
      const m = cron.getMetrics()
      assert.equal(m.totalRuns, 0)
      assert.equal(m.totalScanned, 0)
      assert.equal(m.lastRunAt, null)
      assert.equal(m.lastError, null)
    })

    it('正例: 扫描后指标累积', async () => {
      (dormancy as any)['memberService'] = { listProfiles: () => [], getProfile: () => undefined }
      await cron.hourlyScan()
      const m = cron.getMetrics()
      assert.equal(m.totalRuns, 1)
    })

    it('正例: 多次扫描指标累加', async () => {
      (dormancy as any)['memberService'] = { listProfiles: () => [], getProfile: () => undefined }
      await cron.hourlyScan()
      await cron.hourlyScan()
      const m = cron.getMetrics()
      assert.equal(m.totalRuns, 2)
    })
  })

  describe('resetMetrics', () => {
    it('正例: 重置后指标归零', async () => {
      (dormancy as any)['memberService'] = { listProfiles: () => [], getProfile: () => undefined }
      await cron.hourlyScan()
      cron.resetMetrics()
      const m = cron.getMetrics()
      assert.equal(m.totalRuns, 0)
      assert.equal(m.totalScanned, 0)
      assert.equal(m.lastRunAt, null)
    })
  })
})
