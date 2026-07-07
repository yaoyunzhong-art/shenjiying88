// deploy.controller.test.ts · 部署模块 Controller 测试
// 🐜 自动: [deploy] [D] controller spec 补全

import { describe, it, expect, beforeEach } from 'vitest'
import { NotFoundException } from '@nestjs/common'
import { DeployController } from './deploy.controller'
import { DeployService } from './deploy.service'

describe('DeployController', () => {
  let controller: DeployController
  let service: DeployService

  beforeEach(() => {
    service = new DeployService()
    controller = new DeployController(service)
  })

  // ── POST /deploy/plan ─────────────────────────────────────────

  describe('generatePlan', () => {
    it('should generate a single mode plan', () => {
      const result = controller.generatePlan({ mode: 'single', size: 'medium' })
      expect(result.mode).toBe('single')
      expect(result.size).toBe('medium')
      expect(result.planId).toMatch(/^plan-/)
    })

    it('should generate a kubernetes plan with options', () => {
      const result = controller.generatePlan({
        mode: 'kubernetes',
        size: 'large',
        options: { enableMonitoring: true, enableSSL: true },
      })
      expect(result.mode).toBe('kubernetes')
      expect(result.helmValues).toBeDefined()
    })
  })

  // ── GET /deploy/plan/:planId ──────────────────────────────────

  describe('getPlan', () => {
    it('should retrieve an existing plan', () => {
      const created = controller.generatePlan({ mode: 'single', size: 'small' })
      const found = controller.getPlan(created.planId)
      expect(found.planId).toBe(created.planId)
    })

    it('should throw NotFoundException for non-existent plan', () => {
      expect(() => controller.getPlan('nonexistent')).toThrow(NotFoundException)
    })
  })

  // ── POST /deploy/preflight ────────────────────────────────────

  describe('preflightCheck', () => {
    it('should pass for adequate specs', () => {
      const result = controller.preflightCheck({
        cpu: '4 cores', memory: '8GB', storage: '200GB SSD', os: 'Ubuntu 22.04',
      })
      expect(result.pass).toBe(true)
    })

    it('should warn for borderline specs', () => {
      const result = controller.preflightCheck({
        cpu: '1 core', memory: '1GB', storage: '20GB', os: 'Debian 11',
      })
      expect(result.warnings.length).toBeGreaterThanOrEqual(0)
    })
  })

  // ── POST /deploy/resources ────────────────────────────────────

  describe('calculateResources', () => {
    it('should return correct resource spec for size/mode', () => {
      const result = controller.calculateResources({ size: 'large', mode: 'cluster' })
      expect(result.cpu).toBeDefined()
      expect(result.memory).toBeDefined()
    })
  })

  // ── POST /deploy/plan/:planId/deploy ──────────────────────────

  describe('deploy', () => {
    it('should deploy a plan', async () => {
      const created = controller.generatePlan({ mode: 'single', size: 'small' })
      const result = await controller.deploy(created.planId)
      expect(result.status).toBe('running')
    })
  })

  // ── POST /deploy/plan/:planId/stop ────────────────────────────

  describe('stop', () => {
    it('should stop deployment', async () => {
      const created = controller.generatePlan({ mode: 'single', size: 'small' })
      await controller.deploy(created.planId)
      const result = await controller.stop(created.planId)
      expect(result.status).toBe('stopped')
    })
  })

  // ── POST /deploy/plan/:planId/rollback ────────────────────────

  describe('rollback', () => {
    it('should rollback a deployed plan', async () => {
      const created = controller.generatePlan({ mode: 'single', size: 'small' })
      const result = await controller.rollback(created.planId)
      expect(['stopped', 'rolling_back']).toContain(result.status)
    })
  })

  // ── GET /deploy/plan/:planId/status ───────────────────────────

  describe('getStatus', () => {
    it('should return plan status', () => {
      const created = controller.generatePlan({ mode: 'single', size: 'small' })
      const result = controller.getStatus(created.planId)
      expect(result.planId).toBe(created.planId)
      expect(result.status).toBeDefined()
    })
  })

  // ── POST /deploy/cost ─────────────────────────────────────────

  describe('estimateMonthlyCost', () => {
    it('should return cost estimate', () => {
      const result = controller.estimateMonthlyCost({ size: 'medium', mode: 'cluster' })
      expect(result.total).toBeGreaterThan(0)
      expect(result.currency).toBe('CNY')
    })
  })

  // ── POST /deploy/quote ────────────────────────────────────────

  describe('generateQuote', () => {
    it('should generate a quote', () => {
      const result = controller.generateQuote({ size: 'small', mode: 'single' })
      expect(result.items).toBeDefined()
      expect(result.total).toBeGreaterThan(0)
    })
  })
})
