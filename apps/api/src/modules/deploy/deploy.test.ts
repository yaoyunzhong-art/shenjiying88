import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { DeployService } from './deploy.service'
import type { DeploymentMode, ResourceSize, ServerSpec } from './deploy.service'

describe('DeployService', () => {
  let svc: DeployService

  beforeEach(() => {
    svc = new DeployService()
  })

  // ── generatePlan 三种模式生成 ────────────────────────────────────

  describe('generatePlan', () => {
    it('single 模式生成正确的 plan', () => {
      const plan = svc.generatePlan('single', 'medium')

      assert.equal(plan.mode, 'single')
      assert.equal(plan.size, 'medium')
      assert.ok(plan.planId.startsWith('plan-'))
      assert.equal(plan.serverSpec.cpu, '4 cores')
      assert.equal(plan.serverSpec.memory, '8GB')
      assert.deepEqual(plan.components, ['API', 'Web', 'MySQL', 'Redis', 'Nginx'])
      assert.equal(plan.setupTime, 30)
    })

    it('cluster 模式生成正确的 plan', () => {
      const plan = svc.generatePlan('cluster', 'large')

      assert.equal(plan.mode, 'cluster')
      assert.equal(plan.size, 'large')
      assert.equal(plan.serverSpec.cpu, '8 cores')
      assert.equal(plan.serverSpec.memory, '16GB')
      assert.deepEqual(plan.components, ['API', 'Web', 'MySQL', 'Redis', 'Nginx'])
      assert.equal(plan.setupTime, 60)
    })

    it('kubernetes 模式生成正确的 plan，包含 helmValues', () => {
      const plan = svc.generatePlan('kubernetes', 'small')

      assert.equal(plan.mode, 'kubernetes')
      assert.equal(plan.size, 'small')
      assert.ok(plan.helmValues)
      assert.ok(plan.kubernetesManifests)
      assert.deepEqual(plan.components, ['API', 'Web', 'MySQL/RDS', 'Redis/ElastiCache', 'Nginx Ingress', 'Prometheus', 'Grafana'])
      assert.equal(plan.setupTime, 120)
    })

    it('generatePlan 支持 enableMonitoring 选项', () => {
      const planWithMonitoring = svc.generatePlan('single', 'medium', { enableMonitoring: true })
      assert.ok(planWithMonitoring.components.includes('Monitoring'))
    })

    it('generatePlan 支持 enableBackup 选项', () => {
      const planWithBackup = svc.generatePlan('single', 'medium', { enableBackup: true })
      assert.ok(planWithBackup.components.includes('Backup'))
    })
  })

  // ── preflightCheck 通过/警告/错误判断 ─────────────────────────────

  describe('preflightCheck', () => {
    it('通过检查：规格满足要求', () => {
      const spec: ServerSpec = {
        cpu: '4 cores',
        memory: '8GB',
        storage: '200GB SSD',
        os: 'Ubuntu 22.04',
        privateNetwork: true,
        publicIP: true,
      }
      const result = svc.preflightCheck(spec)

      assert.equal(result.pass, true)
      assert.equal(result.errors.length, 0)
    })

    it('警告检查：非推荐 OS', () => {
      const spec: ServerSpec = {
        cpu: '4 cores',
        memory: '8GB',
        storage: '200GB SSD',
        os: 'Windows Server 2022',
        privateNetwork: true,
        publicIP: true,
      }
      const result = svc.preflightCheck(spec)

      assert.equal(result.pass, true)
      assert.ok(result.warnings.length > 0)
      assert.ok(result.warnings.some((w) => w.includes('Ubuntu')))
    })

    it('警告检查：无私网网络', () => {
      const spec: ServerSpec = {
        cpu: '4 cores',
        memory: '8GB',
        storage: '200GB SSD',
        os: 'Ubuntu 22.04',
        privateNetwork: false,
        publicIP: true,
      }
      const result = svc.preflightCheck(spec)

      assert.equal(result.pass, true)
      assert.ok(result.warnings.some((w) => w.includes('Private network')))
    })

    it('错误检查：CPU 不足', () => {
      const spec: ServerSpec = {
        cpu: '1 core',
        memory: '8GB',
        storage: '200GB SSD',
        os: 'Ubuntu 22.04',
        privateNetwork: true,
        publicIP: true,
      }
      const result = svc.preflightCheck(spec)

      assert.equal(result.pass, false)
      assert.ok(result.errors.some((e) => e.includes('CPU cores')))
    })

    it('错误检查：内存不足', () => {
      const spec: ServerSpec = {
        cpu: '4 cores',
        memory: '2GB',
        storage: '200GB SSD',
        os: 'Ubuntu 22.04',
        privateNetwork: true,
        publicIP: true,
      }
      const result = svc.preflightCheck(spec)

      assert.equal(result.pass, false)
      assert.ok(result.errors.some((e) => e.includes('Memory')))
    })

    it('错误检查：存储不足', () => {
      const spec: ServerSpec = {
        cpu: '4 cores',
        memory: '8GB',
        storage: '50GB SSD',
        os: 'Ubuntu 22.04',
        privateNetwork: true,
        publicIP: true,
      }
      const result = svc.preflightCheck(spec)

      assert.equal(result.pass, false)
      assert.ok(result.errors.some((e) => e.includes('Storage')))
    })
  })

  // ── calculateResources 返回正确规格 ─────────────────────────────

  describe('calculateResources', () => {
    it('small/single 返回正确规格', () => {
      const resources = svc.calculateResources('small', 'single')

      assert.equal(resources.cpu, '2 cores')
      assert.equal(resources.memory, '4GB')
      assert.equal(resources.storage, '100GB SSD')
      assert.equal(resources.recommendedInstanceType, 'ecs.s6-c1m2.xlarge')
    })

    it('medium/cluster 返回正确规格', () => {
      const resources = svc.calculateResources('medium', 'cluster')

      assert.equal(resources.cpu, '4 cores')
      assert.equal(resources.memory, '8GB')
      assert.equal(resources.storage, '200GB SSD')
    })

    it('large/kubernetes 返回正确规格', () => {
      const resources = svc.calculateResources('large', 'kubernetes')

      assert.equal(resources.cpu, '8 cores')
      assert.equal(resources.memory, '16GB')
      assert.equal(resources.storage, '500GB SSD')
    })

    it('xlarge 规格返回正确', () => {
      const resources = svc.calculateResources('xlarge', 'single')

      assert.equal(resources.cpu, '16 cores')
      assert.equal(resources.memory, '32GB')
      assert.equal(resources.storage, '1TB SSD')
    })
  })

  // ── generateHelmValues 输出完整 values ──────────────────────────

  describe('generateHelmValues', () => {
    it('输出完整 Helm values', () => {
      const plan = svc.generatePlan('kubernetes', 'medium')
      const helmValues = svc.generateHelmValues(plan.planId)

      assert.equal(helmValues.image.repository, 'registry.shenjiying.com/shenjiying')
      assert.equal(helmValues.image.tag, 'latest')
      assert.equal(helmValues.image.pullPolicy, 'IfNotPresent')
      assert.equal(helmValues.replicaCount, 2)
      assert.ok(helmValues.resources.requests.cpu)
      assert.ok(helmValues.resources.requests.memory)
      assert.ok(helmValues.resources.limits.cpu)
      assert.ok(helmValues.resources.limits.memory)
      assert.equal(helmValues.service.type, 'ClusterIP')
      assert.equal(helmValues.service.port, 3000)
      assert.equal(helmValues.ingress.enabled, true)
      assert.equal(helmValues.ingress.tls, true)
      assert.equal(helmValues.persistence.enabled, true)
    })

    it('small size 使用 replicaCount 1', () => {
      const plan = svc.generatePlan('kubernetes', 'small')
      const helmValues = svc.generateHelmValues(plan.planId)

      assert.equal(helmValues.replicaCount, 1)
    })

    it('small size persistence size 为 10Gi', () => {
      const plan = svc.generatePlan('kubernetes', 'small')
      const helmValues = svc.generateHelmValues(plan.planId)

      assert.equal(helmValues.persistence.size, '10Gi')
    })

    it('xlarge size persistence size 为 100Gi', () => {
      const plan = svc.generatePlan('kubernetes', 'xlarge')
      const helmValues = svc.generateHelmValues(plan.planId)

      assert.equal(helmValues.persistence.size, '100Gi')
    })
  })

  // ── generateK8sManifests 输出有效 YAML ───────────────────────────

  describe('generateK8sManifests', () => {
    it('输出包含 Deployment 的 YAML', () => {
      const plan = svc.generatePlan('kubernetes', 'small')
      const manifests = svc.generateK8sManifests(plan.planId)

      assert.ok(manifests.includes('apiVersion: apps/v1'))
      assert.ok(manifests.includes('kind: Deployment'))
      assert.ok(manifests.includes('name: shenjiying-api'))
    })

    it('输出包含 Service 的 YAML', () => {
      const plan = svc.generatePlan('kubernetes', 'small')
      const manifests = svc.generateK8sManifests(plan.planId)

      assert.ok(manifests.includes('kind: Service'))
      assert.ok(manifests.includes('name: shenjiying-api'))
      assert.ok(manifests.includes('port: 3000'))
    })

    it('输出包含 Ingress 的 YAML', () => {
      const plan = svc.generatePlan('kubernetes', 'small')
      const manifests = svc.generateK8sManifests(plan.planId)

      assert.ok(manifests.includes('kind: Ingress'))
      assert.ok(manifests.includes('tls'))
      assert.ok(manifests.includes('api.example.com'))
    })
  })

  // ── renderHelmTemplate 输出合集 YAML ─────────────────────────────

  describe('renderHelmTemplate', () => {
    it('输出包含 Deployment/Service/Ingress 的合集 YAML', () => {
      const plan = svc.generatePlan('kubernetes', 'medium')
      const output = svc.renderHelmTemplate(plan.planId)

      assert.ok(output.includes('---'))
      assert.ok(output.includes('Deployment'))
      assert.ok(output.includes('Service'))
      assert.ok(output.includes('Ingress'))
    })
  })

  // ── deploy → status 流转 ──────────────────────────────────────

  describe('deploy', () => {
    it('deploy 后 status 变为 running', async () => {
      const plan = svc.generatePlan('single', 'small')
      assert.equal(svc.getStatus(plan.planId), 'pending')

      await svc.deploy(plan.planId)

      assert.equal(svc.getStatus(plan.planId), 'running')
    })

    it('deploy 不存在的 plan 抛出错误', async () => {
      await assert.rejects(
        async () => {
          await svc.deploy('non-existent-plan')
        },
        (err: any) => {
          return err.message.includes('not found')
        }
      )
    })
  })

  // ── stop / rollback 状态更新 ───────────────────────────────────

  describe('stop', () => {
    it('stop 后 status 变为 stopped', async () => {
      const plan = svc.generatePlan('single', 'small')
      await svc.deploy(plan.planId)

      await svc.stop(plan.planId)

      assert.equal(svc.getStatus(plan.planId), 'stopped')
    })

    it('stop 不存在的 plan 抛出错误', async () => {
      await assert.rejects(
        async () => {
          await svc.stop('non-existent-plan')
        },
        (err: any) => {
          return err.message.includes('not found')
        }
      )
    })
  })

  describe('rollback', () => {
    it('rollback 后 status 变为 stopped', async () => {
      const plan = svc.generatePlan('single', 'small')
      await svc.deploy(plan.planId)

      await svc.rollback(plan.planId)

      assert.equal(svc.getStatus(plan.planId), 'stopped')
    })

    it('rollback 不存在的 plan 抛出错误', async () => {
      await assert.rejects(
        async () => {
          await svc.rollback('non-existent-plan')
        },
        (err: any) => {
          return err.message.includes('not found')
        }
      )
    })
  })

  // ── estimateMonthlyCost 三种规格成本 ───────────────────────────

  describe('estimateMonthlyCost', () => {
    it('small/single 成本计算正确', () => {
      const cost = svc.estimateMonthlyCost('small', 'single')

      assert.equal(cost.infrastructure, 299)
      assert.equal(cost.bandwidth, 100)
      assert.equal(cost.storage, 50)
      assert.equal(cost.total, 449)
      assert.equal(cost.currency, 'CNY')
    })

    it('medium/cluster 成本计算正确', () => {
      const cost = svc.estimateMonthlyCost('medium', 'cluster')

      assert.equal(cost.infrastructure, 599 * 3)
      assert.equal(cost.bandwidth, 300)
      assert.equal(cost.storage, 160)
    })

    it('large/kubernetes 成本计算正确', () => {
      const cost = svc.estimateMonthlyCost('large', 'kubernetes')

      assert.equal(cost.infrastructure, 1199 * 4)
      assert.equal(cost.bandwidth, 800)
      assert.equal(cost.storage, 400)
    })

    it('xlarge 成本最高', () => {
      const smallCost = svc.estimateMonthlyCost('small', 'single')
      const xlargeCost = svc.estimateMonthlyCost('xlarge', 'kubernetes')

      assert.ok(xlargeCost.total > smallCost.total)
    })
  })

  // ── generateQuote 报价单格式 ───────────────────────────────────

  describe('generateQuote', () => {
    it('报价单包含 planName', () => {
      const quote = svc.generateQuote('medium', 'single')

      assert.ok(quote.planName.includes('中型'))
      assert.ok(quote.planName.includes('单机'))
    })

    it('报价单包含 items', () => {
      const quote = svc.generateQuote('small', 'cluster')

      assert.ok(Array.isArray(quote.items))
      assert.ok(quote.items.length >= 3)
      assert.ok(quote.items.some((item) => item.description.includes('基础设施')))
      assert.ok(quote.items.some((item) => item.description.includes('带宽')))
      assert.ok(quote.items.some((item) => item.description.includes('存储')))
    })

    it('报价单 subtotal 计算正确', () => {
      const quote = svc.generateQuote('small', 'single')

      const expectedSubtotal = quote.items.reduce((sum, item) => sum + item.total, 0)
      assert.equal(quote.subtotal, expectedSubtotal)
    })

    it('报价单 tax 为 6%', () => {
      const quote = svc.generateQuote('small', 'single')

      const expectedTax = Math.round(quote.subtotal * 0.06 * 100) / 100
      assert.equal(quote.tax, expectedTax)
    })

    it('报价单 total = subtotal + tax', () => {
      const quote = svc.generateQuote('small', 'single')

      assert.equal(quote.total, quote.subtotal + quote.tax)
    })

    it('报价单 validUntil 为 30 天后', () => {
      const quote = svc.generateQuote('small', 'single')
      const now = new Date()
      const expectedValidUntil = new Date(now.setDate(now.getDate() + 30))

      // Compare date parts only (ignore time)
      assert.equal(quote.validUntil.getDate(), expectedValidUntil.getDate())
    })
  })

  // ── getPlan ───────────────────────────────────────────────────

  describe('getPlan', () => {
    it('返回已生成的 plan', () => {
      const plan = svc.generatePlan('single', 'medium')
      const found = svc.getPlan(plan.planId)

      assert.ok(found)
      assert.equal(found!.planId, plan.planId)
    })

    it('返回不存在的 plan 为 null', () => {
      const found = svc.getPlan('non-existent-plan')

      assert.equal(found, null)
    })
  })
})
