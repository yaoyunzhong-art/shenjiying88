import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * health.controller.test.ts · RetrievalHealthController 单元测试
 *
 * 覆盖:
 *   - 路由元数据 (path / method)
 *   - GET /api/retrieval/health  正常返回组件健康状态
 *   - 响应结构完整性
 *   - 并发安全
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'

describe('RetrievalHealthController', () => {
  const { RetrievalHealthController } = require('./health.controller')
  const { RetrievalService } = require('./retrieval.service')

  let controller: InstanceType<typeof RetrievalHealthController>
  let service: InstanceType<typeof RetrievalService>

  beforeEach(() => {
    service = new RetrievalService()
    controller = new RetrievalHealthController(service)
  })

  // ─── 路由元数据 ────────────────────────────────────────────────────────

  describe('route metadata', () => {
    it('controller path should be api/retrieval', () => {
      const path = Reflect.getMetadata('path', RetrievalHealthController)
      assert.equal(path, 'api/retrieval')
    })

    it('health route should be GET /health', () => {
      const method = Reflect.getMetadata('method', RetrievalHealthController.prototype.health)
      const path = Reflect.getMetadata('path', RetrievalHealthController.prototype.health)

      assert.equal(method, 0) // GET
      assert.equal(path, 'health')
    })
  })

  // ─── GET /api/retrieval/health (骨架状态) ──────────────────────────────

  describe('GET /api/retrieval/health', () => {
    it('should return skeleton health response with unavailable components', async () => {
      const response = await controller.health()

      assert.ok(response)
      assert.equal(typeof response, 'object')
      assert.equal(response.qdrant, 'unavailable')
      assert.equal(response.embedder, 'unavailable')
      assert.equal(response.lastIndexAt, null)
      assert.equal(response.module, 'retrieval')
      assert.equal(response.phase, 'phase-19')
    })

    it('should include checkedAt as valid ISO 8601 timestamp', async () => {
      const response = await controller.health()

      assert.ok(response.checkedAt)
      const parsed = Date.parse(response.checkedAt)
      assert.ok(parsed > 0, 'checkedAt must be parseable as ISO date')
    })

    it('checkedAt should be recent (within 5 seconds of call)', async () => {
      const before = Date.now()
      const response = await controller.health()
      const after = Date.now()
      const checkedAt = Date.parse(response.checkedAt)
      assert.ok(checkedAt >= before - 100, 'checkedAt should be >= request start')
      assert.ok(checkedAt <= after + 100, 'checkedAt should be <= request end')
    })

    it('should return lastIndexAt as null when no index has been performed', async () => {
      const response = await controller.health()
      assert.equal(response.lastIndexAt, null)
    })
  })

  // ─── 边界与异常路径 ──────────────────────────────────────────────────

  describe('edge cases', () => {
    it('should handle concurrent health requests without error', async () => {
      const results = await Promise.all([
        controller.health(),
        controller.health(),
        controller.health(),
      ])
      assert.equal(results.length, 3)
      for (const r of results) {
        assert.equal(r.module, 'retrieval')
        assert.equal(r.phase, 'phase-19')
        assert.equal(r.qdrant, 'unavailable')
      }
    })

    it('response shape should have exactly all expected keys', async () => {
      const response = await controller.health()
      const expectedKeys = ['qdrant', 'embedder', 'lastIndexAt', 'checkedAt', 'module', 'phase']
      for (const key of expectedKeys) {
        assert.ok(key in response, `expected key "${key}" in response`)
      }
      assert.equal(Object.keys(response).length, expectedKeys.length)
    })

    it('should return correct qdrant/embedder values from service state', async () => {
      // 骨架状态: both unavailable
      const response = await controller.health()
      assert.equal(response.qdrant, 'unavailable')
      assert.equal(response.embedder, 'unavailable')
    })

    it('module and phase fields should be static strings', async () => {
      const response = await controller.health()
      assert.equal(response.module, 'retrieval')
      assert.equal(response.phase, 'phase-19')
    })
  })
})
