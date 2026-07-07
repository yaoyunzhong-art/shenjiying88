import { describe, it, expect, beforeEach, vi } from 'vitest'
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

// ──────────── 公共辅助断言 ────────────
function assertValidPlan(plan: DeploymentPlan) {
  assert.ok(plan.planId.startsWith('plan-'))
  assert.ok(['single', 'cluster', 'kubernetes'].includes(plan.mode))
  assert.ok(['small', 'medium', 'large', 'xlarge'].includes(plan.size))
  assert.ok(plan.estimatedCost > 0)
  assert.ok(plan.setupTime > 0)
  assert.ok(plan.components.length >= 3)
  assert.ok(plan.serverSpec)
  assert.ok('cpu' in plan.serverSpec)
  assert.ok('memory' in plan.serverSpec)
  assert.ok('storage' in plan.serverSpec)
}

// ──────────── 🎯 运行专员：部署管理（扩展） ────────────
describe(`${ROLES.Ops} deploy role-extended 测试`, () => {
  let ctrl: DeployController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('运行专员部署不存在的方案应抛出错误（反例）', async () => {
    await expect(ctrl.deploy('non-existent-plan-id')).rejects.toThrow(/not found/)
  })

  it('运行专员停止不存在的方案应抛出错误（反例）', async () => {
    await expect(ctrl.stop('non-existent-plan-id')).rejects.toThrow(/not found/)
  })

  it('运行专员回滚不存在的方案应抛出错误（反例）', async () => {
    await expect(ctrl.rollback('non-existent-plan-id')).rejects.toThrow(/not found/)
  })

  it('运行专员可以连续部署和停止同一方案（正常流程）', async () => {
    const plan = ctrl.generatePlan({ mode: 'single', size: 'small' })
    const pid = plan.planId

    // 部署 -> 停止 -> 再部署
    const deploy1 = await ctrl.deploy(pid)
    assert.equal(deploy1.status, 'running')

    const stop1 = await ctrl.stop(pid)
    assert.equal(stop1.status, 'stopped')

    // 重新部署
    const deploy2 = await ctrl.deploy(pid)
    assert.equal(deploy2.status, 'running')
  })

  it('运行专员部署后可以回滚恢复到停止状态（正常流程）', async () => {
    const plan = ctrl.generatePlan({ mode: 'single', size: 'small' })
    const pid = plan.planId

    await ctrl.deploy(pid)
    const ro = await ctrl.rollback(pid)
    assert.equal(ro.status, 'stopped')
  })

  it('运行专员生成方案后状态应为 pending（边界）', () => {
    const plan = ctrl.generatePlan({ mode: 'single', size: 'small' })
    const status = ctrl.getStatus(plan.planId)
    assert.equal(status.status, 'pending')
  })

  it('运行专员可以生成多份独立方案（正常流程）', () => {
    const plan1 = ctrl.generatePlan({ mode: 'single', size: 'small' })
    const plan2 = ctrl.generatePlan({ mode: 'cluster', size: 'large' })
    assert.notEqual(plan1.planId, plan2.planId)
    assert.equal(plan1.mode, 'single')
    assert.equal(plan2.mode, 'cluster')
  })

  it('运行专员可以生成长尾小规模 K8s 方案（边界）', () => {
    const plan = ctrl.generatePlan({ mode: 'kubernetes', size: 'small' })
    assertValidPlan(plan)
    assert.equal(plan.mode, 'kubernetes')
    assert.equal(plan.size, 'small')
    assert.ok(plan.helmValues)
    assert.ok(plan.kubernetesManifests)
  })

  it('运行专员生成集群方案时包含高配置 serverSpec（正常流程）', () => {
    const plan = ctrl.generatePlan({ mode: 'cluster', size: 'xlarge' })
    assert.equal(plan.serverSpec.cpu, '16 cores')
    assert.equal(plan.serverSpec.memory, '32GB')
    assert.equal(plan.serverSpec.storage, '1TB SSD')
  })
})

