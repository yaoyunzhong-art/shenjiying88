// deploy.entity.test.ts · 部署模块实体测试
// 🐜 自动: [deploy] [A] entity补全

import { describe, it, expect } from 'vitest'
import type {
  DeploymentMode,
  DeploymentStatus,
  ResourceSize,
  ServerSpec,
  HelmValues,
  DeploymentPlan,
  MonthlyCost,
  QuoteItem,
  DeploymentQuote,
  PreflightCheckResult,
  ResourceSpec,
  DeployOptions,
} from './deploy.entity'

describe('ServerSpec entity', () => {
  it('should create a valid ServerSpec', () => {
    const spec: ServerSpec = {
      cpu: '4 cores',
      memory: '8GB',
      storage: '200GB SSD',
      os: 'Ubuntu 22.04',
      privateNetwork: true,
      publicIP: true,
    }

    expect(spec.cpu).toBe('4 cores')
    expect(spec.memory).toBe('8GB')
    expect(spec.privateNetwork).toBe(true)
    expect(spec.publicIP).toBe(true)
  })

  it('should allow minimal ServerSpec', () => {
    const spec: ServerSpec = {
      cpu: '2 cores',
      memory: '4GB',
      storage: '50GB',
      os: 'CentOS 9',
      privateNetwork: false,
      publicIP: false,
    }

    expect(spec.publicIP).toBe(false)
    expect(spec.storage).toBe('50GB')
  })
})

