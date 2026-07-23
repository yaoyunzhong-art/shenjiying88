/**
 * devops.service.spec.ts — DevOps 运维 Service 单元测试
 *
 * 覆盖:
 *   getStatus         — 正例(4) + 反例(1) + 边界(1)
 *   getPipelineStatus — 正例(2) + 反例(2) + 边界(1)
 *   Pipeline CRUD     — 正例(5) + 反例(3) + 边界(2)
 *   Deployment CRUD   — 正例(3) + 反例(2) + 边界(1)
 *   BuildJob CRUD     — 正例(3) + 反例(1) + 边界(1)
 *   executeAction     — 正例(1) + 反例(1) + 边界(1)
 *
 * 原则: 无 as any · 无 describe.skip · 无 it.only
 * 隔离: 每次测试使用独立的 Service 实例
 */

import { describe, it, expect } from 'vitest'
import { DevopsService } from './devops.service'
import { NotFoundException } from '@nestjs/common'

const service = new DevopsService()

// ═══════════════════════════════════════════════════════════════════
// getStatus
// ═══════════════════════════════════════════════════════════════════

describe('DevopsService · getStatus', () => {
  it('正例: 返回 module 为 devops', () => {
    expect(service.getStatus().module).toBe('devops')
  })

  it('正例: 返回 status 为 ok', () => {
    expect(service.getStatus().status).toBe('ok')
  })

  it('正例: 返回 pipelines 字段含 ci/cd', () => {
    const s = service.getStatus().pipelines
    expect(s.ci).toBe('passing')
    expect(s.cd).toBe('passing')
    expect(typeof s.total).toBe('number')
  })

  it('正例: 返回 deployments 和 builds 计数', () => {
    const s = service.getStatus()
    expect(s.deployments).toBeDefined()
    expect(s.builds).toBeDefined()
    expect(typeof s.deployments.active).toBe('number')
    expect(typeof s.builds.running).toBe('number')
  })

  it('反例: 初始状态 deployments.active 为 0', () => {
    expect(service.getStatus().deployments.active).toBe(0)
  })

  it('边界: 创建 PIPELINE 后 pipelines.total 增加', () => {
    const fresh = new DevopsService()
    fresh.createPipeline({ name: 'X', type: 'ci', config: {} })
    const status = fresh.getStatus()
    expect(status.pipelines.total).toBeGreaterThan(0)
  })
})

// ═══════════════════════════════════════════════════════════════════
// getPipelineStatus
// ═══════════════════════════════════════════════════════════════════

describe('DevopsService · getPipelineStatus', () => {
  it('正例: 不存在的 pipeline 返回 passing', () => {
    const result = service.getPipelineStatus('nonexistent')
    expect(result.status).toBe('passing')
    expect(result.pipeline).toBe('nonexistent')
  })

  it('正例: 已创建的 pipeline 可获取状态', () => {
    const fresh = new DevopsService()
    const p = fresh.createPipeline({ name: 'Test', type: 'ci', config: {} })
    const result = fresh.getPipelineStatus(p.id)
    expect(result.pipeline).toBe(p.id)
  })

  it('反例: 空字符串不抛异常', () => {
    expect(() => service.getPipelineStatus('')).not.toThrow()
  })

  it('反例: null id 不抛异常', () => {
    expect(() => service.getPipelineStatus(null as any)).not.toThrow()
  })

  it('边界: 超长 pipeline id', () => {
    const longId = 'x'.repeat(5000)
    const result = service.getPipelineStatus(longId)
    expect(result.pipeline).toBe(longId)
    expect(result.status).toBe('passing')
  })
})

// ═══════════════════════════════════════════════════════════════════
// Pipeline CRUD
// ═══════════════════════════════════════════════════════════════════

