/**
 * devops.dto.ts — DevOps 模块 DTO
 *
 * 🐜 V17: CRUD 补齐
 *
 * 流水线管理、部署任务、构建作业的请求/响应类型。
 */

// ── 流水线 (Pipeline) ──

export interface CreatePipelineDto {
  name: string
  type: 'ci' | 'cd' | 'deploy' | 'custom'
  config: Record<string, unknown>
  description?: string
  triggers?: string[]
  env?: Record<string, string>
}

export interface UpdatePipelineDto {
  name?: string
  config?: Record<string, unknown>
  description?: string
  triggers?: string[]
  env?: Record<string, string>
  enabled?: boolean
}

export interface PipelineResponse {
  id: string
  name: string
  type: string
  status: string
  config: Record<string, unknown>
  description?: string
  triggers?: string[]
  env?: Record<string, string>
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export type PipelineListResponse = {
  items: PipelineResponse[]
  total: number
}

// ── 部署 (Deployment) ──

export interface CreateDeploymentDto {
  pipelineId: string
  version: string
  branch?: string
  commit?: string
  env?: 'staging' | 'production' | 'canary'
  notes?: string
}

export interface DeploymentResponse {
  id: string
  pipelineId: string
  version: string
  branch?: string
  commit?: string
  env: string
  status: string
  steps: DeployStep[]
  notes?: string
  startedAt: string
  completedAt?: string
  createdAt: string
}

export interface DeployStep {
  name: string
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped'
  startedAt?: string
  completedAt?: string
  log?: string
}

export type DeploymentListResponse = {
  items: DeploymentResponse[]
  total: number
}

// ── 构建作业 (Build Job) ──

export interface CreateBuildJobDto {
  pipelineId: string
  branch: string
  commit?: string
  commands: string[]
  env?: Record<string, string>
  timeout?: number
}

export interface BuildJobResponse {
  id: string
  pipelineId: string
  branch: string
  commit?: string
  status: 'queued' | 'running' | 'success' | 'failed' | 'cancelled'
  commands: string[]
  env?: Record<string, string>
  startedAt?: string
  completedAt?: string
  log?: string
  exitCode?: number
  duration?: number
  timeout?: number
  createdAt: string
}

export type BuildJobListResponse = {
  items: BuildJobResponse[]
  total: number
}

// ── 运维操作 ──

export interface ExecuteActionDto {
  action: 'restart' | 'scale' | 'rollback' | 'cleanup' | 'migrate'
  target: string
  params?: Record<string, unknown>
}
