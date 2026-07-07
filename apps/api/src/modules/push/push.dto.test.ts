import { describe, it, expect, assert } from 'vitest'
import { validate } from 'class-validator'
import 'reflect-metadata'
import {
  SendPushDto,
  SchedulePushDto,
  CancelScheduledPushDto,
  RegisterPushTemplateDto,
  UpdatePushTemplateDto,
  SendWSMessageDto,
  BroadcastMessageDto,
  PushQueryDto
} from './push.dto'
import { PushPlatform, PushPriority } from './push.entity'

describe('SendPushDto', () => {
  it('should pass validation with valid data', async () => {
    const dto = new SendPushDto()
    dto.deviceToken = 'a'.repeat(64)
    dto.platform = PushPlatform.iOS
    dto.alert = 'Test alert'
    dto.badge = 1
    dto.sound = 'default'
    dto.priority = PushPriority.High
    dto.memberId = 'member_1'
    dto.tenantId = 'tenant_1'

    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should pass validation without optional fields', async () => {
    const dto = new SendPushDto()
    dto.deviceToken = 'a'.repeat(64)
    dto.platform = PushPlatform.Android
    dto.alert = 'Alert only'

    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should fail with missing required fields', async () => {
    const dto = new SendPushDto()
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    const fields = errors.map((e) => e.property)
    expect(fields).toContain('deviceToken')
    expect(fields).toContain('platform')
    expect(fields).toContain('alert')
  })

  it('should fail with invalid platform enum', async () => {
    const dto = new SendPushDto()
    dto.deviceToken = 'a'.repeat(64)
    ;(dto as any).platform = 'INVALID'
    dto.alert = 'Test'

    const errors = await validate(dto)
    expect(errors.some((e) => e.property === 'platform')).toBe(true)
  })

  it('should fail with negative badge', async () => {
    const dto = new SendPushDto()
    dto.deviceToken = 'a'.repeat(64)
    dto.platform = PushPlatform.iOS
    dto.alert = 'Test'
    dto.badge = -1

    const errors = await validate(dto)
    expect(errors.some((e) => e.property === 'badge')).toBe(true)
  })
})

describe('SchedulePushDto', () => {
  it('should pass validation with valid data', async () => {
    const dto = new SchedulePushDto()
    dto.memberId = 'member_1'
    dto.tenantId = 'tenant_1'
    dto.content = 'Scheduled message'
    dto.platform = PushPlatform.iOS
    dto.sendAt = '2026-02-01T00:00:00Z'

    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should fail with missing required fields', async () => {
    const dto = new SchedulePushDto()
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    const fields = errors.map((e) => e.property)
    expect(fields).toContain('memberId')
    expect(fields).toContain('tenantId')
    expect(fields).toContain('content')
    expect(fields).toContain('platform')
    expect(fields).toContain('sendAt')
  })

  it('should fail with invalid sendAt date', async () => {
    const dto = new SchedulePushDto()
    dto.memberId = 'member_1'
    dto.tenantId = 'tenant_1'
    dto.content = 'Test'
    dto.platform = PushPlatform.iOS
    ;(dto as any).sendAt = 'not-a-date'

    const errors = await validate(dto)
    expect(errors.some((e) => e.property === 'sendAt')).toBe(true)
  })
})

describe('CancelScheduledPushDto', () => {
  it('should pass validation with valid data', async () => {
    const dto = new CancelScheduledPushDto()
    dto.pushId = 'sched_001'
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should fail with empty pushId', async () => {
    const dto = new CancelScheduledPushDto()
    dto.pushId = ''
    const errors = await validate(dto)
    expect(errors.some((e) => e.property === 'pushId')).toBe(true)
  })
})

describe('RegisterPushTemplateDto', () => {
  it('should pass validation with valid data', async () => {
    const dto = new RegisterPushTemplateDto()
    dto.code = 'welcome'
    dto.platform = PushPlatform.iOS
    dto.tenantId = 'tenant_1'
    dto.body = 'Welcome body'
    dto.sound = 'default'
    dto.badge = 1
    dto.enabled = true

    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should pass validation without optional fields', async () => {
    const dto = new RegisterPushTemplateDto()
    dto.code = 'minimal'
    dto.platform = PushPlatform.Web
    dto.tenantId = 'tenant_1'
    dto.body = 'Minimal body'

    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should fail with negative badge', async () => {
    const dto = new RegisterPushTemplateDto()
    dto.code = 'badge'
    dto.platform = PushPlatform.iOS
    dto.tenantId = 'tenant_1'
    dto.body = 'Test'
    dto.badge = -5

    const errors = await validate(dto)
    expect(errors.some((e) => e.property === 'badge')).toBe(true)
  })
})

describe('UpdatePushTemplateDto', () => {
  it('should pass validation with partial data', async () => {
    const dto = new UpdatePushTemplateDto()
    dto.title = 'New Title'
    dto.body = 'Updated body'

    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should pass with all fields empty (all optional)', async () => {
    const dto = new UpdatePushTemplateDto()
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })
})

describe('SendWSMessageDto', () => {
  it('should pass validation with valid data', async () => {
    const dto = new SendWSMessageDto()
    dto.clientId = 'client_1'
    dto.channel = 'notifications'
    dto.data = { msg: 'hello' }

    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should fail without clientId', async () => {
    const dto = new SendWSMessageDto()
    dto.channel = 'test'
    dto.data = {}

    const errors = await validate(dto)
    expect(errors.some((e) => e.property === 'clientId')).toBe(true)
  })
})

describe('BroadcastMessageDto', () => {
  it('should pass validation with valid data', async () => {
    const dto = new BroadcastMessageDto()
    dto.channel = 'global'
    dto.data = { event: 'update' }

    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should fail without channel', async () => {
    const dto = new BroadcastMessageDto()
    dto.data = {}

    const errors = await validate(dto)
    expect(errors.some((e) => e.property === 'channel')).toBe(true)
  })
})

describe('PushQueryDto', () => {
  it('should pass validation with all fields', async () => {
    const dto = new PushQueryDto()
    dto.memberId = 'member_1'
    dto.tenantId = 'tenant_1'
    dto.platform = PushPlatform.iOS
    dto.from = '2026-01-01T00:00:00Z'
    dto.to = '2026-02-01T00:00:00Z'
    dto.page = 1
    dto.limit = 20

    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should pass with empty dto (all optional)', async () => {
    const dto = new PushQueryDto()
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should fail with negative page', async () => {
    const dto = new PushQueryDto()
    dto.page = -1

    const errors = await validate(dto)
    expect(errors.some((e) => e.property === 'page')).toBe(true)
  })

  it('should fail with zero limit', async () => {
    const dto = new PushQueryDto()
    dto.limit = 0

    const errors = await validate(dto)
    expect(errors.some((e) => e.property === 'limit')).toBe(true)
  })
})
