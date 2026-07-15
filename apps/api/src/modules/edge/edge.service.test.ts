/**
 * edge.service.test.ts — EdgeService 单元测试
 *
 * 🐜 V18: 边缘AI推理服务 测试
 * 覆盖：aiInference / getModelStatus / cacheModel / listModels / healthCheck
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EdgeService, type EdgeServiceHealth } from './edge.service'
import { EdgeInferenceService, EdgeModelCache } from './edge-ai.service'

describe('EdgeService', () => {
  let service: EdgeService
  let inferenceService: EdgeInferenceService
  let modelCache: EdgeModelCache

  beforeEach(() => {
    inferenceService = new EdgeInferenceService()
    modelCache = new EdgeModelCache()
    service = new EdgeService(inferenceService, modelCache)
  })

  // ─── aiInference ──────────────────────────────────────────────────────────

  describe('aiInference', () => {
    it('should run inference successfully on a valid device and model', async () => {
      const result = await service.aiInference('face-detect-v1', { image: 'test' }, 'edge-001')
      expect(result.modelId).toBe('face-detect-v1')
      expect(result.deviceId).toBe('edge-001')
      expect(result.latencyMs).toBeGreaterThan(0)
      expect(result.confidence).toBeGreaterThan(0.8)
    })

    it('should run inference and return typed output', async () => {
      const result = await service.aiInference<{ image: string }, { result: string }>(
        'face-detect-v1',
        { image: 'test' },
        'edge-001',
      )
      expect(result.output).toBeDefined()
      expect(typeof result.output).toBe('object')
    })

    it('should throw when device is not found', async () => {
      await expect(
        service.aiInference('face-detect-v1', {}, 'nonexistent-device'),
      ).rejects.toThrow('not found')
    })

    it('should throw when model is not available on the device', async () => {
      await expect(
        service.aiInference('nlp-intent-v1', {}, 'edge-003'),
      ).rejects.toThrow('not available on device')
    })

    it('should auto-load model if not loaded before inference', async () => {
      const statusBefore = inferenceService.getModelStatus('face-detect-v1', 'edge-001')
      expect(statusBefore.loaded).toBe(false)

      const result = await service.aiInference('face-detect-v1', {}, 'edge-001')
      expect(result.modelId).toBe('face-detect-v1')

      const statusAfter = inferenceService.getModelStatus('face-detect-v1', 'edge-001')
      expect(statusAfter.loaded).toBe(true)
    })

    it('should preserve confidence within expected range', async () => {
      const result = await service.aiInference('face-detect-v1', {}, 'edge-001')
      expect(result.confidence).toBeGreaterThanOrEqual(0.8)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })
  })

  // ─── getModelStatus ───────────────────────────────────────────────────────

  describe('getModelStatus', () => {
    it('should return status with loaded=false for initially unloaded model', async () => {
      const status = await service.getModelStatus('face-detect-v1')
      expect(status.loaded).toBe(false)
      expect(status.cached).toBe(false)
      expect(status.deviceInfo.length).toBeGreaterThan(0)
    })

    it('should return loaded=true after inference loads the model', async () => {
      await service.aiInference('face-detect-v1', {}, 'edge-001')
      const status = await service.getModelStatus('face-detect-v1', 'edge-001')
      expect(status.loaded).toBe(true)
      expect(status.deviceInfo[0].loaded).toBe(true)
      expect(status.deviceInfo[0].modelInfo).not.toBeNull()
    })

    it('should return cached=true after caching', async () => {
      await service.cacheModel('face-detect-v1', 'v1.0')
      const status = await service.getModelStatus('face-detect-v1')
      expect(status.cached).toBe(true)
      expect(status.cachedEntry).not.toBeNull()
      expect(status.cachedEntry!.modelId).toBe('face-detect-v1')
    })

    it('should return cached=false for uncached model', async () => {
      const status = await service.getModelStatus('nonexistent-model')
      expect(status.cached).toBe(false)
      expect(status.cachedEntry).toBeNull()
    })
  })

  // ─── cacheModel ───────────────────────────────────────────────────────────

  describe('cacheModel', () => {
    it('should cache a model and return the cache entry', async () => {
      const entry = await service.cacheModel('test-model', 'v2.0')
      expect(entry.modelId).toBe('test-model')
      expect(entry.version).toBe('v2.0')
      expect(entry.sizeMb).toBeGreaterThan(0)
      expect(entry.cachedAt).toBeGreaterThan(0)
    })

    it('should make the cached model visible via listModels', async () => {
      await service.cacheModel('face-detect-v1', 'v1.5')
      const { models } = await service.listModels()
      const model = models.find((m) => m.modelId === 'face-detect-v1')
      expect(model).toBeDefined()
      expect(model!.cached).toBe(true)
    })
  })

  // ─── listModels ───────────────────────────────────────────────────────────

  describe('listModels', () => {
    it('should return all default models', async () => {
      const { models, total } = await service.listModels()
      expect(total).toBe(5)
      expect(models.length).toBe(5)
    })

    it('should return model details including framework and size', async () => {
      const { models } = await service.listModels()
      const faceModel = models.find((m) => m.modelId === 'face-detect-v1')
      expect(faceModel).toBeDefined()
      expect(faceModel!.framework).toBe('tensorrt')
      expect(faceModel!.sizeMb).toBeGreaterThan(0)
      expect(faceModel!.deployedDevices.length).toBeGreaterThan(0)
    })

    it('should show cached=true for cached models', async () => {
      await service.cacheModel('qr-scan-v1', 'v1.0')
      const { models } = await service.listModels()
      const qrModel = models.find((m) => m.modelId === 'qr-scan-v1')
      expect(qrModel!.cached).toBe(true)
    })

    it('should show cached=false for non-cached models', async () => {
      const { models } = await service.listModels()
      const allNotCached = models.every((m) => m.cached === false)
      expect(allNotCached).toBe(true)
    })
  })

  // ─── healthCheck ──────────────────────────────────────────────────────────

  describe('healthCheck', () => {
    it('should return health status with correct shape', async () => {
      const health: EdgeServiceHealth = await service.healthCheck()
      expect(health).toHaveProperty('status')
      expect(health).toHaveProperty('totalDevices')
      expect(health).toHaveProperty('onlineDevices')
      expect(health).toHaveProperty('onlineModels')
      expect(health).toHaveProperty('cachedModels')
      expect(health).toHaveProperty('uptime')
      expect(health).toHaveProperty('timestamp')
    })

    it('should report an appropriate status', async () => {
      const health = await service.healthCheck()
      expect(['ok', 'degraded']).toContain(health.status)
      expect(health.totalDevices).toBeGreaterThan(0)
      expect(health.onlineDevices).toBeGreaterThan(0)
    })

    it('should report online models count correctly', async () => {
      await service.aiInference('face-detect-v1', {}, 'edge-001')
      const health = await service.healthCheck()
      expect(health.onlineModels).toBeGreaterThan(0)
    })

    it('should report cached models count', async () => {
      await service.cacheModel('ocr-text-v2', 'v1.0')
      const health = await service.healthCheck()
      expect(health.cachedModels).toBe(1)
    })

    it('should have non-negative uptime', async () => {
      const health = await service.healthCheck()
      expect(health.uptime).toBeGreaterThanOrEqual(0)
    })

    it('should have a timestamp value', async () => {
      const health = await service.healthCheck()
      expect(health.timestamp).toBeGreaterThan(0)
    })
  })
})
