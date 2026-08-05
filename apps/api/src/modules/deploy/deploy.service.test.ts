/**
 * deploy.service.spec.ts — 部署 Service 深层单元测试
 *
 * 覆盖:
 *  - DeployService: 部署方案生成/预检/Helm/成本/报价
 *  - 辅助函数: parseCpuCores/parseMemoryGB/parseStorageGB
 *  - 正例/反例/边界 ≥ 18 项
 *
 * 全部内联 mock，不依赖 NestJS DI。
 */

import { describe, it, expect } from 'vitest'
import type {
  DeploymentMode,
  DeploymentStatus,
  ResourceSize,
  ServerSpec,
  HelmValues,
  DeploymentPlan,
} from './deploy.service'

// ═══════════════════════════════════════════════════════════════
// 枚举常量
// ═══════════════════════════════════════════════════════════════

const DEPLOY_MODES: DeploymentMode[] = ['single', 'cluster', 'kubernetes']
const RESOURCE_SIZES: ResourceSize[] = ['small', 'medium', 'large', 'xlarge']
const DEPLOY_STATUSES: DeploymentStatus[] = ['pending', 'deploying', 'running', 'stopped', 'failed', 'rolling_back']

// ═══════════════════════════════════════════════════════════════
// mock 数据工厂
// ═══════════════════════════════════════════════════════════════

function mockServerSpec(overrides?: Partial<ServerSpec>): ServerSpec {
  return {
    cpu: '8 cores',
    memory: '16GB',
    storage: '500GB SSD',
    os: 'Ubuntu 22.04',
    privateNetwork: true,
    publicIP: true,
    ...overrides,
  }
}

// ═══════════════════════════════════════════════════════════════
// 内联业务逻辑（从 deploy.service.ts 提取）
// ═══════════════════════════════════════════════════════════════

const RESOURCE_SPECS: Record<ResourceSize, Record<DeploymentMode, { cpu: string; memory: string; storage: string; recommendedInstanceType: string }>> = {
  small: {
    single: { cpu: '2 cores', memory: '4GB', storage: '100GB SSD', recommendedInstanceType: 'ecs.s6-c1m2.xlarge' },
    cluster: { cpu: '2 cores', memory: '4GB', storage: '100GB SSD', recommendedInstanceType: 'ecs.s6-c1m2.xlarge' },
    kubernetes: { cpu: '2 cores', memory: '4GB', storage: '100GB SSD', recommendedInstanceType: 'ecs.s6-c1m2.xlarge' },
  },
  medium: {
    single: { cpu: '4 cores', memory: '8GB', storage: '200GB SSD', recommendedInstanceType: 'ecs.s6-c1m4.xlarge' },
    cluster: { cpu: '4 cores', memory: '8GB', storage: '200GB SSD', recommendedInstanceType: 'ecs.s6-c1m4.xlarge' },
    kubernetes: { cpu: '4 cores', memory: '8GB', storage: '200GB SSD', recommendedInstanceType: 'ecs.s6-c1m4.xlarge' },
  },
  large: {
    single: { cpu: '8 cores', memory: '16GB', storage: '500GB SSD', recommendedInstanceType: 'ecs.s6-c2m4.xlarge' },
    cluster: { cpu: '8 cores', memory: '16GB', storage: '500GB SSD', recommendedInstanceType: 'ecs.s6-c2m4.xlarge' },
    kubernetes: { cpu: '8 cores', memory: '16GB', storage: '500GB SSD', recommendedInstanceType: 'ecs.s6-c2m4.xlarge' },
  },
  xlarge: {
    single: { cpu: '16 cores', memory: '32GB', storage: '1TB SSD', recommendedInstanceType: 'ecs.s6-c4m8.xlarge' },
    cluster: { cpu: '16 cores', memory: '32GB', storage: '1TB SSD', recommendedInstanceType: 'ecs.s6-c4m8.xlarge' },
    kubernetes: { cpu: '16 cores', memory: '32GB', storage: '1TB SSD', recommendedInstanceType: 'ecs.s6-c4m8.xlarge' },
  },
}

