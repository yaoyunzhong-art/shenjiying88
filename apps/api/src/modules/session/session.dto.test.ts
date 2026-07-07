// session.dto.test.ts · 会话 DTO 测试
// Phase-FP P10 · 2026-07-08

import { describe, it, expect } from 'vitest'
import {
  CreateSessionDto,
  ValidateSessionDto,
  RevokeSessionDto,
  RevokeAllSessionsDto,
} from './session.dto'

describe('Session DTOs', () => {
  it('CreateSessionDto 应包含必需字段', () => {
    const dto: CreateSessionDto = {
      userId: 'user-001',
      tenantId: 'tenant-001',
      deviceInfo: {
        deviceId: 'device-001',
        deviceType: 'web',
        browser: 'Chrome',
        os: 'macOS',
        userAgent: 'Mozilla/5.0',
      },
    }

    expect(dto.userId).toBe('user-001')
    expect(dto.tenantId).toBe('tenant-001')
    expect(dto.deviceInfo.deviceId).toBe('device-001')
    expect(dto.deviceInfo.deviceType).toBe('web')
  })

  it('ValidateSessionDto 应包含 sessionId', () => {
    const dto: ValidateSessionDto = { sessionId: 'session-abc' }
    expect(dto.sessionId).toBe('session-abc')
  })

  it('RevokeSessionDto 应包含 sessionId', () => {
    const dto: RevokeSessionDto = { sessionId: 'session-xyz' }
    expect(dto.sessionId).toBe('session-xyz')
  })

  it('RevokeAllSessionsDto 应包含 userId', () => {
    const dto: RevokeAllSessionsDto = { userId: 'user-999' }
    expect(dto.userId).toBe('user-999')
  })

  it('CreateSessionDto 可选浏览器字段可为空', () => {
    const dto: CreateSessionDto = {
      userId: 'user-002',
      tenantId: 'tenant-001',
      deviceInfo: {
        deviceId: 'device-002',
        deviceType: 'mobile',
      },
    }

    expect(dto.deviceInfo.browser).toBeUndefined()
    expect(dto.deviceInfo.os).toBeUndefined()
  })
})