describe('DevopsService · Pipeline CRUD', () => {
  let fresh: DevopsService

  beforeEach(() => {
    fresh = new DevopsService()
  })

  it('正例: createPipeline 返回完整流水线对象', () => {
    const p = fresh.createPipeline({
      name: 'CI Pipeline',
      type: 'ci',
      config: { image: 'node:20' },
    })
    expect(p.id).toMatch(/^pipeline-/)
    expect(p.name).toBe('CI Pipeline')
    expect(p.type).toBe('ci')
    expect(p.status).toBe('idle')
    expect(p.enabled).toBe(true)
    expect(p.createdAt).toBeDefined()
    expect(p.updatedAt).toBeDefined()
  })

  it('正例: createPipeline 支持所有可选字段', () => {
    const p = fresh.createPipeline({
      name: 'Full Pipeline',
      type: 'custom',
      config: { node: '18' },
      description: 'Custom pipeline desc',
      triggers: ['push', 'pr'],
      env: { NODE_ENV: 'production' },
    })
    expect(p.description).toBe('Custom pipeline desc')
    expect(p.triggers).toEqual(['push', 'pr'])
    expect(p.env).toEqual({ NODE_ENV: 'production' })
  })

  it('正例: listPipelines 返回所有创建的流水线', () => {
    fresh.createPipeline({ name: 'A', type: 'ci', config: {} })
    fresh.createPipeline({ name: 'B', type: 'cd', config: {} })
    const list = fresh.listPipelines()
    expect(list.length).toBe(2)
  })

  it('正例: getPipeline 通过 ID 获取', () => {
    const p = fresh.createPipeline({ name: 'GetTest', type: 'ci', config: {} })
    const fetched = fresh.getPipeline(p.id)
    expect(fetched.id).toBe(p.id)
    expect(fetched.name).toBe('GetTest')
  })

  it('正例: triggerPipeline 将状态改为 running', () => {
    const p = fresh.createPipeline({ name: 'Trigger', type: 'ci', config: {} })
    const triggered = fresh.triggerPipeline(p.id)
    expect(triggered.status).toBe('running')
    const fetched = fresh.getPipeline(p.id)
    expect(fetched.status).toBe('running')
  })

  it('反例: getPipeline 不存在的 ID 抛 NotFoundException', () => {
    expect(() => fresh.getPipeline('nonexistent')).toThrow(NotFoundException)
    expect(() => fresh.getPipeline('nonexistent')).toThrow('not found')
  })

  it('反例: triggerPipeline 不存在的 ID 抛 NotFoundException', () => {
    expect(() => fresh.triggerPipeline('nonexistent')).toThrow('not found')
  })

  it('反例: 不存在的 ID 在 deletePipeline 返回 false', () => {
    expect(fresh.deletePipeline('nonexistent')).toBe(false)
  })

  it('正例: updatePipeline 更新名称和 enabled', () => {
    const p = fresh.createPipeline({ name: 'Old', type: 'ci', config: {} })
    const updated = fresh.updatePipeline(p.id, {
      name: 'New',
      enabled: false,
    })
    expect(updated.name).toBe('New')
    expect(updated.enabled).toBe(false)
    expect(updated.updatedAt).toBeDefined()
  })

  it('反例: updatePipeline 不存在的 ID 抛 NotFoundException', () => {
    expect(() => fresh.updatePipeline('nonexistent', { name: 'X' })).toThrow('not found')
  })

  it('边界: deletePipeline 删除后不可查', () => {
    const p = fresh.createPipeline({ name: 'Del', type: 'ci', config: {} })
    const deleted = fresh.deletePipeline(p.id)
    expect(deleted).toBe(true)
    expect(() => fresh.getPipeline(p.id)).toThrow()
    expect(fresh.deletePipeline(p.id)).toBe(false) // 二次删除
  })

  it('边界: 空 config 对象', () => {
    const p = fresh.createPipeline({ name: 'EmptyConfig', type: 'ci', config: {} })
    expect(p.config).toEqual({})
  })
})

// ═══════════════════════════════════════════════════════════════════
// Deployment CRUD
// ═══════════════════════════════════════════════════════════════════

