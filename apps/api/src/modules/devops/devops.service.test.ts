/**
 * devops.service.test.ts — DevOps 服务单元测试
 *
 * 🐜 V17: thin-module-test-batch
 *
 * 覆盖:
 *   正例 × 8: getStatus / getPipelineStatus 正常返回
 *   反例 × 5: 空/异常 pipeline id 处理
 *   边界 × 2: 长字符串、包含特殊字符
 */

import { describe, it, expect } from 'vitest'
import { DevopsService } from './devops.service'

describe('DevopsService', () => {
  const service = new DevopsService()

  // ── 正例 (8) ────────────────────────────────────────────────

  it('getStatus 应返回 module 为 devops', () => {
    const status = service.getStatus()
    expect(status.module).toBe('devops')
  })

  it('getStatus 应返回 status 为 ok', () => {
    const status = service.getStatus()
    expect(status.status).toBe('ok')
  })

  it('getStatus 应包含 pipelines 字段', () => {
    const status = service.getStatus()
    expect(status.pipelines).toBeDefined()
  })

  it('getStatus 的 CI pipeline 状态为 passing', () => {
    const status = service.getStatus()
    expect(status.pipelines.ci).toBe('passing')
  })

  it('getStatus 的 CD pipeline 状态为 passing', () => {
    const status = service.getStatus()
    expect(status.pipelines.cd).toBe('passing')
  })

  it('getPipelineStatus 返回对象含 pipeline 字段', () => {
    const result = service.getPipelineStatus('ci')
    expect(result.pipeline).toBe('ci')
  })

  it('getPipelineStatus 返回对象含 status 字段', () => {
    const result = service.getPipelineStatus('cd')
    expect(result.status).toBeDefined()
    expect(typeof result.status).toBe('string')
  })

  it('getPipelineStatus 返回的 status 为 passing', () => {
    const result = service.getPipelineStatus('deploy')
    expect(result.status).toBe('passing')
  })

  // ── 反例 (5) ────────────────────────────────────────────────

  it('getPipelineStatus 传空字符串应不抛异常', () => {
    expect(() => service.getPipelineStatus('')).not.toThrow()
  })

  it('getPipelineStatus 传 undefined 应不抛异常', () => {
    expect(() => service.getPipelineStatus(undefined as any)).not.toThrow()
  })

  it('getPipelineStatus 传 null 应不抛异常', () => {
    expect(() => service.getPipelineStatus(null as any)).not.toThrow()
  })

  it('getPipelineStatus 传不存在 pipeline 名仍返回 passing', () => {
    const result = service.getPipelineStatus('nonexistent-pipeline-xyz')
    expect(result.status).toBe('passing')
  })

  it('getPipelineStatus 传数字应不抛异常', () => {
    expect(() => service.getPipelineStatus(12345 as any)).not.toThrow()
  })

  // ── 边界 (2) ────────────────────────────────────────────────

  it('getPipelineStatus 传超长 pipeline id', () => {
    const longId = 'a'.repeat(5000)
    const result = service.getPipelineStatus(longId)
    expect(result.pipeline).toBe(longId)
    expect(result.status).toBe('passing')
  })

  it('getPipelineStatus 传包含特殊字符的 id', () => {
    const result = service.getPipelineStatus('ci/cd-pipeline_v2#build')
    expect(result.status).toBe('passing')
  })

  // ── Pipeline CRUD 正例 (4) ──────────────────────────────────

  it('createPipeline 应返回带 ID 的流水线', () => {
    const p = service.createPipeline({ name: 'CI Pipeline', type: 'ci', config: { image: 'node:20' } })
    expect(p.id).toBeDefined()
    expect(p.id).toMatch(/^pipeline-/)
    expect(p.name).toBe('CI Pipeline')
    expect(p.type).toBe('ci')
    expect(p.status).toBe('idle')
    expect(p.enabled).toBe(true)
  })

  it('createPipeline 可以带所有可选字段', () => {
    const p = service.createPipeline({
      name: 'Full Pipeline', type: 'custom', config: {},
      description: 'Custom pipeline', triggers: ['push', 'pr'],
      env: { NODE_ENV: 'production' }
    })
    expect(p.description).toBe('Custom pipeline')
    expect(p.triggers).toEqual(['push', 'pr'])
    expect(p.env).toEqual({ NODE_ENV: 'production' })
  })

  it('listPipelines 返回已创建的流水线列表', () => {
    service.createPipeline({ name: 'P1', type: 'ci', config: {} })
    service.createPipeline({ name: 'P2', type: 'cd', config: {} })
    const list = service.listPipelines()
    expect(list.length).toBeGreaterThanOrEqual(2)
  })

  it('triggerPipeline 将流水线状态改为 running', () => {
    const p = service.createPipeline({ name: 'ToTrigger', type: 'ci', config: {} })
    const triggered = service.triggerPipeline(p.id)
    expect(triggered.status).toBe('running')
    const fetched = service.getPipeline(p.id)
    expect(fetched.status).toBe('running')
  })

  // ── Pipeline CRUD 反例 (3) ──────────────────────────────────

  it('getPipeline 不存在的 ID 抛 NotFoundException', () => {
    expect(() => service.getPipeline('nonexistent')).toThrow('Pipeline nonexistent not found')
  })

  it('updatePipeline 更新名称生效', () => {
    const p = service.createPipeline({ name: 'OldName', type: 'ci', config: {} })
    const updated = service.updatePipeline(p.id, { name: 'NewName' })
    expect(updated.name).toBe('NewName')
    expect(updated.updatedAt).not.toBe(p.updatedAt)
  })

  it('deletePipeline 删除后列表不含该元素', () => {
    const p = service.createPipeline({ name: 'ToDelete', type: 'ci', config: {} })
    expect(service.deletePipeline(p.id)).toBe(true)
    expect(service.deletePipeline(p.id)).toBe(false)
    expect(() => service.getPipeline(p.id)).toThrow()
  })

  // ── Deployment CRUD 正例 (3) ─────────────────────────────────

  it('createDeployment 返回部署对象含 4 个步骤', () => {
    const d = service.createDeployment({ pipelineId: 'p-1', version: 'v1.0.0', branch: 'main' })
    expect(d.id).toMatch(/^deploy-/)
    expect(d.version).toBe('v1.0.0')
    expect(d.steps).toHaveLength(4)
    expect(d.status).toBe('pending')
    expect(d.env).toBe('staging')
  })

  it('createDeployment 可以传 env 和 notes', () => {
    const d = service.createDeployment({
      pipelineId: 'p-1', version: 'v2.0.0',
      env: 'production', notes: '重要发布'
    })
    expect(d.env).toBe('production')
    expect(d.notes).toBe('重要发布')
  })

  it('getDeployment 返回已创建的部署', () => {
    const d = service.createDeployment({ pipelineId: 'p-1', version: 'v1.0.0' })
    const found = service.getDeployment(d.id)
    expect(found.id).toBe(d.id)
  })

  // ── Deployment CRUD 反例 (1) ────────────────────────────────

  it('getDeployment 不存在的 ID 抛 NotFoundException', () => {
    expect(() => service.getDeployment('deploy-nonexistent')).toThrow()
  })

  // ── Build Job CRUD 正例 (2) ─────────────────────────────────

  it('createBuildJob 返回构建作业对象', () => {
    const j = service.createBuildJob({
      pipelineId: 'p-1', branch: 'feature/test', commands: ['npm install', 'npm test']
    })
    expect(j.id).toMatch(/^build-/)
    expect(j.status).toBe('queued')
    expect(j.commands).toHaveLength(2)
  })

  it('getBuildJob 返回已创建的构建作业', () => {
    const j = service.createBuildJob({
      pipelineId: 'p-1', branch: 'main', commands: ['echo hello']
    })
    const found = service.getBuildJob(j.id)
    expect(found.branch).toBe('main')
  })

  // ── Build Job CRUD 反例 (1) ─────────────────────────────────

  it('getBuildJob 不存在的 ID 抛 NotFoundException', () => {
    expect(() => service.getBuildJob('build-nonexistent')).toThrow()
  })

  // ── Ops Action (1) ───────────────────────────────────────────

  it('executeAction 返回 accepted', () => {
    const result = service.executeAction({ action: 'restart', target: 'api-server' })
    expect(result.action).toBe('restart')
    expect(result.status).toBe('accepted')
  })
})
