import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { DeployController } from './deploy.controller'
import { DeployService } from './deploy.service'
import type { DeploymentPlan, DeploymentQuote, MonthlyCost, PreflightCheckResult } from './deploy.entity'

// ── 8 角色定义 ──
const ROLES = {
  TenantAdmin: '👔店长',
  Reception: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
}

// ── 辅助函数 ──

function makeController(): DeployController {
  return new DeployController(new DeployService())
}

// ──────────── 🎯 运行专员：部署管理 ────────────
describe(`${ROLES.Ops} deploy 角色测试`, () => {
  let ctrl: DeployController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('运行专员可以生成单机部署方案（正常流程）', () => {
    const plan = ctrl.generatePlan({ mode: 'single', size: 'medium' })
    assert.equal(plan.mode, 'single')
    assert.equal(plan.size, 'medium')
    assert.ok(plan.planId.startsWith('plan-'))
    assert.equal(plan.serverSpec.cpu, '4 cores')
    assert.equal(plan.serverSpec.memory, '8GB')
    assert.deepEqual(plan.components, ['API', 'Web', 'MySQL', 'Redis', 'Nginx'])
    assert.equal(plan.setupTime, 30)
  })

  it('运行专员可以生成集群部署方案（正常流程）', () => {
    const plan = ctrl.generatePlan({ mode: 'cluster', size: 'large' })
    assert.equal(plan.mode, 'cluster')
    assert.equal(plan.size, 'large')
    assert.equal(plan.serverSpec.cpu, '8 cores')
    assert.equal(plan.setupTime, 60)
    assert.ok(plan.estimatedCost > 0)
  })

  it('运行专员可以生成 Kubernetes 部署方案（正常流程）', () => {
    const plan = ctrl.generatePlan({ mode: 'kubernetes', size: 'small' })
    assert.equal(plan.mode, 'kubernetes')
    assert.equal(plan.size, 'small')
    assert.ok(plan.helmValues)
    assert.ok(plan.kubernetesManifests)
    assert.equal(plan.setupTime, 120)
    // K8s 模式额外包含监控组件
    assert.ok(plan.components.includes('Prometheus'))
    assert.ok(plan.components.includes('Grafana'))
  })

  it('运行专员可以执行部署（正常流程）', async () => {
    ctrl.generatePlan({ mode: 'single', size: 'small' })
    // 需要用 planId 来获取最新的 plan
    const plan = ctrl.generatePlan({ mode: 'single', size: 'small' })
    const result = await ctrl.deploy(plan.planId)
    assert.equal(result.status, 'running')

    const statusResult = ctrl.getStatus(plan.planId)
    assert.equal(statusResult.status, 'running')
  })

  it('运行专员可以停止和回滚部署（正常流程）', async () => {
    const plan = ctrl.generatePlan({ mode: 'single', size: 'small' })
    await ctrl.deploy(plan.planId)

    const stopResult = await ctrl.stop(plan.planId)
    assert.equal(stopResult.status, 'stopped')

    ctrl.generatePlan({ mode: 'single', size: 'small' })
    const plan2 = ctrl.generatePlan({ mode: 'single', size: 'small' })
    await ctrl.deploy(plan2.planId)

    const rollbackResult = await ctrl.rollback(plan2.planId)
    assert.equal(rollbackResult.status, 'stopped')
  })

  it('运行专员可以查询部署方案详情（正常流程）', () => {
    const plan = ctrl.generatePlan({ mode: 'single', size: 'medium' })
    const fetched = ctrl.getPlan(plan.planId)
    assert.equal(fetched.planId, plan.planId)
    assert.equal(fetched.mode, 'single')
  })

  it('运行专员查询不存在的部署方案应报错（边界）', () => {
    assert.throws(
      () => ctrl.getPlan('nonexistent-plan'),
      /不存在/,
    )
  })

  it('运行专员可以计算资源规格（正常流程）', () => {
    const resources = ctrl.calculateResources({ size: 'xlarge', mode: 'cluster' })
    assert.equal(resources.cpu, '16 cores')
    assert.equal(resources.memory, '32GB')
    assert.equal(resources.storage, '1TB SSD')
    assert.ok(resources.recommendedInstanceType)
  })
})

