import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { DeployController } from './deploy.controller'
import { DeployService } from './deploy.service'
import type { DeploymentPlan } from './deploy.entity'

// ── 8 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 辅助函数 ──
function makeController(): DeployController {
  return new DeployController(new DeployService())
}

function genPlan(ctrl: DeployController, mode: 'single' | 'cluster' | 'kubernetes' = 'single', size: 'small' | 'medium' | 'large' | 'xlarge' = 'small'): DeploymentPlan {
  return ctrl.generatePlan({ mode, size })
}

// ── 场景 1: 👔店长 → 🎯运行专员 协同部署流程 ──
describe('👔店长 → 🎯运行专员 协同部署场景', () => {
  let ctrl: DeployController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('👔店长生成集群方案 → 🎯运行专员执行部署 → 状态流转正确', async () => {
    // Step 1: 店长生成方案
    const plan = ctrl.generatePlan({ mode: 'cluster', size: 'large' })
    assert.equal(plan.mode, 'cluster')
    assert.equal(plan.size, 'large')

    // Step 2: 运行专员检查前检查
    const preflight = ctrl.preflightCheck({
      cpu: plan.serverSpec.cpu,
      memory: plan.serverSpec.memory,
      storage: plan.serverSpec.storage,
      os: plan.serverSpec.os,
      privateNetwork: true,
      publicIP: true,
    })
    assert.equal(preflight.pass, true)

    // Step 3: 运行专员执行部署
    const deployResult = await ctrl.deploy(plan.planId)
    assert.equal(deployResult.status, 'running')

    // Step 4: 验证最终状态
    const status = ctrl.getStatus(plan.planId)
    assert.equal(status.status, 'running')
  })

  it('👔店长检查多方案成本 → 🎯运行专员选择性价比最优方案', () => {
    // 店长查看所有模式的报价
    const singleQuote = ctrl.generateQuote({ size: 'large', mode: 'single' })
    const clusterQuote = ctrl.generateQuote({ size: 'large', mode: 'cluster' })
    const k8sQuote = ctrl.generateQuote({ size: 'large', mode: 'kubernetes' })

    // 确认成本递增
    assert.ok(singleQuote.total < clusterQuote.total)
    assert.ok(clusterQuote.total < k8sQuote.total)

    // 店长选择集群方案，运行专员检查资源
    const plan = ctrl.generatePlan({ mode: 'cluster', size: 'large' })
    const resources = ctrl.calculateResources({ size: 'large', mode: 'cluster' })
    assert.equal(resources.cpu, '8 cores')
    assert.equal(resources.memory, '16GB')
    assert.equal(resources.storage, '500GB SSD')
  })
})

// ── 场景 2: 👔店长 → 🔧安监 安全与合规场景 ──
describe('👔店长 → 🔧安监 安全合规场景', () => {
  let ctrl: DeployController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('👔店长选择 K8s 方案 → 🔧安监验证 TLS 和 Ingress 配置', () => {
    const plan = ctrl.generatePlan({ mode: 'kubernetes', size: 'medium' })
    // 店长确认包含安全组件
    assert.ok(plan.components.includes('Nginx Ingress'))

    // 安监验证 TLS
    assert.ok(plan.helmValues)
    assert.equal(plan.helmValues!.ingress.tls, true)
    assert.equal(plan.helmValues!.ingress.enabled, true)

    // 安监检查 YAML 中包含 TLS secret
    assert.ok(plan.kubernetesManifests)
    assert.ok(plan.kubernetesManifests!.includes('secretName: shenjiying-tls'))
  })

  it('🔧安监发现非标准 OS 给出警告 → 👔店长确认后仍可继续', () => {
    const result = ctrl.preflightCheck({
      cpu: '8 cores',
      memory: '16GB',
      storage: '500GB SSD',
      os: 'Debian 12',
      privateNetwork: true,
      publicIP: true,
    })

    // 安监发现非推荐 OS
    assert.ok(result.warnings.some(w => w.includes('Recommended OS')))
    // 但通过检查
    assert.equal(result.pass, true)
  })

  it('🔧安监检测到不安全配置 → 阻止部署', () => {
    const result = ctrl.preflightCheck({
      cpu: '1 core',
      memory: '2GB',
      storage: '50GB',
      os: 'Windows Server',
      privateNetwork: false,
      publicIP: false,
    })

    assert.equal(result.pass, false)
    assert.ok(result.errors.length >= 3)
  })
})

