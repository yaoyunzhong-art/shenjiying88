/**
 * e2e-auto-gen.entity.ts - Phase-19 E2E Auto Gen Entity
 * 用途: E2E 自动生成模块的实体类型定义
 * 关联: phase-19-intelligence/spec.md §Phase 2
 */

/**
 * E2E 测试配置
 */
export interface E2ETestConfig {
  /** 配置唯一标识 */
  id: string
  /** 项目名称 */
  projectName: string
  /** OpenAPI spec URL 或本地路径 */
  specSource: string
  /** 生成的目标目录 */
  outputDir: string
  /** 测试框架 */
  testFramework: 'vitest' | 'jest' | 'playwright'
  /** 是否启用 E2E 模式 */
  enableE2E: boolean
  /** 基础 URL */
  baseUrl?: string
  /** 授权 token */
  authToken?: string
  /** 额外头部 */
  extraHeaders?: Record<string, string>
  /** 是否启用 */
  enabled: boolean
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt?: string
}

/**
 * 生成任务
 */
export interface GenTask {
  /** 任务唯一标识 */
  id: string
  /** 关联配置 ID */
  configId: string
  /** 任务状态 */
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  /** 生成的测试文件列表 */
  generatedFiles: string[]
  /** 生成的行数统计 */
  stats: {
    totalFiles: number
    totalTestCases: number
    totalLines: number
  }
  /** 错误信息 */
  errorMessage?: string
  /** 开始时间 */
  startedAt?: string
  /** 完成时间 */
  completedAt?: string
  /** 创建时间 */
  createdAt: string
}

/**
 * E2E 测试执行报告
 */
export interface E2ETestReport {
  /** 报告唯一标识 */
  id: string
  /** 关联任务 ID */
  taskId: string
  /** 关联配置 ID */
  configId: string
  /** 总用例数 */
  totalCases: number
  /** 通过数 */
  passed: number
  /** 失败数 */
  failed: number
  /** 跳过数 */
  skipped: number
  /** 通过率 */
  passRate: number
  /** 执行耗时(ms) */
  durationMs: number
  /** 用例详情 */
  caseResults: Array<{
    caseId: string
    name: string
    passed: boolean
    durationMs: number
    errorMessage?: string
  }>
  /** 创建时间 */
  createdAt: string
}

/**
 * 生成请求
 */
export interface GenerateRequest {
  /** OpenAPI spec 内容 */
  spec: string
  /** 输出目录 */
  outputDir?: string
  /** 测试框架 */
  testFramework?: 'vitest' | 'jest' | 'playwright'
  /** 是否启用 E2E */
  enableE2E?: boolean
  /** 基础 URL */
  baseUrl?: string
  /** 授权 token */
  authToken?: string
}

/**
 * 生成响应
 */
export interface GenerateResponse {
  /** 任务 ID */
  taskId: string
  /** 任务状态 */
  status: GenTask['status']
  /** 生成的文件列表 */
  files: string[]
  /** 统计 */
  stats: GenTask['stats']
  /** 创建时间 */
  createdAt: string
}

/**
 * 执行请求
 */
export interface ExecuteRequest {
  /** 配置 ID */
  configId: string
  /** 测试文件列表（为空则执行全部） */
  fileFilter?: string[]
  /** 超时时间(ms) */
  timeoutMs?: number
}

/**
 * 执行响应
 */
export interface ExecuteResponse {
  /** 报告 ID */
  reportId: string
  /** 总用例数 */
  totalCases: number
  /** 通过数 */
  passed: number
  /** 失败数 */
  failed: number
  /** 通过率 */
  passRate: number
  /** 创建时间 */
  createdAt: string
}