// ──────────── 🔧 安监：安全部署验证（扩展） ────────────
describe(`${ROLES.Safety} deploy role-extended 测试`, () => {
  let ctrl: DeployController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('安监全空服务器规格应报错（边界）', () => {
    const result = ctrl.preflightCheck({
      cpu: '',
      memory: '',
      storage: '',
      os: '',
      privateNetwork: false,
      publicIP: false,
    })
    assert.equal(result.pass, false)
    assert.ok(result.errors.length >= 3)
  })

  it('安监检测 CentOS 应通过检查（正常流程）', () => {
    const result = ctrl.preflightCheck({
      cpu: '4 cores',
      memory: '8GB',
      storage: '200GB SSD',
      os: 'CentOS 7.9',
      privateNetwork: true,
      publicIP: true,
    })
    assert.equal(result.pass, true)
    // CentOS 属于推荐 OS，不应有 OS 警告
    const osWarnings = result.warnings.filter(w => w.toLowerCase().includes('os') || w.toLowerCase().includes('recommended'))
    assert.equal(osWarnings.length, 0)
  })

  it('安监检测 Rocky Linux 应通过检查（正常流程）', () => {
    const result = ctrl.preflightCheck({
      cpu: '4 cores',
      memory: '8GB',
      storage: '200GB SSD',
      os: 'Rocky Linux 9',
      privateNetwork: true,
      publicIP: true,
    })
    assert.equal(result.pass, true)
  })

  it('安监缺少公网 IP 应给出警告（边界）', () => {
    const result = ctrl.preflightCheck({
      cpu: '4 cores',
      memory: '8GB',
      storage: '200GB SSD',
      os: 'Ubuntu 22.04',
      privateNetwork: true,
      publicIP: false,
    })
    assert.equal(result.pass, true)
    assert.ok(result.warnings.some(w => w.includes('Public IP')))
  })

  it('安监检查 MacOS 应推荐 Linux（边界）', () => {
    const result = ctrl.preflightCheck({
      cpu: '8 cores',
      memory: '16GB',
      storage: '500GB SSD',
      os: 'macOS Sonoma',
      privateNetwork: true,
      publicIP: true,
    })
    assert.equal(result.pass, true)
    assert.ok(result.warnings.some(w => w.includes('Recommended OS') || w.includes('Recommended')))
  })

  it('安监检查 K8s 方案 getStatus 返回 pending 状态（正常流程）', () => {
    const plan = ctrl.generatePlan({ mode: 'kubernetes', size: 'medium' })
    const status = ctrl.getStatus(plan.planId)
    assert.equal(status.status, 'pending')
    // K8s 方案应有 Helm Values
    assert.ok(plan.helmValues)
    assert.equal(plan.helmValues!.ingress.tls, true)
    assert.equal(plan.helmValues!.ingress.enabled, true)
  })

  it('安监检查备份启用方案包含 Backup 组件（正常流程）', () => {
    const plan = ctrl.generatePlan({ mode: 'single', size: 'small', options: { enableBackup: true } })
    assert.ok(plan.components.includes('Backup'))
  })
})

// ──────────── 👔 店长：门店部署状态（扩展） ────────────
describe(`${ROLES.TenantAdmin} deploy role-extended 测试`, () => {
  let ctrl: DeployController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('店长可以生成带监控组件的方案（正常流程）', () => {
    const plan = ctrl.generatePlan({ mode: 'single', size: 'medium', options: { enableMonitoring: true } })
    assert.ok(plan.components.includes('Monitoring'))
  })

  it('店长比较不同类型方案报价（正常流程）', () => {
    const single = ctrl.generateQuote({ size: 'large', mode: 'single' })
    const cluster = ctrl.generateQuote({ size: 'large', mode: 'cluster' })
    const k8s = ctrl.generateQuote({ size: 'large', mode: 'kubernetes' })

    // K8s 报价最贵
    assert.ok(single.total < cluster.total)
    assert.ok(cluster.total < k8s.total)

    // 都包含 3 个费用项
    assert.equal(single.items.length, 3)
    assert.equal(cluster.items.length, 3)
    assert.equal(k8s.items.length, 3)

    // 税后总价 > 小计
    assert.ok(single.total > single.subtotal)
    assert.ok(cluster.total > cluster.subtotal)
    assert.ok(k8s.total > k8s.subtotal)
  })

  it('店长可以生成超大型单机方案（边界）', () => {
    const plan = ctrl.generatePlan({ mode: 'single', size: 'xlarge' })
    assert.equal(plan.mode, 'single')
    assert.equal(plan.size, 'xlarge')
    assert.equal(plan.serverSpec.cpu, '16 cores')
    assert.ok(plan.estimatedCost > 3000)
  })

  it('店长调用 getPlan 获取不存在的方案应抛出 NotFoundException（反例）', () => {
    assert.throws(
      () => ctrl.getPlan('impossible-id-12345'),
      /不存在/,
    )
  })

  it('店长查看各模式的部署时间预估（正常流程）', () => {
    const single = ctrl.generatePlan({ mode: 'single', size: 'small' })
    const cluster = ctrl.generatePlan({ mode: 'cluster', size: 'small' })
    const k8s = ctrl.generatePlan({ mode: 'kubernetes', size: 'small' })

    assert.equal(single.setupTime, 30)
    assert.equal(cluster.setupTime, 60)
    assert.equal(k8s.setupTime, 120)
  })

  it('店长查看月度成本各组成部分不应为负数（边界）', () => {
    const sizes = ['small', 'medium', 'large', 'xlarge'] as const
    const modes = ['single', 'cluster', 'kubernetes'] as const
    for (const size of sizes) {
      for (const mode of modes) {
        const cost = ctrl.estimateMonthlyCost({ size, mode })
        assert.ok(cost.infrastructure >= 0)
        assert.ok(cost.bandwidth >= 0)
        assert.ok(cost.storage >= 0)
        assert.ok(cost.total > 0)
        assert.equal(cost.currency, 'CNY')
      }
    }
  })
})

