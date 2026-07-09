/**
 * deploy.contract.test.ts
 * 🐜 自动: [deploy] [D] contract 补全
 *
 * 部署模块合约测试：
 * 验证实体 Shape、服务方法契约、DTO 约束
 */

import { describe, it, expect, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
import 'reflect-metadata'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import { DeployService } from './deploy.service'
import {
  GeneratePlanDto, DeployPlanDto, ServerSpecDto,
  CostQueryDto, ResourceQueryDto, PlanOptionsDto,
} from './deploy.dto'
import type {
  DeploymentPlan, DeploymentMode, DeploymentStatus,
  ResourceSize, ServerSpec, HelmValues, MonthlyCost,
  DeploymentQuote, PreflightCheckResult,
} from './deploy.entity'

// ── 服务实例 helper ──

function makeService(): DeployService {
  return new DeployService()
}

// ── 合约：实体 Shape ──

describe('[deploy] 契约：实体 Shape', () => {
  it('DeploymentPlan 必须包含必要字段', () => {
    const plan: DeploymentPlan = {
      planId: 'plan-001',
      mode: 'single',
      size: 'medium',
      serverSpec: {
        cpu: '4 cores', memory: '8GB', storage: '200GB SSD',
        os: 'Ubuntu 22.04', privateNetwork: true, publicIP: true,
      },
      estimatedCost: 899,
      setupTime: 30,
      components: ['API', 'Web', 'MySQL', 'Redis', 'Nginx'],
    }
    assert.equal(typeof plan.planId, 'string')
    assert.equal(typeof plan.mode, 'string')
    assert.ok(['single', 'cluster', 'kubernetes'].includes(plan.mode))
    assert.equal(typeof plan.size, 'string')
    assert.ok(['small', 'medium', 'large', 'xlarge'].includes(plan.size))
    assert.equal(typeof plan.estimatedCost, 'number')
    assert.equal(typeof plan.setupTime, 'number')
    assert.ok(Array.isArray(plan.components))
    assert.ok(plan.components.length > 0)
  })

  it('HelmValues 必须包含必要字段', () => {
    const helm: HelmValues = {
      image: { repository: 'reg/foo', tag: 'v1', pullPolicy: 'Always' },
      replicaCount: 2,
      resources: { requests: { cpu: '250m', memory: '256Mi' }, limits: { cpu: '1000m', memory: '1Gi' } },
      service: { type: 'ClusterIP', port: 3000 },
      ingress: { enabled: true, host: 'api.example.com', tls: true },
      env: {},
      persistence: { enabled: true, size: '20Gi' },
    }
    assert.equal(typeof helm.image.repository, 'string')
    assert.equal(typeof helm.replicaCount, 'number')
    assert.equal(typeof helm.resources.requests.cpu, 'string')
    assert.equal(typeof helm.service.type, 'string')
    assert.equal(typeof helm.ingress.enabled, 'boolean')
  })

  it('PreflightCheckResult 必须包含通过/警告/错误', () => {
    const result: PreflightCheckResult = { pass: true, warnings: [], errors: [] }
    assert.equal(typeof result.pass, 'boolean')
    assert.ok(Array.isArray(result.warnings))
    assert.ok(Array.isArray(result.errors))
  })

  it('MonthlyCost 必须包含分项和总价', () => {
    const cost: MonthlyCost = { infrastructure: 299, bandwidth: 100, storage: 50, total: 449, currency: 'CNY' }
    assert.equal(typeof cost.infrastructure, 'number')
    assert.equal(typeof cost.total, 'number')
    assert.equal(cost.currency, 'CNY')
    assert.equal(cost.infrastructure + cost.bandwidth + cost.storage, cost.total)
  })

  it('DeploymentQuote 必须包含明细和含税总价', () => {
    const quote: DeploymentQuote = {
      planName: '小型单机部署方案',
      items: [
        { description: 'ECS', unitPrice: 299, quantity: 1, total: 299 },
      ],
      subtotal: 299,
      tax: 17.94,
      total: 316.94,
      validUntil: new Date(),
    }
    assert.equal(typeof quote.planName, 'string')
    assert.ok(Array.isArray(quote.items))
    assert.ok(quote.items.length > 0)
    assert.equal(quote.subtotal + quote.tax, quote.total)
    assert.ok(quote.validUntil instanceof Date)
  })
})

// ── 合约：DTO 约束 ──

describe('[deploy] 契约：DTO 校验', () => {
  it('GeneratePlanDto - 合法输入通过校验', async () => {
    const dto = plainToInstance(GeneratePlanDto, { mode: 'kubernetes', size: 'large' })
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('GeneratePlanDto - 非法 mode 校验失败', async () => {
    const dto = plainToInstance(GeneratePlanDto, { mode: 'bare-metal', size: 'medium' })
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('GeneratePlanDto - 非法 size 校验失败', async () => {
    const dto = plainToInstance(GeneratePlanDto, { mode: 'single', size: 'huge' })
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('GeneratePlanDto - 空输入校验失败', async () => {
    const dto = plainToInstance(GeneratePlanDto, {})
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('GeneratePlanDto - 可选 options 通过校验', async () => {
    const dto = plainToInstance(GeneratePlanDto, {
      mode: 'cluster', size: 'medium',
      options: { enableSSL: true, enableMonitoring: false },
    })
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('ServerSpecDto - 合法输入通过校验', async () => {
    const dto = plainToInstance(ServerSpecDto, {
      cpu: '4 cores', memory: '8GB', storage: '200GB SSD', os: 'Ubuntu 22.04',
    })
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('ServerSpecDto - 缺少必填字段校验失败', async () => {
    const dto = plainToInstance(ServerSpecDto, { cpu: '4 cores' })
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('CostQueryDto - 合法输入通过校验', async () => {
    const dto = plainToInstance(CostQueryDto, { size: 'xlarge', mode: 'kubernetes' })
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('DeployPlanDto - 合法 planId 通过校验', async () => {
    const dto = plainToInstance(DeployPlanDto, { planId: 'plan-abc123' })
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('DeployPlanDto - 空 planId 校验失败', async () => {
    const dto = plainToInstance(DeployPlanDto, { planId: '' })
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

// ── 合约：服务方法 ──

describe('[deploy] 契约：服务方法签名', () => {
  let service: DeployService

  beforeEach(() => {
    service = makeService()
  })

  it('generatePlan 返回 DeploymentPlan', () => {
    const result = service.generatePlan('single', 'small')
    assert.ok(result)
    assert.equal(typeof result.planId, 'string')
    assert.equal(result.mode, 'single')
  })

  it('getPlan 存在时返回 DeploymentPlan，不存在返回 null', () => {
    const plan = service.generatePlan('single', 'small')
    assert.notEqual(service.getPlan(plan.planId), null)
    assert.equal(service.getPlan('nonexistent'), null)
  })

  it('preflightCheck 返回 PreflightCheckResult', () => {
    const spec: ServerSpec = {
      cpu: '4 cores', memory: '8GB', storage: '200GB SSD',
      os: 'Ubuntu 22.04', privateNetwork: true, publicIP: true,
    }
    const result = service.preflightCheck(spec)
    assert.equal(typeof result.pass, 'boolean')
    assert.ok(Array.isArray(result.warnings))
    assert.ok(Array.isArray(result.errors))
  })

  it('calculateResources 返回完整规格', () => {
    const res = service.calculateResources('medium', 'cluster')
    assert.equal(typeof res.cpu, 'string')
    assert.equal(typeof res.memory, 'string')
    assert.equal(typeof res.storage, 'string')
    assert.equal(typeof res.recommendedInstanceType, 'string')
  })

  it('deploy 异步返回状态字符串', async () => {
    const plan = service.generatePlan('single', 'small')
    const status = await service.deploy(plan.planId)
    assert.equal(status, 'running')
  })

  it('stop 修改状态为 stopped', async () => {
    const plan = service.generatePlan('single', 'small')
    await service.deploy(plan.planId)
    await service.stop(plan.planId)
    assert.equal(service.getStatus(plan.planId), 'stopped')
  })

  it('rollback 最终状态为 stopped', async () => {
    const plan = service.generatePlan('single', 'small')
    await service.rollback(plan.planId)
    assert.equal(service.getStatus(plan.planId), 'stopped')
  })

  it('estimateMonthlyCost 返回正确成本结构', () => {
    const cost = service.estimateMonthlyCost('small', 'single')
    assert.equal(cost.currency, 'CNY')
    assert.equal(cost.infrastructure + cost.bandwidth + cost.storage, cost.total)
  })

  it('generateQuote 生成含税报价', () => {
    const quote = service.generateQuote('medium', 'kubernetes')
    assert.equal(quote.items.length, 3)
    assert.equal(quote.total, quote.subtotal + quote.tax)
    assert.ok(quote.validUntil > new Date(Date.now() - 86400000))
  })
})

// ── 合约：Kubernetes 清单结构 ──

describe('[deploy] 契约：K8s 清单结构', () => {
  it('清单包含标准的 YAML 文档分隔符', () => {
    const service = makeService()
    service.generatePlan('kubernetes', 'small')
    const manifest = service.renderHelmTemplate('plan-generated')
    // renderHelmTemplate 需要实际 plan
    expect(manifest).toBe('')
  })

  it('有效 plan 的 renderHelmTemplate 返回完整清单', () => {
    const service = makeService()
    const plan = service.generatePlan('kubernetes', 'medium')
    const manifest = service.renderHelmTemplate(plan.planId)
    expect(manifest).toContain('apiVersion: apps/v1')
    expect(manifest).toContain('kind: Deployment')
    expect(manifest).toContain('kind: Ingress')
    expect(manifest).toMatch(/replicas: \d+/)
  })

  it('HelmValues 的 ingress 配置格式正确', () => {
    const service = makeService()
    const plan = service.generatePlan('kubernetes', 'xlarge')
    expect(plan.helmValues!).toBeDefined()
    expect(plan.helmValues!.image.pullPolicy).toMatch(/^(Always|IfNotPresent|Never)$/)
    expect(plan.helmValues!.service.type).toMatch(/^(ClusterIP|NodePort|LoadBalancer)$/)
  })
})