// ── 场景 3: 🎮导玩员 → 🛒前台 → 👔店长 端到端部署体验 ──
describe('🎮导玩员 → 🛒前台 → 👔店长 端到端部署', () => {
  let ctrl: DeployController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('🎮导玩员浏览方案 → 🛒前台执行最小部署 → 👔店长确认上线', async () => {
    // 导玩员浏览方案
    const plan = genPlan(ctrl, 'single', 'small')
    assert.equal(plan.serverSpec.cpu, '2 cores')
    assert.equal(plan.setupTime, 30)

    // 前台执行部署
    const depResult = await ctrl.deploy(plan.planId)
    assert.equal(depResult.status, 'running')

    // 店长确认上线状态
    const finalStatus = ctrl.getStatus(plan.planId)
    assert.equal(finalStatus.status, 'running')
  })

  it('🎮导玩员生成 K8s 方案 → 🛒前台检查组件完整性', () => {
    const plan = genPlan(ctrl, 'kubernetes', 'medium')
    // 导玩员查看
    assert.ok(plan.components.includes('Prometheus'))
    assert.ok(plan.components.includes('Grafana'))

    // 前台确认基础组件齐全
    assert.ok(plan.components.includes('API'))
    assert.ok(plan.components.includes('Web'))

    // 前台确认有完整的 YAML
    assert.ok(plan.kubernetesManifests)
    assert.ok(plan.kubernetesManifests!.includes('apiVersion: apps/v1'))
  })

  it('🎮导玩员部署空 planId → 🛒前台收到错误（反例）', async () => {
    await expect(ctrl.deploy('')).rejects.toThrow()
  })
})

// ── 场景 4: 👥HR → 🎯运行专员 资源与成本规划 ──
describe('👥HR → 🎯运行专员 资源成本规划场景', () => {
  let ctrl: DeployController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('👥HR 规划团队资源 → 🎯运行专员按需求部署', () => {
    // HR 计算不同规模资源
    const smallRes = ctrl.calculateResources({ size: 'small', mode: 'single' })
    const mediumRes = ctrl.calculateResources({ size: 'medium', mode: 'cluster' })

    assert.equal(smallRes.cpu, '2 cores')
    assert.equal(mediumRes.cpu, '4 cores')

    // 运行专员按 HR 规划的中型方案部署
    const plan = ctrl.generatePlan({ mode: 'cluster', size: 'medium' })
    assert.equal(plan.serverSpec.cpu, '4 cores')
    assert.equal(plan.serverSpec.memory, '8GB')
    assert.equal(plan.estimatedCost, 599 * 3 + 300 + 160) // 2257
  })

  it('👥HR 查询各规模成本 → 🎯运行专员选择 budget 最优', () => {
    const costs = ['small', 'medium', 'large', 'xlarge'].map(
      s => ctrl.estimateMonthlyCost({ size: s as any, mode: 'single' })
    )
    // HR 验证递增
    for (let i = 1; i < costs.length; i++) {
      assert.ok(costs[i].total > costs[i - 1].total)
    }
    // 运行专员确定小规模成本最低
    assert.equal(costs[0].total, 299 + 100 + 50) // 449
  })

  it('👥HR 查看报价有效期 → 🎯运行专员确认 30 天有效', () => {
    const quote = ctrl.generateQuote({ size: 'medium', mode: 'single' })
    const expectedValidity = new Date()
    expectedValidity.setDate(expectedValidity.getDate() + 30)
    // 有效期在 30 天左右
    const diffMs = quote.validUntil.getTime() - new Date().getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    assert.ok(diffDays >= 29 && diffDays <= 31)
  })
})

// ── 场景 5: 📢营销 → 👔店长 → 🤝团建 促销与协作 ──
describe('📢营销 → 👔店长 → 🤝团建 促销协作场景', () => {
  let ctrl: DeployController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('📢营销生成报价单 → 👔店长确认 → 🤝团建使用多区域方案', () => {
    // 营销生成报价
    const quote = ctrl.generateQuote({ size: 'xlarge', mode: 'cluster' })
    assert.ok(quote.planName.includes('超大型'))
    assert.ok(quote.planName.includes('集群部署'))

    // 店长确认总价包含税
    assert.equal(quote.total, quote.subtotal + quote.tax)

    // 团建使用多区域方案
    const plan = ctrl.generatePlan({
      mode: 'cluster',
      size: 'xlarge',
      options: { multiRegion: true }
    })
    assert.ok(plan.estimatedCost > 8000)
  })

  it('📢营销展示各规模价格 → 👔店长选择最贵的 K8s → 成本最高', () => {
    const k8sQuote = ctrl.generateQuote({ size: 'xlarge', mode: 'kubernetes' })
    const singleQuote = ctrl.generateQuote({ size: 'xlarge', mode: 'single' })
    // K8s 比单机贵很多
    assert.ok(k8sQuote.total > singleQuote.total * 3)
  })
})

