import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { AlliancePartner, PartnerGradingService, HealthScoreService } from './alliance-grade.service'

describe('AllianceGradeService', () => {
  let alliancePartner: AlliancePartner
  let gradingService: PartnerGradingService
  let healthScoreService: HealthScoreService

  beforeEach(() => {
    alliancePartner = new AlliancePartner()
    gradingService = new PartnerGradingService()
    healthScoreService = new HealthScoreService()
  })

  describe('AlliancePartner', () => {
    describe('register', () => {
      it('should register a new partner', () => {
        const partner = alliancePartner.register({
          name: 'Test Partner',
          businessType: 'RETAIL',
          contact: 'contact@test.com',
          address: 'Test Address',
        })
        expect(partner.id).toBeDefined()
        expect(partner.name).toBe('Test Partner')
        expect(partner.status).toBe('ACTIVE')
      })

      it('should throw error for duplicate partner', () => {
        alliancePartner.register({
          name: 'Test Partner',
          businessType: 'RETAIL',
          contact: 'contact@test.com',
          address: 'Test Address',
        })
        expect(() =>
          alliancePartner.register({
            name: 'Test Partner',
            businessType: 'RETAIL',
            contact: 'contact2@test.com',
            address: 'Another Address',
          })
        ).toThrow()
      })
    })

    describe('updatePartner', () => {
      it('should update partner info', () => {
        const partner = alliancePartner.register({
          name: 'Test Partner',
          businessType: 'RETAIL',
          contact: 'contact@test.com',
          address: 'Test Address',
        })
        const updated = alliancePartner.updatePartner(partner.id, { contact: 'new@test.com' })
        expect(updated.contact).toBe('new@test.com')
      })
    })

    describe('getPartner', () => {
      it('should return partner by id', () => {
        const partner = alliancePartner.register({
          name: 'Test Partner',
          businessType: 'RETAIL',
          contact: 'contact@test.com',
          address: 'Test Address',
        })
        const found = alliancePartner.getPartner(partner.id)
        expect(found?.name).toBe('Test Partner')
      })
    })

    describe('listPartners', () => {
      it('should list all partners', () => {
        alliancePartner.register({
          name: 'Partner 1',
          businessType: 'RETAIL',
          contact: 'c1@test.com',
          address: 'Address 1',
        })
        alliancePartner.register({
          name: 'Partner 2',
          businessType: 'F&B',
          contact: 'c2@test.com',
          address: 'Address 2',
        })
        const partners = alliancePartner.listPartners()
        expect(partners.length).toBe(2)
      })

      it('should filter partners by business type', () => {
        alliancePartner.register({
          name: 'Partner 1',
          businessType: 'RETAIL',
          contact: 'c1@test.com',
          address: 'Address 1',
        })
        alliancePartner.register({
          name: 'Partner 2',
          businessType: 'F&B',
          contact: 'c2@test.com',
          address: 'Address 2',
        })
        const partners = alliancePartner.listPartners({ businessType: 'RETAIL' })
        expect(partners.length).toBe(1)
      })
    })
  })

  describe('PartnerGradingService', () => {
    describe('calculateGrade', () => {
      it('should calculate grade for partner', () => {
        const grade = gradingService.calculateGrade('partner1')
        expect(['S', 'A', 'B', 'C']).toContain(grade)
      })
    })

    describe('assignGrade', () => {
      it('should assign grade to partner', () => {
        gradingService.assignGrade('partner1', 'A')
        const grade = gradingService.getGrade('partner1')
        expect(grade).toBe('A')
      })
    })

    describe('getGradeCriteria', () => {
      it('should return grade criteria', () => {
        const criteria = gradingService.getGradeCriteria()
        expect(criteria.length).toBe(4)
      })
    })
  })

  describe('HealthScoreService', () => {
    describe('calculateHealthScore', () => {
      it('should return default score for unknown partner', () => {
        const score = healthScoreService.calculateHealthScore('unknown')
        expect(score).toBe(50)
      })

      it('should calculate score based on metrics', () => {
        healthScoreService.setMetrics('partner1', {
          revenue: 200000,
          orderCount: 600,
          complaintCount: 5,
          activeDays: 30,
        })
        const score = healthScoreService.calculateHealthScore('partner1')
        expect(score).toBeGreaterThan(0)
      })
    })

    describe('getHealthTrend', () => {
      it('should return health trend', () => {
        const trend = healthScoreService.getHealthTrend('partner1', 7)
        expect(trend.length).toBe(7)
      })
    })

    describe('alertIfLow', () => {
      it('should return alert for low health score', () => {
        healthScoreService.setMetrics('partner1', {
          revenue: 1000,
          orderCount: 1,
          complaintCount: 10,
          activeDays: 1,
        })
        const alert = healthScoreService.alertIfLow('partner1', 40)
        expect(alert).toBeDefined()
      })
    })

    describe('getHealthFactors', () => {
      it('should return health factors breakdown', () => {
        const factors = healthScoreService.getHealthFactors('partner1')
        expect(factors.revenueScore).toBeDefined()
        expect(factors.orderScore).toBeDefined()
      })
    })
  })
})