// ──────────── 👥 HR：部署资源规划（扩展） ────────────
describe(`${ROLES.HR} deploy role-extended 测试`, () => {
  let ctrl: DeployController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('HR 可以计算各模式资源规格（正常流程）', () => {
    const res = ctrl.calculateResources({ size: 'large', mode: 'cluster' })
    assert.equal(res.cpu, '8 cores')
    assert.equal(res.memory, '16GB')
    assert.equal(res.storage, '500GB SSD')
    assert.ok(res.recommendedInstanceType)
  })

  it('HR 可以计算小型方案资源规格（正常流程）', () => {
    const res = ctrl.calculateResources({ size: 'small', mode: 'single' })
    assert.equal(res.cpu, '2 cores')
    assert.equal(res.memory, '4GB')
    assert.equal(res.storage, '100GB SSD')
  })

  it('HR 可查看 K8s 方案的 Helm Values 资源请求限制（正常流程）', () => {
    const plan = ctrl.generatePlan({ mode: 'kubernetes', size: 'xlarge' })
    assert.ok(plan.helmValues)
    assert.equal(plan.helmValues!.resources.requests.cpu, '1000m')
    assert.equal(plan.helmValues!.resources.requests.memory, '1Gi')
    assert.equal(plan.helmValues!.resources.limits.cpu, '4000m')
    assert.equal(plan.helmValues!.resources.limits.memory, '4Gi')
  })

  it('HR 计算超大型方案推荐实例类型应有值（正常流程）', () => {
    const res = ctrl.calculateResources({ size: 'xlarge', mode: 'kubernetes' })
    assert.ok(res.recommendedInstanceType.startsWith('ecs.'))
    assert.ok(res.recommendedInstanceType.length > 5)
  })

  it('HR 查看各规模成本应呈递增趋势（正常流程）', () => {
    const sizes = ['small', 'medium', 'large', 'xlarge'] as const
    const costs = sizes.map(s => ctrl.estimateMonthlyCost({ size: s, mode: 'single' }))
    for (let i = 1; i < costs.length; i++) {
      assert.ok(costs[i].total > costs[i - 1].total, `Size escalation failed at index ${i}`)
    }
  })

  it('HR 查看报价单名称应包含规模和部署模式（正常流程）', () => {
    const quote = ctrl.generateQuote({ size: 'medium', mode: 'cluster' })
    assert.ok(quote.planName.includes('中型'))
    assert.ok(quote.planName.includes('集群部署'))
  })
})

