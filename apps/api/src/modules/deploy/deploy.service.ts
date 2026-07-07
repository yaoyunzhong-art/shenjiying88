export type DeploymentMode = 'single' | 'cluster' | 'kubernetes'
export type DeploymentStatus = 'pending' | 'deploying' | 'running' | 'stopped' | 'failed' | 'rolling_back'
export type ResourceSize = 'small' | 'medium' | 'large' | 'xlarge'

export interface ServerSpec {
  cpu: string           // e.g. "8 cores"
  memory: string        // e.g. "16GB"
  storage: string       // e.g. "500GB SSD"
  os: string            // e.g. "Ubuntu 22.04"
  privateNetwork: boolean
  publicIP: boolean
}

export interface HelmValues {
  image: {
    repository: string
    tag: string
    pullPolicy: 'Always' | 'IfNotPresent' | 'Never'
  }
  replicaCount: number
  resources: {
    requests: { cpu: string; memory: string }
    limits: { cpu: string; memory: string }
  }
  service: {
    type: 'ClusterIP' | 'NodePort' | 'LoadBalancer'
    port: number
  }
  ingress: {
    enabled: boolean
    host: string
    tls: boolean
    annotations?: Record<string, string>
  }
  env: Record<string, string>
  persistence: {
    enabled: boolean
    storageClass?: string
    size: string
  }
}

export interface DeploymentPlan {
  planId: string
  mode: DeploymentMode
  size: ResourceSize
  serverSpec: ServerSpec
  estimatedCost: number       // CNY/month
  setupTime: number           // minutes
  components: string[]        // 部署的组件列表
  helmValues?: HelmValues     // K8s 模式特有
  kubernetesManifests?: string // K8s 模式特有 YAML
}

// 资源规格映射表
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

// 月度成本估算（单位：CNY）
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

// 组件列表
const COMPONENTS: Record<DeploymentMode, string[]> = {
  single: ['API', 'Web', 'MySQL', 'Redis', 'Nginx'],
  cluster: ['API', 'Web', 'MySQL', 'Redis', 'Nginx'],
  kubernetes: ['API', 'Web', 'MySQL/RDS', 'Redis/ElastiCache', 'Nginx Ingress', 'Prometheus', 'Grafana'],
}

// 部署时间估算（分钟）
const SETUP_TIMES: Record<DeploymentMode, number> = {
  single: 30,
  cluster: 60,
  kubernetes: 120,
}

