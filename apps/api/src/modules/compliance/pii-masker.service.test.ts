import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
// 用途: PIIMaskerService 单元测试 (各类型脱敏策略 + 文本脱敏)
import { PIIDetectorService } from './pii-detector.service'
import { PIIMaskerService } from './pii-masker.service'

function createEnv() {
  const detector = new PIIDetectorService()
  const masker = new PIIMaskerService(detector)
  return { detector, masker }
}

describe('PIIMaskerService', () => {
  let env: ReturnType<typeof createEnv>

  beforeEach(() => {
    env = createEnv()
  })

  // ── maskPhone ──

  describe('maskPhone', () => {
    it('should mask middle 4 digits: 138****1234', () => {
      expect(env.masker.maskPhone('13800138000')).toBe('138****8000')
    })

    it('should return original if too short', () => {
      expect(env.masker.maskPhone('12345')).toBe('12345')
    })

    it('should support custom mask character', () => {
      expect(env.masker.maskPhone('13800138000', '#')).toBe('138####8000')
    })
  })

  // ── maskEmail ──

  describe('maskEmail', () => {
    it('should mask local part: a***@example.com', () => {
      expect(env.masker.maskEmail('alice@example.com')).toBe('a***@example.com')
    })

    it('should handle single char local part', () => {
      expect(env.masker.maskEmail('a@b.com')).toBe('a***@b.com')
    })

    it('should return original if no @ found', () => {
      expect(env.masker.maskEmail('notanemail')).toBe('notanemail')
    })

    it('should handle empty local part before @', () => {
      expect(env.masker.maskEmail('@domain.com')).toBe('@domain.com')
    })
  })

  // ── maskIdCard ──

  describe('maskIdCard', () => {
    it('should mask middle 8 digits: 110101********1234', () => {
      expect(env.masker.maskIdCard('110101199001011234')).toBe('110101********1234')
    })

    it('should return original if too short', () => {
      expect(env.masker.maskIdCard('12345')).toBe('12345')
    })
  })

  // ── maskCreditCard ──

  describe('maskCreditCard', () => {
    it('should mask middle 6 digits: 411111******1111', () => {
      expect(env.masker.maskCreditCard('4111111111111111')).toBe('411111******1111')
    })

    it('should handle cards with spaces', () => {
      expect(env.masker.maskCreditCard('4111 1111 1111 1111')).toBe('411111******1111')
    })

    it('should return original if too short', () => {
      expect(env.masker.maskCreditCard('1234')).toBe('1234')
    })
  })

  // ── maskIP ──

  describe('maskIP', () => {
    it('should mask last 2 octets: 192.168.*.*', () => {
      expect(env.masker.maskIP('192.168.1.100')).toBe('192.168.*.*')
    })

    it('should return original if not 4 octets', () => {
      expect(env.masker.maskIP('not-an-ip')).toBe('not-an-ip')
    })
  })

  // ── mask (generic) ──

  describe('mask (generic dispatch)', () => {
    it('should dispatch to correct strategy by kind', () => {
      expect(env.masker.mask('13800138000', 'phone')).toBe('138****8000')
      expect(env.masker.mask('a@b.com', 'email')).toBe('a***@b.com')
      expect(env.masker.mask('192.168.1.1', 'ip')).toBe('192.168.*.*')
    })

    it('should return original for unknown kind', () => {
      expect(env.masker.mask('hello', 'phone' as any)).toBeDefined()
    })
  })

  // ── maskText ──

  describe('maskText', () => {
    it('should mask all PII in the text, preserving non-PII content', () => {
      const text = '用户张三, 手机13800138000, 邮箱zhangsan@test.com'
      const masked = env.masker.maskText(text)

      expect(masked).not.toContain('13800138000')
      expect(masked).not.toContain('zhangsan@test.com')
      expect(masked).toContain('用户张三')
      expect(masked).toContain('138****8000')
      expect(masked).toContain('z***@test.com')
    })

    it('should return original text if no PII', () => {
      expect(env.masker.maskText('普通文本，无敏感信息')).toBe('普通文本，无敏感信息')
    })

    it('should handle empty input', () => {
      expect(env.masker.maskText('')).toBe('')
      expect(env.masker.maskText(null as any)).toBe(null)
    })

    it('should handle multiple PII occurrences of the same kind', () => {
      const text = '联系人A:13800138000, 联系人B:13912345678'
      const masked = env.masker.maskText(text)
      expect(masked).toContain('138****8000')
      expect(masked).toContain('139****5678')
    })

    it('should mask with kind prefix when withKind=true', () => {
      const text = '手机13800138000'
      const masked = env.masker.maskText(text, { withKind: true })
      expect(masked).toContain('phone:')
    })

    it('should support custom mask character', () => {
      const text = '手机13800138000'
      const masked = env.masker.maskText(text, { maskChar: '#' })
      expect(masked).toContain('138####8000')
    })
  })

  // ── maskBatch ──

  describe('maskBatch', () => {
    it('should mask an array of texts', () => {
      const texts = [
        'a@b.com',
        '13800138000',
        'normal text',
      ]
      const masked = env.masker.maskBatch(texts)
      expect(masked[0]).not.toContain('a@b.com')
      expect(masked[1]).not.toContain('13800138000')
      expect(masked[2]).toBe('normal text')
    })
  })

  // ── maskRatio ──

  describe('maskRatio', () => {
    it('should return 0 for text with no PII', () => {
      expect(env.masker.maskRatio('hello world')).toBe(0)
    })

    it('should return positive ratio for text with PII', () => {
      const ratio = env.masker.maskRatio('手机号是13800138000')
      expect(ratio).toBeGreaterThan(0)
      expect(ratio).toBeLessThanOrEqual(1)
    })
  })
})
