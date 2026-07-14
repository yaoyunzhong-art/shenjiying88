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
})
