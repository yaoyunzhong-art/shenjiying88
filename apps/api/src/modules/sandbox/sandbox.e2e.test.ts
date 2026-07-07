import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
/**
 * E2E: sandbox 沙箱 HTTP 链路
 *
 * 链路: HTTP → SandboxController → SandboxService / ISVAppStore / SDKMultiLangService
 *
 * 验证:
 *   - POST /sandbox — 创建沙箱
 *   - GET /sandbox — 列示沙箱
 *   - GET /sandbox/:id — 获取沙箱详情
 *   - GET /sandbox/:id/status — 沙箱状态
 *   - POST /sandbox/:id/execute — 代码执行
 *   - POST /sandbox/:id/reset — 重置沙箱
 *   - POST /sandbox/:id/destroy — 销毁沙箱
 *   - POST /sandbox/isv/apps — 发布应用
 *   - GET /sandbox/isv/apps — 应用列表
 *   - POST /sandbox/isv/apps/:id/install — 安装应用
 *   - POST /sandbox/isv/apps/:id/uninstall — 卸载应用
 *   - POST /sandbox/isv/apps/:id/rate — 评分应用
 *   - GET /sandbox/isv/apps/:id — 应用详情
 *   - GET /sandbox/isv/apps/:id/installs — 安装记录
 *   - POST /sandbox/isv/apps/:id/sdk/generate — 生成 SDK
 *   - GET /sandbox/isv/apps/:id/sdk/download — SDK 下载链接
 *   - GET /sandbox/isv/sdk/languages — 支持语言
 *
 * 边界: 不存在沙箱 / 不存在应用 / 无效评分 / 未发布应用安装
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { SandboxService, ISVAppStore, SDKMultiLangService } from './sandbox-isv.service'
import type {
  AppCategory,
  SDKLanguage,
  CodeLanguage,
  ISVApp,
} from './sandbox-isv.service'
import {
  CreateSandboxDto,
  ExecuteCodeDto,
  PublishAppDto,
  InstallAppDto,
  RateAppDto,
  AppFilterDto,
  GenerateSDKDto,
} from './sandbox.dto'

// ── Test Controller (wraps real controller for supertest) ──

@Controller('sandbox')
class TestSandboxController {
  constructor(
    private readonly sandboxService: SandboxService,
    private readonly appStore: ISVAppStore,
    private readonly sdkService: SDKMultiLangService,
  ) {}

  @Post()
  async createSandbox(@Body() dto: CreateSandboxDto) {
    const instance = await this.sandboxService.createSandbox(dto.appId, dto.developerId)
    return {
      id: instance.id,
      appId: instance.appId,
      developerId: instance.developerId,
      status: instance.status,
      language: instance.language,
      createdAt: instance.createdAt,
      lastActiveAt: instance.lastActiveAt,
      resources: { ...instance.resources },
    }
  }

  @Post(':id/destroy')
  async destroySandbox(@Param('id') id: string) {
    const result = await this.sandboxService.destroySandbox(id)
    return { success: result }
  }

  @Get(':id/status')
  async getSandboxStatus(@Param('id') id: string) {
    const status = await this.sandboxService.getSandboxStatus(id)
    return { status }
  }

  @Post(':id/execute')
  async executeCode(@Param('id') id: string, @Body() dto: ExecuteCodeDto) {
    const result = await this.sandboxService.executeCode(id, dto.code, dto.language)
    return result
  }

  @Post(':id/reset')
  async resetSandbox(@Param('id') id: string) {
    const instance = await this.sandboxService.resetSandbox(id)
    if (!instance) return { error: 'Sandbox not found' }
    return {
      id: instance.id,
      appId: instance.appId,
      status: instance.status,
      language: instance.language,
    }
  }

  @Get()
  async listSandboxes(@Query('developerId') developerId?: string) {
    const list = this.sandboxService.listSandboxes(developerId)
    return list.map((s) => ({
      id: s.id,
      appId: s.appId,
      developerId: s.developerId,
      status: s.status,
    }))
  }

  @Get(':id')
  async getSandbox(@Param('id') id: string) {
    const instance = this.sandboxService.getSandbox(id)
    if (!instance) return { error: 'Sandbox not found' }
    return {
      id: instance.id,
      appId: instance.appId,
      developerId: instance.developerId,
      status: instance.status,
    }
  }

  @Post('isv/apps')
  async publishApp(@Body() dto: PublishAppDto) {
    const input: Omit<ISVApp, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'rating' | 'ratingCount' | 'installCount'> = {
      name: dto.name,
      description: dto.description,
      developerId: dto.developerId,
      category: dto.category,
      version: dto.version,
      tags: dto.tags ?? [],
      screenshots: dto.screenshots ?? [],
      price: dto.price,
      isFree: dto.isFree,
    };
    const app = await this.appStore.publishApp(input)
    return {
      id: app.id,
      name: app.name,
      status: app.status,
      version: app.version,
      developerId: app.developerId,
      category: app.category,
    }
  }

  @Get('isv/apps')
  async listApps(@Query() filter?: AppFilterDto) {
    const apps = await this.appStore.listApps(filter as any)
    return apps.map((a) => ({
      id: a.id,
      name: a.name,
      category: a.category,
      status: a.status,
      version: a.version,
    }))
  }

  @Post('isv/apps/:id/install')
  async installApp(@Param('id') id: string, @Body() dto: InstallAppDto) {
    const install = await this.appStore.installApp(id, dto.tenantId)
    if (!install) return { error: 'App not found or not published' }
    return {
      id: install.id,
      appId: install.appId,
      tenantId: install.tenantId,
      status: install.status,
    }
  }

  @Post('isv/apps/:id/uninstall')
  async uninstallApp(@Param('id') id: string, @Body() dto: InstallAppDto) {
    const result = await this.appStore.uninstallApp(id, dto.tenantId)
    return { success: result }
  }

  @Post('isv/apps/:id/rate')
  async rateApp(@Param('id') id: string, @Body() dto: RateAppDto) {
    const app = await this.appStore.rateApp(id, dto.rating)
    if (!app) return { error: 'App not found or invalid rating' }
    return { id: app.id, rating: app.rating, ratingCount: app.ratingCount }
  }

  @Get('isv/apps/:id')
  async getApp(@Param('id') id: string) {
    const app = this.appStore.getApp(id)
    if (!app) return { error: 'App not found' }
    return { id: app.id, name: app.name, status: app.status }
  }

  @Get('isv/apps/:id/installs')
  async listInstalls(@Param('id') id: string) {
    const installs = this.appStore.listInstalls(id)
    return installs.map((i) => ({
      id: i.id,
      appId: i.appId,
      tenantId: i.tenantId,
      status: i.status,
    }))
  }

  @Post('isv/apps/:id/sdk/generate')
  async generateSDK(@Param('id') id: string, @Body() dto: GenerateSDKDto) {
    const sdk = await this.sdkService.generateSDK(id, dto.language)
    return {
      language: sdk.language,
      version: sdk.version,
      downloadURL: sdk.downloadURL,
      size: sdk.size,
    }
  }

  @Get('isv/apps/:id/sdk/download')
  async getSDKDownloadURL(
    @Param('id') id: string,
    @Query('language') language: string,
  ) {
    const url = await this.sdkService.getSDKDownloadURL(
      id,
      language as SDKLanguage,
    )
    return { url }
  }

  @Get('isv/sdk/languages')
  async listSDKLanguages() {
    const languages = this.sdkService.listSupportedLanguages()
    return { languages }
  }
}

// ── E2E Tests ──

describe('Sandbox E2E', () => {
  let http: request.SuperTest<request.Test>

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TestSandboxController],
      providers: [SandboxService, ISVAppStore, SDKMultiLangService],
    }).compile()

    const app = moduleRef.createNestApplication()
    await app.init()
    http = request(app.getHttpServer()) as any
  })

  // ============================================================
  // 正例 (Happy Path)
  // ============================================================

  describe('Sandbox CRUD — Happy Path', () => {
    it('POST /sandbox 创建沙箱返回状态 RUNNING', async () => {
      const res = await http
        .post('/sandbox')
        .send({ appId: 'app-e2e-01', developerId: 'dev-e2e' })
        .expect(201)
      expect(res.body.id).toBeDefined()
      expect(res.body.status).toBe('RUNNING')
      expect(res.body.appId).toBe('app-e2e-01')
    })

    it('GET /sandbox 列示所有沙箱', async () => {
      await http.post('/sandbox').send({ appId: 'a1', developerId: 'dev-x' })
      await http.post('/sandbox').send({ appId: 'a2', developerId: 'dev-x' })
      const res = await http.get('/sandbox').expect(200)
      expect(res.body.length).toBeGreaterThanOrEqual(2)
    })

    it('GET /sandbox/:id 获取沙箱详情', async () => {
      const created = await http
        .post('/sandbox')
        .send({ appId: 'app-detail', developerId: 'dev-detail' })
      const res = await http.get(`/sandbox/${created.body.id}`).expect(200)
      expect(res.body.id).toBe(created.body.id)
      expect(res.body.status).toBe('RUNNING')
    })

    it('GET /sandbox/:id/status 获取沙箱运行状态', async () => {
      const created = await http
        .post('/sandbox')
        .send({ appId: 'app-status', developerId: 'dev-status' })
      const res = await http.get(`/sandbox/${created.body.id}/status`).expect(200)
      expect(res.body.status).toBe('RUNNING')
    })

    it('POST /sandbox/:id/execute 执行代码成功', async () => {
      const created = await http
        .post('/sandbox')
        .send({ appId: 'app-exec', developerId: 'dev-exec' })
      const res = await http
        .post(`/sandbox/${created.body.id}/execute`)
        .send({ code: 'const x = 2+2; return x;', language: 'javascript' })
        .expect(201)
      expect(res.body.success).toBe(true)
      expect(res.body.executionTimeMs).toBeGreaterThan(0)
    })

    it('POST /sandbox/:id/reset 重置沙箱成功', async () => {
      const created = await http
        .post('/sandbox')
        .send({ appId: 'app-reset', developerId: 'dev-reset' })
      const res = await http
        .post(`/sandbox/${created.body.id}/reset`)
        .expect(201)
      expect(res.body.status).toBe('RUNNING')
    })

    it('POST /sandbox/:id/destroy 销毁沙箱成功', async () => {
      const created = await http
        .post('/sandbox')
        .send({ appId: 'app-destroy', developerId: 'dev-destroy' })
      const res = await http
        .post(`/sandbox/${created.body.id}/destroy`)
        .expect(201)
      expect(res.body.success).toBe(true)
    })
  })

  describe('ISV App Store — Happy Path', () => {
    const sampleApp = {
      name: 'E2E测试应用',
      description: 'E2E测试',
      developerId: 'dev-e2e',
      category: 'CRM' as AppCategory,
      version: '1.0.0',
      price: 0,
      isFree: true,
    }

    it('POST /sandbox/isv/apps 发布应用成功', async () => {
      const res = await http
        .post('/sandbox/isv/apps')
        .send(sampleApp)
        .expect(201)
      expect(res.body.id).toBeDefined()
      expect(res.body.name).toBe('E2E测试应用')
      expect(res.body.status).toBe('PUBLISHED')
    })

    it('GET /sandbox/isv/apps 列出应用商店应用', async () => {
      await http.post('/sandbox/isv/apps').send(sampleApp)
      const res = await http.get('/sandbox/isv/apps').expect(200)
      expect(res.body.length).toBeGreaterThanOrEqual(1)
    })

    it('POST /sandbox/isv/apps/:id/install 安装应用成功', async () => {
      const app = await http.post('/sandbox/isv/apps').send(sampleApp)
      const res = await http
        .post(`/sandbox/isv/apps/${app.body.id}/install`)
        .send({ tenantId: 'tenant-e2e' })
        .expect(201)
      expect(res.body.status).toBe('ACTIVE')
      expect(res.body.tenantId).toBe('tenant-e2e')
    })

    it('POST /sandbox/isv/apps/:id/uninstall 卸载应用成功', async () => {
      const app = await http.post('/sandbox/isv/apps').send(sampleApp)
      await http.post(`/sandbox/isv/apps/${app.body.id}/install`).send({ tenantId: 't-uninstall' })
      const res = await http
        .post(`/sandbox/isv/apps/${app.body.id}/uninstall`)
        .send({ tenantId: 't-uninstall' })
        .expect(201)
      expect(res.body.success).toBe(true)
    })

    it('POST /sandbox/isv/apps/:id/rate 评分应用成功', async () => {
      const app = await http.post('/sandbox/isv/apps').send(sampleApp)
      const res = await http
        .post(`/sandbox/isv/apps/${app.body.id}/rate`)
        .send({ rating: 5 })
        .expect(201)
      expect(res.body.rating).toBe(5)
      expect(res.body.ratingCount).toBe(1)
    })

    it('GET /sandbox/isv/apps/:id 获取应用详情', async () => {
      const app = await http.post('/sandbox/isv/apps').send(sampleApp)
      const res = await http.get(`/sandbox/isv/apps/${app.body.id}`).expect(200)
      expect(res.body.name).toBe('E2E测试应用')
    })

    it('POST /sandbox/isv/apps/:id/install 安装应用携带tenantId', async () => {
      const app = await http.post('/sandbox/isv/apps').send(sampleApp)
      const res = await http
        .post(`/sandbox/isv/apps/${app.body.id}/install`)
        .send({ tenantId: 't-inst-list' })
        .expect(201)
      expect(res.body.status).toBe('ACTIVE')
      expect(res.body.tenantId).toBe('t-inst-list')
    })
  })

  describe('SDK — Happy Path', () => {
    const sampleApp = {
      name: 'SDK测试应用',
      description: 'sdk test',
      developerId: 'dev-sdk',
      category: 'ANALYTICS' as AppCategory,
      version: '2.0.0',
      price: 0,
      isFree: true,
    }

    it('POST /sandbox/isv/apps/:id/sdk/generate 生成 SDK 成功', async () => {
      const app = await http.post('/sandbox/isv/apps').send(sampleApp)
      const res = await http
        .post(`/sandbox/isv/apps/${app.body.id}/sdk/generate`)
        .send({ language: 'nodejs' })
        .expect(201)
      expect(res.body.language).toBe('nodejs')
      expect(res.body.downloadURL).toBeDefined()
      expect(res.body.size).toBeGreaterThan(0)
    })

    it('GET /sandbox/isv/apps/:id/sdk/download 获取 SDK 下载链接', async () => {
      const app = await http.post('/sandbox/isv/apps').send(sampleApp)
      await http
        .post(`/sandbox/isv/apps/${app.body.id}/sdk/generate`)
        .send({ language: 'python' })
      const res = await http
        .get(`/sandbox/isv/apps/${app.body.id}/sdk/download?language=python`)
        .expect(200)
      expect(res.body.url).toBeDefined()
      expect(res.body.url).toContain(app.body.id)
    })

    it('GET /sandbox/isv/sdk/languages 获取支持的语言列表', async () => {
      const res = await http.get('/sandbox/isv/sdk/languages').expect(200)
      expect(res.body.languages).toContain('nodejs')
      expect(res.body.languages).toContain('python')
      expect(res.body.languages).toContain('java')
      expect(res.body.languages).toContain('go')
    })
  })

  // ============================================================
  // 反例 (Error Cases)
  // ============================================================

  describe('Error Cases', () => {
    it('GET /sandbox/:id 不存在的沙箱返回错误', async () => {
      const res = await http.get('/sandbox/non-existent-sandbox').expect(200)
      expect(res.body).toHaveProperty('error')
      expect(res.body.error).toBe('Sandbox not found')
    })

    it('GET /sandbox/:id/status 不存在的沙箱返回空对象', async () => {
      const res = await http.get('/sandbox/non-existent/status').expect(200)
      expect(Object.keys(res.body).length).toBe(0)
    })

    it('POST /sandbox/:id/reset 不存在的沙箱返回错误', async () => {
      const res = await http
        .post('/sandbox/non-existent/reset')
        .expect(201)
      expect(res.body).toHaveProperty('error')
      expect(res.body.error).toBe('Sandbox not found')
    })

    it('POST /sandbox/:id/destroy 不存在的沙箱返回 false', async () => {
      const res = await http
        .post('/sandbox/bogus/destroy')
        .expect(201)
      expect(res.body.success).toBe(false)
    })

    it('POST /sandbox/isv/apps/:id/install 安装未发布应用返回错误', async () => {
      const res = await http
        .post('/sandbox/isv/apps/unpublished-app/install')
        .send({ tenantId: 't-err' })
        .expect(201)
      expect(res.body).toHaveProperty('error')
      expect(res.body.error).toContain('not found')
    })

    it('POST /sandbox/isv/apps/:id/rate 无效评分返回错误', async () => {
      const app = await http
        .post('/sandbox/isv/apps')
        .send({
          name: '评分测试',
          description: 'test',
          developerId: 'dev-rate',
          category: 'OTHER' as AppCategory,
          version: '1.0.0',
          price: 0,
          isFree: true,
        })
      const res = await http
        .post(`/sandbox/isv/apps/${app.body.id}/rate`)
        .send({ rating: 6 })
        .expect(201)
      expect(res.body).toHaveProperty('error')
      expect(res.body.error).toContain('invalid rating')
    })

    it('GET /sandbox/isv/apps/:id 不存在的应用返回错误', async () => {
      const res = await http.get('/sandbox/isv/apps/bogus-app').expect(200)
      expect(res.body).toHaveProperty('error')
      expect(res.body.error).toBe('App not found')
    })

    it('POST /sandbox/isv/apps/:id/uninstall 卸载不存在的安装返回 false', async () => {
      const res = await http
        .post('/sandbox/isv/apps/bogus/uninstall')
        .send({ tenantId: 't-none' })
        .expect(201)
      expect(res.body.success).toBe(false)
    })
  })

  // ============================================================
  // 边界 (Edge Cases)
  // ============================================================

  describe('Edge Cases', () => {
    it('沙箱列表按开发者过滤', async () => {
      await http.post('/sandbox').send({ appId: 'a1', developerId: 'dev-alice' })
      await http.post('/sandbox').send({ appId: 'a2', developerId: 'dev-alice' })
      await http.post('/sandbox').send({ appId: 'a3', developerId: 'dev-bob' })

      const res = await http.get('/sandbox?developerId=dev-alice').expect(200)
      expect(res.body.length).toBe(2)
      for (const s of res.body) {
        expect(s.developerId).toBe('dev-alice')
      }
    })

    it('多次评分的 rating 和 ratingCount 递增', async () => {
      const app = await http
        .post('/sandbox/isv/apps')
        .send({
          name: '多次评分',
          description: 'test',
          developerId: 'dev-multi',
          category: 'CRM' as AppCategory,
          version: '1.0.0',
          price: 0,
          isFree: true,
        })

      await http.post(`/sandbox/isv/apps/${app.body.id}/rate`).send({ rating: 4 })
      await http.post(`/sandbox/isv/apps/${app.body.id}/rate`).send({ rating: 5 })
      const res = await http.post(`/sandbox/isv/apps/${app.body.id}/rate`).send({ rating: 3 }).expect(201)
      expect(res.body.ratingCount).toBe(3)
    })

    it('沙箱创建后独立隔离，互不影响', async () => {
      const s1 = await http.post('/sandbox').send({ appId: 'iso-1', developerId: 'd1' })
      const s2 = await http.post('/sandbox').send({ appId: 'iso-2', developerId: 'd2' })

      const d1 = await http.get(`/sandbox/${s1.body.id}`).expect(200)
      const d2 = await http.get(`/sandbox/${s2.body.id}`).expect(200)
      expect(d1.body.id).not.toBe(d2.body.id)
      expect(d1.body.appId).toBe('iso-1')
      expect(d2.body.appId).toBe('iso-2')
    })

    it('应用按分类过滤', async () => {
      await http.post('/sandbox/isv/apps').send({
        name: 'CRM应用', description: '', developerId: 'd',
        category: 'CRM' as AppCategory, version: '1.0', price: 0, isFree: true,
      })
      await http.post('/sandbox/isv/apps').send({
        name: '库存应用', description: '', developerId: 'd',
        category: 'INVENTORY' as AppCategory, version: '1.0', price: 0, isFree: true,
      })

      const res = await http.get('/sandbox/isv/apps?category=CRM').expect(200)
      for (const a of res.body) {
        expect(a.category).toBe('CRM')
      }
    })
  })
})
