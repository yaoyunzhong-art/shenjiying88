/**
 * devops.controller.test.ts — DevOps 控制器单元测试
 *
 * 🐜 V17: thin-module-test-batch
 *
 * 覆盖:
 *   正例 × 6: 各端点正确返回结构
 *   反例 × 3: 错误 pipeline id
 *   边界 × 2: 超长 id / 空 id
 */

import { describe, it, expect, vi } from 'vitest'
import { DevopsController } from './devops.controller'
import { DevopsService } from './devops.service'

describe('DevopsController', () => {
  // ── 正例 (6) ────────────────────────────────────────────────

  it('getStatus 应委托到 service.getStatus', () => {
    const service = new DevopsService()
    const spy = vi.spyOn(service, 'getStatus')
    const controller = new DevopsController(service)
    controller.getStatus()
    expect(spy).toHaveBeenCalledOnce()
  })

  it('getStatus 返回结构正确（集成验证）', () => {
    const controller = new DevopsController(new DevopsService())
    const result = controller.getStatus()
    expect(result).toHaveProperty('module')
    expect(result).toHaveProperty('status')
    expect(result).toHaveProperty('pipelines')
  })

  it('getStatus 返回 pipelines.ci 为 passing', () => {
    const controller = new DevopsController(new DevopsService())
    const result = controller.getStatus()
    expect(result.pipelines.ci).toBe('passing')
  })

  it('getPipelineStatus 应委托到 service.getPipelineStatus', () => {
    const service = new DevopsService()
    const spy = vi.spyOn(service, 'getPipelineStatus')
    const controller = new DevopsController(service)
    controller.getPipelineStatus('ci')
    expect(spy).toHaveBeenCalledWith('ci')
  })

  it('getPipelineStatus 传 "cd" 返回正确', () => {
    const controller = new DevopsController(new DevopsService())
    const result = controller.getPipelineStatus('cd')
    expect(result.pipeline).toBe('cd')
    expect(result.status).toBe('passing')
  })

  it('getPipelineStatus 传 "deploy" 返回正确', () => {
    const controller = new DevopsController(new DevopsService())
    const result = controller.getPipelineStatus('deploy')
    expect(result.pipeline).toBe('deploy')
    expect(result.status).toBe('passing')
  })

  // ── 反例 (3) ────────────────────────────────────────────────

  it('getPipelineStatus 传空字符串应不抛异常', () => {
    const controller = new DevopsController(new DevopsService())
    expect(() => controller.getPipelineStatus('')).not.toThrow()
  })

  it('getPipelineStatus 传 null 应不抛异常', () => {
    const controller = new DevopsController(new DevopsService())
    expect(() => controller.getPipelineStatus(null as any)).not.toThrow()
  })

  it('getPipelineStatus 传 undefined 应不抛异常', () => {
    const controller = new DevopsController(new DevopsService())
    expect(() => controller.getPipelineStatus(undefined as any)).not.toThrow()
  })

  // ── 边界 (2) ────────────────────────────────────────────────

  it('getPipelineStatus 传超长 id 仍正常工作', () => {
    const controller = new DevopsController(new DevopsService())
    const longId = 'x'.repeat(10000)
    expect(() => controller.getPipelineStatus(longId)).not.toThrow()
  })

  it('getPipelineStatus 传包含特殊字符的 id', () => {
    const controller = new DevopsController(new DevopsService())
    const result = controller.getPipelineStatus('pipeline_with#special?chars&symbols')
    expect(result.pipeline).toBe('pipeline_with#special?chars&symbols')
  })
})
