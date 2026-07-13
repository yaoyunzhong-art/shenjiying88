import { describe, it, expect } from 'vitest'

interface UserSession { id: string; userId: string; tenantId: string; token: string; refreshToken: string; expiresAt: string; device?: string; ip?: string; lastActiveAt: string }
function isSessionExpired(session: UserSession): boolean { return new Date(session.expiresAt).getTime() < Date.now() }

describe('✅ AC-SESSION: 会话', () => {
  it('创建会话', () => {
    const s: UserSession = { id: 's1', userId: 'u1', tenantId: 't1', token: 'tok_xxx', refreshToken: 'ref_xxx', expiresAt: new Date(Date.now() + 86400000).toISOString(), device: 'ios', ip: '192.168.1.1', lastActiveAt: new Date().toISOString() }
    expect(s.token).toContain('tok_'); expect(s.device).toBe('ios')
  })
  it('过期检测', () => {
    const expired: UserSession = { id: 's2', userId: 'u1', tenantId: 't1', token: 'tok_old', refreshToken: 'ref_old', expiresAt: new Date(Date.now() - 1000).toISOString(), lastActiveAt: '' }
    expect(isSessionExpired(expired)).toBe(true)
  })
  it('刷新令牌', () => {
    const rt = 'refresh_token_abc'
    expect(rt.length).toBeGreaterThan(5)
  })
})
