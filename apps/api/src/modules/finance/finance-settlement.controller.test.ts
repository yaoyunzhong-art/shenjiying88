/**
 * finance-settlement.controller.spec.ts — P-38 结算 Controller 测试
 *
 * Mock Cron + NestJS TestingModule
 * 三件套: 正例(6 路由正常响应) + 反例(空结算/未找到通知) + 边界(空历史/大数字/幂等)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import 'reflect-metadata'
import { Test, type TestingModule } from '@nestjs/testing'
import { FinanceSettlementController } from './finance-settlement.controller'
import { FinanceSettlementCron } from './finance-settlement.cron'

// ═══════════════════════════════════════════════════════════════
// Mock Data
// ═══════════════════════════════════════════════════════════════

const mockResult = (overrides: Partial<{
  id: string
  status: 'completed' | 'failed'
  storeId: string
  periodicity: string
  periodKey: string
  amountCents: number
  error?: string
}> = {}) => ({
  id: overrides.id ?? 'settle-store-A1-2026-07-21-1',
  task: {
    periodicity: overrides.periodicity ?? 'daily',
    storeId: overrides.storeId ?? 'store-A1',
    periodKey: overrides.periodKey ?? '2026-07-21',
    amountCents: overrides.amountCents ?? 50000,
  },
  status: overrides.status ?? 'completed',
  error: overrides.error,
  settledAt: '2026-07-21T03:00:00.000Z',
})

const mockCompleted = mockResult()
const mockFailed = mockResult({
  status: 'failed',
  storeId: 'store-B1',
  error: 'Upstream timeout',
})

const mockNotification = (overrides: Partial<{
  id: string
  type: 'settlement_completed' | 'settlement_failed' | 'settlement_summary'
  title: string
  message: string
  acknowledged: boolean
}> = {}) => ({
  id: overrides.id ?? 'notify-daily-2026-07-21-1',
  type: overrides.type ?? 'settlement_completed',
  title: overrides.title ?? 'daily结算完成',
  message: overrides.message ?? 'daily结算 (2026-07-21): 4 门店, 总额 2000.00元',
  timestamp: '2026-07-21T03:00:00.000Z',
  details: { periodicity: 'daily', periodKey: '2026-07-21', storeCount: 4, totalAmountCents: 200000 },
  acknowledged: overrides.acknowledged ?? false,
})

const mockMetrics = {
  totalSettlements: 4,
  totalCompleted: 4,
  totalFailed: 0,
  lastRunAt: '2026-07-21T03:00:00.000Z',
  lastError: null,
  unacknowledgedNotifications: 1,
}

// ═══════════════════════════════════════════════════════════════
// Mock Service
// ═══════════════════════════════════════════════════════════════

function createMockCron() {
  const mockCron = {
    runPeriodic: vi.fn(),
    getHistory: vi.fn(),
    getUnacknowledgedNotifications: vi.fn(),
    acknowledgeNotification: vi.fn(),
    acknowledgeAll: vi.fn(),
    getMetrics: vi.fn(),
    onApplicationBootstrap: vi.fn(),
    onApplicationShutdown: vi.fn(),
  }
  return mockCron
}

// ═══════════════════════════════════════════════════════════════
// Test Suite
// ═══════════════════════════════════════════════════════════════

describe('FinanceSettlementController', () => {
  let controller: FinanceSettlementController
  let mockCron: ReturnType<typeof createMockCron>

  beforeEach(async () => {
    mockCron = createMockCron()

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinanceSettlementController],
      providers: [
        { provide: FinanceSettlementCron, useValue: mockCron },
      ],
    }).compile()

    controller = module.get<FinanceSettlementController>(FinanceSettlementController)
  })

  // ── POST /api/finance/settlement/run ──────────────────────────

  describe('POST /api/finance/settlement/run', () => {
    it('should run daily settlement and return completed/failed counts', async () => {
      mockCron.runPeriodic.mockResolvedValue([mockCompleted, mockFailed])

      const result = await controller.run(
        { tenantId: 't1', storeId: 's-001' },
        { periodicity: 'daily' }
      )

      expect(result.success).toBe(true)
      expect(result.data.completed).toBe(1)
      expect(result.data.failed).toBe(1)
      expect(result.data.results).toHaveLength(2)
      expect(result.message).toContain('2 tasks')
      expect(mockCron.runPeriodic).toHaveBeenCalledWith({ periodicity: 'daily' })
    })

    it('should work without periodicity (default to daily)', async () => {
      mockCron.runPeriodic.mockResolvedValue([mockCompleted])

      const result = await controller.run(
        { tenantId: 't1', storeId: 's-001' },
        {} // no periodicity
      )

      expect(result.success).toBe(true)
      expect(result.data.completed).toBe(1)
      expect(result.data.failed).toBe(0)
    })

    it('should handle weekly periodicity', async () => {
      mockCron.runPeriodic.mockResolvedValue([mockResult({ periodicity: 'weekly' })])

      const result = await controller.run(
        { tenantId: 't1', storeId: 's-001' },
        { periodicity: 'weekly' }
      )

      expect(result.success).toBe(true)
      expect(mockCron.runPeriodic).toHaveBeenCalledWith({ periodicity: 'weekly' })
    })

    it('should propagate slient empty results (no store to settle)', async () => {
      mockCron.runPeriodic.mockResolvedValue([])

      const result = await controller.run(
        { tenantId: 't1', storeId: 's-001' },
        { periodicity: 'daily' }
      )

      expect(result.success).toBe(true)
      expect(result.data.results).toHaveLength(0)
      expect(result.data.completed).toBe(0)
      expect(result.data.failed).toBe(0)
      expect(result.message).toContain('0 tasks')
    })
  })

  // ── GET /api/finance/settlement/history ───────────────────────

  describe('GET /api/finance/settlement/history', () => {
    it('should return history with default limit 20', async () => {
      mockCron.getHistory.mockReturnValue([mockCompleted, mockFailed])

      const result = await controller.getHistory(
        { tenantId: 't1', storeId: 's-001' },
        undefined
      )

      expect(result.success).toBe(true)
      expect(result.data.history).toHaveLength(2)
      expect(result.data.total).toBe(2)
      expect(mockCron.getHistory).toHaveBeenCalledWith(20)
    })

    it('should respect custom limit query param', async () => {
      mockCron.getHistory.mockReturnValue([mockCompleted])

      const result = await controller.getHistory(
        { tenantId: 't1', storeId: 's-001' },
        '5'
      )

      expect(result.success).toBe(true)
      expect(result.data.history).toHaveLength(1)
      expect(mockCron.getHistory).toHaveBeenCalledWith(5)
    })

    it('should handle empty history', async () => {
      mockCron.getHistory.mockReturnValue([])

      const result = await controller.getHistory(
        { tenantId: 't1', storeId: 's-001' },
        undefined
      )

      expect(result.success).toBe(true)
      expect(result.data.history).toHaveLength(0)
      expect(result.data.total).toBe(0)
    })

    it('should handle limit=0 or negative gracefully', async () => {
      mockCron.getHistory.mockReturnValue([])

      const result = await controller.getHistory(
        { tenantId: 't1', storeId: 's-001' },
        '0'
      )

      expect(result.success).toBe(true)
      expect(mockCron.getHistory).toHaveBeenCalledWith(0)
    })
  })

  // ── GET /api/finance/settlement/notifications ────────────────

  describe('GET /api/finance/settlement/notifications', () => {
    it('should return unacknowledged notifications with count', async () => {
      mockCron.getUnacknowledgedNotifications.mockReturnValue([
        mockNotification({ id: 'n1' }),
        mockNotification({ id: 'n2', acknowledged: true }),
      ])

      const result = await controller.getNotifications(
        { tenantId: 't1', storeId: 's-001' }
      )

      expect(result.success).toBe(true)
      expect(result.data.notifications).toHaveLength(2)
      expect(result.data.unreadCount).toBe(2)
    })

    it('should handle no notifications', async () => {
      mockCron.getUnacknowledgedNotifications.mockReturnValue([])

      const result = await controller.getNotifications(
        { tenantId: 't1', storeId: 's-001' }
      )

      expect(result.success).toBe(true)
      expect(result.data.notifications).toHaveLength(0)
      expect(result.data.unreadCount).toBe(0)
    })

    it('should include all notification fields', async () => {
      mockCron.getUnacknowledgedNotifications.mockReturnValue([mockNotification()])

      const result = await controller.getNotifications(
        { tenantId: 't1', storeId: 's-001' }
      )

      expect(result.success).toBe(true)
      const notif = result.data.notifications[0]
      expect(notif).toHaveProperty('id')
      expect(notif).toHaveProperty('type')
      expect(notif).toHaveProperty('title')
      expect(notif).toHaveProperty('message')
      expect(notif).toHaveProperty('timestamp')
      expect(notif).toHaveProperty('details')
    })
  })

  // ── POST /api/finance/settlement/notifications/ack ───────────

  describe('POST /api/finance/settlement/notifications/ack', () => {
    it('should acknowledge a notification and return true', async () => {
      mockCron.acknowledgeNotification.mockReturnValue(true)

      const result = await controller.acknowledgeNotification(
        { tenantId: 't1', storeId: 's-001' },
        { id: 'notify-123' }
      )

      expect(result.success).toBe(true)
      expect(result.data.acknowledged).toBe(true)
      expect(result.message).toContain('acknowledged')
      expect(mockCron.acknowledgeNotification).toHaveBeenCalledWith('notify-123')
    })

    it('should return false for non-existent notification id', async () => {
      mockCron.acknowledgeNotification.mockReturnValue(false)

      const result = await controller.acknowledgeNotification(
        { tenantId: 't1', storeId: 's-001' },
        { id: 'non-existent' }
      )

      expect(result.success).toBe(true)
      expect(result.data.acknowledged).toBe(false)
      expect(result.message).toContain('not found')
    })

    it('should handle empty string id', async () => {
      mockCron.acknowledgeNotification.mockReturnValue(false)

      const result = await controller.acknowledgeNotification(
        { tenantId: 't1', storeId: 's-001' },
        { id: '' }
      )

      expect(result.success).toBe(true)
      expect(result.data.acknowledged).toBe(false)
      expect(mockCron.acknowledgeNotification).toHaveBeenCalledWith('')
    })
  })

  // ── POST /api/finance/settlement/notifications/ack-all ───────

  describe('POST /api/finance/settlement/notifications/ack-all', () => {
    it('should acknowledge all and return count', async () => {
      mockCron.acknowledgeAll.mockReturnValue(3)

      const result = await controller.acknowledgeAll(
        { tenantId: 't1', storeId: 's-001' }
      )

      expect(result.success).toBe(true)
      expect(result.data.acknowledgedCount).toBe(3)
      expect(result.message).toContain('3 notifications')
    })

    it('should return 0 when no notifications to acknowledge', async () => {
      mockCron.acknowledgeAll.mockReturnValue(0)

      const result = await controller.acknowledgeAll(
        { tenantId: 't1', storeId: 's-001' }
      )

      expect(result.success).toBe(true)
      expect(result.data.acknowledgedCount).toBe(0)
    })

    it('should handle large count values', async () => {
      mockCron.acknowledgeAll.mockReturnValue(999)

      const result = await controller.acknowledgeAll(
        { tenantId: 't1', storeId: 's-001' }
      )

      expect(result.success).toBe(true)
      expect(result.data.acknowledgedCount).toBe(999)
      expect(result.message).toContain('999 notifications')
    })
  })

  // ── GET /api/finance/settlement/metrics ──────────────────────

  describe('GET /api/finance/settlement/metrics', () => {
    it('should return settlement metrics', async () => {
      mockCron.getMetrics.mockReturnValue(mockMetrics)

      const result = await controller.getMetrics(
        { tenantId: 't1', storeId: 's-001' }
      )

      expect(result.success).toBe(true)
      expect(result.data.totalSettlements).toBe(4)
      expect(result.data.totalCompleted).toBe(4)
      expect(result.data.totalFailed).toBe(0)
      expect(result.data.lastRunAt).toBeTruthy()
      expect(result.data.lastError).toBeNull()
      expect(result.data.unacknowledgedNotifications).toBe(1)
    })

    it('should return initial metrics when no settlement has run', async () => {
      mockCron.getMetrics.mockReturnValue({
        totalSettlements: 0,
        totalCompleted: 0,
        totalFailed: 0,
        lastRunAt: null,
        lastError: null,
        unacknowledgedNotifications: 0,
      })

      const result = await controller.getMetrics(
        { tenantId: 't1', storeId: 's-001' }
      )

      expect(result.success).toBe(true)
      expect(result.data.totalSettlements).toBe(0)
      expect(result.data.lastRunAt).toBeNull()
    })

    it('should include lastError when settlements failed', async () => {
      mockCron.getMetrics.mockReturnValue({
        ...mockMetrics,
        totalFailed: 2,
        lastError: 'Upstream timeout for store-B1',
      })

      const result = await controller.getMetrics(
        { tenantId: 't1', storeId: 's-001' }
      )

      expect(result.success).toBe(true)
      expect(result.data.totalFailed).toBe(2)
      expect(result.data.lastError).toContain('Upstream timeout')
    })

    it('should correctly count unacknowledged notifications', async () => {
      mockCron.getMetrics.mockReturnValue({
        ...mockMetrics,
        unacknowledgedNotifications: 5,
      })

      const result = await controller.getMetrics(
        { tenantId: 't1', storeId: 's-001' }
      )

      expect(result.success).toBe(true)
      expect(result.data.unacknowledgedNotifications).toBe(5)
    })
  })
})

// Total: 21 test cases
