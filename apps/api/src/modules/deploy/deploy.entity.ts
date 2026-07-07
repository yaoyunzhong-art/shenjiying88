// deploy.entity.ts - 部署模块实体类型定义

export type DeploymentMode = 'single' | 'cluster' | 'kubernetes'
export type DeploymentStatus = 'pending' | 'deploying' | 'running' | 'stopped' | 'failed' | 'rolling_back'
export type ResourceSize = 'small' | 'medium' | 'large' | 'xlarge'

export interface ServerSpec {
  cpu: string
  memory: string
  storage: string
  os: string
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
  estimatedCost: number
  setupTime: number
  components: string[]
  helmValues?: HelmValues
  kubernetesManifests?: string
}

export interface MonthlyCost {
  infrastructure: number
  bandwidth: number
  storage: number
  total: number
  currency: string
}

export interface QuoteItem {
  description: string
  unitPrice: number
  quantity: number
  total: number
}

export interface DeploymentQuote {
  planName: string
  items: QuoteItem[]
  subtotal: number
  tax: number
  total: number
  validUntil: Date
}

export interface PreflightCheckResult {
  pass: boolean
  warnings: string[]
  errors: string[]
}

export interface ResourceSpec {
  cpu: string
  memory: string
  storage: string
  recommendedInstanceType: string
}

export interface DeployOptions {
  enableSSL?: boolean
  enableCDN?: boolean
  enableMonitoring?: boolean
  enableBackup?: boolean
  multiRegion?: boolean
}
