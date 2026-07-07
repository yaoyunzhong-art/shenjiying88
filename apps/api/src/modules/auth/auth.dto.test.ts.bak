// auth.dto.test.ts · 统一认证 DTO 校验测试
// Phase-FP P0 · 2026-07-05

import { describe, it, expect } from 'vitest'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import {
  LoginBySmsDto,
  LoginByPasswordDto,
  RefreshTokenDto,
  LogoutDto,
  WechatLoginDto,
  LoginType,
} from './auth.dto'

describe('LoginBySmsDto', () => {
  it('should validate a valid SMS login request', async () => {
    const dto = plainToInstance(LoginBySmsDto, {
      mobile: '13800138000',
      code: '123456',
    })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should reject invalid mobile number', async () => {
    const dto = plainToInstance(LoginBySmsDto, {
      mobile: '12345',
      code: '123456',
    })
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors.some(e => e.property === 'mobile')).toBe(true)
  })

  it('should reject empty mobile', async () => {
    const dto = plainToInstance(LoginBySmsDto, {
      mobile: '',
      code: '123456',
    })
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('should reject code shorter than 4 chars', async () => {
    const dto = plainToInstance(LoginBySmsDto, {
      mobile: '13800138000',
      code: '12',
    })
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors.some(e => e.property === 'code')).toBe(true)
  })

  it('should reject empty code', async () => {
    const dto = plainToInstance(LoginBySmsDto, {
      mobile: '13800138000',
      code: '',
    })
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('LoginByPasswordDto', () => {
  it('should validate valid password login with mobile', async () => {
    const dto = plainToInstance(LoginByPasswordDto, {
      mobile: '13800138000',
      password: 'password123',
      loginType: LoginType.MOBILE_PASSWORD,
    })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should validate valid password login with email', async () => {
    const dto = plainToInstance(LoginByPasswordDto, {
      email: 'user@example.com',
      password: 'password123',
    })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should reject password shorter than 6 chars', async () => {
    const dto = plainToInstance(LoginByPasswordDto, {
      mobile: '13800138000',
      password: '123',
    })
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors.some(e => e.property === 'password')).toBe(true)
  })

  it('should reject empty password', async () => {
    const dto = plainToInstance(LoginByPasswordDto, {
      mobile: '13800138000',
      password: '',
    })
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('should reject invalid email format', async () => {
    const dto = plainToInstance(LoginByPasswordDto, {
      email: 'not-an-email',
      password: 'password123',
    })
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors.some(e => e.property === 'email')).toBe(true)
  })

  it('should reject invalid mobile format with email login', async () => {
    const dto = plainToInstance(LoginByPasswordDto, {
      mobile: 'abc',
      email: 'user@example.com',
      password: 'password123',
    })
    const errors = await validate(dto)
    // mobile is optional but if provided must match format
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('RefreshTokenDto', () => {
  it('should validate valid refresh token request', async () => {
    const dto = plainToInstance(RefreshTokenDto, {
      refreshToken: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyXzAwMSJ9.signature',
    })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should reject empty refresh token', async () => {
    const dto = plainToInstance(RefreshTokenDto, {
      refreshToken: '',
    })
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('should reject missing refresh token', async () => {
    const dto = plainToInstance(RefreshTokenDto, {})
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('LogoutDto', () => {
  it('should validate logout with sessionId', async () => {
    const dto = plainToInstance(LogoutDto, {
      sessionId: 'sess_001',
      allSessions: false,
    })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should validate logout with allSessions flag', async () => {
    const dto = plainToInstance(LogoutDto, {
      allSessions: true,
    })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should validate empty logout body (all fields optional)', async () => {
    const dto = plainToInstance(LogoutDto, {})
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })
})

describe('WechatLoginDto', () => {
  it('should validate valid wechat code', async () => {
    const dto = plainToInstance(WechatLoginDto, {
      code: 'valid-wechat-code',
    })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should reject empty wechat code', async () => {
    const dto = plainToInstance(WechatLoginDto, {
      code: '',
    })
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('LoginType enum', () => {
  it('should have all expected login types', () => {
    expect(LoginType.MOBILE_SMS).toBe('mobile_sms')
    expect(LoginType.MOBILE_PASSWORD).toBe('mobile_password')
    expect(LoginType.WECHAT).toBe('wechat')
    expect(LoginType.WECHAT_MINIAPP).toBe('wechat_miniapp')
    expect(LoginType.EMAIL_PASSWORD).toBe('email_password')
    expect(LoginType.SSO).toBe('sso')
  })
})