// ──────────── 🔧 安监：安全部署验证 ────────────
describe(`${ROLES.Safety} deploy 角色测试`, () => {
  let ctrl: DeployController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('安监可以执行部署前检查（正常流程 - 通过）', () => {
    const result = ctrl.preflightCheck({
      cpu: '4 cores',
      memory: '8GB',
      storage: '200GB SSD',
      os: 'Ubuntu 22.04',
      privateNetwork: true,
      publicIP: true,
    })
    assert.equal(result.pass, true)
    assert.equal(result.errors.length, 0)
    assert.equal(result.warnings.length, 0)
  })

  it('安监可以检测不满足最低要求的服务器配置（检查失败）', () => {
    const result = ctrl.preflightCheck({
      cpu: '1 cores',
      memory: '2GB',
      storage: '50GB HDD',
      os: 'Ubuntu 22.04',
      privateNetwork: false,
      publicIP: false,
    })
    assert.equal(result.pass, false)
    assert.ok(result.errors.length > 0)
    // 应包含 CPU、内存、存储的告警
    assert.ok(result.errors.some((e: string) => e.includes('CPU')))
    assert.ok(result.errors.some((e: string) => e.includes('Memory')))
    assert.ok(result.errors.some((e: string) => e.includes('Storage')))
  })

  it('安监可以检测不推荐的操作系统（警告）', () => {
    const result = ctrl.preflightCheck({
      cpu: '4 cores',
      memory: '8GB',
      storage: '200GB SSD',
      os: 'Windows Server 2022',
      privateNetwork: true,
      publicIP: true,
    })
    assert.equal(result.pass, true)
    assert.ok(result.warnings.length > 0)
    assert.ok(result.warnings.some((w: string) => w.includes('OS') || w.includes('Recommended')))
  })

  it('安监可以检测缺失私有网络的部署（警告）', () => {
    const result = ctrl.preflightCheck({
      cpu: '4 cores',
      memory: '8GB',
      storage: '200GB SSD',
      os: 'Ubuntu 22.04',
      privateNetwork: false,
      publicIP: true,
    })
    assert.equal(result.pass, true)
    assert.ok(result.warnings.some((w: string) => w.includes('Private network')))
  })

  it('安监可以检查 Kubernetes 部署方案的安全性（正常流程）', () => {
    const plan = ctrl.generatePlan({ mode: 'kubernetes', size: 'medium' })
    // Kubernetes 部署应该有 TLS 配置
    assert.ok(plan.helmValues)
    assert.equal(plan.helmValues!.ingress.tls, true)
  })

  it('安监可以在部署前验证最小边界配置（边界）', () => {
    const result = ctrl.preflightCheck({
      cpu: '2 cores',
      memory: '4GB',
      storage: '100GB SSD',
      os: 'Ubuntu 22.04',
      privateNetwork: true,
      publicIP: true,
    })
    assert.equal(result.pass, true)
    assert.equal(result.errors.length, 0)
  })
})

