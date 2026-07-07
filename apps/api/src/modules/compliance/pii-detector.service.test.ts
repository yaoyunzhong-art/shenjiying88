import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
// 用途: PIIDetectorService 单元测试 (多类型 PII 检测 + 置信度)
import { PIIDetectorService } from './pii-detector.service'

function createEnv() {
  const service = new PIIDetectorService()
  return { service }
}

describe('PIIDetectorService', () => {
  let service: PIIDetectorService

  beforeEach(() => {
    service = new PIIDetectorService()
  })

  // ── detect: phone ──

  describe('phone detection', () => {
    it('should detect Chinese mobile phone numbers', () => {
      const text = '联系方式: 13800138000'
      const matches = service.detect(text)
      const phones = matches.filter((m) => m.kind === 'phone')
      expect(phones).toHaveLength(1)
      expect(phones[0].value).toBe('13800138000')
      expect(phones[0].confidence).toBeGreaterThanOrEqual(0.9)
    })

    it('should detect multiple phone numbers', () => {
      const text = '张三:13912345678, 李四:18600001111'
      const matches = service.detect(text)
      expect(matches.filter((m) => m.kind === 'phone')).toHaveLength(2)
    })

    it('should not match short numeric sequences', () => {
      const text = '数量: 12345'
      const matches = service.detect(text)
      expect(matches.filter((m) => m.kind === 'phone')).toHaveLength(0)
    })
  })

  // ── detect: email ──

  describe('email detection', () => {
    it('should detect standard email addresses', () => {
      const text = '联系邮箱: alice@example.com'
      const matches = service.detect(text)
      const emails = matches.filter((m) => m.kind === 'email')
      expect(emails).toHaveLength(1)
      expect(emails[0].value).toBe('alice@example.com')
    })

    it('should detect emails with subdomain', () => {
      const text = 'support@mail.company.co.uk'
      const matches = service.detect(text)
      expect(matches.filter((m) => m.kind === 'email')).toHaveLength(1)
    })

    it('should not match invalid emails (no domain)', () => {
      const text = 'notanemail@'
      expect(service.detect(text).filter((m) => m.kind === 'email')).toHaveLength(0)
    })
  })

  // ── detect: idCard ──

  describe('idCard detection', () => {
    it('should detect valid 18-digit Chinese ID cards', () => {
      // Use a regex-matched valid ID card number with valid checksum
      // We need an ID card passing the checksum. Let's compute one:
      // The service uses the regex pattern which requires dates between 1900-2099
      // and the checksum validation. We test the pattern match by checking hasPII
      // which relies on the regex + confidence threshold of 0.8.
      // If confidence is 0.99 (valid checksum) it will pass 0.8 threshold.
      // If 0.6 (invalid checksum) it will be filtered out.
      // Use detect with lower minConfidence to test raw regex matching.
      const text = '身份证: 110101199001011234'
      const matches = service.detect(text, { minConfidence: 0 })
      const cards = matches.filter((m) => m.kind === 'idCard')
      // The regex should match the pattern. Confidence depends on checksum validation.
      expect(cards.length).toBeGreaterThanOrEqual(1)
    })

    it('should not match obviously invalid sequences', () => {
      const text = '编号: 1234567890123456' // 16 digits
      expect(service.detect(text).filter((m) => m.kind === 'idCard')).toHaveLength(0)
    })

    it('should detect ID card with high confidence when checksum is valid', () => {
      // Find an ID card that passes the checksum algorithm:
      // Use the isValidIdCardChecksum function inline
      const findValidIdCard = (): string => {
        const prefix = '11010119900101123'
        const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
        const codes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']
        let sum = 0
        for (let i = 0; i < 17; i++) sum += Number(prefix[i]) * weights[i]
        return prefix + codes[sum % 11]
      }
      const validId = findValidIdCard()
      const text = `身份证: ${validId}`

      const matches = service.detect(text)
      const cards = matches.filter((m) => m.kind === 'idCard')
      expect(cards).toHaveLength(1)
      expect(cards[0].confidence).toBeGreaterThanOrEqual(0.9)
    })
  })

  // ── detect: creditCard ──

  describe('creditCard detection', () => {
    it('should detect credit card numbers passing Luhn check', () => {
      // Known test CC number: 4111111111111111 (Visa test, passes Luhn)
      const text = '卡号: 4111111111111111'
      const matches = service.detect(text)
      const cards = matches.filter((m) => m.kind === 'creditCard')
      expect(cards).toHaveLength(1)
      // Should have high confidence because it passes Luhn
      expect(cards[0].confidence).toBeGreaterThanOrEqual(0.9)
    })

    it('should assign low confidence to numbers failing Luhn', () => {
      const text = '卡号: 1234567890123456' // Fails Luhn
      const matches = service.detect(text)
      const cards = matches.filter((m) => m.kind === 'creditCard')
      // It will match the regex pattern but with reduced confidence
      const highConfCards = cards.filter((c) => c.confidence >= 0.8)
      expect(highConfCards).toHaveLength(0)
    })
  })

  // ── detect: ip ──

  describe('IP detection', () => {
    it('should detect IPv4 addresses', () => {
      const text = '服务器: 192.168.1.1'
      const matches = service.detect(text)
      const ips = matches.filter((m) => m.kind === 'ip')
      expect(ips).toHaveLength(1)
      expect(ips[0].value).toBe('192.168.1.1')
    })

    it('should detect public IPs', () => {
      const text = '外网IP: 8.8.8.8'
      const matches = service.detect(text)
      expect(matches.filter((m) => m.kind === 'ip')).toHaveLength(1)
    })

    it('should not match numbers out of valid IP range', () => {
      const text = '无效: 999.999.999.999'
      expect(service.detect(text).filter((m) => m.kind === 'ip')).toHaveLength(0)
    })
  })

  // ── detect: mixed content ──

  describe('mixed content detection', () => {
    it('should detect multiple PII types in one text', () => {
      const text = `
        姓名: 张三
        手机: 13912345678
        邮箱: zhangsan@test.com
        IP: 10.0.0.5
      `
      const matches = service.detect(text)
      const kinds = new Set(matches.map((m) => m.kind))
      expect(kinds.has('phone')).toBe(true)
      expect(kinds.has('email')).toBe(true)
      expect(kinds.has('ip')).toBe(true)
    })

    it('should sort matches by start position', () => {
      const text = 'email: a@b.com phone:13800138000'
      const matches = service.detect(text)
      for (let i = 1; i < matches.length; i++) {
        expect(matches[i].start).toBeGreaterThanOrEqual(matches[i - 1].start)
      }
    })
  })

  // ── detect: options ──

  describe('detect with options', () => {
    it('should limit detection to specified kinds', () => {
      const text = 'phone:13800138000 email:a@b.com'
      const matches = service.detect(text, { kinds: ['email'] })
      expect(matches).toHaveLength(1)
      expect(matches[0].kind).toBe('email')
    })

    it('should respect minConfidence threshold', () => {
      const text = '卡号: 1234567890123456' // Low confidence CC
      const matches = service.detect(text, { minConfidence: 0.8 })
      const cards = matches.filter((m) => m.kind === 'creditCard')
      expect(cards).toHaveLength(0)
    })

    it('should return empty for falsy input', () => {
      expect(service.detect('')).toHaveLength(0)
      expect(service.detect(null as any)).toHaveLength(0)
    })
  })

  // ── detectGrouped ──

  describe('detectGrouped', () => {
    it('should group matches by kind', () => {
      const text = 'phone:13800138000 email:a@b.com IP:8.8.8.8'
      const grouped = service.detectGrouped(text)

      expect(grouped.phone).toHaveLength(1)
      expect(grouped.email).toHaveLength(1)
      expect(grouped.ip).toHaveLength(1)
      expect(grouped.idCard).toHaveLength(0)
      expect(grouped.creditCard).toHaveLength(0)
    })
  })

  // ── hasPII / count ──

  describe('hasPII / count', () => {
    it('hasPII should return boolean', () => {
      expect(service.hasPII('普通文本')).toBe(false)
      expect(service.hasPII('手机:13800138000')).toBe(true)
    })

    it('count should return per-kind counts', () => {
      const text = 'phone:13800138000 email:a@b.com phone:13912345678'
      const counts = service.count(text)
      expect(counts.phone).toBe(2)
      expect(counts.email).toBe(1)
      expect(counts.creditCard).toBe(0)
    })
  })
})
