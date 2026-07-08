import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [omnichannel] [A] e2e 补全
 *
 * E2E: 全渠道触达 HTTP 链路
 *
 * 链路:
 *   HTTP → TestController → OmnichannelReachService / SMSDualChannelService / InternationalEmailService
 *
 * 验证:
 *   - 单条触达 (SMS / Email / Push / App)
 *   - 批量触达
 *   - 触达历史查询
 *   - 渠道状态管理
 *   - 短信双通道 (主/备/自动切换)
 *   - 国际化邮件 (多语言发送 / 模板渲染)
 *   - 异常输入 (渠道不可用、空列表、未知 messageId)
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Body, Controller, Get, Post, Patch, Param, Query } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import {
  OmnichannelReachService,
  SMSDualChannelService,
  InternationalEmailService,
} from './omnichannel.service'

// ── Test Controller (mirrors OmnichannelController without NestJS decorator conflicts) ──

@Controller('omnichannel')
class TestOmnichannelController {
  constructor(
    private readonly reachService: OmnichannelReachService,
    private readonly smsService: SMSDualChannelService,
    private readonly emailService: InternationalEmailService,
  ) {}

  @Post('reach')
  async reach(@Body() body: { memberId: string; channel: string; content: string }) {
    return this.reachService.reach(body.memberId, body.channel as any, body.content)
  }

  @Post('reach-all')
  async reachAll(@Body() body: { memberIds: string[]; channel: string; content: string }) {
    const results = await this.reachService.reachAll(body.memberIds, body.channel as any, body.content)
    return { results, total: results.length }
  }

  @Get('history/:memberId')
  async getHistory(@Param('memberId') memberId: string, @Query('channel') channel?: string) {
    const history = this.reachService.getReachHistory(memberId)
    const filtered = channel ? history.filter(h => h.channel === channel) : history
    return { memberId, deliveries: filtered, total: filtered.length }
  }

  @Get('channel/:channel')
  async getChannelStatus(@Param('channel') channel: string) {
    const status = this.reachService.getChannelStatus(channel as any)
    return { channel, status, lastChecked: new Date().toISOString() }
  }

  @Patch('channel/:channel')
  async setChannelStatus(@Param('channel') channel: string, @Body() body: { status: string }) {
    this.reachService.setChannelStatus(channel as any, body.status as any)
    return { channel, status: body.status, updated: true }
  }

  @Get('channels')
  async listChannels() {
    const channels = ['SMS', 'Email', 'Push', 'App'] as const
    return channels.map(ch => ({
      channel: ch,
      status: this.reachService.getChannelStatus(ch),
    }))
  }

  @Post('sms/send')
  async sendSms(@Body() body: { phone: string; content: string }) {
    return this.smsService.sendViaPrimary(body.phone, body.content)
  }

  @Post('sms/send-backup')
  async sendSmsBackup(@Body() body: { phone: string; content: string }) {
    return this.smsService.sendViaBackup(body.phone, body.content)
  }

  @Post('sms/send-fallback')
  async sendSmsFallback(@Body() body: { phone: string; content: string }) {
    return this.smsService.sendWithFallback(body.phone, body.content)
  }

  @Get('sms/status/:messageId')
  async getSmsStatus(@Param('messageId') messageId: string) {
    const status = this.smsService.getDeliveryStatus(messageId)
    if (!status) return { messageId, status: 'not_found' }
    return status
  }

  @Post('email/send')
  async sendEmail(@Body() body: { to: string; subject: string; body: string; locale?: string }) {
    return this.emailService.sendEmail(body.to, body.subject, body.body, (body.locale ?? 'en-US') as any)
  }

  @Post('email/bulk')
  async sendBulkEmail(@Body() body: { recipients: string[]; subject: string; body: string; locale?: string }) {
    const recipients = body.recipients.map(to => ({ to }))
    const results = await this.emailService.sendBulkEmail(recipients, body.subject, body.body, (body.locale ?? 'en-US') as any)
    return { results, total: results.length }
  }

  @Post('email/render')
  async renderTemplate(@Body() body: { templateId: string; locale: string; data: Record<string, string> }) {
    const rendered = this.emailService.renderTemplate(body.templateId, body.locale as any, body.data)
    return { templateId: body.templateId, locale: body.locale, rendered }
  }