// ──────────── 👔 店长：门店部署状态 ────────────
describe(`${ROLES.TenantAdmin} deploy 角色测试`, () => {
  let ctrl: DeployController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('店长可以查看门店部署方案（正常流程）', () => {
    const plan = ctrl.generatePlan({ mode: 'single', size: 'small' })
    const fetched = ctrl.getPlan(plan.planId)
    assert.equal(fetched.size, 'small')
    assert.equal(fetched.estimatedCost > 0, true)
    assert.ok(fetched.components.length > 0)
  })

  it('店长可以查看门店部署状态（正常流程）', async () => {
    const plan = ctrl.generatePlan({ mode: 'single', size: 'small' })
    const statusBefore = ctrl.getStatus(plan.planId)
    assert.equal(statusBefore.status, 'pending')

    await ctrl.deploy(plan.planId)
    const statusAfter = ctrl.getStatus(plan.planId)
    assert.equal(statusAfter.status, 'running')
  })

  it('店长可以估算月度成本（正常流程）', () => {
    const cost = ctrl.estimateMonthlyCost({ size: 'medium', mode: 'single' })
    assert.ok(cost.infrastructure > 0)
    assert.ok(cost.bandwidth > 0)
    assert.ok(cost.storage > 0)
    assert.equal(cost.total, cost.infrastructure + cost.bandwidth + cost.storage)
    assert.equal(cost.currency, 'CNY')
  })

  it('店长可以查看多模式成本对比（正常流程）', () => {
    const single = ctrl.estimateMonthlyCost({ size: 'medium', mode: 'single' })
    const cluster = ctrl.estimateMonthlyCost({ size: 'medium', mode: 'cluster' })
    const k8s = ctrl.estimateMonthlyCost({ size: 'medium', mode: 'kubernetes' })

    // 集群部署成本应高于单机
    assert.ok(cluster.total > single.total)
    // K8s 部署成本最高
    assert.ok(k8s.total > cluster.total)
  })

  it('店长可以生成报价单（正常流程）', () => {
    const quote = ctrl.generateQuote({ size: 'large', mode: 'cluster' })
    assert.ok(quote.planName.includes('大型'))
    assert.ok(quote.planName.includes('集群部署'))
    assert.ok(quote.items.length >= 3)
    assert.ok(quote.subtotal > 0)
    assert.ok(quote.tax > 0)
    assert.equal(quote.total, quote.subtotal + quote.tax)
    assert.ok(quote.validUntil > new Date())
  })
})

// ──────────── 👥 HR：部署资源规划 ────────────
describe(`${ROLES.HR} deploy 角色测试`, () => {
  let ctrl: DeployController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('HR 可以生成部署方案了解资源需求（正常流程）', () => {
    const plan = ctrl.generatePlan({ mode: 'single', size: 'small' })
    assert.equal(plan.serverSpec.cpu, '2 cores')
    assert.equal(plan.serverSpec.memory, '4GB')
    assert.equal(plan.serverSpec.storage, '100GB SSD')
  })

  it('HR 可以查看各种规模的部署方案（正常流程）', () => {
    const small = ctrl.generatePlan({ mode: 'single', size: 'small' })
    const medium = ctrl.generatePlan({ mode: 'single', size: 'medium' })
    const large = ctrl.generatePlan({ mode: 'single', size: 'large' })
    const xlarge = ctrl.generatePlan({ mode: 'single', size: 'xlarge' })

    // 成本随规模递增
    assert.ok(small.estimatedCost < medium.estimatedCost)
    assert.ok(medium.estimatedCost < large.estimatedCost)
    assert.ok(large.estimatedCost < xlarge.estimatedCost)
  })

  it('HR 可以查看报价单用于预算审批（正常流程）', () => {
    const quote = ctrl.generateQuote({ size: 'small', mode: 'single' })
    assert.ok(quote.planName.includes('小型'))
    assert.equal(quote.items.length, 3)
    assert.ok(quote.total > 0)
    assert.ok(quote.subtotal > 0)
  })

  it('HR 可以查看部署方案详细信息了解技术岗位需求（正常流程）', () => {
    const plan = ctrl.generatePlan({ mode: 'kubernetes', size: 'medium' })
    // K8s 方案包含更多组件，对人员技能要求更高
    assert.ok(plan.helmValues)
    assert.ok(plan.kubernetesManifests)
    // 组件中包含基础设施组件
    assert.ok(plan.components.includes('API'))
    assert.ok(plan.components.includes('Web'))
  })
})