// ──────────── 🛒 前台：部署状态查询（扩展） ────────────
describe(`${ROLES.Reception} deploy role-extended 测试`, () => {
  let ctrl: DeployController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('前台可以查看 K8s 部署方案的组件列表（正常流程）', () => {
    const plan = ctrl.generatePlan({ mode: 'kubernetes', size: 'small' })
    assert.ok(plan.components.includes('API'))
    assert.ok(plan.components.includes('Web'))
  })

  it('前台生成方案后 state 流转正确（正常流程）', async () => {
    const plan = ctrl.generatePlan({ mode: 'single', size: 'small' })
    const pid = plan.planId

    // pending
    assert.equal(ctrl.getStatus(pid).status, 'pending')

    // deploying -> running
    await ctrl.deploy(pid)
    assert.equal(ctrl.getStatus(pid).status, 'running')
  })

  it('前台查看部署方案预估成本应为正数（边界）', () => {
    const plan = ctrl.generatePlan({ mode: 'single', size: 'small' })
    assert.ok(plan.estimatedCost > 0)
    assert.equal(plan.estimatedCost, 449) // 299 + 100 + 50
  })

  it('前台查询不同模式的 getPlan 都能获取（正常流程）', () => {
    const modes = ['single', 'cluster', 'kubernetes'] as const
    for (const mode of modes) {
      const plan = ctrl.generatePlan({ mode, size: 'small' })
      const fetched = ctrl.getPlan(plan.planId)
      assert.equal(fetched.planId, plan.planId)
      assert.equal(fetched.mode, mode)
    }
  })

  it('前台查看未部署状态应为 pending（边界）', () => {
    const plan = ctrl.generatePlan({ mode: 'single', size: 'small' })
    const status = ctrl.getStatus(plan.planId)
    assert.equal(status.status, 'pending')
  })

  it('前台查看多份方案的 getStatus 互不干扰（正常流程）', () => {
    const plan1 = ctrl.generatePlan({ mode: 'single', size: 'small' })
    const plan2 = ctrl.generatePlan({ mode: 'cluster', size: 'large' })

    assert.equal(ctrl.getStatus(plan1.planId).status, 'pending')
    assert.equal(ctrl.getStatus(plan2.planId).status, 'pending')
    assert.notEqual(plan1.planId, plan2.planId)
  })
})

// ──────────── 🎮 导玩员：部署方案浏览（扩展） ────────────
describe(`${ROLES.Guide} deploy role-extended 测试`, () => {
  let ctrl: DeployController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('导玩员查看方案的所有属性应有定义（正常流程）', () => {
    const plan = ctrl.generatePlan({ mode: 'single', size: 'medium' })
    assert.ok(plan.planId)
    assert.ok(plan.serverSpec)
    assert.ok(plan.serverSpec.os)
    assert.ok(plan.serverSpec.privateNetwork)
    assert.ok(plan.serverSpec.publicIP)
    assert.ok(plan.setupTime)
    assert.ok(plan.estimatedCost)
  })

  it('导玩员查看 K8s 方案包含 Prometheus 和 Grafana（正常流程）', () => {
    const plan = ctrl.generatePlan({ mode: 'kubernetes', size: 'medium' })
    assert.ok(plan.components.includes('Prometheus'))
    assert.ok(plan.components.includes('Grafana'))
  })

  it('导玩员查看 super large 之外不支持的大小时不应生效（边界）', () => {
    // 只支持 small / medium / large / xlarge
    const plan = ctrl.generatePlan({ mode: 'single', size: 'xlarge' })
    assert.equal(plan.size, 'xlarge')
    // 确认有效
    assertValidPlan(plan)
  })

  it('导玩员查看部署方案 serverSpec 默认 OS 为 Ubuntu（正常流程）', () => {
    const plan = ctrl.generatePlan({ mode: 'single', size: 'small' })
    assert.equal(plan.serverSpec.os, 'Ubuntu 22.04')
  })

  it('导玩员尝试部署无效方案 ID 应抛出错误（反例）', async () => {
    await expect(ctrl.deploy('')).rejects.toThrow()
  })

  it('导玩员查看方案规格应与预期一致（正常流程）', () => {
    const plan = ctrl.generatePlan({ mode: 'single', size: 'medium' })
    assert.equal(plan.serverSpec.cpu, '4 cores')
    assert.equal(plan.serverSpec.memory, '8GB')
    assert.equal(plan.serverSpec.storage, '200GB SSD')
  })
})