// ── 场景 6: 🔧安监 → 🎯运行专员 异常恢复场景 ──
describe('🔧安监 → 🎯运行专员 异常恢复场景', () => {
  let ctrl: DeployController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('🎯运行专员部署 → 发现异常 → 🔧安监要求回滚 → 🎯运行专员执行回滚', async () => {
    const plan = genPlan(ctrl, 'single', 'medium')
    const pid = plan.planId

    // 部署
    await ctrl.deploy(pid)
    assert.equal(ctrl.getStatus(pid).status, 'running')

    // 安监确认可以回滚
    const rollbackResult = await ctrl.rollback(pid)
    assert.equal(rollbackResult.status, 'stopped')
    assert.equal(ctrl.getStatus(pid).status, 'stopped')
  })

  it('🎯运行专员部署不存在的方案 → 🔧安监确认错误处理', async () => {
    await expect(ctrl.deploy('plan-nonexistent')).rejects.toThrow(/not found/)
    await expect(ctrl.rollback('plan-nonexistent')).rejects.toThrow(/not found/)
    await expect(ctrl.stop('plan-nonexistent')).rejects.toThrow(/not found/)
  })

  it('🎯运行专员部署后停止 → 🔧安监检查状态 → 🎯运行专员重新部署', async () => {
    const plan = genPlan(ctrl, 'cluster', 'large')
    const pid = plan.planId

    // 部署
    await ctrl.deploy(pid)
    assert.equal(ctrl.getStatus(pid).status, 'running')

    // 停止
    await ctrl.stop(pid)
    assert.equal(ctrl.getStatus(pid).status, 'stopped')

    // 安监确认已停止
    const safetyStatus = ctrl.getStatus(pid)
    assert.equal(safetyStatus.status, 'stopped')

    // 运行专员重新部署
    await ctrl.deploy(pid)
    assert.equal(ctrl.getStatus(pid).status, 'running')
  })
})

// ── 场景 7: 🎯运行专员 并发部署测试 ──
describe('🎯运行专员 并发部署场景', () => {
  let ctrl: DeployController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('🎯运行专员可以同时生成多份独立方案（无冲突）', () => {
    const plans = Array.from({ length: 10 }, (_, i) => {
      const sizes: Array<'small' | 'medium' | 'large' | 'xlarge'> = ['small', 'medium', 'large', 'xlarge']
      const modes: Array<'single' | 'cluster' | 'kubernetes'> = ['single', 'cluster', 'kubernetes']
      return ctrl.generatePlan({
        mode: modes[i % 3],
        size: sizes[i % 4],
      })
    })

    const ids = new Set(plans.map(p => p.planId))
    assert.equal(ids.size, 10, '所有 planId 必须唯一')
  })

  it('🎯运行专员并发部署多个方案互不干扰', async () => {
    const plan1 = genPlan(ctrl, 'single', 'small')
    const plan2 = genPlan(ctrl, 'single', 'medium')
    const plan3 = genPlan(ctrl, 'single', 'large')

    // 同时部署
    const results = await Promise.all([
      ctrl.deploy(plan1.planId),
      ctrl.deploy(plan2.planId),
      ctrl.deploy(plan3.planId),
    ])

    results.forEach(r => assert.equal(r.status, 'running'))

    // 各自独立状态
    assert.equal(ctrl.getStatus(plan1.planId).status, 'running')
    assert.equal(ctrl.getStatus(plan2.planId).status, 'running')
    assert.equal(ctrl.getStatus(plan3.planId).status, 'running')
  })

  it('🎯运行专员部署 10 个方案后全部可独立回滚', async () => {
    const plans = ['small', 'medium', 'large', 'xlarge'].flatMap(size =>
      ['single', 'cluster', 'kubernetes'].map(mode =>
        genPlan(ctrl, mode as any, size as any)
      )
    )

    // 全部部署
    await Promise.all(plans.map(p => ctrl.deploy(p.planId)))
    plans.forEach(p => assert.equal(ctrl.getStatus(p.planId).status, 'running'))

    // 全部回滚
    await Promise.all(plans.map(p => ctrl.rollback(p.planId)))
    plans.forEach(p => assert.equal(ctrl.getStatus(p.planId).status, 'stopped'))
  })
})