// ──────────── 🛒 前台：部署状态查询 ────────────
describe(`${ROLES.Reception} deploy 角色测试`, () => {
  let ctrl: DeployController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('前台可以查看门店系统是否在线（正常流程）', async () => {
    const plan = ctrl.generatePlan({ mode: 'single', size: 'small' })
    const statusBefore = ctrl.getStatus(plan.planId)
    assert.equal(statusBefore.status, 'pending')

    await ctrl.deploy(plan.planId)
    const statusAfter = ctrl.getStatus(plan.planId)
    assert.equal(statusAfter.status, 'running')
  })

  it('前台可以查看部署方案的基本信息（正常流程）', () => {
    const plan = ctrl.generatePlan({ mode: 'single', size: 'medium' })
    const fetched = ctrl.getPlan(plan.planId)
    assert.ok(fetched.components.length >= 5)
    // 前台关心门店前台系统是否包含在内
    assert.ok(fetched.components.includes('API') || fetched.components.includes('Web'))
  })

  it('前台查询不存在的部署方案应报错（反例）', () => {
    assert.throws(
      () => ctrl.getPlan('nonexistent-plan-id'),
      /不存在/,
    )
  })

  it('前台查看未部署的方案状态应为 pending（边界）', () => {
    const plan = ctrl.generatePlan({ mode: 'single', size: 'small' })
    const status = ctrl.getStatus(plan.planId)
    assert.equal(status.status, 'pending')
  })
})

// ──────────── 🎮 导玩员：部署方案浏览 ────────────
describe(`${ROLES.Guide} deploy 角色测试`, () => {
  let ctrl: DeployController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('导玩员可以查看部署方案了解系统组成（正常流程）', () => {
    const plan = ctrl.generatePlan({ mode: 'single', size: 'medium' })
    assert.ok(plan.components.includes('Web'))
    assert.ok(plan.components.includes('API'))
    assert.equal(plan.setupTime, 30)
  })

  it('导玩员可以查看不同模式部署的时间预估（正常流程）', () => {
    const single = ctrl.generatePlan({ mode: 'single', size: 'small' })
    const cluster = ctrl.generatePlan({ mode: 'cluster', size: 'small' })
    const k8s = ctrl.generatePlan({ mode: 'kubernetes', size: 'small' })

    assert.equal(single.setupTime, 30)
    assert.equal(cluster.setupTime, 60)
    assert.equal(k8s.setupTime, 120)
  })

  it('导玩员可以查看部署方案中的资源规格（正常流程）', () => {
    const plan = ctrl.generatePlan({ mode: 'single', size: 'large' })
    assert.ok(plan.serverSpec.cpu)
    assert.ok(plan.serverSpec.memory)
    assert.ok(plan.serverSpec.storage)
    // 大型方案有较高的资源配置
    assert.equal(plan.serverSpec.cpu, '8 cores')
  })

  it('导玩员无法执行部署操作（使用无效 planId 应抛错）（反例）', async () => {
    await expect(ctrl.deploy('invalid-plan-id')).rejects.toThrow(/not found/)
  })
})

// ──────────── 🤝 团建：多环境与协作部署 ────────────
describe(`${ROLES.Teambuilding} deploy 角色测试`, () => {
  let ctrl: DeployController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('团建可以生成小规模部署方案用于活动系统（正常流程）', () => {
    const plan = ctrl.generatePlan({ mode: 'single', size: 'small' })
    assert.equal(plan.size, 'small')
    assert.equal(plan.estimatedCost, 449) // 299 + 100 + 50
    // 小规模适合活动临时使用
    assert.ok(plan.components.every(c => c))
  })

  it('团建可以查看各模式报价用于活动预算（正常流程）', () => {
    const singleQuote = ctrl.generateQuote({ size: 'small', mode: 'single' })
    assert.ok(singleQuote.planName.includes('小型'))
    assert.ok(singleQuote.planName.includes('单机部署'))
    assert.equal(singleQuote.items.length, 3)

    const k8sQuote = ctrl.generateQuote({ size: 'small', mode: 'kubernetes' })
    assert.ok(k8sQuote.total > singleQuote.total)
  })

  it('团建可以查看带备份组的部署方案（正常流程）', () => {
    // 带备份选项的部署（通过 options 传入）
    const plan = ctrl.generatePlan({ mode: 'single', size: 'small', options: { enableBackup: true } })
    assert.ok(plan.components.includes('Backup'))
  })

  it('团建可以查看多区域大规模部署方案的成本（正常流程）', () => {
    const plan = ctrl.generatePlan({ mode: 'cluster', size: 'xlarge', options: { multiRegion: true } })
    assert.equal(plan.mode, 'cluster')
    assert.equal(plan.size, 'xlarge')
    assert.ok(plan.estimatedCost > 8000)

    const quote = ctrl.generateQuote({ size: 'xlarge', mode: 'cluster' })
    assert.ok(quote.planName.includes('超大型'))
    assert.ok(quote.planName.includes('集群部署'))
  })

  it('团建查看报价单的有效期应包含未来日期（边界）', () => {
    const quote = ctrl.generateQuote({ size: 'medium', mode: 'single' })
    // 报价单有效期为30天
    const thirtyDaysLater = new Date()
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)
    // 有效期最早到今天+30
    assert.ok(quote.validUntil >= thirtyDaysLater)
  })
})

