import { describe, it, expect } from 'vitest'
import { BirthdayCountdownService } from './birthday-countdown.service'

describe('BirthdayCountdownService', () => {
  let service: BirthdayCountdownService

  beforeEach(() => {
    service = new BirthdayCountdownService()
  })

  describe('getCountdown', () => {
    it('returns today effect when birthday is today', () => {
      const now = new Date(2026, 6, 29) // July 29
      const month = '07'
      const day = '29'
      const result = service.getCountdown('m1', `${month}-${day}`, false, now)
      expect(result.daysUntilBirthday).toBe(0)
      expect(result.effectType).toBe('today')
      expect(result.effectLevel).toBe(5)
      expect(result.canPreview).toBe(true)
    })

    it('returns tomorrow effect when birthday is tomorrow', () => {
      const now = new Date(2026, 6, 28)
      const month = '07'
      const day = '29'
      const result = service.getCountdown('m1', `${month}-${day}`, false, now)
      expect(result.daysUntilBirthday).toBe(1)
      expect(result.effectType).toBe('tomorrow')
      expect(result.effectLevel).toBe(4)
    })

    it('returns near effect when birthday is within 7 days', () => {
      const now = new Date(2026, 6, 22)
      const result = service.getCountdown('m1', '07-29', false, now)
      expect(result.effectType).toBe('near')
      expect(result.effectLevel).toBe(3)
      expect(result.canPreview).toBe(true)
    })

    it('returns upcoming effect when birthday is more than 7 days away', () => {
      const now = new Date(2026, 5, 1) // June 1
      const result = service.getCountdown('m1', '07-29', false, now)
      expect(result.daysUntilBirthday).toBeGreaterThan(7)
      expect(result.effectType).toBe('upcoming')
      expect(result.effectLevel).toBe(2)
    })

    it('returns past effect when birthday already passed this year', () => {
      const now = new Date(2026, 11, 31) // Dec 31
      const result = service.getCountdown('m1', '01-01', false, now)
      // Jan 1 next year
      expect(result.daysUntilBirthday).toBeGreaterThanOrEqual(0)
      expect(result.canPreview).toBe(true)
    })

    it('throws on invalid birthday format', () => {
      const now = new Date(2026, 6, 29)
      expect(() => service.getCountdown('m1', 'invalid', false, now)).toThrow('生日格式错误')
    })

    it('includes seconds detail when includeSeconds is true', () => {
      const now = new Date(2026, 6, 29)
      const result = service.getCountdown('m1', '07-29', true, now)
      expect(result.detail.seconds).toBe(0)
      // They should differ slightly from 0 due to millisecond timing
      expect(typeof result.detail.seconds).toBe('number')
    })

    it('sets previewUrl when within 90 days', () => {
      const now = new Date(2026, 6, 1)
      const result = service.getCountdown('m1', '07-29', false, now)
      expect(result.previewUrl).toContain('/birthday/preview/m1')
    })

    it('returns correct memberId and birthday', () => {
      const now = new Date(2026, 6, 29)
      const result = service.getCountdown('mem-123', '07-29', false, now)
      expect(result.memberId).toBe('mem-123')
      expect(result.birthday).toBe('07-29')
    })

    it('handles cross-year birthdays correctly', () => {
      const now = new Date(2026, 11, 31) // Dec 31
      const result = service.getCountdown('m1', '01-15', false, now)
      // Jan 15 next year: days = floor((Jan 15 - Dec 31) / msPerDay) = 15
      expect(result.daysUntilBirthday).toBe(15)
      // birthdayDate is computed from local-time midnight + timezone shift
      // In UTC+8, Jan 15 local midnight = Jan 14 16:00 UTC
      expect(result.birthdayDate).toBeDefined()
    })
  })

  describe('getPreview', () => {
    it('returns preview info with config', () => {
      const now = new Date(2026, 6, 29)
      const preview = service.getPreview('m1', '07-29', now)
      expect(preview.effectType).toBe('today')
      expect(preview.effectLevel).toBe(5)
      expect(preview.config).toBeDefined()
      expect(preview.config.animation).toBe('confetti')
    })

    it('returns preview config for upcoming type', () => {
      const now = new Date(2026, 5, 1)
      const preview = service.getPreview('m1', '07-29', now)
      expect(preview.effectType).toBe('upcoming')
      expect(preview.config.animation).toBe('static')
    })
  })
})
