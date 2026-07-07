/**
 * 🐜 自动: [e2e-auto-gen] [D] contract 补全
 *
 * E2E Auto Gen 合约类型
 * 定义 e2e-auto-gen 模块对外暴露的稳定合约接口，
 * 供其他模块（recommender, cross-module 等）消费。
 */

import type {
  E2ETestConfig,
  GenTask,
  E2ETestReport,
  GenerateResponse,
  ExecuteResponse,
} from './e2e-auto-gen.entity'

/**
 * 生成请求合约（跨模块安全子集）
 */
export interface GenerateRequestContract {
  spec: string
  outputDir?: string
  testFramework?: 'vitest' | 'jest' | 'playwright'
  enableE2E?: boolean
  baseUrl?: string
  authToken?: string
}

/**
 * 执行请求合约（跨模块安全子集）
 */
export interface ExecuteRequestContract {
  configId: string
  fileFilter?: string[]
  timeoutMs?: number
}

/**
 * 生成响应合约（跨模块安全子集）
 */
export interface GenerateResponseContract {
  taskId: string
  status: GenTask['status']
  files: string[]
  stats: {
    totalFiles: number
    totalTestCases: number
    totalLines: number
  }
  createdAt: string
}

/**
 * 执行响应合约（跨模块安全子集）
 */
export interface ExecuteResponseContract {
  reportId: string
  totalCases: number
  passed: number
  failed: number
  passRate: number
  createdAt: string
}

/**
 * 配置合约（跨模块安全子集）
 */
export interface E2ETestConfigContract {
  id: string
  projectName: string
  specSource: string
  outputDir: string
  testFramework: 'vitest' | 'jest' | 'playwright'
  enableE2E: boolean
  baseUrl?: string
  enabled: boolean
  createdAt: string
}

/**
 * 任务合约（跨模块安全子集）
 */
export interface GenTaskContract {
  id: string
  configId: string
  status: GenTask['status']
  generatedFiles: string[]
  stats: {
    totalFiles: number
    totalTestCases: number
    totalLines: number
  }
  startedAt?: string
  completedAt?: string
  createdAt: string
}

/**
 * 报告合约（跨模块安全子集）
 */
export interface E2ETestReportContract {
  id: string
  taskId: string
  configId: string
  totalCases: number
  passed: number
  failed: number
  passRate: number
  durationMs: number
  createdAt: string
}

/**
 * 创建配置请求合约
 */
export interface CreateConfigRequestContract {
  projectName: string
  specSource: string
  outputDir?: string
  testFramework?: 'vitest' | 'jest' | 'playwright'
  enableE2E?: boolean
  baseUrl?: string
  authToken?: string
}

/**
 * 更新配置请求合约
 */
export interface UpdateConfigRequestContract {
  projectName?: string
  specSource?: string
  outputDir?: string
  testFramework?: 'vitest' | 'jest' | 'playwright'
  enableE2E?: boolean
  baseUrl?: string
  authToken?: string
  enabled?: boolean
}

/**
 * 诊断报告格式 —— 提供当前模块状态快照
 */
export interface E2EAutoGenModuleDiagnostics {
  module: 'e2e-auto-gen'
  version: string
  configsCount: number
  tasksCount: number
  reportsCount: number
  health: 'healthy' | 'degraded' | 'unhealthy'
}
