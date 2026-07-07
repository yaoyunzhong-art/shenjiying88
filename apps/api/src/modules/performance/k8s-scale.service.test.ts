import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { K8sScaleService } from './k8s-scale.service'

describe('K8sScaleService', () => {
  let service: K8sScaleService

  beforeEach(() => {
    service = new K8sScaleService()
  })

  describe('createHPAPolicy', () => {
    it('should create an HPA policy', () => {
      const policy = service.createHPAPolicy({
        name: 'test-policy',
        metric: 'cpu',
        targetValue: 70,
        targetPercent: 80,
        minReplicas: 1,
        maxReplicas: 10,
        stabilizationWindowSeconds: 300,
        cooldownSeconds: 300,
        enabled: true,
      })
      expect(policy.name).toBe('test-policy')
    })
  })

  describe('getHPAPolicy', () => {
    it('should return policy by name', () => {
      service.createHPAPolicy({
        name: 'test-policy',
        metric: 'cpu',
        targetValue: 70,
        targetPercent: 80,
        minReplicas: 1,
        maxReplicas: 10,
        stabilizationWindowSeconds: 300,
        cooldownSeconds: 300,
        enabled: true,
      })
      const policy = service.getHPAPolicy('test-policy')
      expect(policy?.name).toBe('test-policy')
    })

    it('should return null for non-existent policy', () => {
      const policy = service.getHPAPolicy('nonexistent')
      expect(policy).toBeNull()
    })
  })

  describe('listHPAPolicies', () => {
    it('should list all policies', () => {
      service.createHPAPolicy({
        name: 'policy1',
        metric: 'cpu',
        targetValue: 70,
        targetPercent: 80,
        minReplicas: 1,
        maxReplicas: 10,
        stabilizationWindowSeconds: 300,
        cooldownSeconds: 300,
        enabled: true,
      })
      const policies = service.listHPAPolicies()
      expect(policies.length).toBeGreaterThan(0)
    })
  })

  describe('updateHPAPolicy', () => {
    it('should update existing policy', () => {
      service.createHPAPolicy({
        name: 'test-policy',
        metric: 'cpu',
        targetValue: 70,
        targetPercent: 80,
        minReplicas: 1,
        maxReplicas: 10,
        stabilizationWindowSeconds: 300,
        cooldownSeconds: 300,
        enabled: true,
      })
      const updated = service.updateHPAPolicy('test-policy', { minReplicas: 2 })
      expect(updated.minReplicas).toBe(2)
    })
  })

  describe('deleteHPAPolicy', () => {
    it('should delete policy', () => {
      service.createHPAPolicy({
        name: 'test-policy',
        metric: 'cpu',
        targetValue: 70,
        targetPercent: 80,
        minReplicas: 1,
        maxReplicas: 10,
        stabilizationWindowSeconds: 300,
        cooldownSeconds: 300,
        enabled: true,
      })
      service.deleteHPAPolicy('test-policy')
      expect(service.getHPAPolicy('test-policy')).toBeNull()
    })
  })

  describe('scale', () => {
    it('should scale deployment to target replicas', () => {
      const health = service.scale('test-deployment', 3)
      expect(health.readyReplicas).toBe(3)
    })
  })

  describe('checkHealth', () => {
    it('should return health status for existing deployment', () => {
      service.scale('test-deployment', 2)
      const health = service.checkHealth('test-deployment')
      expect(health.status).toBeDefined()
    })

    it('should return unknown status for non-existing deployment', () => {
      const health = service.checkHealth('nonexistent')
      expect(health.status).toBe('unknown')
    })
  })

  describe('collectMetrics', () => {
    it('should collect metrics with random values', () => {
      const metrics = service.collectMetrics()
      expect(metrics.cpuPercent).toBeGreaterThanOrEqual(0)
      expect(metrics.memoryPercent).toBeGreaterThanOrEqual(0)
    })
  })

  describe('analyzeBottleneck', () => {
    it('should detect high CPU bottleneck', () => {
      const bottlenecks = service.analyzeBottleneck({
        timestamp: new Date(),
        cpuPercent: 95,
        memoryPercent: 50,
        requestsPerSecond: 100,
        latencyMs: 100,
        currentReplicas: 2,
      })
      expect(bottlenecks.some(b => b.includes('CPU'))).toBe(true)
    })

    it('should detect high memory bottleneck', () => {
      const bottlenecks = service.analyzeBottleneck({
        timestamp: new Date(),
        cpuPercent: 50,
        memoryPercent: 95,
        requestsPerSecond: 100,
        latencyMs: 100,
        currentReplicas: 2,
      })
      expect(bottlenecks.some(b => b.includes('内存'))).toBe(true)
    })
  })

  describe('estimateCost', () => {
    it('should estimate cost for deployment', () => {
      service.scale('test-deployment', 2)
      const cost = service.estimateCost('test-deployment')
      expect(cost.totalPerMonth).toBeGreaterThan(0)
    })
  })
})
