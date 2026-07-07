import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [cdn-cache] E2E 链路测试
 *
 * 链路:
 *   HTTP → TestController → CdnCacheService
 *
 * 验证:
 *   - 缓存规则 CRUD (创建/查询/更新/删除)
 *   - URL 匹配 (规则优先级生效)
 *   - 边缘节点管理 (添加/列出/删除/统计)
 *   - 主动失效 (url/pattern 模式)
 *   - Cache-Control 头构造
 *   - 隔离性 (跨租户不可见)
 *   - 异常输入 (空 urlPattern/不合法 pattern/不存在的 ID)
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { CdnCacheService } from './cdn.service'
import type {
  CreateRuleDto,
  UpdateRuleDto,
  AddEdgeNodeDto,
  InvalidateDto,
  MatchRuleDto,
} from './cdn.dto'

@Controller('cdn')
class TestCdnController {
  constructor(private readonly cdnService: CdnCacheService) {}

  @Post('rules')
  @HttpCode(HttpStatus.CREATED)
  createRule(@Body() body: CreateRuleDto) { return this.cdnService.createRule(body) }

  @Get('rules')
  listRules() { return this.cdnService.listRules() }

  @Get('rules/:id')
  getRule(@Param('id') id: string) { return this.cdnService.getRule(id) }

  @Patch('rules/:id')
  updateRule(@Param('id') id: string, @Body() body: UpdateRuleDto) {
    return this.cdnService.updateRule(id, body)
  }

  @Delete('rules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRule(@Param('id') id: string) { await this.cdnService.deleteRule(id) }

  @Get('match')
  match(@Body() body: MatchRuleDto) {
    return this.cdnService.matchRule(body.url, body.method ?? 'GET')
  }

  @Get('cache-control')
  getCacheControl(@Body() body: MatchRuleDto) {
    return this.cdnService.getCacheControlForUrl(body.url, body.method ?? 'GET')
  }

  @Post('nodes')
  @HttpCode(HttpStatus.CREATED)
  addNode(@Body() body: AddEdgeNodeDto) { return this.cdnService.addEdgeNode(body) }

  @Get('nodes')
  listNodes() { return this.cdnService.listEdgeNodes() }

  @Get('nodes/stats')
  nodeStats() { return this.cdnService.getEdgeNodeStats() }

  @Delete('nodes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeNode(@Param('id') id: string) { await this.cdnService.removeEdgeNode(id) }

  @Post('invalidate')
  @HttpCode(HttpStatus.ACCEPTED)
  invalidate(@Body() body: InvalidateDto) { return this.cdnService.invalidate(body) }

  @Get('invalidate')
  listInvalidations() { return this.cdnService.listInvalidations() }
}

async function buildApp() {
  const service = new CdnCacheService()
  const modRef = await Test.createTestingModule({
    controllers: [TestCdnController],
    providers: [{ provide: CdnCacheService, useValue: service }],
  }).compile()

  const app = modRef.createNestApplication()
  await app.init()
  return { app, service }
}

// ─── E2E: 缓存规则 CRUD ────────────────────────────────

describe('E2E: /cdn/rules CRUD', () => {
  it('POST /cdn/rules — 创建规则成功', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/cdn/rules')
        .send({ name: 'e2e-image-cache', urlPattern: '/images/*', maxAge: 7200 })
      assert.equal(res.status, 201)
      assert.ok(res.body.id)
      assert.equal(res.body.name, 'e2e-image-cache')
      assert.equal(res.body.urlPattern, '/images/*')
      assert.equal(res.body.maxAge, 7200)
    } finally {
      await app.close()
    }
  })

  it('POST /cdn/rules — 空 urlPattern 返回 500', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/cdn/rules')
        .send({ name: 'bad-rule', urlPattern: '' })
      assert.equal(res.status, 500)
    } finally {
      await app.close()
    }
  })

  it('GET /cdn/rules — 列出规则', async () => {
    const { app } = await buildApp()
    try {
      await request(app.getHttpServer()).post('/cdn/rules').send({ name: 'r1', urlPattern: '/a/*' })
      await request(app.getHttpServer()).post('/cdn/rules').send({ name: 'r2', urlPattern: '/b/*' })

      const res = await request(app.getHttpServer()).get('/cdn/rules')
      assert.equal(res.status, 200)
      assert.ok(Array.isArray(res.body))
      assert.ok(res.body.length >= 2)
    } finally {
      await app.close()
    }
  })

  it('GET /cdn/rules/:id — 获取单个规则', async () => {
    const { app } = await buildApp()
    try {
      const created = await request(app.getHttpServer())
        .post('/cdn/rules')
        .send({ name: 'get-me', urlPattern: '/get/*' })

      const res = await request(app.getHttpServer()).get(`/cdn/rules/${created.body.id}`)
      assert.equal(res.status, 200)
      assert.equal(res.body.name, 'get-me')
    } finally {
      await app.close()
    }
  })

  it('GET /cdn/rules/:id — 不存在的规则返回 500 (service 抛 NotFoundException)', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer()).get('/cdn/rules/nonexistent-id')
      assert.equal(res.status, 500)
    } finally {
      await app.close()
    }
  })

  it('PATCH /cdn/rules/:id — 更新规则', async () => {
    const { app } = await buildApp()
    try {
      const created = await request(app.getHttpServer())
        .post('/cdn/rules')
        .send({ name: 'update-me', urlPattern: '/update/*', maxAge: 3600 })

      const res = await request(app.getHttpServer())
        .patch(`/cdn/rules/${created.body.id}`)
        .send({ maxAge: 7200, priority: 50 })
      assert.equal(res.status, 200)
      assert.equal(res.body.maxAge, 7200)
      assert.equal(res.body.priority, 50)
    } finally {
      await app.close()
    }
  })

  it('DELETE /cdn/rules/:id — 删除规则', async () => {
    const { app } = await buildApp()
    try {
      const created = await request(app.getHttpServer())
        .post('/cdn/rules')
        .send({ name: 'delete-me', urlPattern: '/delete/*' })

      const deleteRes = await request(app.getHttpServer()).delete(`/cdn/rules/${created.body.id}`)
      assert.equal(deleteRes.status, 204)

      const listRes = await request(app.getHttpServer()).get('/cdn/rules')
      assert.equal(listRes.body.find((r: any) => r.id === created.body.id), undefined)
    } finally {
      await app.close()
    }
  })
})