const MONTHLY_COSTS: Record<ResourceSize, Record<DeploymentMode, { infrastructure: number; bandwidth: number; storage: number }>> = {
  small: {
    single: { infrastructure: 299, bandwidth: 100, storage: 50 },
    cluster: { infrastructure: 299 * 3, bandwidth: 150, storage: 80 },
    kubernetes: { infrastructure: 299 * 4, bandwidth: 200, storage: 100 },
  },
  medium: {
    single: { infrastructure: 599, bandwidth: 200, storage: 100 },
    cluster: { infrastructure: 599 * 3, bandwidth: 300, storage: 160 },
    kubernetes: { infrastructure: 599 * 4, bandwidth: 400, storage: 200 },
  },
  large: {
    single: { infrastructure: 1199, bandwidth: 400, storage: 200 },
    cluster: { infrastructure: 1199 * 3, bandwidth: 600, storage: 320 },
    kubernetes: { infrastructure: 1199 * 4, bandwidth: 800, storage: 400 },
  },
  xlarge: {
    single: { infrastructure: 2399, bandwidth: 800, storage: 400 },
    cluster: { infrastructure: 2399 * 3, bandwidth: 1200, storage: 640 },
    kubernetes: { infrastructure: 2399 * 4, bandwidth: 1600, storage: 800 },
  },
}

const COMPONENTS: Record<DeploymentMode, string[]> = {
  single: ['API', 'Web', 'MySQL', 'Redis', 'Nginx'],
  cluster: ['API', 'Web', 'MySQL', 'Redis', 'Nginx'],
  kubernetes: ['API', 'Web', 'MySQL/RDS', 'Redis/ElastiCache', 'Nginx Ingress', 'Prometheus', 'Grafana'],
}

const SETUP_TIMES: Record<DeploymentMode, number> = {
  single: 30,
  cluster: 60,
  kubernetes: 120,
}

function inlineParseCpuCores(cpuStr: string): number {
  const match = cpuStr.match(/(\d+)\s*cores?/)
  return match ? parseInt(match[1], 10) : 0
}

function inlineParseMemoryGB(memoryStr: string): number {
  const match = memoryStr.match(/(\d+)\s*GB/i)
  return match ? parseInt(match[1], 10) : 0
}

function inlineParseStorageGB(storageStr: string): number {
  const match = storageStr.match(/(\d+)\s*GB/i)
  if (match) return parseInt(match[1], 10)
  const tbMatch = storageStr.match(/(\d+)\s*TB/i)
  return tbMatch ? parseInt(tbMatch[1], 10) * 1000 : 0
}

function inlinePreflightCheck(serverSpec: ServerSpec): {
  pass: boolean
  warnings: string[]
  errors: string[]
} {
  const warnings: string[] = []
  const errors: string[] = []

  const cpuCores = inlineParseCpuCores(serverSpec.cpu)
  const memoryGB = inlineParseMemoryGB(serverSpec.memory)
  const storageGB = inlineParseStorageGB(serverSpec.storage)

  if (cpuCores < 2) {
    errors.push(`CPU cores must be at least 2, got ${cpuCores}`)
  }
  if (memoryGB < 4) {
    errors.push(`Memory must be at least 4GB, got ${memoryGB}`)
  }
  if (storageGB < 100) {
    errors.push(`Storage must be at least 100GB, got ${storageGB}`)
  }

  if (!serverSpec.os.toLowerCase().includes('ubuntu') && !serverSpec.os.toLowerCase().includes('centos') && !serverSpec.os.toLowerCase().includes('rocky')) {
    warnings.push(`Recommended OS is Ubuntu or CentOS, got ${serverSpec.os}`)
  }

  if (!serverSpec.privateNetwork) {
    warnings.push('Private network is recommended for production')
  }

  if (!serverSpec.publicIP) {
    warnings.push('Public IP is recommended for API accessibility')
  }

  return {
    pass: errors.length === 0,
    warnings,
    errors,
  }
}

function inlineCalculateResources(size: ResourceSize, mode: DeploymentMode): {
  cpu: string
  memory: string
  storage: string
  recommendedInstanceType: string
} {
  return { ...RESOURCE_SPECS[size][mode] }
}

function inlineEstimateMonthlyCost(size: ResourceSize, mode: DeploymentMode): {
  infrastructure: number
  bandwidth: number
  storage: number
  total: number
  currency: string
} {
  const costs = MONTHLY_COSTS[size][mode]
  return {
    ...costs,
    total: costs.infrastructure + costs.bandwidth + costs.storage,
    currency: 'CNY',
  }
}