function generatePlanId(): string {
  return `plan-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
}

function parseCpuCores(cpuStr: string): number {
  const match = cpuStr.match(/(\d+)\s*cores?/)
  return match ? parseInt(match[1], 10) : 0
}

function parseMemoryGB(memoryStr: string): number {
  const match = memoryStr.match(/(\d+)\s*GB/i)
  return match ? parseInt(match[1], 10) : 0
}

function parseStorageGB(storageStr: string): number {
  const match = storageStr.match(/(\d+)\s*GB/i)
  if (match) return parseInt(match[1], 10)
  const tbMatch = storageStr.match(/(\d+)\s*TB/i)
  return tbMatch ? parseInt(tbMatch[1], 10) * 1000 : 0
}

export class DeployService {
  private readonly plans: Map<string, DeploymentPlan> = new Map()
  private readonly statuses: Map<string, DeploymentStatus> = new Map()

  // ── 部署方案生成 ──────────────────────────────────────────────────

  generatePlan(mode: DeploymentMode, size: ResourceSize, options?: {
    enableSSL?: boolean
    enableCDN?: boolean
    enableMonitoring?: boolean
    enableBackup?: boolean
    multiRegion?: boolean
  }): DeploymentPlan {
    const planId = generatePlanId()
    const resourceSpec = RESOURCE_SPECS[size][mode]
    const costs = MONTHLY_COSTS[size][mode]

    const components = [...COMPONENTS[mode]]
    if (options?.enableMonitoring && mode === 'kubernetes') {
      // Prometheus & Grafana already included in k8s components
    } else if (options?.enableMonitoring && mode !== 'kubernetes') {
      components.push('Monitoring')
    }
    if (options?.enableBackup) {
      components.push('Backup')
    }

    const plan: DeploymentPlan = {
      planId,
      mode,
      size,
      serverSpec: {
        cpu: resourceSpec.cpu,
        memory: resourceSpec.memory,
        storage: resourceSpec.storage,
        os: 'Ubuntu 22.04',
        privateNetwork: true,
        publicIP: true,
      },
      estimatedCost: costs.infrastructure + costs.bandwidth + costs.storage,
      setupTime: SETUP_TIMES[mode],
      components,
    }

    this.plans.set(planId, plan)
    this.statuses.set(planId, 'pending')

    if (mode === 'kubernetes') {
      plan.helmValues = this.generateHelmValues(planId)
      plan.kubernetesManifests = this.generateK8sManifests(planId)
    }

    return plan
  }

  getPlan(planId: string): DeploymentPlan | null {
    return this.plans.get(planId) ?? null
  }

  // ── 部署前检查 ────────────────────────────────────────────────────

  preflightCheck(serverSpec: ServerSpec): {
    pass: boolean
    warnings: string[]
    errors: string[]
  } {
    const warnings: string[] = []
    const errors: string[] = []

    const cpuCores = parseCpuCores(serverSpec.cpu)
    const memoryGB = parseMemoryGB(serverSpec.memory)
    const storageGB = parseStorageGB(serverSpec.storage)

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

  calculateResources(size: ResourceSize, mode: DeploymentMode): {
    cpu: string
    memory: string
    storage: string
    recommendedInstanceType: string
  } {
    const spec = RESOURCE_SPECS[size][mode]
    return { ...spec }
  }

  // ── Helm Chart 生成（Kubernetes 模式）────────────────────────────────

  generateHelmValues(planId: string): HelmValues {
    const plan = this.plans.get(planId)
    const size = plan?.size ?? 'medium'

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

  generateK8sManifests(planId: string): string {
    const plan = this.plans.get(planId)
    if (!plan) return ''

    const helmValues = plan.helmValues ?? this.generateHelmValues(planId)

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
      let ingressYAML = `---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: shenjiying-api
  annotations:
    kubernetes.io/ingress.class: nginx
`
      if (helmValues.ingress.annotations) {
        const annotationLines = Object.entries(helmValues.ingress.annotations)
          .map(([k, v]) => `    ${k}: "${v}"`)
          .join('\n')
        ingressYAML += annotationLines + '\n'
      }
      ingressYAML += `spec:
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
      manifests += '\n' + ingressYAML
    }

    return manifests
  }

  renderHelmTemplate(planId: string): string {
    return this.generateK8sManifests(planId)
  }

  // ── 部署执行（模拟）───────────────────────────────────────────────

  async deploy(planId: string): Promise<DeploymentStatus> {
    const plan = this.plans.get(planId)
    if (!plan) {
      throw new Error(`Plan ${planId} not found`)
    }

    this.statuses.set(planId, 'deploying')

    // Simulate async deployment process
    await new Promise((resolve) => setTimeout(resolve, 10))

    this.statuses.set(planId, 'running')
    return 'running'
  }

  async stop(planId: string): Promise<void> {
    const status = this.statuses.get(planId)
    if (!status) {
      throw new Error(`Plan ${planId} not found`)
    }
    this.statuses.set(planId, 'stopped')
  }

  async rollback(planId: string): Promise<void> {
    const status = this.statuses.get(planId)
    if (!status) {
      throw new Error(`Plan ${planId} not found`)
    }
    this.statuses.set(planId, 'rolling_back')
    await new Promise((resolve) => setTimeout(resolve, 10))
    this.statuses.set(planId, 'stopped')
  }

  getStatus(planId: string): DeploymentStatus {
    return this.statuses.get(planId) ?? 'pending'
  }

  // ── 成本估算 ──────────────────────────────────────────────────────

  estimateMonthlyCost(size: ResourceSize, mode: DeploymentMode): {
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

  generateQuote(size: ResourceSize, mode: DeploymentMode): {
    planName: string
    items: { description: string; unitPrice: number; quantity: number; total: number }[]
    subtotal: number
    tax: number
    total: number
    validUntil: Date
  } {
    const modeNames: Record<DeploymentMode, string> = {
      single: '单机部署',
      cluster: '集群部署',
      kubernetes: 'K8s 部署',
    }
    const sizeNames: Record<ResourceSize, string> = {
      small: '小型',
      medium: '中型',
      large: '大型',
      xlarge: '超大型',
    }

    const costs = MONTHLY_COSTS[size][mode]
    const items = [
      { description: '基础设施（ECS）', unitPrice: costs.infrastructure, quantity: 1, total: costs.infrastructure },
      { description: '带宽费用', unitPrice: costs.bandwidth, quantity: 1, total: costs.bandwidth },
      { description: '存储费用', unitPrice: costs.storage, quantity: 1, total: costs.storage },
    ]

    const subtotal = costs.infrastructure + costs.bandwidth + costs.storage
    const tax = Math.round(subtotal * 0.06 * 100) / 100 // 6% tax

    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + 30)

    return {
      planName: `${sizeNames[size]}${modeNames[mode]}方案`,
      items,
      subtotal,
      tax,
      total: subtotal + tax,
      validUntil,
    }
  }
}