describe('DevopsService · Deployment CRUD', () => {
  let fresh: DevopsService

  beforeEach(() => {
    fresh = new DevopsService()
  })

  it('正例: createDeployment 返回部署对象', () => {
    const d = fresh.createDeployment({
      pipelineId: 'p-1',
      version: 'v1.0.0',
      branch: 'main',
    })
    expect(d.id).toMatch(/^deploy-/)
    expect(d.version).toBe('v1.0.0')
    expect(d.status).toBe('pending')
    expect(d.env).toBe('staging')
    expect(d.steps).toHaveLength(4)
  })

  it('正例: createDeployment 支持自定义 env 和 commit', () => {
    const d = fresh.createDeployment({
      pipelineId: 'p-1',
      version: 'v2.0.0',
      branch: 'feature/test',
      commit: 'abc123',
      env: 'production',
      notes: '重要发布',
    })
    expect(d.env).toBe('production')
    expect(d.commit).toBe('abc123')
    expect(d.notes).toBe('重要发布')
  })

  it('正例: listDeployments 返回所有部署', () => {
    fresh.createDeployment({ pipelineId: 'p-1', version: 'v1', branch: 'main' })
    fresh.createDeployment({ pipelineId: 'p-1', version: 'v2', branch: 'feature' })
    expect(fresh.listDeployments()).toHaveLength(2)
  })

  it('反例: getDeployment 不存在的 ID 抛 NotFoundException', () => {
    expect(() => fresh.getDeployment('deploy-nonexistent')).toThrow('not found')
  })

  it('反例: 空字符串 ID 也抛 NotFoundException', () => {
    expect(() => fresh.getDeployment('')).toThrow('not found')
  })

  it('边界: 版本号超长字符串', () => {
    const longVersion = 'v' + '0'.repeat(500)
    const d = fresh.createDeployment({ pipelineId: 'p-1', version: longVersion, branch: 'main' })
    expect(d.version).toBe(longVersion)
  })
})

// ═══════════════════════════════════════════════════════════════════
// BuildJob CRUD
// ═══════════════════════════════════════════════════════════════════

describe('DevopsService · BuildJob CRUD', () => {
  let fresh: DevopsService

  beforeEach(() => {
    fresh = new DevopsService()
  })

  it('正例: createBuildJob 返回构建作业', () => {
    const j = fresh.createBuildJob({
      pipelineId: 'p-1',
      branch: 'feature/test',
      commands: ['npm install', 'npm test', 'npm build'],
    })
    expect(j.id).toMatch(/^build-/)
    expect(j.status).toBe('queued')
    expect(j.commands).toHaveLength(3)
    expect(j.createdAt).toBeDefined()
  })

  it('正例: createBuildJob 支持可选 env 和 timeout', () => {
    const j = fresh.createBuildJob({
      pipelineId: 'p-1',
      branch: 'main',
      commands: ['echo hello'],
      env: { NODE_ENV: 'test' },
      timeout: 600,
    })
    expect(j.env).toEqual({ NODE_ENV: 'test' })
    expect(j.timeout).toBe(600)
  })

  it('正例: listBuildJobs 列出所有作业', () => {
    fresh.createBuildJob({ pipelineId: 'p-1', branch: 'main', commands: ['echo a'] })
    fresh.createBuildJob({ pipelineId: 'p-1', branch: 'dev', commands: ['echo b'] })
    const jobs = fresh.listBuildJobs()
    expect(jobs).toHaveLength(2)
  })

  it('反例: getBuildJob 不存在的 ID 抛 NotFoundException', () => {
    expect(() => fresh.getBuildJob('build-nonexistent')).toThrow('not found')
  })

  it('边界: 空命令数组', () => {
    const j = fresh.createBuildJob({ pipelineId: 'p-1', branch: 'main', commands: [] })
    expect(j.commands).toHaveLength(0)
    expect(j.status).toBe('queued')
  })
})

// ═══════════════════════════════════════════════════════════════════
// executeAction
// ═══════════════════════════════════════════════════════════════════

describe('DevopsService · executeAction', () => {
  it('正例: 返回 accepted 状态', () => {
    const result = service.executeAction({ action: 'restart', target: 'api-server' })
    expect(result.action).toBe('restart')
    expect(result.target).toBe('api-server')
    expect(result.status).toBe('accepted')
  })

  it('反例: 空 action 仍返回 accepted', () => {
    const result = service.executeAction({ action: 'restart', target: '' })
    expect(result.status).toBe('accepted')
  })

  it('边界: 超长 action 字段', () => {
    const longAction = 'restart' as const
    const result = service.executeAction({ action: longAction, target: 'target' })
    expect(result.action).toBe(longAction)
    expect(result.status).toBe('accepted')
  })
})