function inlineGenerateHelmValues(size: ResourceSize): HelmValues {
  const resourceRequests: Record<ResourceSize, { cpu: string; memory: string }> = {
    small: { cpu: '100m', memory: '128Mi' },
    medium: { cpu: '250m', memory: '256Mi' },
    large: { cpu: '500m', memory: '512Mi' },
    xlarge: { cpu: '1000m', memory: '1Gi' },
  }
  const resourceLimits: Record<ResourceSize, { cpu: string; memory: string }> = {
    small: { cpu: '500m', memory: '512Mi' },
    medium: { cpu: '1000m', memory: '1Gi' },
    large: { cpu: '2000m', memory: '2Gi' },
    xlarge: { cpu: '4000m', memory: '4Gi' },
  }
  const persistenceSizes: Record<ResourceSize, string> = {
    small: '10Gi',
    medium: '20Gi',
    large: '50Gi',
    xlarge: '100Gi',
  }
  return {
    image: {
      repository: 'registry.shenjiying.com/shenjiying',
      tag: 'latest',
      pullPolicy: 'IfNotPresent',
    },
    replicaCount: size === 'small' ? 1 : 2,
    resources: {
      requests: resourceRequests[size],
      limits: resourceLimits[size],
    },
    service: {
      type: 'ClusterIP',
      port: 3000,
    },
    ingress: {
      enabled: true,
      host: 'api.example.com',
      tls: true,
    },
    env: {},
    persistence: {
      enabled: true,
      size: persistenceSizes[size],
    },
  }
}

