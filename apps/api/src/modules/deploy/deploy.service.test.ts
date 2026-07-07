import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { DeployService } from './deploy.service'

describe('DeployService', () => {
  let service: DeployService

  beforeEach(() => {
    service = new DeployService()
  })

  describe('generatePlan', () => {
    it('should generate a deployment plan for single mode', () => {
      const plan = service.generatePlan('single', 'small')
      expect(plan).toBeDefined()
      expect(plan.mode).toBe('single')
      expect(plan.size).toBe('small')
      expect(plan.components).toContain('API')
      expect(plan.components).toContain('MySQL')
    })

    it('should generate a deployment plan for kubernetes mode', () => {
      const plan = service.generatePlan('kubernetes', 'medium')
      expect(plan).toBeDefined()
      expect(plan.mode).toBe('kubernetes')
      expect(plan.helmValues).toBeDefined()
      expect(plan.kubernetesManifests).toBeDefined()
    })

    it('should include monitoring component when enabled', () => {
      const plan = service.generatePlan('single', 'medium', { enableMonitoring: true })
      expect(plan.components).toContain('Monitoring')
    })

    it('should include backup component when enabled', () => {
      const plan = service.generatePlan('single', 'medium', { enableBackup: true })
      expect(plan.components).toContain('Backup')
    })
  })

  describe('preflightCheck', () => {
    it('should pass check with valid server spec', () => {
      const spec = {
        cpu: '4 cores',
        memory: '8GB',
        storage: '200GB SSD',
        os: 'Ubuntu 22.04',
        privateNetwork: true,
        publicIP: true,
      }
      const result = service.preflightCheck(spec)
      expect(result.pass).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail check with insufficient CPU', () => {
      const spec = {
        cpu: '1 core',
        memory: '8GB',
        storage: '200GB SSD',
        os: 'Ubuntu 22.04',
        privateNetwork: true,
        publicIP: true,
      }
      const result = service.preflightCheck(spec)
      expect(result.pass).toBe(false)
      expect(result.errors).toContain('CPU cores must be at least 2, got 1')
    })

    it('should fail check with insufficient memory', () => {
      const spec = {
        cpu: '4 cores',
        memory: '2GB',
        storage: '200GB SSD',
        os: 'Ubuntu 22.04',
        privateNetwork: true,
        publicIP: true,
      }
      const result = service.preflightCheck(spec)
      expect(result.pass).toBe(false)
      expect(result.errors).toContain('Memory must be at least 4GB, got 2')
    })
  })

  describe('getPlan', () => {
    it('should return null for non-existent plan', () => {
      const plan = service.getPlan('non-existent')
      expect(plan).toBeNull()
    })
  })

  describe('calculateResources', () => {
    it('should return correct resources for small size', () => {
      const resources = service.calculateResources('small', 'single')
      expect(resources.cpu).toBe('2 cores')
      expect(resources.memory).toBe('4GB')
    })
  })

  describe('estimateMonthlyCost', () => {
    it('should return cost breakdown for small single mode', () => {
      const cost = service.estimateMonthlyCost('small', 'single')
      expect(cost.total).toBeGreaterThan(0)
      expect(cost.currency).toBe('CNY')
    })
  })

  describe('generateQuote', () => {
    it('should generate a quote with tax calculation', () => {
      const quote = service.generateQuote('medium', 'single')
      expect(quote.items).toHaveLength(3)
      expect(quote.tax).toBeGreaterThan(0)
      expect(quote.total).toBe(quote.subtotal + quote.tax)
    })
  })
})
