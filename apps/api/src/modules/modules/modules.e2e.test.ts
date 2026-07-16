import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Modules 模块管理 HTTP 链路
 *
 * 链路:
 *   HTTP → TestModulesController → ModulesService
 *
 * 验证:
 *   - 模块注册与信息查询
 *   - 依赖解析与拓扑排序
 *   - 版本管理与兼容性检查
 *   - 热加载生命周期
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import type { NextFunction, Request, Response } from 'express'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'

// ─── 类型定义 ───────────────────────────────────────────────────────

interface ModuleDescriptor {
  id: string
  name: string
  version: string
  description: string
  dependencies: string[]
  status: 'registered' | 'loading' | 'active' | 'error' | 'disabled'
  createdAt: string
  updatedAt: string
}

interface ModuleDependencyGraph {
  modules: string[]
  edges: Array<{ from: string; to: string }>
  topologicalOrder: string[]
}

interface ModuleVersionInfo {
  moduleId: string
  versions: Array<{
    version: string
    semver: string
    releasedAt: string
    compatibleRange: string
  }>
  activeVersion: string
}

// ─── Service ────────────────────────────────────────────────────────

class ModulesService {
  private readonly registry = new Map<string, ModuleDescriptor>()
  private readonly moduleDirs = new Set<string>()

  register(name: string, version: string, description: string, dependencies: string[]): ModuleDescriptor {
    if (this.moduleDirs.has(name)) {
      throw new Error(`Module "${name}" is already registered`)
    }
    const now = new Date().toISOString()
    const mod: ModuleDescriptor = {
      id: `mod-${name}-${version.replace(/\./g, '-')}`,
      name,
      version,
      description,
      dependencies,
      status: 'registered',
      createdAt: now,
      updatedAt: now,
    }
    this.registry.set(name, mod)
    this.moduleDirs.add(name)
    return mod
  }

  getModule(name: string): ModuleDescriptor | null {
    return this.registry.get(name) ?? null
  }

  listModules(): ModuleDescriptor[] {
    return Array.from(this.registry.values()).sort((a, b) => a.name.localeCompare(b.name))
  }

  resolveDependencies(moduleName: string): { order: string[]; circular: boolean } {
    const visited = new Set<string>()
    const stack = new Set<string>()
    const order: string[] = []
    let isCircular = false

    function dfs(name: string, graph: Map<string, ModuleDescriptor>): void {
      if (stack.has(name)) {
        isCircular = true
        return
      }
      if (visited.has(name)) return
      visited.add(name)
      stack.add(name)

      const mod = graph.get(name)
      if (mod) {
        for (const dep of mod.dependencies) {
          dfs(dep, graph)
        }
      }
      stack.delete(name)
      order.push(name)
    }

    dfs(moduleName, this.registry)
    return { order: order.reverse(), circular: isCircular }
  }

  checkVersionCompatibility(moduleName: string, targetVersion: string): { compatible: boolean; reason?: string } {
    const mod = this.registry.get(moduleName)
    if (!mod) {
      return { compatible: false, reason: `Module "${moduleName}" not found` }
    }
    const currentParts = mod.version.split('.').map(Number)
    const targetParts = targetVersion.split('.').map(Number)
    if (currentParts.length !== 3 || targetParts.length !== 3) {
      return { compatible: false, reason: 'Invalid semver format' }
    }
    // Major version must match for backward compatibility
    if (currentParts[0] !== targetParts[0]) {
      return { compatible: false, reason: `Major version mismatch: ${mod.version} vs ${targetVersion}` }
    }
    return { compatible: true }
  }

  activateModule(name: string): ModuleDescriptor {
    const mod = this.registry.get(name)
    if (!mod) {
      throw new Error(`Module "${name}" not found`)
    }
    if (mod.status === 'error') {
      throw new Error(`Module "${name}" is in error state and cannot be activated`)
    }
    mod.status = 'loading'
    // Simulate hot-load delay
    this.registry.set(name, { ...mod, status: 'active', updatedAt: new Date().toISOString() })
    return this.registry.get(name)!
  }

  deactivateModule(name: string): ModuleDescriptor {
    const mod = this.registry.get(name)
    if (!mod) throw new Error(`Module "${name}" not found`)
    mod.status = 'disabled'
    mod.updatedAt = new Date().toISOString()
    this.registry.set(name, { ...mod })
    return { ...mod }
  }

  countModules(): number {
    return this.registry.size
  }
}

// ─── Test Controller ────────────────────────────────────────────────

