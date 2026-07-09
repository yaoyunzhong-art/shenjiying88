/**
 * deploy.e2e.test.ts
 * 🐜 自动: [deploy] [D] E2E 补全
 *
 * 部署模块端到端集成测试 — 覆盖完整生命周期
 *
 * 测试场景:
 * 1. 生成方案 → 飞前检查 → 执行部署 → 停止 → 回滚
 * 2. 不存在的方案部署拒绝
 * 3. 资源规格计算与成本估算正确性
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { NotFoundException } from '@nestjs/common'
import { DeployController } from './deploy.controller'
import { DeployService } from './deploy.service'

describe('Deploy 模块 E2E 集成测试', () => {
  let controller: DeployController
  let service: DeployService

  beforeEach(() => {
    service = new DeployService()
    controller = new DeployController(service)
  })

  // ── 完整部署生命周期 ──

  describe('完整部署生命周期', () => {
    it('✔️ 生成方案 → 飞前检查 → 执行部署 → 查看状态 → 停止 → 回滚', async () => {
      // 1. 生成方案
      const plan = controller.generatePlan({ mode: 'kubernetes', size: 'medium', options: { enableMonitoring: true, enableBackup: true } })
      expect(plan).toBeDefined()
      expect(plan.planId).toMatch(/^plan-/)
      expect(plan.mode).toBe('kubernetes')
      expect(plan.helmValues).toBeDefined()
      expect(plan.kubernetesManifests).toBeDefined()
      expect(plan.components).toContain('Backup')

      // 2. 获取方案详情
      const found = controller.getPlan(plan.planId)
      expect(found.planId).toBe(plan.planId)

      // 3. 飞前检查（使用方案的规格）
      const preflight = controller.preflightCheck({
        cpu: plan.serverSpec.cpu,
        memory: plan.serverSpec.memory,
        storage: plan.serverSpec.storage,
        os: plan.serverSpec.os,
      })
      expect(preflight.pass).toBe(true)
      expect(preflight.errors).toHaveLength(0)

      // 4. 执行部署
      const deployResult = await controller.deploy(plan.planId)
      expect(deployResult.status).toBe('running')

      // 5. 查看状态
      const status = controller.getStatus(plan.planId)
      expect(status.status).toBe('running')
      expect(status.planId).toBe(plan.planId)

      // 6. 停止部署
      const stopResult = await controller.stop(plan.planId)
      expect(stopResult.status).toBe('stopped')

      // 7. 回滚
      const rollbackResult = await controller.rollback(plan.planId)
      expect(['stopped', 'rolling_back']).toContain(rollbackResult.status)
    })

    it('✔️ 单机部署完整流程', async () => {
      const plan = controller.generatePlan({ mode: 'single', size: 'small' })
      expect(plan.estimatedCost).toBeGreaterThan(0)
      expect(plan.setupTime).toBe(30)

      // 部署
      const result = await controller.deploy(plan.planId)
      expect(result.status).toBe('running')

      // 停止后状态一致
      await controller.stop(plan.planId)
      const st = controller.getStatus(plan.planId)
      expect(st.status).toBe('stopped')
    })
  })

  // ── 异常场景 ──

  describe('异常场景', () => {
    it('❌ 获取不存在的方案返回 404', () => {
      expect(() => controller.getPlan('nonexistent-plan')).toThrow(NotFoundException)
    })

    it('❌ 部署不存在的方案抛出错误', async () => {
      await expect(controller.deploy('fake-plan-id')).rejects.toThrow(/not found/i)
    })

    it('❌ 停止不存在的方案抛出错误', async () => {
      await expect(controller.stop('fake-plan-id')).rejects.toThrow(/not found/i)
    })

    it('❌ 回滚不存在的方案抛出错误', async () => {
      await expect(controller.rollback('fake-plan-id')).rejects.toThrow(/not found/i)
    })
  })

  // ── 成本与报价 ──

  describe('成本与报价', () => {
    it('✔️ 小型单机报价计算正确', () => {
      const cost = controller.estimateMonthlyCost({ size: 'small', mode: 'single' })
      expect(cost.total).toBe(449) // 299 + 100 + 50
      expect(cost.currency).toBe('CNY')
      expect(cost.infrastructure).toBe(299)
      expect(cost.bandwidth).toBe(100)
      expect(cost.storage).toBe(50)
    })

    it('✔️ 大型集群报价含税', () => {
      const quote = controller.generateQuote({ size: 'large', mode: 'cluster' })
      expect(quote.items).toHaveLength(3)
      expect(quote.tax).toBeGreaterThan(0)
      expect(quote.total).toBe(quote.subtotal + quote.tax)
      expect(quote.validUntil).toBeInstanceOf(Date)
    })

    it('✔️ 超大型 K8s 报价含监控组件', () => {
      const plan = controller.generatePlan({ mode: 'kubernetes', size: 'xlarge' })
      expect(plan.components).toContain('Prometheus')
      expect(plan.components).toContain('Grafana')
    })
  })

  // ── 飞前检查边界 ──

  describe('飞前检查边界', () => {
    it('⚠️ 不推荐的 OS 应给出警告', () => {
      const result = controller.preflightCheck({
        cpu: '4 cores', memory: '8GB', storage: '200GB', os: 'Windows Server 2022',
      })
      expect(result.pass).toBe(true)
      expect(result.warnings.some(w => w.includes('Recommended OS'))).toBe(true)
    })

    it('❌ CPU 不足 2 核检查失败', () => {
      const result = controller.preflightCheck({
        cpu: '1 core', memory: '8GB', storage: '200GB', os: 'Ubuntu 22.04',
      })
      expect(result.pass).toBe(false)
      expect(result.errors.some(e => e.includes('CPU'))).toBe(true)
    })

    it('❌ 多个检查项同时失败', () => {
      const result = controller.preflightCheck({
        cpu: '1 core', memory: '2GB', storage: '50GB', os: 'Arch Linux',
      })
      expect(result.pass).toBe(false)
      expect(result.errors.length).toBeGreaterThanOrEqual(3)
    })
  })

  // ── Helm & K8s 清单 ──

  describe('Kubernetes 清单生成', () => {
    it('✔️ K8s 方案生成有效 YAML 清单', () => {
      const plan = controller.generatePlan({ mode: 'kubernetes', size: 'medium' })
      expect(plan.kubernetesManifests).toContain('apiVersion: apps/v1')
      expect(plan.kubernetesManifests).toContain('kind: Deployment')
      expect(plan.kubernetesManifests).toContain('kind: Service')
      expect(plan.kubernetesManifests).toContain('kind: Ingress')
    })

    it('✔️ Helm values 包含正确的资源限制', () => {
      const plan = controller.generatePlan({ mode: 'kubernetes', size: 'large' })
      expect(plan.helmValues).toBeDefined()
      expect(plan.helmValues!.resources.requests.cpu).toBe('500m')
      expect(plan.helmValues!.resources.limits.memory).toBe('2Gi')
      expect(plan.helmValues!.ingress.host).toBe('api.example.com')
    })
  })
})
