import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * health.controller.test.ts · RetrievalHealthController 单元测试
 *
 * 覆盖:
 *   - 路由元数据 (path / method)
 *   - GET /api/retrieval/health  正常返回组件健康状态
 *   - 响应结构完整性
 *   - 并发安全
 *   - 8角色视角场景 (👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销)
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { RetrievalHealthController } from './health.controller'
import { RetrievalService } from './retrieval.service'

describe('RetrievalHealthController', () => {
  let controller: RetrievalHealthController
  let service: RetrievalService

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

  // ─── 👔 店长视角 ────────────────────────────────────────────────────
  describe('👔店长 · retrieval-health 角色场景', () => {
    it('店长查看检索系统健康状态，确认知识库可用', async () => {
      const response = await controller.health()
      assert.ok(response.checkedAt, '店长需要确认系统时间戳')
      assert.equal(response.module, 'retrieval', '模块标识正确')
      // 店长关心组件是否在线，但骨架状态下都不可用
      assert.ok(['unavailable', 'ok', 'degraded'].includes(response.qdrant))
      assert.ok(['unavailable', 'ok', 'degraded'].includes(response.embedder))
    })

    it('店长尝试在非营业时间查看健康状态（边界测试）', async () => {
      // 健康检查始终可用，无时间限制
      const response = await controller.health()
      assert.equal(response.module, 'retrieval')
      assert.ok(typeof response.checkedAt === 'string')
    })
  })

  // ─── 🛒 前台视角 ────────────────────────────────────────────────────
  describe('🛒前台 · retrieval-health 角色场景', () => {
    it('前台确认检索模块可用于会员信息查询', async () => {
      const response = await controller.health()
      // 前台关心 RAG 检索能否正常工作（embedder 状态）
      assert.equal(response.embedder, 'unavailable')
      assert.equal(response.lastIndexAt, null)
    })

    it('前台在高峰期并发查询健康状态不报错', async () => {
      const results = await Promise.all(Array.from({ length: 10 }, () => controller.health()))
      results.forEach(r => assert.equal(r.module, 'retrieval'))
    })
  })

  // ─── 👥 HR 视角 ────────────────────────────────────────────────────
  describe('👥HR · retrieval-health 角色场景', () => {
    it('HR 检查检索系统是否可用作为员工培训系统依赖', async () => {
      const response = await controller.health()
      assert.equal(response.module, 'retrieval')
      assert.equal(response.phase, 'phase-19', 'HR 期望 phase 字段存在')
    })

    it('HR 了解组件状态用于系统使用培训', async () => {
      const response = await controller.health()
      // HR 只需确认健康检查返回完整字段
      const keys = Object.keys(response)
      assert.ok(keys.includes('embedder'))
      assert.ok(keys.includes('qdrant'))
    })
  })

  // ─── 🔧 安监视角 ────────────────────────────────────────────────────
  describe('🔧安监 · retrieval-health 角色场景', () => {
    it('安监检查检索模块健康接口不泄露敏感信息', async () => {
      const response = await controller.health()
      // 响应不应包含密码、token、密钥等
      const dangerousKeys = ['password', 'token', 'secret', 'key', 'credential']
      for (const key of dangerousKeys) {
        assert.ok(!(key in response), `不应泄露 ${key}`)
      }
    })

    it('安监验证并发健康检查不会导致服务雪崩', async () => {
      // 50 并发请求
      const results = await Promise.all(Array.from({ length: 50 }, () => controller.health()))
      assert.equal(results.length, 50)
      results.forEach(r => {
        assert.equal(r.module, 'retrieval')
        assert.equal(typeof r.checkedAt, 'string')
      })
    })
  })

  // ─── 🎮 导玩员视角 ──────────────────────────────────────────────────
  describe('🎮导玩员 · retrieval-health 角色场景', () => {
    it('导玩员通过健康状态确认游戏推荐系统可用', async () => {
      const response = await controller.health()
      assert.ok(response.checkedAt)
      assert.equal(response.module, 'retrieval')
    })

    it('导玩员在非高峰时段查看检索系统状态', async () => {
      const response = await controller.health()
      assert.ok(Date.parse(response.checkedAt) > 0, 'checkedAt 应是有效时间')
    })
  })

  // ─── 🎯 运行专员视角 ────────────────────────────────────────────────
  describe('🎯运行专员 · retrieval-health 角色场景', () => {
    it('运行专员查看各组件状态用于系统监控', async () => {
      const response = await controller.health()
      assert.equal(response.qdrant, 'unavailable', '无 Qdrant 实例时返回 unavailable')
      assert.equal(response.embedder, 'unavailable', '无 embedder 时返回 unavailable')
    })

    it('运行专员验证 health 端点返回强类型响应', async () => {
      const response = await controller.health()
      assert.equal(typeof response.qdrant, 'string')
      assert.equal(typeof response.embedder, 'string')
      assert.equal(typeof response.checkedAt, 'string')
      assert.equal(typeof response.module, 'string')
      assert.equal(typeof response.phase, 'string')
      // lastIndexAt 可能为 null
      assert.ok(response.lastIndexAt === null || typeof response.lastIndexAt === 'string')
    })
  })

  // ─── 🤝 团建视角 ────────────────────────────────────────────────────
  describe('🤝团建 · retrieval-health 角色场景', () => {
    it('团建确认检索模块可用于团建活动推荐', async () => {
      const response = await controller.health()
      assert.equal(response.module, 'retrieval')
    })

    it('团建检查 phase 字段用于了解系统迭代阶段', async () => {
      const response = await controller.health()
      assert.equal(response.phase, 'phase-19', '团建关心当前开发阶段')
    })
  })

  // ─── 📢 营销视角 ────────────────────────────────────────────────────
  describe('📢营销 · retrieval-health 角色场景', () => {
    it('营销检查检索系统是否可用于推送个性化内容', async () => {
      const response = await controller.health()
      assert.equal(response.embedder, 'unavailable', 'embedder 不可用影响内容生成')
    })

    it('营销查看健康端点确认服务在营销活动期间可用', async () => {
      const response = await controller.health()
      assert.ok(response.checkedAt)
      assert.equal(response.module, 'retrieval')
    })
  })
})