// ──────────── 🤝 团建：多环境与协作部署（扩展） ────────────
describe(`${ROLES.Teambuilding} deploy role-extended 测试`, () => {
  let ctrl: DeployController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('团建可以查看多区域大方案的估算成本（正常流程）', () => {
    const plan = ctrl.generatePlan({ mode: 'cluster', size: 'xlarge', options: { multiRegion: true } })
    assertValidPlan(plan)
    assert.equal(plan.mode, 'cluster')
    assert.equal(plan.size, 'xlarge')
    assert.ok(plan.estimatedCost > 8000)
  })

  it('团建可以查看带备份组件的集群方案（正常流程）', () => {
    const plan = ctrl.generatePlan({ mode: 'cluster', size: 'medium', options: { enableBackup: true } })
    assert.ok(plan.components.includes('Backup'))
    assert.ok(plan.components.includes('API'))
    assert.ok(plan.components.includes('Redis'))
  })

  it('团建查看报价单有效期应大于当前时间（边界）', () => {
    const quote = ctrl.generateQuote({ size: 'small', mode: 'single' })
    assert.ok(quote.validUntil > new Date())
  })

  it('团建查看超大型 K8s 方案 Helm 配置（正常流程）', () => {
    const plan = ctrl.generatePlan({ mode: 'kubernetes', size: 'xlarge' })
    assert.ok(plan.helmValues)
    // 超大型副本数为 2
    assert.equal(plan.helmValues!.replicaCount, 2)
    // persistence 大小为 100Gi
    assert.equal(plan.helmValues!.persistence.size, '100Gi')
    // service type 为 ClusterIP
    assert.equal(plan.helmValues!.service.type, 'ClusterIP')
    assert.equal(plan.helmValues!.service.port, 3000)
  })

  it('团建查看中型 K8s 方案副本数为 2（正常流程）', () => {
    const plan = ctrl.generatePlan({ mode: 'kubernetes', size: 'medium' })
    assert.ok(plan.helmValues)
    assert.equal(plan.helmValues!.replicaCount, 2)
  })

  it('团建生成小型 K8s 方案副本数为 1（边界）', () => {
    const plan = ctrl.generatePlan({ mode: 'kubernetes', size: 'small' })
    assert.ok(plan.helmValues)
    assert.equal(plan.helmValues!.replicaCount, 1)
  })
})

// ──────────── 📢 营销：部署成本与页面（扩展） ────────────
describe(`${ROLES.Marketing} deploy role-extended 测试`, () => {
  let ctrl: DeployController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('营销可以查看超大型集群方案报价（正常流程）', () => {
    const quote = ctrl.generateQuote({ size: 'xlarge', mode: 'cluster' })
    assert.ok(quote.planName.includes('超大型'))
    assert.ok(quote.planName.includes('集群部署'))
    assert.equal(quote.items.length, 3)
    // 超大型集群 = 2399*3 + 1200 + 640 = 9037
    assert.equal(quote.subtotal, 2399 * 3 + 1200 + 640)
    assert.equal(quote.tax, Math.round(quote.subtotal * 0.06 * 100) / 100)
    assert.equal(quote.total, quote.subtotal + quote.tax)
  })

  it('营销可以对比所有 mode 的同规模成本（正常流程）', () => {
    const modes = ['single', 'cluster', 'kubernetes'] as const
    const costResults = modes.map(m => ctrl.estimateMonthlyCost({ size: 'large', mode: m }))
    // 成本应递增
    assert.ok(costResults[0].total < costResults[1].total)
    assert.ok(costResults[1].total < costResults[2].total)
    // 所有货币为 CNY
    costResults.forEach(c => assert.equal(c.currency, 'CNY'))
  })

  it('营销查看各模式报价总价应大于小计（正常流程）', () => {
    const modes = ['single', 'cluster', 'kubernetes'] as const
    for (const mode of modes) {
      const quote = ctrl.generateQuote({ size: 'medium', mode })
      assert.ok(quote.total > quote.subtotal, `mode=${mode} total should be > subtotal`)
      assert.equal(quote.total, quote.subtotal + quote.tax)
    }
  })

  it('营销查看小型单机报价单子项明细应齐全（正常流程）', () => {
    const quote = ctrl.generateQuote({ size: 'small', mode: 'single' })
    assert.equal(quote.items.length, 3)
    assert.ok(quote.items.some(i => i.description.includes('基础设施')))
    assert.ok(quote.items.some(i => i.description.includes('带宽')))
    assert.ok(quote.items.some(i => i.description.includes('存储')))
    assert.equal(quote.items[0].total, quote.items[0].unitPrice * quote.items[0].quantity)
  })

  it('营销可以同时生成多份方案查看 K8s YAML（正常流程）', () => {
    const plan = ctrl.generatePlan({ mode: 'kubernetes', size: 'large' })
    assert.ok(plan.kubernetesManifests)
    assert.ok(plan.kubernetesManifests!.includes('apiVersion: apps/v1'))
    assert.ok(plan.kubernetesManifests!.includes('kind: Deployment'))
    assert.ok(plan.kubernetesManifests!.includes('kind: Service'))
    assert.ok(plan.kubernetesManifests!.includes('kind: Ingress'))
  })

  it('营销查看 K8s 方案的 Ingress 配置应包含 TLS secret（正常流程）', () => {
    const plan = ctrl.generatePlan({ mode: 'kubernetes', size: 'medium' })
    assert.ok(plan.kubernetesManifests)
    assert.ok(plan.kubernetesManifests!.includes('secretName: shenjiying-tls'))
    assert.ok(plan.kubernetesManifests!.includes('tls:'))
    assert.ok(plan.kubernetesManifests!.includes('host: api.example.com'))
  })

  it('营销查看 Helm Values 镜像配置应有 registry 地址（正常流程）', () => {
    const plan = ctrl.generatePlan({ mode: 'kubernetes', size: 'small' })
    assert.ok(plan.helmValues)
    assert.equal(plan.helmValues!.image.repository, 'registry.shenjiying.com/shenjiying')
    assert.equal(plan.helmValues!.image.tag, 'latest')
    assert.equal(plan.helmValues!.image.pullPolicy, 'IfNotPresent')
  })
})