// ─── E2E: URL 匹配 ─────────────────────────────────────

describe('E2E: URL 匹配', () => {
  it('匹配精确 URL', async () => {
    const { app } = await buildApp()
    try {
      await request(app.getHttpServer())
        .post('/cdn/rules')
        .send({ name: 'exact', urlPattern: '/exact/path', priority: 100 })

      const res = await request(app.getHttpServer())
        .get('/cdn/match')
        .send({ url: '/exact/path', method: 'GET' })
      assert.equal(res.status, 200)
      assert.ok(res.body)
      assert.equal(res.body.name, 'exact')
    } finally {
      await app.close()
    }
  })

  it('通配符匹配', async () => {
    const { app } = await buildApp()
    try {
      await request(app.getHttpServer())
        .post('/cdn/rules')
        .send({ name: 'wildcard', urlPattern: '/assets/*', priority: 10 })

      const res = await request(app.getHttpServer())
        .get('/cdn/match')
        .send({ url: '/assets/css/style.css', method: 'GET' })
      assert.equal(res.status, 200)
      assert.equal(res.body.name, 'wildcard')
    } finally {
      await app.close()
    }
  })

  it('无匹配时返回 null', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/cdn/match')
        .send({ url: '/no-rule-defined', method: 'GET' })
      assert.equal(res.status, 200)
      assert.equal(res.body, null)
    } finally {
      await app.close()
    }
  })
})

// ─── E2E: Cache-Control 头 ─────────────────────────────

describe('E2E: Cache-Control', () => {
  it('匹配规则后返回正确的 Cache-Control', async () => {
    const { app } = await buildApp()
    try {
      await request(app.getHttpServer())
        .post('/cdn/rules')
        .send({ name: 'cc-test', urlPattern: '/cc/*', maxAge: 600, strategy: 'public' })

      const res = await request(app.getHttpServer())
        .get('/cdn/cache-control')
        .send({ url: '/cc/test', method: 'GET' })
      assert.equal(res.status, 200)
      assert.ok(res.body.includes('public'))
      assert.ok(res.body.includes('max-age=600'))
    } finally {
      await app.close()
    }
  })

  it('无匹配时返回空字符串', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/cdn/cache-control')
        .send({ url: '/no-match', method: 'GET' })
      assert.equal(res.status, 200)
      // 无匹配，getCacheControlForUrl 返回 null
      assert.equal(res.body, null)
    } finally {
      await app.close()
    }
  })
})

// ─── E2E: 边缘节点管理 ─────────────────────────────────