// ── 场景 8: 🎮导玩员 → 🎯运行专员 → 🤝团建 多方案比较与协作 ──
describe('🎮导玩员 → 🎯运行专员 → 🤝团建 多方案协作', () => {
  let ctrl: DeployController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('🎮导玩员浏览所有模式方案 → 🎯运行专员计算资源 → 🤝团建选择带备份的集群方案', () => {
    // 导玩员浏览
    const single = genPlan(ctrl, 'single', 'medium')
    const cluster = genPlan(ctrl, 'cluster', 'medium')
    const k8s = genPlan(ctrl, 'kubernetes', 'medium')

    // 运行专员检查资源
    assert.equal(single.serverSpec.cpu, '4 cores')
    assert.equal(cluster.serverSpec.cpu, '4 cores')

    // 团建选择带备份的集群方案
    const teamPlan = ctrl.generatePlan({
      mode: 'cluster',
      size: 'medium',
      options: { enableBackup: true }
    })
    assert.ok(teamPlan.components.includes('Backup'))
    assert.ok(teamPlan.components.includes('API'))
    assert.ok(teamPlan.components.includes('Redis'))
  })

  it('🤝团建需要多区域 → 🎯运行专员检查超大集群成本 → 总成本递增', () => {
    const plan = ctrl.generatePlan({
      mode: 'cluster',
      size: 'xlarge',
      options: { multiRegion: true }
    })
    assert.ok(plan.estimatedCost > 8000)

    const costs = ctrl.estimateMonthlyCost({ size: 'xlarge', mode: 'cluster' })
    assert.equal(costs.infrastructure, 2399 * 3)
    assert.equal(costs.total, 2399 * 3 + 1200 + 640)
  })
})

// ── 场景 9: 👔店长 经营决策测试（数据驱动） ──
describe('👔店长 经营决策场景', () => {
  let ctrl: DeployController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('👔店长应能在所有 mode/size 组合下生成有效方案', () => {
    const modes: Array<'single' | 'cluster' | 'kubernetes'> = ['single', 'cluster', 'kubernetes']
    const sizes: Array<'small' | 'medium' | 'large' | 'xlarge'> = ['small', 'medium', 'large', 'xlarge']

    for (const mode of modes) {
      for (const size of sizes) {
        const plan = ctrl.generatePlan({ mode, size })
        assert.ok(plan.planId.startsWith('plan-'), `mode=${mode} size=${size}`)
        assert.ok(plan.estimatedCost > 0, `cost for ${mode}/${size}`)
        assert.ok(plan.components.length >= 3, `components for ${mode}/${size}: ${plan.components.length}`)
        assert.ok(plan.serverSpec.cpu, `cpu for ${mode}/${size}`)
        assert.ok(plan.serverSpec.memory, `memory for ${mode}/${size}`)

        if (mode === 'kubernetes') {
          assert.ok(plan.helmValues, `helmValues for ${size}`)
          assert.ok(plan.kubernetesManifests, `k8s manifests for ${size}`)
        }
      }
    }
  })

  it('👔店长确认所有方案 serverSpec 默认 OS 为 Ubuntu', () => {
    const modes: Array<'single' | 'cluster' | 'kubernetes'> = ['single', 'cluster', 'kubernetes']
    const sizes: Array<'small' | 'medium' | 'large' | 'xlarge'> = ['small', 'medium', 'large', 'xlarge']

    for (const mode of modes) {
      for (const size of sizes) {
        const plan = ctrl.generatePlan({ mode, size })
        assert.equal(plan.serverSpec.os, 'Ubuntu 22.04', `mode=${mode} size=${size}`)
      }
    }
  })

  it('👔店长确认 K8s 方案各 size 的 replica 策略正确', () => {
    // small: 1 replica
    const smallPlan = ctrl.generatePlan({ mode: 'kubernetes', size: 'small' })
    assert.equal(smallPlan.helmValues!.replicaCount, 1)

    // medium: 2 replicas
    const mediumPlan = ctrl.generatePlan({ mode: 'kubernetes', size: 'medium' })
    assert.equal(mediumPlan.helmValues!.replicaCount, 2)

    // large: 2 replicas
    const largePlan = ctrl.generatePlan({ mode: 'kubernetes', size: 'large' })
    assert.equal(largePlan.helmValues!.replicaCount, 2)

    // xlarge: 2 replicas
    const xlargePlan = ctrl.generatePlan({ mode: 'kubernetes', size: 'xlarge' })
    assert.equal(xlargePlan.helmValues!.replicaCount, 2)
  })

  it('👔店长确认报价税后金额 = subtotal + 6% tax', () => {
    const modes: Array<'single' | 'cluster' | 'kubernetes'> = ['single', 'cluster', 'kubernetes']
    const sizes: Array<'small' | 'medium' | 'large' | 'xlarge'> = ['small', 'medium', 'large', 'xlarge']

    for (const mode of modes) {
      for (const size of sizes) {
        const quote = ctrl.generateQuote({ size, mode })
        assert.equal(quote.total, quote.subtotal + quote.tax, `mode=${mode} size=${size}`)
        assert.equal(quote.tax, Math.round(quote.subtotal * 0.06 * 100) / 100)
      }
    }
  })
})