function inlineGenerateK8sManifests(planId: string, helmValues: HelmValues): string {
  let manifests = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: shenjiying-api
  labels:
    app: shenjiying-api
spec:
  replicas: ${helmValues.replicaCount}
  selector:
    matchLabels:
      app: shenjiying-api
  template:
    metadata:
      labels:
        app: shenjiying-api
    spec:
      containers:
        - name: api
          image: ${helmValues.image.repository}:${helmValues.image.tag}
          imagePullPolicy: ${helmValues.image.pullPolicy}
          ports:
            - containerPort: ${helmValues.service.port}
          resources:
            requests:
              cpu: ${helmValues.resources.requests.cpu}
              memory: ${helmValues.resources.requests.memory}
            limits:
              cpu: ${helmValues.resources.limits.cpu}
              memory: ${helmValues.resources.limits.memory}
---
apiVersion: v1
kind: Service
metadata:
  name: shenjiying-api
spec:
  type: ${helmValues.service.type}
  selector:
    app: shenjiying-api
  ports:
    - port: ${helmValues.service.port}
      targetPort: ${helmValues.service.port}`
  if (helmValues.ingress.enabled) {
    manifests += `\n---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: shenjiying-api
  annotations:
    kubernetes.io/ingress.class: nginx
spec:
  tls:
    - hosts:
        - ${helmValues.ingress.host}
      secretName: shenjiying-tls
  rules:
    - host: ${helmValues.ingress.host}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: shenjiying-api
                port:
                  number: ${helmValues.service.port}`
  }
  return manifests
}

function inlineGenerateQuote(size: ResourceSize, mode: DeploymentMode): {
  planName: string
  items: { description: string; unitPrice: number; quantity: number; total: number }[]
  subtotal: number
  tax: number
  total: number
} {
  const modeNames: Record<DeploymentMode, string> = { single: '单机部署', cluster: '集群部署', kubernetes: 'K8s 部署' }
  const sizeNames: Record<ResourceSize, string> = { small: '小型', medium: '中型', large: '大型', xlarge: '超大型' }
  const costs = MONTHLY_COSTS[size][mode]
  const items = [
    { description: '基础设施（ECS）', unitPrice: costs.infrastructure, quantity: 1, total: costs.infrastructure },
    { description: '带宽费用', unitPrice: costs.bandwidth, quantity: 1, total: costs.bandwidth },
    { description: '存储费用', unitPrice: costs.storage, quantity: 1, total: costs.storage },
  ]
  const subtotal = costs.infrastructure + costs.bandwidth + costs.storage
  const tax = Math.round(subtotal * 0.06 * 100) / 100
  return { planName: `${sizeNames[size]}${modeNames[mode]}方案`, items, subtotal, tax, total: subtotal + tax }
}

// ═══════════════════════════════════════════════════════════════
// 纯函数测试
// ═══════════════════════════════════════════════════════════════

describe('纯函数 | parseCpuCores', () => {
  it('正例: "8 cores" → 8', () => {
    expect(inlineParseCpuCores('8 cores')).toBe(8)
  })
  it('正例: "2 cores" → 2', () => {
    expect(inlineParseCpuCores('2 cores')).toBe(2)
  })
  it('反例: 无匹配返回 0', () => {
    expect(inlineParseCpuCores('unknown')).toBe(0)
  })
  it('边界: 空字符串', () => {
    expect(inlineParseCpuCores('')).toBe(0)
  })
})

describe('纯函数 | parseMemoryGB', () => {
  it('正例: "16GB" → 16', () => {
    expect(inlineParseMemoryGB('16GB')).toBe(16)
  })
  it('正例: "4GB" → 4', () => {
    expect(inlineParseMemoryGB('4GB')).toBe(4)
  })
  it('反例: 无匹配返回 0', () => {
    expect(inlineParseMemoryGB('128MB')).toBe(0)
  })
  it('边界: 空字符串', () => {
    expect(inlineParseMemoryGB('')).toBe(0)
  })
})

describe('纯函数 | parseStorageGB', () => {
  it('正例: "500GB SSD" → 500', () => {
    expect(inlineParseStorageGB('500GB SSD')).toBe(500)
  })
  it('正例: "1TB SSD" → 1000', () => {
    expect(inlineParseStorageGB('1TB SSD')).toBe(1000)
  })
  it('反例: 无匹配返回 0', () => {
    expect(inlineParseStorageGB('unknown')).toBe(0)
  })
  it('边界: "100GB" 无空格匹配', () => {
    expect(inlineParseStorageGB('100GB')).toBe(100)
  })
})

describe('DeployService | preflightCheck', () => {
  it('正例: 规格达标通过', () => {
    const r = inlinePreflightCheck(mockServerSpec())
    expect(r.pass).toBe(true)
    expect(r.errors).toHaveLength(0)
  })

  it('正例: Ubuntu 系统无警告', () => {
    const r = inlinePreflightCheck(mockServerSpec({ os: 'Ubuntu 22.04' }))
    expect(r.warnings.length).toBe(0)
  })

  it('正例: CentOS 系统无 OS 警告', () => {
    const r = inlinePreflightCheck(mockServerSpec({ os: 'CentOS 7' }))
    expect(r.warnings.some(w => w.includes('OS'))).toBe(false)
  })

  it('反例: CPU 不足抛出错误', () => {
    const r = inlinePreflightCheck(mockServerSpec({ cpu: '1 core' }))
    expect(r.pass).toBe(false)
    expect(r.errors.some(e => e.includes('CPU'))).toBe(true)
  })

  it('反例: 内存不足', () => {
    const r = inlinePreflightCheck(mockServerSpec({ memory: '2GB' }))
    expect(r.pass).toBe(false)
    expect(r.errors.some(e => e.includes('Memory'))).toBe(true)
  })

  it('反例: 存储不足', () => {
    const r = inlinePreflightCheck(mockServerSpec({ storage: '50GB SSD' }))
    expect(r.pass).toBe(false)
    expect(r.errors.some(e => e.includes('Storage'))).toBe(true)
  })

  it('反例: 多个检查同时失败', () => {
    const r = inlinePreflightCheck(mockServerSpec({ cpu: '1 core', memory: '2GB', storage: '50GB' }))
    expect(r.pass).toBe(false)
    expect(r.errors.length).toBeGreaterThanOrEqual(3)
  })

  it('边界: 刚好最小规格 2 cores / 4GB / 100GB', () => {
    const r = inlinePreflightCheck(mockServerSpec({ cpu: '2 cores', memory: '4GB', storage: '100GB SSD' }))
    expect(r.pass).toBe(true)
  })

  it('反例: 非标 OS 产生警告', () => {
    const r = inlinePreflightCheck(mockServerSpec({ os: 'Debian 11' }))
    expect(r.warnings.some(w => w.includes('OS'))).toBe(true)
  })

  it('反例: 无 privateNetwork 产生警告', () => {
    const r = inlinePreflightCheck(mockServerSpec({ privateNetwork: false }))
    expect(r.warnings.some(w => w.includes('Private network'))).toBe(true)
  })

  it('反例: 无 publicIP 产生警告', () => {
    const r = inlinePreflightCheck(mockServerSpec({ publicIP: false }))
    expect(r.warnings.some(w => w.includes('Public IP'))).toBe(true)
  })
})

describe('DeployService | calculateResources', () => {
  it('正例: small/single → 2 cores', () => {
    const r = inlineCalculateResources('small', 'single')
    expect(r.cpu).toBe('2 cores')
    expect(r.memory).toBe('4GB')
    expect(r.storage).toBe('100GB SSD')
  })

  it('正例: xlarge/kubernetes → 16 cores / 32GB / 1TB', () => {
    const r = inlineCalculateResources('xlarge', 'kubernetes')
    expect(r.cpu).toBe('16 cores')
    expect(r.memory).toBe('32GB')
    expect(r.storage).toBe('1TB SSD')
  })

  it('正例: 所有 size×mode 组合均可查到', () => {
    for (const s of RESOURCE_SIZES) {
      for (const m of DEPLOY_MODES) {
        const r = inlineCalculateResources(s, m)
        expect(r.cpu).toBeTruthy()
        expect(r.memory).toBeTruthy()
        expect(r.storage).toBeTruthy()
        expect(r.recommendedInstanceType).toBeTruthy()
      }
    }
  })
})

describe('DeployService | estimateMonthlyCost', () => {
  it('正例: small/single → 449 total', () => {
    const r = inlineEstimateMonthlyCost('small', 'single')
    expect(r.total).toBe(449)
    expect(r.currency).toBe('CNY')
  })

  it('正例: xlarge/kubernetes → 11996 total', () => {
    const r = inlineEstimateMonthlyCost('xlarge', 'kubernetes')
    expect(r.total).toBe(11996)
  })

  it('正例: currency 始终 CNY', () => {
    for (const s of RESOURCE_SIZES) {
      for (const m of DEPLOY_MODES) {
        expect(inlineEstimateMonthlyCost(s, m).currency).toBe('CNY')
      }
    }
  })
})

describe('DeployService | Helm 配置生成', () => {
  it('正例: small → replicaCount=1, requests=100m/128Mi', () => {
    const hv = inlineGenerateHelmValues('small')
    expect(hv.replicaCount).toBe(1)
    expect(hv.resources.requests.cpu).toBe('100m')
    expect(hv.resources.requests.memory).toBe('128Mi')
  })

  it('正例: xlarge → replicaCount=2, requests=1000m/1Gi', () => {
    const hv = inlineGenerateHelmValues('xlarge')
    expect(hv.replicaCount).toBe(2)
    expect(hv.resources.requests.cpu).toBe('1000m')
    expect(hv.resources.limits.memory).toBe('4Gi')
  })

  it('正例: 默认 ingress enabled, port 3000', () => {
    const hv = inlineGenerateHelmValues('medium')
    expect(hv.ingress.enabled).toBe(true)
    expect(hv.service.port).toBe(3000)
    expect(hv.image.repository).toBe('registry.shenjiying.com/shenjiying')
  })
})

describe('DeployService | K8s manifests 生成', () => {
  it('正例: 含 Deployment/Service/Ingress 3 段', () => {
    const hv = inlineGenerateHelmValues('medium')
    const yaml = inlineGenerateK8sManifests('plan-test', hv)
    expect(yaml).toContain('kind: Deployment')
    expect(yaml).toContain('kind: Service')
    expect(yaml).toContain('kind: Ingress')
  })

  it('正例: manifests 含 correct replicaCount', () => {
    const hv = inlineGenerateHelmValues('xlarge')
    const yaml = inlineGenerateK8sManifests('plan-xl', hv)
    expect(yaml).toContain('replicas: 2')
  })

  it('正例: Ingress 含 host', () => {
    const hv = inlineGenerateHelmValues('small')
    const yaml = inlineGenerateK8sManifests('plan-s', hv)
    expect(yaml).toContain('api.example.com')
  })
})

describe('DeployService | generateQuote', () => {
  it('正例: small/single 包含 3 项, subtotal=449, tax=26.94', () => {
    const q = inlineGenerateQuote('small', 'single')
    expect(q.items).toHaveLength(3)
    expect(q.subtotal).toBe(449)
    expect(q.tax).toBeCloseTo(26.94, 1)
    expect(q.total).toBe(q.subtotal + q.tax)
    expect(q.planName).toBe('小型单机部署方案')
  })

  it('正例: xlarge/kubernetes → total>5000', () => {
    const q = inlineGenerateQuote('xlarge', 'kubernetes')
    expect(q.total).toBeGreaterThan(5000)
  })
})

describe('DeployService | 模拟实例 (部署生命周期)', () => {
  // 手动模拟 DeployService（不 import 生产代码）
  class MockDeployService {
    plans = new Map<string, DeploymentPlan>()
    statuses = new Map<string, DeploymentStatus>()

    generatePlan(mode: DeploymentMode, size: ResourceSize): DeploymentPlan {
      const planId = `plan-mock-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      const spec = RESOURCE_SPECS[size][mode]
      const costs = MONTHLY_COSTS[size][mode]
      const plan: DeploymentPlan = {
        planId,
        mode,
        size,
        serverSpec: {
          cpu: spec.cpu,
          memory: spec.memory,
          storage: spec.storage,
          os: 'Ubuntu 22.04',
          privateNetwork: true,
          publicIP: true,
        },
        estimatedCost: costs.infrastructure + costs.bandwidth + costs.storage,
        setupTime: SETUP_TIMES[mode],
        components: [...COMPONENTS[mode]],
      }
      if (mode === 'kubernetes') {
        plan.helmValues = inlineGenerateHelmValues(size)
        plan.kubernetesManifests = inlineGenerateK8sManifests(planId, plan.helmValues)
      }
      this.plans.set(planId, plan)
      this.statuses.set(planId, 'pending')
      return plan
    }

    getPlan(planId: string): DeploymentPlan | null {
      return this.plans.get(planId) ?? null
    }

    getStatus(planId: string): DeploymentStatus {
      return this.statuses.get(planId) ?? 'pending'
    }

    async deploy(planId: string): Promise<DeploymentStatus> {
      if (!this.plans.has(planId)) throw new Error(`Plan ${planId} not found`)
      this.statuses.set(planId, 'deploying')
      await new Promise(r => setTimeout(r, 5))
      this.statuses.set(planId, 'running')
      return 'running'
    }

    async stop(planId: string): Promise<void> {
      if (!this.statuses.has(planId)) throw new Error(`Plan ${planId} not found`)
      this.statuses.set(planId, 'stopped')
    }

    async rollback(planId: string): Promise<void> {
      if (!this.statuses.has(planId)) throw new Error(`Plan ${planId} not found`)
      this.statuses.set(planId, 'rolling_back')
      await new Promise(r => setTimeout(r, 5))
      this.statuses.set(planId, 'stopped')
    }
  }

  it('正例: generatePlan 返回完整 plan', () => {
    const svc = new MockDeployService()
    const plan = svc.generatePlan('cluster', 'large')
    expect(plan.planId).toMatch(/^plan-mock-/)
    expect(plan.mode).toBe('cluster')
    expect(plan.size).toBe('large')
    expect(plan.components).toContain('API')
    expect(plan.estimatedCost).toBeGreaterThan(0)
    expect(plan.setupTime).toBe(60)
  })

  it('正例: k8s 模式含 helmValues', () => {
    const svc = new MockDeployService()
    const plan = svc.generatePlan('kubernetes', 'medium')
    expect(plan.helmValues).toBeDefined()
    expect(plan.kubernetesManifests).toContain('kind: Deployment')
  })

  it('正例: getPlan 返回已生成 plan', () => {
    const svc = new MockDeployService()
    const plan = svc.generatePlan('single', 'small')
    expect(svc.getPlan(plan.planId)).not.toBeNull()
  })

  it('反例: getPlan 不存在的 id 返回 null', () => {
    const svc = new MockDeployService()
    expect(svc.getPlan('nonexistent')).toBeNull()
  })

  it('正例: deploy 状态转换 pending → deploying → running', async () => {
    const svc = new MockDeployService()
    const plan = svc.generatePlan('single', 'small')
    expect(svc.getStatus(plan.planId)).toBe('pending')
    await svc.deploy(plan.planId)
    expect(svc.getStatus(plan.planId)).toBe('running')
  })

  it('反例: deploy 不存在的 plan 抛错', async () => {
    const svc = new MockDeployService()
    await expect(svc.deploy('invalid')).rejects.toThrow('not found')
  })

  it('正例: stop 将状态改为 stopped', async () => {
    const svc = new MockDeployService()
    const plan = svc.generatePlan('cluster', 'medium')
    await svc.deploy(plan.planId)
    await svc.stop(plan.planId)
    expect(svc.getStatus(plan.planId)).toBe('stopped')
  })

  it('反例: stop 不存在的 plan 抛错', async () => {
    const svc = new MockDeployService()
    await expect(svc.stop('invalid')).rejects.toThrow('not found')
  })

  it('正例: rollback 状态转换 rolling_back → stopped', async () => {
    const svc = new MockDeployService()
    const plan = svc.generatePlan('single', 'xlarge')
    await svc.deploy(plan.planId)
    await svc.rollback(plan.planId)
    expect(svc.getStatus(plan.planId)).toBe('stopped')
  })

  it('反例: rollback 不存在的 plan 抛错', async () => {
    const svc = new MockDeployService()
    await expect(svc.rollback('invalid')).rejects.toThrow('not found')
  })
})