describe('HelmValues entity', () => {
  it('should create a valid HelmValues', () => {
    const hv: HelmValues = {
      image: {
        repository: 'myapp/api',
        tag: '1.0.0',
        pullPolicy: 'Always',
      },
      replicaCount: 3,
      resources: {
        requests: { cpu: '500m', memory: '512Mi' },
        limits: { cpu: '1', memory: '1Gi' },
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
      env: { NODE_ENV: 'production' },
      persistence: {
        enabled: true,
        storageClass: 'gp2',
        size: '10Gi',
      },
    }

    expect(hv.image.repository).toBe('myapp/api')
    expect(hv.replicaCount).toBe(3)
    expect(hv.service.type).toBe('ClusterIP')
    expect(hv.ingress.enabled).toBe(true)
    expect(hv.persistence.size).toBe('10Gi')
  })

  it('should accept ingress without annotations', () => {
    const hv: HelmValues = {
      image: { repository: 'app', tag: 'latest', pullPolicy: 'IfNotPresent' },
      replicaCount: 1,
      resources: { requests: { cpu: '100m', memory: '128Mi' }, limits: { cpu: '200m', memory: '256Mi' } },
      service: { type: 'NodePort', port: 80 },
      ingress: { enabled: false, host: '', tls: false },
      env: {},
      persistence: { enabled: false, size: '' },
    }

    expect(hv.replicaCount).toBe(1)
    expect(hv.ingress.enabled).toBe(false)
  })
})

describe('DeploymentPlan entity', () => {
  it('should create a valid DeploymentPlan', () => {
    const plan: DeploymentPlan = {
      planId: 'plan-abc123',
      mode: 'single',
      size: 'medium',
      serverSpec: { cpu: '4 cores', memory: '8GB', storage: '200GB SSD', os: 'Ubuntu 22.04', privateNetwork: true, publicIP: true },
      estimatedCost: 250.00,
      setupTime: 30,
      components: ['API', 'Web', 'MySQL', 'Redis', 'Nginx'],
    }

    expect(plan.planId).toBe('plan-abc123')
    expect(plan.mode).toBe('single')
    expect(plan.estimatedCost).toBe(250.00)
    expect(plan.components).toContain('Redis')
  })

  it('should support kubernetes mode with helmValues', () => {
    const plan: DeploymentPlan = {
      planId: 'plan-k8s-001',
      mode: 'kubernetes',
      size: 'large',
      serverSpec: { cpu: '8 cores', memory: '16GB', storage: '500GB SSD', os: 'Ubuntu 22.04', privateNetwork: true, publicIP: true },
      estimatedCost: 1500.00,
      setupTime: 120,
      components: ['API', 'Web', 'MySQL/RDS', 'Redis/ElastiCache', 'Nginx Ingress', 'Prometheus', 'Grafana'],
      helmValues: {
        image: { repository: 'myapp/api', tag: '2.0.0', pullPolicy: 'Always' },
        replicaCount: 5,
        resources: { requests: { cpu: '1', memory: '1Gi' }, limits: { cpu: '2', memory: '2Gi' } },
        service: { type: 'LoadBalancer', port: 443 },
        ingress: { enabled: true, host: 'api.prod.com', tls: true },
        env: { NODE_ENV: 'production', LOG_LEVEL: 'info' },
        persistence: { enabled: true, storageClass: 'ebs-gp3', size: '100Gi' },
      },
      kubernetesManifests: 'apiVersion: v1\nkind: Service\n...',
    }

    expect(plan.helmValues).toBeDefined()
    expect(plan.helmValues!.replicaCount).toBe(5)
    expect(plan.kubernetesManifests).toContain('apiVersion: v1')
  })
})

describe('MonthlyCost entity', () => {
  it('should create a valid MonthlyCost', () => {
    const cost: MonthlyCost = {
      infrastructure: 200.00,
      bandwidth: 50.00,
      storage: 30.00,
      total: 280.00,
      currency: 'USD',
    }

    expect(cost.total).toBe(cost.infrastructure + cost.bandwidth + cost.storage)
    expect(cost.currency).toBe('USD')
  })

  it('should support different currencies', () => {
    const cost: MonthlyCost = {
      infrastructure: 1500,
      bandwidth: 200,
      storage: 100,
      total: 1800,
      currency: 'CNY',
    }

    expect(cost.currency).toBe('CNY')
    expect(cost.total).toBe(1800)
  })
})

describe('DeploymentQuote entity', () => {
  it('should create a valid DeploymentQuote with items', () => {
    const items: QuoteItem[] = [
      { description: '云服务器 ECS', unitPrice: 0.5, quantity: 2, total: 1.0 },
      { description: '云数据库 RDS', unitPrice: 1.0, quantity: 1, total: 1.0 },
    ]

    const quote: DeploymentQuote = {
      planName: '标准部署方案',
      items,
      subtotal: 2.0,
      tax: 0.2,
      total: 2.2,
      validUntil: new Date('2026-12-31'),
    }

    expect(quote.items).toHaveLength(2)
    expect(quote.subtotal).toBe(2.0)
    expect(quote.total).toBe(2.2)
  })

  it('should calculate total correctly', () => {
    const quote: DeploymentQuote = {
      planName: '大型集群方案',
      items: [
        { description: 'Server', unitPrice: 1000, quantity: 3, total: 3000 },
        { description: 'Storage', unitPrice: 500, quantity: 2, total: 1000 },
      ],
      subtotal: 4000,
      tax: 400,
      total: 4400,
      validUntil: new Date('2026-06-30'),
    }

    expect(quote.total).toBe(quote.subtotal + quote.tax)
    expect(quote.validUntil).toBeInstanceOf(Date)
  })
})

describe('PreflightCheckResult entity', () => {
  it('should create a passing preflight result', () => {
    const result: PreflightCheckResult = {
      pass: true,
      warnings: [],
      errors: [],
    }

    expect(result.pass).toBe(true)
    expect(result.warnings).toHaveLength(0)
  })

  it('should create a failing preflight result with errors', () => {
    const result: PreflightCheckResult = {
      pass: false,
      warnings: ['Storage not SSD'],
      errors: ['CPU cores < 2', 'Memory < 4GB'],
    }

    expect(result.pass).toBe(false)
    expect(result.errors).toHaveLength(2)
    expect(result.warnings).toHaveLength(1)
  })
})

describe('ResourceSpec entity', () => {
  it('should create a valid ResourceSpec', () => {
    const spec: ResourceSpec = {
      cpu: '8 cores',
      memory: '32GB',
      storage: '500GB SSD',
      recommendedInstanceType: 'ecs.g7.2xlarge',
    }

    expect(spec.recommendedInstanceType).toBe('ecs.g7.2xlarge')
  })
})

describe('DeployOptions entity', () => {
  it('should allow partial DeployOptions', () => {
    const opts: DeployOptions = {
      enableSSL: true,
    }

    expect(opts.enableSSL).toBe(true)
    expect(opts.enableCDN).toBeUndefined()
  })

  it('should support all options', () => {
    const opts: DeployOptions = {
      enableSSL: true,
      enableCDN: true,
      enableMonitoring: true,
      enableBackup: true,
      multiRegion: true,
    }

    expect(opts.enableSSL).toBe(true)
    expect(opts.enableCDN).toBe(true)
    expect(opts.enableBackup).toBe(true)
    expect(opts.multiRegion).toBe(true)
  })
})