// ── 场景 10: 🎯运行专员 错误处理与恢复测试 ──
describe('🎯运行专员 错误处理与恢复场景', () => {
  let ctrl: DeployController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('🎯运行专员获取不存在方案的状态 → 返回 pending', () => {
    const status = ctrl.getStatus('plan-not-exists')
    assert.equal(status.status, 'pending')
  })

  it('🎯运行专员获取不存在方案的详情 → 抛出错误', () => {
    assert.throws(() => ctrl.getPlan('plan-not-exists'), /不存在/)
  })

  it('🎯运行专员可以停止已部署方案后再部署', async () => {
    const plan = genPlan(ctrl, 'single', 'small')
    const pid = plan.planId

    await ctrl.deploy(pid)
    assert.equal(ctrl.getStatus(pid).status, 'running')

    await ctrl.stop(pid)
    assert.equal(ctrl.getStatus(pid).status, 'stopped')

    // 重新部署
    await ctrl.deploy(pid)
    assert.equal(ctrl.getStatus(pid).status, 'running')
  })

  it('🎯运行专员部署后立即停止 → 状态正确', async () => {
    const plan = genPlan(ctrl, 'cluster', 'medium')
    const pid = plan.planId

    await ctrl.deploy(pid)
    await ctrl.stop(pid)
    const status = ctrl.getStatus(pid)
    assert.equal(status.status, 'stopped')
  })
})

// ── 场景 11: 🎮导玩员 轻量级浏览场景 ──
describe('🎮导玩员 方案浏览场景', () => {
  let ctrl: DeployController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('🎮导玩员浏览方案应看到完整 serverSpec 属性', () => {
    const plan = genPlan(ctrl, 'single', 'medium')
    assert.ok(plan.serverSpec.os)
    assert.ok(plan.serverSpec.privateNetwork)
    assert.ok(plan.serverSpec.publicIP)
    assert.equal(typeof plan.setupTime, 'number')
    assert.equal(typeof plan.estimatedCost, 'number')
  })

  it('🎮导玩员查看小型方案 cost = 基础设施 + 带宽 + 存储', () => {
    const plan = genPlan(ctrl, 'single', 'small')
    assert.equal(plan.estimatedCost, 299 + 100 + 50)
  })

  it('🎮导玩员查看配置时 setupTime 应大于 0', () => {
    const plan = genPlan(ctrl, 'kubernetes', 'large')
    assert.ok(plan.setupTime > 0)
    assert.equal(plan.setupTime, 120)
  })
})

// ── 场景 12: 📢营销 报价单完整性场景 ──
describe('📢营销 报价单场景', () => {
  let ctrl: DeployController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('📢营销报价单应含 3 个费用明细项', () => {
    const modes: Array<'single' | 'cluster' | 'kubernetes'> = ['single', 'cluster', 'kubernetes']
    const sizes: Array<'small' | 'medium' | 'large' | 'xlarge'> = ['small', 'medium', 'large', 'xlarge']
    for (const mode of modes) {
      for (const size of sizes) {
        const quote = ctrl.generateQuote({ size, mode })
        assert.equal(quote.items.length, 3, `mode=${mode} size=${size}`)
        assert.ok(quote.items.some(i => i.description.includes('基础设施')))
        assert.ok(quote.items.some(i => i.description.includes('带宽')))
        assert.ok(quote.items.some(i => i.description.includes('存储')))
      }
    }
  })

  it('📢营销报价单 item total = unitPrice * quantity', () => {
    const quote = ctrl.generateQuote({ size: 'large', mode: 'kubernetes' })
    for (const item of quote.items) {
      assert.equal(item.total, item.unitPrice * item.quantity)
    }
  })

  it('📢营销各模式报价单名称包含对应中文描述', () => {
    const single = ctrl.generateQuote({ size: 'small', mode: 'single' })
    const cluster = ctrl.generateQuote({ size: 'small', mode: 'cluster' })
    const k8s = ctrl.generateQuote({ size: 'small', mode: 'kubernetes' })

    assert.ok(single.planName.includes('单机'))
    assert.ok(cluster.planName.includes('集群'))
    assert.ok(k8s.planName.includes('K8s'))
  })
})
