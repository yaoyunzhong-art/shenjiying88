import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [omnichannel] [D] controller spec 补全 - 全路由覆盖
 *
 * OmnichannelController routes:
 *   POST /omnichannel/reach                    → reach
 *   POST /omnichannel/reach-all                → reachAll
 *   GET  /omnichannel/history/:memberId        → getHistory
 *   GET  /omnichannel/channel/:channel         → getChannelStatus
 *   PATCH /omnichannel/channel/:channel        → setChannelStatus
 *   GET  /omnichannel/channels                 → listChannels
 *   POST /omnichannel/sms/send                 → sendSms
 *   POST /omnichannel/sms/send-backup          → sendSmsBackup
 *   POST /omnichannel/sms/send-fallback        → sendSmsFallback
 *   GET  /omnichannel/sms/status/:messageId    → getSmsStatus
 *   POST /omnichannel/email/send               → sendEmail
 *   POST /omnichannel/email/bulk               → sendBulkEmail
 *   POST /omnichannel/email/render             → renderTemplate
 *   GET  /omnichannel/email/status/:messageId  → getEmailStatus
 *
 * 覆盖: 正例 / 反例 / 边界
 */

import assert from 'node:assert/strict'

// ── Factory Helpers ──

function makeReachResult(overrides: Record<string, unknown> = {}) {
  return {
    success: true,
    messageId: 'msg_001_abc123',
    channel: 'SMS',
    timestamp: new Date('2026-07-07T00:00:00Z'),
    ...overrides,
  }
}

function makeSmsStatus(overrides: Record<string, unknown> = {}) {
  return {
    messageId: 'sms_001_def456',
    status: 'sent',
    channel: 'primary',
    timestamp: new Date('2026-07-07T00:00:00Z'),
    ...overrides,
  }
}

function makeEmailStatus(overrides: Record<string, unknown> = {}) {
  return {
    messageId: 'email_001_ghi789',
    status: 'sent',
    locale: 'en-US',
    timestamp: new Date('2026-07-07T00:00:00Z'),
    ...overrides,
  }
}

// ── Mock Services ──
// We mock the 3 services to test controller input/output mapping only.

const mockReachService = {
  reach: vi.fn(),
  reachAll: vi.fn(),
  getReachHistory: vi.fn(),
  getChannelStatus: vi.fn(),
  setChannelStatus: vi.fn(),
}

const mockSmsService = {
  sendViaPrimary: vi.fn(),
  sendViaBackup: vi.fn(),
  sendWithFallback: vi.fn(),
  getDeliveryStatus: vi.fn(),
}

const mockEmailService = {
  sendEmail: vi.fn(),
  sendBulkEmail: vi.fn(),
  renderTemplate: vi.fn(),
  getEmailStatus: vi.fn(),
}

// We need the controller to accept our mocks. Use proper DI by importing the real class.
// We'll dynamically replace internal service refs.
let controller: any

async function createController(): Promise<any> {
  const { OmnichannelController } = await import('./omnichannel.controller')
  const ctrl = new OmnichannelController(
    mockReachService as any,
    mockSmsService as any,
    mockEmailService as any,
  )
  return ctrl
}

