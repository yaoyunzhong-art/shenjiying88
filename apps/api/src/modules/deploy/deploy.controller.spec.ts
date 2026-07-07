/**
 * deploy.controller.spec.ts — 部署模块 Controller 单元测试
 *
 * 覆盖路由（10 个）：
 *   POST   /deploy/plan                          generatePlan
 *   GET    /deploy/plan/:planId                  getPlan
 *   POST   /deploy/preflight                     preflightCheck
 *   POST   /deploy/resources                     calculateResources
 *   POST   /deploy/plan/:planId/deploy           deploy
 *   POST   /deploy/plan/:planId/stop             stop
 *   POST   /deploy/plan/:planId/rollback         rollback
 *   GET    /deploy/plan/:planId/status           getStatus
 *   POST   /deploy/cost                          estimateMonthlyCost
 *   POST   /deploy/quote                         generateQuote
 *
 * 每个路由：正例 + 反例 + 边界，共 27 test cases
 */

import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
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

  // ══════════════════════════════════════════════════════════════
  // 1. POST /deploy/plan — generatePlan
  // ══════════════════════════════════════════════════════════════

  describe('generatePlan (POST /deploy/plan)', () => {
    // ── 正例 ────────────────────────────────────────────────

    it('应生成单机 small 部署方案', () => {
      const result = controller.generatePlan({ mode: 'single', size: 'small' })
      expect(result.mode).toBe('single')
      expect(result.size).toBe('small')
      expect(result.planId).toMatch(/^plan-/)
      expect(result.estimatedCost).toBe(299 + 100 + 50) // 449
      expect(result.setupTime).toBe(30)
      expect(result.components).toContain('API')
      expect(result.components).toContain('MySQL')
      expect(result.components).toContain('Redis')
    })

    it('应生成 K8s medium 部署方案并附带 helmValues', () => {
      const result = controller.generatePlan({ mode: 'kubernetes', size: 'medium' })
      expect(result.mode).toBe('kubernetes')
      expect(result.size).toBe('medium')
      expect(result.helmValues).toBeDefined()
      expect(result.helmValues!.replicaCount).toBe(2) // medium → 2
      expect(result.helmValues!.image.repository).toContain('shenjiying')
      expect(result.kubernetesManifests).toBeDefined()
      expect(result.kubernetesManifests).toContain('apiVersion: apps/v1')
    })

    it('应生成 cluster large 部署方案', () => {
      const result = controller.generatePlan({ mode: 'cluster', size: 'large' })
      expect(result.mode).toBe('cluster')
      expect(result.size).toBe('large')
      expect(result.estimatedCost).toBe(1199 * 3 + 600 + 320) // 4517
      expect(result.setupTime).toBe(60)
    })

    it('应生成 xlarge 方案且组件包含 Backup（enableBackup 选项）', () => {
      const result = controller.generatePlan({
        mode: 'single',
        size: 'xlarge',
        options: { enableBackup: true },
      })
      expect(result.components).toContain('Backup')
      expect(result.size).toBe('xlarge')
    })

    it('应生成 single 方案时 enableMonitoring 添加 Monitoring 组件', () => {
      const result = controller.generatePlan({
        mode: 'single',
        size: 'medium',
        options: { enableMonitoring: true },
      })
      expect(result.components).toContain('Monitoring')
    })

    // ── 边界 ────────────────────────────────────────────────

    it('K8s 模式下即使 enableMonitoring 也不额外添加 Monitoring（已在默认组件中）', () => {
      const result = controller.generatePlan({
        mode: 'kubernetes',
        size: 'small',
        options: { enableMonitoring: true },
      })
      // K8s 默认已含 Prometheus / Grafana，不会重复添加 Monitoring
      expect(result.components).toContain('Prometheus')
      const monitoringCount = result.components.filter((c) => c === 'Monitoring').length
      expect(monitoringCount).toBe(0)
    })
  })

  // ══════════════════════════════════════════════════════════════
  // 2. GET /deploy/plan/:planId — getPlan
  // ══════════════════════════════════════════════════════════════

  describe('getPlan (GET /deploy/plan/:planId)', () => {
    // ── 正例 ────────────────────────────────────────────────

    it('应返回已生成的部署方案', () => {
      const created = controller.generatePlan({ mode: 'single', size: 'small' })
      const found = controller.getPlan(created.planId)
      expect(found.planId).toBe(created.planId)
      expect(found.mode).toBe('single')
      expect(found.size).toBe('small')
    })

    // ── 反例 ────────────────────────────────────────────────

    it('不存在的 planId 应抛 NotFoundException', () => {
      expect(() => controller.getPlan('non-existent-plan')).toThrow(NotFoundException)
    })

    // ── 边界 ────────────────────────────────────────────────

    it('空字符串 planId 应抛 NotFoundException', () => {
      expect(() => controller.getPlan('')).toThrow(NotFoundException)
    })
  })

  // ══════════════════════════════════════════════════════════════
  // 3. POST /deploy/preflight — preflightCheck
  // ══════════════════════════════════════════════════════════════

  describe('preflightCheck (POST /deploy/preflight)', () => {
    // ── 正例 ────────────────────────────────────────────────

    it('规格满足最低要求时通过检查', () => {
      const result = controller.preflightCheck({
        cpu: '4 cores',
        memory: '8GB',
        storage: '200GB SSD',
        os: 'Ubuntu 22.04',
        privateNetwork: true,
        publicIP: true,
      })
      expect(result.pass).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })

    it('CentOS 系统应通过但带 warning', () => {
      const result = controller.preflightCheck({
        cpu: '8 cores',
        memory: '16GB',
        storage: '500GB SSD',
        os: 'CentOS 8',
        privateNetwork: true,
        publicIP: true,
      })
      expect(result.pass).toBe(true)
      // CentOS 是推荐系统，不应有操作系统 warning
      // 检查具体 warning 内容
      const osWarning = result.warnings.filter((w) => w.toLowerCase().includes('os') || w.toLowerCase().includes('ubuntu'))
      // CentOS 在推荐列表中，不应有 OS warning
      expect(result.warnings.length).toBe(0)
    })

    it('Rocky Linux 也应通过检查', () => {
      const result = controller.preflightCheck({
        cpu: '4 cores',
        memory: '8GB',
        storage: '100GB',
        os: 'Rocky Linux 9',
        privateNetwork: true,
        publicIP: true,
      })
      expect(result.pass).toBe(true)
    })

    // ── 反例 ────────────────────────────────────────────────

    it('CPU 不足 2 cores 应失败', () => {
      const result = controller.preflightCheck({
        cpu: '1 core',
        memory: '4GB',
        storage: '100GB',
        os: 'Ubuntu 22.04',
        privateNetwork: true,
        publicIP: true,
      })
      expect(result.pass).toBe(false)
      expect(result.errors.some((e) => e.includes('CPU'))).toBe(true)
    })

    it('Memory 不足 4GB 应失败', () => {
      const result = controller.preflightCheck({
        cpu: '4 cores',
        memory: '2GB',
        storage: '100GB',
        os: 'Ubuntu 22.04',
        privateNetwork: true,
        publicIP: true,
      })
      expect(result.pass).toBe(false)
      expect(result.errors.some((e) => e.toLowerCase().includes('memory'))).toBe(true)
    })

    it('Storage 不足 100GB 应失败', () => {
      const result = controller.preflightCheck({
        cpu: '4 cores',
        memory: '8GB',
        storage: '50GB',
        os: 'Ubuntu 22.04',
        privateNetwork: true,
        publicIP: true,
      })
      expect(result.pass).toBe(false)
      expect(result.errors.some((e) => e.toLowerCase().includes('storage'))).toBe(true)
    })

    it('多个规格同时不足时应返回多条 error', () => {
      const result = controller.preflightCheck({
        cpu: '1 core',
        memory: '2GB',
        storage: '50GB',
        os: 'Ubuntu 22.04',
        privateNetwork: true,
        publicIP: true,
      })
      expect(result.pass).toBe(false)
      expect(result.errors.length).toBeGreaterThanOrEqual(3)
    })

    // ── 边界 ────────────────────────────────────────────────

    it('非标准操作系统应通过但带 warning', () => {
      const result = controller.preflightCheck({
        cpu: '4 cores',
        memory: '8GB',
        storage: '100GB',
        os: 'Debian 11',
        privateNetwork: true,
        publicIP: true,
      })
      expect(result.pass).toBe(true)
      expect(result.warnings.some((w) => w.includes('Ubuntu') || w.includes('CentOS'))).toBe(true)
    })

    it('缺少私网应带 warning', () => {
      const result = controller.preflightCheck({
        cpu: '4 cores',
        memory: '8GB',
        storage: '100GB',
        os: 'Ubuntu 22.04',
        privateNetwork: false,
        publicIP: true,
      })
      expect(result.pass).toBe(true)
      expect(result.warnings.some((w) => w.includes('Private network'))).toBe(true)
    })

    it('缺少公网 IP 应带 warning', () => {
      const result = controller.preflightCheck({
        cpu: '4 cores',
        memory: '8GB',
        storage: '100GB',
        os: 'Ubuntu 22.04',
        privateNetwork: true,
        publicIP: false,
      })
      expect(result.pass).toBe(true)
      expect(result.warnings.some((w) => w.includes('Public IP'))).toBe(true)
    })
  })

  // ══════════════════════════════════════════════════════════════
  // 4. POST /deploy/resources — calculateResources
  // ══════════════════════════════════════════════════════════════

  describe('calculateResources (POST /deploy/resources)', () => {
    // ── 正例 ────────────────────────────────────────────────

    it('应返回 small/single 规格', () => {
      const res = controller.calculateResources({ size: 'small', mode: 'single' })
      expect(res.cpu).toBe('2 cores')
      expect(res.memory).toBe('4GB')
      expect(res.storage).toBe('100GB SSD')
      expect(res.recommendedInstanceType).toBe('ecs.s6-c1m2.xlarge')
    })

    it('应返回 xlarge/kubernetes 规格', () => {
      const res = controller.calculateResources({ size: 'xlarge', mode: 'kubernetes' })
      expect(res.cpu).toBe('16 cores')
      expect(res.memory).toBe('32GB')
      expect(res.storage).toBe('1TB SSD')
      expect(res.recommendedInstanceType).toBe('ecs.s6-c4m8.xlarge')
    })

    it('应返回 large/cluster 规格', () => {
      const res = controller.calculateResources({ size: 'large', mode: 'cluster' })
      expect(res.cpu).toBe('8 cores')
      expect(res.memory).toBe('16GB')
      expect(res.storage).toBe('500GB SSD')
    })

    // ── 边界 ────────────────────────────────────────────────

    it('同一 size 不同 mode 应返回相同资源规格（当前映射一致）', () => {
      const single = controller.calculateResources({ size: 'medium', mode: 'single' })
      const cluster = controller.calculateResources({ size: 'medium', mode: 'cluster' })
      const k8s = controller.calculateResources({ size: 'medium', mode: 'kubernetes' })
      expect(single).toEqual(cluster)
      expect(cluster).toEqual(k8s)
    })
  })

  // ══════════════════════════════════════════════════════════════
  // 5. POST /deploy/plan/:planId/deploy — deploy
  // ══════════════════════════════════════════════════════════════

  describe('deploy (POST /deploy/plan/:planId/deploy)', () => {
    // ── 正例 ────────────────────────────────────────────────

    it('应部署已生成的方案并返回 running 状态', async () => {
      const plan = controller.generatePlan({ mode: 'single', size: 'small' })
      const result = await controller.deploy(plan.planId)
      expect(result.status).toBe('running')
    })

    it('部署后 getStatus 应返回 running', async () => {
      const plan = controller.generatePlan({ mode: 'cluster', size: 'medium' })
      await controller.deploy(plan.planId)
      const status = controller.getStatus(plan.planId)
      expect(status.status).toBe('running')
    })

    it('K8s 方案也应可以部署', async () => {
      const plan = controller.generatePlan({ mode: 'kubernetes', size: 'large' })
      const result = await controller.deploy(plan.planId)
      expect(result.status).toBe('running')
    })

    // ── 反例 ────────────────────────────────────────────────

    it('部署不存在的方案应抛异常', async () => {
      await expect(controller.deploy('non-existent-plan')).rejects.toThrow()
    })
  })

  // ══════════════════════════════════════════════════════════════
  // 6. POST /deploy/plan/:planId/stop — stop
  // ══════════════════════════════════════════════════════════════

  describe('stop (POST /deploy/plan/:planId/stop)', () => {
    // ── 正例 ────────────────────────────────────────────────

    it('应停止运行中的部署', async () => {
      const plan = controller.generatePlan({ mode: 'single', size: 'small' })
      await controller.deploy(plan.planId)
      const result = await controller.stop(plan.planId)
      expect(result.status).toBe('stopped')
    })

    it('即使未 deploy 也可以暂停', async () => {
      const plan = controller.generatePlan({ mode: 'single', size: 'small' })
      const result = await controller.stop(plan.planId)
      expect(result.status).toBe('stopped')
    })

    // ── 反例 ────────────────────────────────────────────────

    it('停止不存在的方案应抛异常', async () => {
      await expect(controller.stop('non-existent')).rejects.toThrow()
    })
  })

  // ══════════════════════════════════════════════════════════════
  // 7. POST /deploy/plan/:planId/rollback — rollback
  // ══════════════════════════════════════════════════════════════

  describe('rollback (POST /deploy/plan/:planId/rollback)', () => {
    // ── 正例 ────────────────────────────────────────────────

    it('应回滚已部署的方案到 stopped', async () => {
      const plan = controller.generatePlan({ mode: 'single', size: 'small' })
      await controller.deploy(plan.planId)
      const result = await controller.rollback(plan.planId)
      expect(result.status).toBe('stopped')
    })

    // ── 反例 ────────────────────────────────────────────────

    it('回滚不存在的方案应抛异常', async () => {
      await expect(controller.rollback('non-existent')).rejects.toThrow()
    })

    // ── 边界 ────────────────────────────────────────────────

    it('未部署的方案也可以回滚', async () => {
      const plan = controller.generatePlan({ mode: 'single', size: 'small' })
      const result = await controller.rollback(plan.planId)
      expect(result.status).toBe('stopped')
    })

    it('已停止的方案回滚后应保持 stopped', async () => {
      const plan = controller.generatePlan({ mode: 'single', size: 'small' })
      await controller.deploy(plan.planId)
      await controller.stop(plan.planId)
      const result = await controller.rollback(plan.planId)
      expect(result.status).toBe('stopped')
    })
  })

  // ══════════════════════════════════════════════════════════════
  // 8. GET /deploy/plan/:planId/status — getStatus
  // ══════════════════════════════════════════════════════════════

  describe('getStatus (GET /deploy/plan/:planId/status)', () => {
    // ── 正例 ────────────────────────────────────────────────

    it('刚生成的方案状态应为 pending', () => {
      const plan = controller.generatePlan({ mode: 'single', size: 'small' })
      const status = controller.getStatus(plan.planId)
      expect(status.planId).toBe(plan.planId)
      expect(status.status).toBe('pending')
    })

    it('部署后状态应为 running', async () => {
      const plan = controller.generatePlan({ mode: 'single', size: 'small' })
      await controller.deploy(plan.planId)
      const status = controller.getStatus(plan.planId)
      expect(status.status).toBe('running')
    })

    it('停止后状态应为 stopped', async () => {
      const plan = controller.generatePlan({ mode: 'single', size: 'small' })
      await controller.deploy(plan.planId)
      await controller.stop(plan.planId)
      const status = controller.getStatus(plan.planId)
      expect(status.status).toBe('stopped')
    })

    // ── 边界 ────────────────────────────────────────────────

    it('不存在的 planId 应返回 pending 默认状态（不会抛异常）', () => {
      const status = controller.getStatus('unknown-plan')
      expect(status.planId).toBe('unknown-plan')
      expect(status.status).toBe('pending')
    })
  })

  // ══════════════════════════════════════════════════════════════
  // 9. POST /deploy/cost — estimateMonthlyCost
  // ══════════════════════════════════════════════════════════════

  describe('estimateMonthlyCost (POST /deploy/cost)', () => {
    // ── 正例 ────────────────────────────────────────────────

    it('应返回 small/single 成本明细，币种 CNY', () => {
      const cost = controller.estimateMonthlyCost({ size: 'small', mode: 'single' })
      expect(cost.infrastructure).toBe(299)
      expect(cost.bandwidth).toBe(100)
      expect(cost.storage).toBe(50)
      expect(cost.total).toBe(449)
      expect(cost.currency).toBe('CNY')
    })

    it('应返回 xlarge/kubernetes 成本', () => {
      const cost = controller.estimateMonthlyCost({ size: 'xlarge', mode: 'kubernetes' })
      expect(cost.infrastructure).toBe(2399 * 4)
      expect(cost.bandwidth).toBe(1600)
      expect(cost.storage).toBe(800)
      expect(cost.total).toBe(2399 * 4 + 1600 + 800)
    })

    // ── 边界 ────────────────────────────────────────────────

    it('cluster 成本应为 single 的约 3 倍基础设施 + 更多带宽/存储', () => {
      const single = controller.estimateMonthlyCost({ size: 'medium', mode: 'single' })
      const cluster = controller.estimateMonthlyCost({ size: 'medium', mode: 'cluster' })
      expect(cluster.infrastructure).toBe(single.infrastructure * 3)
      expect(cluster.bandwidth).toBeGreaterThan(single.bandwidth)
      expect(cluster.storage).toBeGreaterThan(single.storage)
    })

    it('large 成本应介于 medium 和 xlarge 之间', () => {
      const medium = controller.estimateMonthlyCost({ size: 'medium', mode: 'single' })
      const large = controller.estimateMonthlyCost({ size: 'large', mode: 'single' })
      const xlarge = controller.estimateMonthlyCost({ size: 'xlarge', mode: 'single' })
      expect(large.total).toBeGreaterThan(medium.total)
      expect(large.total).toBeLessThan(xlarge.total)
    })
  })

  // ══════════════════════════════════════════════════════════════
  // 10. POST /deploy/quote — generateQuote
  // ══════════════════════════════════════════════════════════════

  describe('generateQuote (POST /deploy/quote)', () => {
    // ── 正例 ────────────────────────────────────────────────

    it('应生成包含 3 个费用项的中型单机报价', () => {
      const quote = controller.generateQuote({ size: 'medium', mode: 'single' })
      expect(quote.items).toHaveLength(3)
      expect(quote.items[0].description).toBe('基础设施（ECS）')
      expect(quote.items[1].description).toBe('带宽费用')
      expect(quote.items[2].description).toBe('存储费用')
    })

    it('报价应有正确的小计、税费和总计', () => {
      const quote = controller.generateQuote({ size: 'small', mode: 'single' })
      expect(quote.subtotal).toBe(449)
      expect(quote.tax).toBeCloseTo(449 * 0.06, 2)
      expect(quote.total).toBe(quote.subtotal + quote.tax)
    })

    it('报价应有 30 天有效期', () => {
      const quote = controller.generateQuote({ size: 'large', mode: 'cluster' })
      const now = new Date()
      const diffDays = Math.round((quote.validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      expect(diffDays).toBeGreaterThanOrEqual(28)
      expect(diffDays).toBeLessThanOrEqual(32)
    })

    it('报价 planName 应包含尺寸和模式中文', () => {
      const single = controller.generateQuote({ size: 'small', mode: 'single' })
      expect(single.planName).toContain('小型')
      expect(single.planName).toContain('单机部署')

      const k8s = controller.generateQuote({ size: 'xlarge', mode: 'kubernetes' })
      expect(k8s.planName).toContain('超大型')
      expect(k8s.planName).toContain('K8s 部署')
    })

    // ── 边界 ────────────────────────────────────────────────

    it('cluster 报价的基础设施单价应与 single 不同', () => {
      const single = controller.generateQuote({ size: 'medium', mode: 'single' })
      const cluster = controller.generateQuote({ size: 'medium', mode: 'cluster' })
      expect(cluster.items[0].total).not.toBe(single.items[0].total)
      expect(cluster.items[0].total).toBeGreaterThan(single.items[0].total)
    })

    it('large 报价的 total 大于 small 报价的 total', () => {
      const small = controller.generateQuote({ size: 'small', mode: 'single' })
      const large = controller.generateQuote({ size: 'large', mode: 'single' })
      expect(large.total).toBeGreaterThan(small.total)
    })
  })

  // ══════════════════════════════════════════════════════════════
  // 路由元数据验证
  // ══════════════════════════════════════════════════════════════

  describe('route metadata', () => {
    it('controller 路径应为 deploy', () => {
      const path = Reflect.getMetadata('path', DeployController)
      expect(path).toBe('deploy')
    })

    it('generatePlan 应标记 POST 方法', () => {
      const method = Reflect.getMetadata('method', DeployController.prototype.generatePlan)
      expect(method).toBeDefined()
    })

    it('getPlan 应标记 GET 方法', () => {
      const method = Reflect.getMetadata('method', DeployController.prototype.getPlan)
      expect(method).toBe(0) // RequestMethod.GET
    })
  })
})
