/**
 * 🐜 自动: [sandbox] [A] contract 补全
 *
 * 沙箱模块：跨模块合约类型
 * 定义 sandbox 模块对外暴露的稳定合约接口，
 * 供其他模块（agent, aiops, deploy, lowcode 等）消费。
 */

import type {
  SandboxInstance,
  CodeExecutionResult,
  ISVApp,
  AppInstall,
  AppFilter,
  SDKPackage,
  SandboxStatus,
  CodeLanguage,
  AppStatus,
  AppCategory,
  SDKLanguage,
} from './sandbox-isv.service'
import type {
  SandboxEnvironment,
  SandboxEnvironmentConfig,
} from './sandbox.service'

// ── 合约接口 ─────────────────────────────────────────

/**
 * 沙箱实例合约（跨模块安全子集）
 */
export interface SandboxInstanceContract {
  id: string
  appId: string
  developerId: string
  status: SandboxStatus
  language: CodeLanguage
  createdAt: string
  lastActiveAt: string
  resources: {
    cpu: number
    memory: number
    disk: number
  }
  snapshot?: string
}

/**
 * 代码执行结果合约（跨模块安全子集）
 */
export interface CodeExecutionResultContract {
  success: boolean
  output: string
  error?: string
  executionTimeMs: number
  memoryUsedMB: number
}

/**
 * ISV 应用合约（跨模块安全子集）
 */
export interface ISVAppContract {
  id: string
  name: string
  description: string
  developerId: string
  category: AppCategory
  status: AppStatus
  version: string
  rating: number
  ratingCount: number
  installCount: number
  publishedAt?: string
  createdAt: string
  updatedAt: string
  tags: string[]
  screenshots: string[]
  price: number
  isFree: boolean
}

/**
 * 应用安装合约（跨模块安全子集）
 */
export interface AppInstallContract {
  id: string
  appId: string
  tenantId: string
  installedAt: string
  status: 'ACTIVE' | 'DISABLED' | 'UNINSTALLED'
}

/**
 * SDK 包合约（跨模块安全子集）
 */
export interface SDKPackageContract {
  language: SDKLanguage
  version: string
  downloadURL: string
  size: number
  checksum: string
  generatedAt: string
}

/**
 * 沙箱环境合约（跨模块安全子集）
 */
export interface SandboxEnvironmentContract {
  envId: string
  tenantId: string
  name: string
  status: 'CREATING' | 'RUNNING' | 'STOPPED' | 'ERROR'
  createdAt: string
  config: Record<string, unknown>
}

// ── Contract 映射器 ─────────────────────────────────

/** 实体 -> 合约映射 */
export function toSandboxInstanceContract(entity: SandboxInstance): SandboxInstanceContract {
  return {
    id: entity.id,
    appId: entity.appId,
    developerId: entity.developerId,
    status: entity.status,
    language: entity.language,
    createdAt: entity.createdAt,
    lastActiveAt: entity.lastActiveAt,
    resources: { ...entity.resources },
    snapshot: entity.snapshot,
  }
}

/** 实体 -> 合约映射 */
export function toCodeExecutionResultContract(entity: CodeExecutionResult): CodeExecutionResultContract {
  return {
    success: entity.success,
    output: entity.output,
    error: entity.error,
    executionTimeMs: entity.executionTimeMs,
    memoryUsedMB: entity.memoryUsedMB,
  }
}

/** 实体 -> 合约映射 */
export function toISVAppContract(entity: ISVApp): ISVAppContract {
  return {
    id: entity.id,
    name: entity.name,
    description: entity.description,
    developerId: entity.developerId,
    category: entity.category,
    status: entity.status,
    version: entity.version,
    rating: entity.rating,
    ratingCount: entity.ratingCount,
    installCount: entity.installCount,
    publishedAt: entity.publishedAt,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    tags: [...entity.tags],
    screenshots: [...entity.screenshots],
    price: entity.price,
    isFree: entity.isFree,
  }
}

/** 实体 -> 合约映射 */
export function toAppInstallContract(entity: AppInstall): AppInstallContract {
  return {
    id: entity.id,
    appId: entity.appId,
    tenantId: entity.tenantId,
    installedAt: entity.installedAt,
    status: entity.status,
  }
}

/** 实体 -> 合约映射 */
export function toSDKPackageContract(entity: SDKPackage): SDKPackageContract {
  return {
    language: entity.language,
    version: entity.version,
    downloadURL: entity.downloadURL,
    size: entity.size,
    checksum: entity.checksum,
    generatedAt: entity.generatedAt,
  }
}

/** 实体 -> 合约映射 */
export function toSandboxEnvironmentContract(entity: SandboxEnvironment): SandboxEnvironmentContract {
  return {
    envId: entity.envId,
    tenantId: entity.tenantId,
    name: entity.name,
    status: entity.status,
    createdAt: entity.createdAt,
    config: { ...entity.config },
  }
}

// ── 批量映射 ───────────────────────────────────

export function toSandboxInstanceContracts(entities: SandboxInstance[]): SandboxInstanceContract[] {
  return entities.map(toSandboxInstanceContract)
}

export function toISVAppContracts(entities: ISVApp[]): ISVAppContract[] {
  return entities.map(toISVAppContract)
}

export function toAppInstallContracts(entities: AppInstall[]): AppInstallContract[] {
  return entities.map(toAppInstallContract)
}

export function toSandboxEnvironmentContracts(entities: SandboxEnvironment[]): SandboxEnvironmentContract[] {
  return entities.map(toSandboxEnvironmentContract)
}

// ── 重新导出类型 ─────────────────────────────────

export type {
  SandboxStatus,
  CodeLanguage,
  AppStatus,
  AppCategory,
  SDKLanguage,
  SandboxInstance,
  CodeExecutionResult,
  ISVApp,
  AppInstall,
  AppFilter,
  SDKPackage,
  SandboxEnvironment,
  SandboxEnvironmentConfig,
}