  @Get('email/status/:messageId')
  async getEmailStatus(@Param('messageId') messageId: string) {
    const status = this.emailService.getEmailStatus(messageId)
    if (!status) return { messageId, status: 'not_found' }
    return status
  }
}

// ── Test Setup ──

async function createTestApp() {
  const moduleRef = await Test.createTestingModule({
    controllers: [TestOmnichannelController],
    providers: [
      OmnichannelReachService,
      SMSDualChannelService,
      InternationalEmailService,
    ],
  }).compile()

  const app = moduleRef.createNestApplication()
  // No ResponseInterceptor in e2e tests — test raw controller output directly
  await app.init()
  return app
}

describe('Omnichannel E2E: HTTP 链路', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>

  beforeAll(async () => {
    app = await createTestApp()
  })

  afterAll(async () => {
    await app.close()
  })

  // ── Reach ──

  describe('POST /omnichannel/reach', () => {
    it('应通过 SMS 成功触达', async () => {
      const res = await request(app.getHttpServer())
        .post('/omnichannel/reach')
        .send({ memberId: 'e2e-m1', channel: 'SMS', content: 'E2E 测试消息' })
        .expect(201)

      assert.equal(res.body.success, true)
      assert.equal(res.body.channel, 'SMS')
      assert.ok(res.body.messageId)
    })

    it('渠道 maintenance 时返回失败', async () => {
      await request(app.getHttpServer())
        .patch('/omnichannel/channel/SMS')
        .send({ status: 'maintenance' })
        .expect(200)

      const res = await request(app.getHttpServer())
        .post('/omnichannel/reach')
        .send({ memberId: 'e2e-m1', channel: 'SMS', content: '应在维护中' })
        .expect(201)

      assert.equal(res.body.success, false)
      assert.ok(res.body.error)

      // 恢复
      await request(app.getHttpServer())
        .patch('/omnichannel/channel/SMS')
        .send({ status: 'available' })
    })
  })

  describe('POST /omnichannel/reach-all', () => {
    it('应批量触达所有会员', async () => {
      const res = await request(app.getHttpServer())
        .post('/omnichannel/reach-all')
        .send({ memberIds: ['e2e-m1', 'e2e-m2', 'e2e-m3'], channel: 'Email', content: '批量通知' })
        .expect(201)

      assert.equal(res.body.total, 3)
      assert.equal(res.body.results.length, 3)
      assert.ok(res.body.results.every((r: any) => r.success))
    })

    it('空列表应返回 0 条结果', async () => {
      const res = await request(app.getHttpServer())
        .post('/omnichannel/reach-all')
        .send({ memberIds: [], channel: 'Push', content: '空' })
        .expect(201)

      assert.equal(res.body.total, 0)
    })
  })

  describe('GET /omnichannel/history/:memberId', () => {
    it('应返回该会员触达历史', async () => {
      await request(app.getHttpServer())
        .post('/omnichannel/reach')
        .send({ memberId: 'hist-m1', channel: 'SMS', content: '历史1' })

      const res = await request(app.getHttpServer())
        .get('/omnichannel/history/hist-m1')
        .expect(200)

      assert.equal(res.body.memberId, 'hist-m1')
      assert.ok(res.body.total >= 1)
    })

    it('无历史的会员应返回 0', async () => {
      const res = await request(app.getHttpServer())
        .get('/omnichannel/history/unknown-member')
        .expect(200)

      assert.equal(res.body.total, 0)
    })
  })

  // ── SMS ──

  describe('POST /omnichannel/sms/send', () => {
    it('应通过主通道发送短信', async () => {
      const res = await request(app.getHttpServer())
        .post('/omnichannel/sms/send')
        .send({ phone: '+8613800000000', content: 'E2E SMS 主通道' })
        .expect(201)

      assert.equal(res.body.channel, 'primary')
      assert.equal(res.body.status, 'sent')
    })
  })

  describe('POST /omnichannel/sms/send-backup', () => {
    it('应通过备用通道发送短信', async () => {
      const res = await request(app.getHttpServer())
        .post('/omnichannel/sms/send-backup')
        .send({ phone: '+8613800000000', content: 'E2E SMS 备用' })
        .expect(201)

      assert.equal(res.body.channel, 'backup')
    })
  })

  describe('POST /omnichannel/sms/send-fallback', () => {
    it('主通道可用时走主通道', async () => {
      const res = await request(app.getHttpServer())
        .post('/omnichannel/sms/send-fallback')
        .send({ phone: '+8613800000000', content: '自动切换测试' })
        .expect(201)

      assert.equal(res.body.status, 'sent')
      assert.equal(res.body.channel, 'primary')
    })
  })

  describe('GET /omnichannel/sms/status/:messageId', () => {
    it('已发送短信应返回 sent 状态', async () => {
      const sent = await request(app.getHttpServer())
        .post('/omnichannel/sms/send')
        .send({ phone: '+86', content: '状态测试' })
        .expect(201)

      const res = await request(app.getHttpServer())
        .get(`/omnichannel/sms/status/${sent.body.messageId}`)
        .expect(200)

      assert.equal(res.body.status, 'sent')
    })

    it('未知 messageId 应返回 not_found', async () => {
      const res = await request(app.getHttpServer())
        .get('/omnichannel/sms/status/idonotexist')
        .expect(200)

      assert.equal(res.body.status, 'not_found')
    })
  })

  // ── Email ──

  describe('POST /omnichannel/email/send', () => {
    it('应发送邮件到指定地址', async () => {
      const res = await request(app.getHttpServer())
        .post('/omnichannel/email/send')
        .send({ to: 'e2e@test.com', subject: 'E2E', body: 'Hello', locale: 'zh-CN' })
        .expect(201)

      assert.equal(res.body.status, 'sent')
      assert.equal(res.body.locale, 'zh-CN')
    })
  })

  describe('POST /omnichannel/email/bulk', () => {
    it('应批量发送邮件', async () => {
      const res = await request(app.getHttpServer())
        .post('/omnichannel/email/bulk')
        .send({ recipients: ['a@t.com', 'b@t.com'], subject: 'Bulk', body: 'Body' })
        .expect(201)

      assert.equal(res.body.total, 2)
      assert.ok(res.body.results.every((r: any) => r.status === 'sent'))
    })
  })

  describe('POST /omnichannel/email/render', () => {
    it('应渲染中文 welcome 模板', async () => {
      const res = await request(app.getHttpServer())
        .post('/omnichannel/email/render')
        .send({ templateId: 'welcome', locale: 'zh-CN', data: { name: 'E2E用户' } })
        .expect(201)

      assert.equal(res.body.rendered, '欢迎 E2E用户 加入我们！')
    })

    it('不存在的模板应返回提示', async () => {
      const res = await request(app.getHttpServer())
        .post('/omnichannel/email/render')
        .send({ templateId: 'void', locale: 'en-US', data: {} })
        .expect(201)

      assert.ok(res.body.rendered.includes('not found'))
    })
  })

  describe('GET /omnichannel/email/status/:messageId', () => {
    it('已发送邮件应返回状态', async () => {
      const sent = await request(app.getHttpServer())
        .post('/omnichannel/email/send')
        .send({ to: 'u@t.com', subject: 'S', body: 'B' })
        .expect(201)

      const res = await request(app.getHttpServer())
        .get(`/omnichannel/email/status/${sent.body.messageId}`)
        .expect(200)

      assert.equal(res.body.status, 'sent')
    })

    it('未知 messageId 返回 not_found', async () => {
      const res = await request(app.getHttpServer())
        .get('/omnichannel/email/status/nonexistent')
        .expect(200)

      assert.equal(res.body.status, 'not_found')
    })
  })

  // ── 渠道管理 ──

  describe('GET /omnichannel/channels', () => {
    it('应返回所有 4 个渠道', async () => {
      const res = await request(app.getHttpServer())
        .get('/omnichannel/channels')
        .expect(200)

      assert.equal(res.body.length, 4)
      const channels = res.body.map((c: any) => c.channel)
      assert.ok(channels.includes('SMS'))
      assert.ok(channels.includes('Email'))
      assert.ok(channels.includes('Push'))
      assert.ok(channels.includes('App'))
    })
  })

  describe('PATCH /omnichannel/channel/:channel', () => {
    it('应更新渠道状态', async () => {
      await request(app.getHttpServer())
        .patch('/omnichannel/channel/Push')
        .send({ status: 'maintenance' })
        .expect(200)

      const res = await request(app.getHttpServer())
        .get('/omnichannel/channel/Push')
        .expect(200)

      assert.equal(res.body.status, 'maintenance')

      // 恢复
      await request(app.getHttpServer())
        .patch('/omnichannel/channel/Push')
        .send({ status: 'available' })
    })
  })
})