// ──────────── 📢 营销：部署成本与页面 ────────────
describe(`${ROLES.Marketing} deploy 角色测试`, () => {
  let ctrl: DeployController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('营销可以查看单机部署的中型方案报价（正常流程）', () => {
    const quote = ctrl.generateQuote({ size: 'medium', mode: 'single' })
    assert.ok(quote.planName.includes('中型'))
    assert.ok(quote.planName.includes('单机部署'))
    assert.equal(quote.items.length, 3)
    const expectedSubtotal = 599 + 200 + 100
    assert.equal(quote.subtotal, expectedSubtotal)
    assert.equal(quote.tax, Math.round(expectedSubtotal * 0.06 * 100) / 100)
    assert.equal(quote.total, quote.subtotal + quote.tax)
  })

  it('营销可以对比不同模式部署成本用于活动方案决策（正常流程）', () => {
    const singleCost = ctrl.estimateMonthlyCost({ size: 'medium', mode: 'single' })
    const clusterCost = ctrl.estimateMonthlyCost({ size: 'medium', mode: 'cluster' })
    const k8sCost = ctrl.estimateMonthlyCost({ size: 'medium', mode: 'kubernetes' })

    assert.equal(singleCost.currency, 'CNY')
    assert.equal(clusterCost.currency, 'CNY')
    assert.equal(k8sCost.currency, 'CNY')

    // 成本随复杂度递增
    assert.ok(singleCost.total < clusterCost.total)
    assert.ok(clusterCost.total < k8sCost.total)
  })

  it('营销可以查看部署方案了解营销页面组件（正常流程）', () => {
    const plan = ctrl.generatePlan({ mode: 'single', size: 'medium' })
    // Web 组件对应营销页面部署
    assert.ok(plan.components.includes('Web'))
    // 中型方案有合理配置
    assert.equal(plan.serverSpec.cpu, '4 cores')
    assert.equal(plan.serverSpec.memory, '8GB')
  })

  it('营销可以查看 Kubernetes 方案确认 Ingress 和 TLS 配置（正常流程）', () => {
    const plan = ctrl.generatePlan({ mode: 'kubernetes', size: 'medium' })
    assert.ok(plan.helmValues)
    // ingress 已启用并配置 TLS
    assert.equal(plan.helmValues!.ingress.enabled, true)
    assert.equal(plan.helmValues!.ingress.host, 'api.example.com')
    assert.equal(plan.helmValues!.ingress.tls, true)
  })

  it('营销查看不支持的部署模式组合仍能正常返回（边界）', () => {
    // 所有 mode/size 组合都应有效
    const modes = ['single', 'cluster', 'kubernetes'] as const
    const sizes = ['small', 'medium', 'large', 'xlarge'] as const
    for (const mode of modes) {
      for (const size of sizes) {
        const plan = ctrl.generatePlan({ mode, size })
        assert.equal(plan.mode, mode)
        assert.equal(plan.size, size)
        assert.ok(plan.estimatedCost > 0)
      }
    }
  })
})