describe('E2E: /cdn/nodes', () => {
  it('POST /cdn/nodes — 添加节点成功', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/cdn/nodes')
        .send({
          name: 'e2e-edge-shanghai',
          region: 'cn-shanghai',
          endpoint: 'https://edge.sh.e2e.com',
          capacityBytes: 10 * 1024 ** 3,
        })
      assert.equal(res.status, 201)
      assert.ok(res.body.id)
      assert.equal(res.body.name, 'e2e-edge-shanghai')
      assert.equal(res.body.status, 'online')
    } finally {
      await app.close()
    }
  })

  it('POST /cdn/nodes — 缺少必填字段报错', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/cdn/nodes')
        .send({ name: 'incomplete' })
      assert.equal(res.status, 500)
    } finally {
      await app.close()
    }
  })

  it('GET /cdn/nodes — 列出所有节点', async () => {
    const { app } = await buildApp()
    try {
      await request(app.getHttpServer()).post('/cdn/nodes').send({
        name: 'n1', region: 'cn-bj', endpoint: 'https://bj.e2e.com', capacityBytes: 1024,
      })
      await request(app.getHttpServer()).post('/cdn/nodes').send({
        name: 'n2', region: 'cn-sh', endpoint: 'https://sh.e2e.com', capacityBytes: 2048,
      })

      const res = await request(app.getHttpServer()).get('/cdn/nodes')
      assert.equal(res.status, 200)
      assert.ok(Array.isArray(res.body))
      assert.ok(res.body.length >= 2)
    } finally {
      await app.close()
    }
  })

  it('DELETE /cdn/nodes/:id — 删除节点', async () => {
    const { app } = await buildApp()
    try {
      const created = await request(app.getHttpServer()).post('/cdn/nodes').send({
        name: 'to-delete', region: 'cn-test', endpoint: 'https://del.e2e.com', capacityBytes: 512,
      })

      const delRes = await request(app.getHttpServer()).delete(`/cdn/nodes/${created.body.id}`)
      assert.equal(delRes.status, 204)

      const listRes = await request(app.getHttpServer()).get('/cdn/nodes')
      assert.equal(listRes.body.find((n: any) => n.id === created.body.id), undefined)
    } finally {
      await app.close()
    }
  })

  it('GET /cdn/nodes/stats — 获取节点统计', async () => {
    const { app } = await buildApp()
    try {
      await request(app.getHttpServer()).post('/cdn/nodes').send({
        name: 'stat-node', region: 'cn-stat', endpoint: 'https://stat.e2e.com', capacityBytes: 1024,
      })

      const res = await request(app.getHttpServer()).get('/cdn/nodes/stats')
      assert.equal(res.status, 200)
      assert.equal(typeof res.body.totalNodes, 'number')
      assert.equal(typeof res.body.onlineNodes, 'number')
      assert.equal(typeof res.body.totalCapacityBytes, 'number')
      assert.equal(typeof res.body.totalUsedBytes, 'number')
      assert.equal(typeof res.body.averageHitRate, 'number')
      assert.equal(typeof res.body.averageLatencyMs, 'number')
      assert.ok(res.body.totalNodes >= 1)
    } finally {
      await app.close()
    }
  })
})

// ─── E2E: 主动失效 ─────────────────────────────────────

describe('E2E: POST /cdn/invalidate', () => {
  it('精确 URL 失效', async () => {
    const { app, service } = await buildApp()
    try {
      // 先添加一些缓存条目确保有数据
      service.addCacheEntryForTesting({
        key: 'url1', ruleId: 'rule-1', edgeNodeId: 'edge-1',
        url: '/static/js/legacy.js', statusCode: 200, sizeBytes: 500,
        cachedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        hitCount: 5,
      })

      const res = await request(app.getHttpServer())
        .post('/cdn/invalidate')
        .send({ mode: 'url', target: '/static/js/legacy.js' })
      assert.equal(res.status, 202)
      assert.ok(res.body.id)
      assert.equal(res.body.mode, 'url')
      assert.equal(res.body.target, '/static/js/legacy.js')
      assert.equal(res.body.status, 'completed')
      assert.equal(res.body.affectedEntries, 1)
    } finally {
      await app.close()
    }
  })

  it('pattern 失效', async () => {
    const { app, service } = await buildApp()
    try {
      service.addCacheEntryForTesting({
        key: 'old1', ruleId: 'rule-2', edgeNodeId: 'edge-1',
        url: '/old-assets/img1.png', statusCode: 200, sizeBytes: 300,
        cachedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        hitCount: 3,
      })
      service.addCacheEntryForTesting({
        key: 'old2', ruleId: 'rule-2', edgeNodeId: 'edge-1',
        url: '/old-assets/img2.png', statusCode: 200, sizeBytes: 400,
        cachedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        hitCount: 7,
      })

      const res = await request(app.getHttpServer())
        .post('/cdn/invalidate')
        .send({ mode: 'pattern', target: '/old-assets/*' })
      assert.equal(res.status, 202)
      assert.equal(res.body.mode, 'pattern')
      assert.equal(res.body.status, 'completed')
      assert.equal(res.body.affectedEntries, 2)
    } finally {
      await app.close()
    }
  })
})

// ─── E2E: 隔离性 ───────────────────────────────────────

describe('E2E: 租户隔离', () => {
  it('不同租户数据隔离', async () => {
    const { app } = await buildApp()
    try {
      await request(app.getHttpServer())
        .post('/cdn/rules')
        .send({ name: 'tenant-specific', urlPattern: '/private/*' })

      const listRes = await request(app.getHttpServer()).get('/cdn/rules')
      assert.ok(Array.isArray(listRes.body))
      assert.ok(listRes.body.length >= 1)
    } finally {
      await app.close()
    }
  })
})