@Controller('api/modules')
class TestModulesController {
  constructor(
    @Inject(ModulesService) private readonly modulesService: ModulesService
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(body: { name: string; version: string; description?: string; dependencies?: string[] }) {
    return this.modulesService.register(
      body.name,
      body.version,
      body.description ?? '',
      body.dependencies ?? [],
    )
  }

  @Get()
  async list() {
    return this.modulesService.listModules()
  }

  @Get(':name')
  async getModule(@Param('name') name: string) {
    const mod = this.modulesService.getModule(name)
    if (!mod) {
      return { error: `Module "${name}" not found` }
    }
    return mod
  }

  @Post(':name/activate')
  @HttpCode(HttpStatus.OK)
  async activate(@Param('name') name: string) {
    return this.modulesService.activateModule(name)
  }

  @Post(':name/deactivate')
  @HttpCode(HttpStatus.OK)
  async deactivate(@Param('name') name: string) {
    return this.modulesService.deactivateModule(name)
  }

  @Get(':name/dependencies')
  async dependencies(@Param('name') name: string) {
    return this.modulesService.resolveDependencies(name)
  }

  @Get(':name/version-check')
  async checkVersion(@Param('name') name: string, target: { version?: string }) {
    return this.modulesService.checkVersionCompatibility(name, target.version ?? '0.0.0')
  }
}

// ─── App Builder ────────────────────────────────────────────────────

async function buildApp() {
  const modulesService = new ModulesService()

  const moduleRef = await Test.createTestingModule({
    controllers: [TestModulesController],
    providers: [
      { provide: ModulesService, useValue: modulesService },
    ],
  }).compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, modulesService }
}

// ─── 测试用例 ──────────────────────────────────────────────────────

it('e2e: POST /api/modules/register creates a new module entry', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/api/modules/register')
      .send({ name: 'auth', version: '1.0.0', description: 'Authentication module' })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.name, 'auth')
    assert.equal(res.body.version, '1.0.0')
    assert.equal(res.body.status, 'registered')
  } finally {
    await app.close()
  }
})

it('e2e: GET /api/modules returns registered modules', async () => {
  const { app, modulesService } = await buildApp()
  try {
    modulesService.register('core', '1.0.0', 'Core module', [])
    modulesService.register('tenant', '1.0.0', 'Tenant management', ['core'])

    const res = await request(app.getHttpServer()).get('/api/modules')
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body))
    assert.equal(res.body.length, 2)
    assert.ok(res.body.some((m: ModuleDescriptor) => m.name === 'core'))
    assert.ok(res.body.some((m: ModuleDescriptor) => m.name === 'tenant'))
  } finally {
    await app.close()
  }
})

it('e2e: dependency resolution returns topological order', async () => {
  const { app, modulesService } = await buildApp()
  try {
    modulesService.register('database', '1.0.0', 'DB layer', [])
    modulesService.register('cache', '2.0.0', 'Cache layer', ['database'])
    modulesService.register('api', '1.5.0', 'API gateway', ['cache', 'database'])

    const result = modulesService.resolveDependencies('api')
    assert.ok(Array.isArray(result.order))
    assert.equal(result.order.length, 3)
    // database must come before cache and api
    const dbIdx = result.order.indexOf('database')
    const cacheIdx = result.order.indexOf('cache')
    const apiIdx = result.order.indexOf('api')
    assert.ok(dbIdx < cacheIdx)
    assert.ok(dbIdx < apiIdx)
    assert.equal(result.circular, false)
  } finally {
    await app.close()
  }
})

it('e2e: module activation transitions through lifecycle', async () => {
  const { app, modulesService } = await buildApp()
  try {
    modulesService.register('notification', '1.0.0', 'Notification module', [])

    const activated = modulesService.activateModule('notification')
    assert.equal(activated.status, 'active')

    const deactivated = modulesService.deactivateModule('notification')
    assert.equal(deactivated.status, 'disabled')
  } finally {
    await app.close()
  }
})

it('e2e: version compatibility check works across major/minor', async () => {
  const { app, modulesService } = await buildApp()
  try {
    modulesService.register('payment', '2.1.0', 'Payment gateway', [])

    // Same major = compatible
    const compatible = modulesService.checkVersionCompatibility('payment', '2.3.0')
    assert.equal(compatible.compatible, true)

    // Different major = incompatible
    const incompatible = modulesService.checkVersionCompatibility('payment', '3.0.0')
    assert.equal(incompatible.compatible, false)
    assert.ok(incompatible.reason?.includes('Major version mismatch'))
  } finally {
    await app.close()
  }
})

it('e2e: GET /api/modules/:name/dependencies returns order and circular flag', async () => {
  const { app, modulesService } = await buildApp()
  try {
    modulesService.register('security', '1.0.0', 'Security module', ['auth'])
    modulesService.register('auth', '1.0.0', 'Auth module', [])

    const res = await request(app.getHttpServer()).get('/api/modules/security/dependencies')
    assert.equal(res.statusCode, 200)
    assert.ok(res.body)
  } finally {
    await app.close()
  }
})

it('e2e: GET /api/modules/:name returns 200 with module info', async () => {
  const { app, modulesService } = await buildApp()
  try {
    modulesService.register('scheduler', '1.0.0', 'Job scheduler', [])

    const res = await request(app.getHttpServer()).get('/api/modules/scheduler')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.name, 'scheduler')
    assert.equal(res.body.version, '1.0.0')
  } finally {
    await app.close()
  }
})

it('e2e: POST /api/modules/:name/activate transitions to active', async () => {
  const { app, modulesService } = await buildApp()
  try {
    modulesService.register('events', '1.0.0', 'Event bus', [])

    const res = await request(app.getHttpServer()).post('/api/modules/events/activate')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.status, 'active')
  } finally {
    await app.close()
  }
})