describe('OmnichannelController - Spec Coverage', () => {
  beforeAll(async () => {
    controller = await createController()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ═══════════════════════════════════════════
  //  Reach Routes
  // ═══════════════════════════════════════════

  describe('POST /omnichannel/reach (reach)', () => {
    it('should return success when reaching a single member via SMS', async () => {
      const expected = makeReachResult()
      mockReachService.reach.mockResolvedValue(expected)

      const result = await controller.reach({
        memberId: 'm1',
        channel: 'SMS',
        content: 'Hello',
      })

      assert.equal(result.success, true)
      assert.equal(result.messageId, 'msg_001_abc123')
      assert.equal(result.channel, 'SMS')
      expect(mockReachService.reach).toHaveBeenCalledWith('m1', 'SMS', 'Hello')
    })

    it('should return error when channel is in maintenance', async () => {
      mockReachService.reach.mockResolvedValue(
        makeReachResult({ success: false, error: 'Channel SMS is maintenance' }),
      )

      const result = await controller.reach({
        memberId: 'm2',
        channel: 'SMS',
        content: 'Maintenance test',
      })

      assert.equal(result.success, false)
      assert.ok(result.error)
    })

    it('should handle empty content gracefully', async () => {
      mockReachService.reach.mockResolvedValue(makeReachResult())

      const result = await controller.reach({ memberId: 'm3', channel: 'Email', content: '' })

      assert.equal(result.success, true)
      expect(mockReachService.reach).toHaveBeenCalledWith('m3', 'Email', '')
    })

    it('should handle non-existent memberId', async () => {
      // Service doesn't validate member existence; controller should still pass through
      mockReachService.reach.mockResolvedValue(makeReachResult())

      const result = await controller.reach({ memberId: '', channel: 'Push', content: 'test' })

      assert.equal(result.success, true)
    })
  })

  describe('POST /omnichannel/reach-all (reachAll)', () => {
    it('should reach multiple members with same channel and content', async () => {
      const results = [makeReachResult({ messageId: 'a' }), makeReachResult({ messageId: 'b' })]
      mockReachService.reachAll.mockResolvedValue(results)

      const result = await controller.reachAll({
        memberIds: ['m1', 'm2'],
        channel: 'SMS',
        content: 'Batch message',
      })

      assert.equal(result.total, 2)
      assert.equal(result.results.length, 2)
      expect(mockReachService.reachAll).toHaveBeenCalledWith(['m1', 'm2'], 'SMS', 'Batch message')
    })

    it('should handle empty memberIds list', async () => {
      mockReachService.reachAll.mockResolvedValue([])

      const result = await controller.reachAll({
        memberIds: [],
        channel: 'Email',
        content: 'Empty batch',
      })

      assert.equal(result.total, 0)
      assert.deepEqual(result.results, [])
    })

    it('should handle 1000+ member ids', async () => {
      const manyIds = Array.from({ length: 1000 }, (_, i) => `m${i}`)
      const manyResults = manyIds.map((_, i) => makeReachResult({ messageId: `batch_${i}` }))
      mockReachService.reachAll.mockResolvedValue(manyResults)

      const result = await controller.reachAll({
        memberIds: manyIds,
        channel: 'App',
        content: 'Scale test',
      })

      assert.equal(result.total, 1000)
    })
  })

  describe('GET /omnichannel/history/:memberId (getHistory)', () => {
    it('should return delivery history for a member', async () => {
      const deliveries = [
        { id: 'd1', memberId: 'm1', channel: 'SMS', content: 'Hi', status: 'delivered', messageId: 'm1', timestamp: '2026-07-01T00:00:00Z' },
        { id: 'd2', memberId: 'm1', channel: 'Email', content: 'Welcome', status: 'sent', messageId: 'm2', timestamp: '2026-07-02T00:00:00Z' },
      ]
      mockReachService.getReachHistory.mockReturnValue(deliveries)

      const result = await controller.getHistory('m1', {})

      assert.equal(result.memberId, 'm1')
      assert.equal(result.total, 2)
      assert.equal(result.deliveries.length, 2)
    })

    it('should filter by channel when query param is provided', async () => {
      const deliveries = [
        { id: 'd1', memberId: 'm2', channel: 'SMS', content: 'Hi', status: 'delivered', messageId: 'm3', timestamp: '2026-07-01T00:00:00Z' },
        { id: 'd2', memberId: 'm2', channel: 'Email', content: 'Welcome', status: 'sent', messageId: 'm4', timestamp: '2026-07-02T00:00:00Z' },
      ]
      mockReachService.getReachHistory.mockReturnValue(deliveries)

      const result = await controller.getHistory('m2', { channel: 'SMS' })

      assert.equal(result.total, 1)
      assert.equal(result.deliveries[0].channel, 'SMS')
    })

    it('should return empty array when member has no history', async () => {
      mockReachService.getReachHistory.mockReturnValue([])

      const result = await controller.getHistory('unknown', {})

      assert.equal(result.total, 0)
      assert.deepEqual(result.deliveries, [])
    })
  })

  describe('GET /omnichannel/channel/:channel (getChannelStatus)', () => {
    it('should return available status for SMS channel', async () => {
      mockReachService.getChannelStatus.mockReturnValue('available')

      const result = await controller.getChannelStatus('SMS')

      assert.equal(result.channel, 'SMS')
      assert.equal(result.status, 'available')
      assert.ok(result.lastChecked)
    })

    it('should return maintenance status when channel is down', async () => {
      mockReachService.getChannelStatus.mockReturnValue('maintenance')

      const result = await controller.getChannelStatus('SMS')

      assert.equal(result.status, 'maintenance')
    })
  })

  describe('PATCH /omnichannel/channel/:channel (setChannelStatus)', () => {
    it('should update channel status', async () => {
      mockReachService.setChannelStatus.mockReturnValue(undefined)

      const result = await controller.setChannelStatus('SMS', { status: 'maintenance' })

      assert.equal(result.channel, 'SMS')
      assert.equal(result.status, 'maintenance')
      assert.equal(result.updated, true)
      expect(mockReachService.setChannelStatus).toHaveBeenCalledWith('SMS', 'maintenance')
    })
  })

  describe('GET /omnichannel/channels (listChannels)', () => {
    it('should return all configured channels with their status', async () => {
      mockReachService.getChannelStatus
        .mockReturnValueOnce('available')
        .mockReturnValueOnce('available')
        .mockReturnValueOnce('maintenance')
        .mockReturnValueOnce('available')

      const result = await controller.listChannels()

      assert.ok(Array.isArray(result))
      assert.equal(result.length, 4)
      // First is SMS - available
      assert.equal(result[0].channel, 'SMS')
      assert.equal(result[0].status, 'available')
      // Third is Push - maintenance
      assert.equal(result[2].channel, 'Push')
      assert.equal(result[2].status, 'maintenance')
    })
  })

  // ═══════════════════════════════════════════
  //  SMS Routes
  // ═══════════════════════════════════════════

  describe('POST /omnichannel/sms/send (sendSms)', () => {
    it('should send SMS via primary channel', async () => {
      mockSmsService.sendViaPrimary.mockResolvedValue(makeSmsStatus())

      const result = await controller.sendSms({ phone: '+8613800000000', content: 'Verify code: 1234' })

      assert.equal(result.messageId, 'sms_001_def456')
      assert.equal(result.channel, 'primary')
      assert.equal(result.status, 'sent')
      expect(mockSmsService.sendViaPrimary).toHaveBeenCalledWith('+8613800000000', 'Verify code: 1234')
    })
  })

  describe('POST /omnichannel/sms/send-backup (sendSmsBackup)', () => {
    it('should send SMS via backup channel', async () => {
      mockSmsService.sendViaBackup.mockResolvedValue(makeSmsStatus({ channel: 'backup' }))

      const result = await controller.sendSmsBackup({ phone: '+8613800000001', content: 'Backup test' })

      assert.equal(result.channel, 'backup')
      expect(mockSmsService.sendViaBackup).toHaveBeenCalledWith('+8613800000001', 'Backup test')
    })
  })

  describe('POST /omnichannel/sms/send-fallback (sendSmsFallback)', () => {
    it('should fallback to backup when primary fails', async () => {
      mockSmsService.sendWithFallback.mockResolvedValue(makeSmsStatus({ channel: 'backup' }))

      const result = await controller.sendSmsFallback({ phone: '+8613800000002', content: 'Fallback test' })

      assert.equal(result.channel, 'backup')
      expect(mockSmsService.sendWithFallback).toHaveBeenCalledWith('+8613800000002', 'Fallback test')
    })
  })

  describe('GET /omnichannel/sms/status/:messageId (getSmsStatus)', () => {
    it('should return delivery status for valid message', async () => {
      mockSmsService.getDeliveryStatus.mockReturnValue(makeSmsStatus())

      const result = await controller.getSmsStatus('sms_001')

      assert.equal(result.messageId, 'sms_001_def456')
      assert.equal(result.status, 'sent')
    })

    it('should return not_found for unknown messageId', async () => {
      mockSmsService.getDeliveryStatus.mockReturnValue(undefined)

      const result = await controller.getSmsStatus('unknown')

      assert.equal(result.status, 'not_found')
    })
  })

  // ═══════════════════════════════════════════
  //  Email Routes
  // ═══════════════════════════════════════════

  describe('POST /omnichannel/email/send (sendEmail)', () => {
    it('should send email with default locale', async () => {
      mockEmailService.sendEmail.mockResolvedValue(makeEmailStatus())

      const result = await controller.sendEmail({
        to: 'user@example.com',
        subject: 'Welcome',
        body: 'Hello!',
      })

      assert.equal(result.messageId, 'email_001_ghi789')
      assert.equal(result.status, 'sent')
      assert.equal(result.locale, 'en-US')
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith('user@example.com', 'Welcome', 'Hello!', undefined)
    })

    it('should send email with custom locale', async () => {
      mockEmailService.sendEmail.mockResolvedValue(makeEmailStatus({ locale: 'zh-CN' }))

      const result = await controller.sendEmail({
        to: 'user@cn.com',
        subject: '欢迎',
        body: '你好！',
        locale: 'zh-CN',
      })

      assert.equal(result.locale, 'zh-CN')
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith('user@cn.com', '欢迎', '你好！', 'zh-CN')
    })
  })

  describe('POST /omnichannel/email/bulk (sendBulkEmail)', () => {
    it('should send bulk email to multiple recipients', async () => {
      const statuses = [
        makeEmailStatus({ messageId: 'e1' }),
        makeEmailStatus({ messageId: 'e2' }),
        makeEmailStatus({ messageId: 'e3' }),
      ]
      mockEmailService.sendBulkEmail.mockResolvedValue(statuses)

      const result = await controller.sendBulkEmail({
        recipients: ['a@test.com', 'b@test.com', 'c@test.com'],
        subject: 'Bulk',
        body: 'Bulk body',
      })

      assert.equal(result.total, 3)
      assert.equal(result.results.length, 3)
      expect(mockEmailService.sendBulkEmail).toHaveBeenCalledWith(
        [{ to: 'a@test.com' }, { to: 'b@test.com' }, { to: 'c@test.com' }],
        'Bulk',
        'Bulk body',
        undefined,
      )
    })

    it('should handle single recipient', async () => {
      mockEmailService.sendBulkEmail.mockResolvedValue([makeEmailStatus()])

      const result = await controller.sendBulkEmail({
        recipients: ['single@test.com'],
        subject: 'Single',
        body: 'Only one',
      })

      assert.equal(result.total, 1)
    })

    it('should handle empty recipient list', async () => {
      mockEmailService.sendBulkEmail.mockResolvedValue([])

      const result = await controller.sendBulkEmail({
        recipients: [],
        subject: 'Empty',
        body: 'No recipients',
      })

      assert.equal(result.total, 0)
      assert.deepEqual(result.results, [])
    })
  })

  describe('POST /omnichannel/email/render (renderTemplate)', () => {
    it('should render a known template with data', async () => {
      mockEmailService.renderTemplate.mockReturnValue('Welcome 张三 to our platform!')

      const result = await controller.renderTemplate({
        templateId: 'welcome',
        locale: 'zh-CN',
        data: { name: '张三' },
      })

      assert.equal(result.templateId, 'welcome')
      assert.equal(result.locale, 'zh-CN')
      assert.equal(result.rendered, 'Welcome 张三 to our platform!')
    })

    it('should return template not found message for unknown template', async () => {
      mockEmailService.renderTemplate.mockReturnValue('Template unknown not found')

      const result = await controller.renderTemplate({
        templateId: 'unknown',
        locale: 'en-US',
        data: {},
      })

      assert.ok(result.rendered.includes('not found'))
    })
  })

  describe('GET /omnichannel/email/status/:messageId (getEmailStatus)', () => {
    it('should return email status for valid message', async () => {
      mockEmailService.getEmailStatus.mockReturnValue(makeEmailStatus())

      const result = await controller.getEmailStatus('email_001')

      assert.equal(result.messageId, 'email_001_ghi789')
      assert.equal(result.status, 'sent')
    })

    it('should return not_found for unknown email message', async () => {
      mockEmailService.getEmailStatus.mockReturnValue(undefined)

      const result = await controller.getEmailStatus('unknown')

      assert.equal(result.status, 'not_found')
    })
  })
})