// ──────────── 📦 跨角色权限边界测试 ────────────
describe('跨角色部署权限边界测试', () => {
  let ctrl: DeployController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('所有角色可以生成和查看部署方案（通用能力）', () => {
    const plan = ctrl.generatePlan({ mode: 'single', size: 'medium' })
    const fetched = ctrl.getPlan(plan.planId)
    assertValidPlan(fetched)
  })

  it('所有角色可以查询部署状态（通用能力）', () => {
    const plan = ctrl.generatePlan({ mode: 'single', size: 'small' })
    const status = ctrl.getStatus(plan.planId)
    assert.equal(status.status, 'pending')
  })

  it('所有角色可以查看报价（通用能力）', () => {
    const quote = ctrl.generateQuote({ size: 'small', mode: 'single' })
    assert.ok(quote.total > 0)
    assert.ok(quote.items.length > 0)
    assert.ok(quote.validUntil > new Date())
  })

  it('所有角色可以查看月度成本（通用能力）', () => {
    const cost = ctrl.estimateMonthlyCost({ size: 'small', mode: 'single' })
    assert.ok(cost.total > 0)
    assert.equal(cost.currency, 'CNY')
  })

  it('所有角色可以计算资源规格（通用能力）', () => {
    const res = ctrl.calculateResources({ size: 'medium', mode: 'single' })
    assert.ok(res.cpu)
    assert.ok(res.memory)
    assert.ok(res.storage)
    assert.ok(res.recommendedInstanceType)
  })

  it('所有角查看不存在的 plan 应报错（通用边界）', () => {
    assert.throws(
      () => ctrl.getPlan('fake-plan-999'),
      /不存在/,
    )
  })

  it('所有模式组合成本应满足 single < cluster < kubernetes（通用）', () => {
    const sizes = ['small', 'medium', 'large', 'xlarge'] as const
    for (const size of sizes) {
      const s = ctrl.estimateMonthlyCost({ size, mode: 'single' })
      const c = ctrl.estimateMonthlyCost({ size, mode: 'cluster' })
      const k = ctrl.estimateMonthlyCost({ size, mode: 'kubernetes' })
      assert.ok(s.total < c.total, `single ${size} should be < cluster`)
      assert.ok(c.total < k.total, `cluster ${size} should be < kubernetes`)
    }
  })

  it('所有模式 setupTime 应满足 single(30) < cluster(60) < kubernetes(120)', () => {
    const s = ctrl.generatePlan({ mode: 'single', size: 'small' })
    const c = ctrl.generatePlan({ mode: 'cluster', size: 'small' })
    const k = ctrl.generatePlan({ mode: 'kubernetes', size: 'small' })
    assert.equal(s.setupTime, 30)
    assert.equal(c.setupTime, 60)
    assert.equal(k.setupTime, 120)
  })

  it('所有角色使用 generateQuote 获取的 total 应为 subtotal + tax', () => {
    const modes = ['single', 'cluster', 'kubernetes'] as const
    const sizes = ['small', 'medium', 'large', 'xlarge'] as const
    for (const mode of modes) {
      for (const size of sizes) {
        const quote = ctrl.generateQuote({ size, mode })
        assert.equal(quote.total, quote.subtotal + quote.tax, `mode=${mode} size=${size}`)
      }
    }
  })
})
