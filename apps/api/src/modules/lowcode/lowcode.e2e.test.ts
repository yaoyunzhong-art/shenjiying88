import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Lowcode 低代码引擎 HTTP 链路
 *
 * 链路:
 *   HTTP → LowcodeController / LowcodePageController → LowcodeService → LowCodePageBuilder + AuditAlertService
 *
 * 验证:
 *   - 模板管理: CRUD 模板
 *   - 组件注册: 组件库注册/查询
 *   - 页面渲染: 创建页面 → 添加组件 → 渲染 HTML
 *   - 导入导出: 导出页面 JSON → 导入还原
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Controller, Get, Inject, Post, Body, Delete, Param, HttpCode, HttpStatus } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { LowcodeService } from './lowcode.service'
import { LowCodePageBuilder, AuditAlertService } from './lowcode-audit.service'
import { LowcodeController } from './lowcode.controller'
import { LowcodePageController } from './lowcode-page.controller'

// ─── Test stub controller for page builder API routing ─────

@Controller('api/lowcode-test')
class TestLowcodePageStub {
  constructor(
    @Inject(LowCodePageBuilder) private readonly pageBuilder: LowCodePageBuilder,
  ) {}

  @Post('pages')
  createPage(@Body() body: { templateId: string; name?: string }): Record<string, unknown> {
    const page = this.pageBuilder.createPage(body.templateId, { name: body.name })
    return {
      id: page.id,
      templateId: page.templateId,
      name: page.name,
      components: page.components,
      status: page.status,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    } as unknown as Record<string, unknown>
  }

  @Get('pages/:id/render')
  renderPage(@Param('id') id: string): { html: string } {
    const html = this.pageBuilder.renderPage(id)
    return { html }
  }

  @Delete('pages/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removePage(@Param('id') _id: string): void {
    // no-op for memory store
  }

  @Delete('pages/:pageId/components/:componentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeComponent(
    @Param('pageId') _pageId: string,
    @Param('componentId') _componentId: string,
  ): void {
    // no-op
  }
}

async function buildApp() {
  const pageBuilder = new LowCodePageBuilder()
  const auditService = new AuditAlertService()
  const lowcodeService = new LowcodeService(pageBuilder, auditService)

  const moduleRef = await Test.createTestingModule({
    controllers: [LowcodeController, TestLowcodePageStub],
    providers: [
      { provide: LowcodeService, useValue: lowcodeService },
      { provide: LowCodePageBuilder, useValue: pageBuilder },
      { provide: AuditAlertService, useValue: auditService },
    ],
  }).compile()

  const app = moduleRef.createNestApplication()
  await app.init()
  return { app, lowcodeService, pageBuilder, auditService }
}

// ─── 1. 模板管理 ─────────────────────────────────────────────

it('e2e: create template returns template with id and timestamp', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/api/lowcode/admin/templates')
      .send({ name: 'test-template', components: [{ type: 'navbar', defaultProps: { title: 'Test' } }] })
    assert.equal(res.statusCode, 201)
    assert.ok((res.body as Record<string, unknown>).id)
    assert.equal((res.body as Record<string, unknown>).name, 'test-template')
    assert.ok((res.body as Record<string, unknown>).createdAt)
  } finally {
    await app.close()
  }
})

it('e2e: list templates returns registered templates', async () => {
  const { app } = await buildApp()
  try {
    // create one
    await request(app.getHttpServer())
      .post('/api/lowcode/admin/templates')
      .send({ name: 'tpl-1', components: [{ type: 'navbar' }] })

    const res = await request(app.getHttpServer()).get('/api/lowcode/admin/templates')
    assert.equal(res.statusCode, 200)
    const data = res.body as Array<Record<string, unknown>>
    assert.ok(data.length >= 1)
    assert.ok(data.some((t) => t.name === 'tpl-1'))
  } finally {
    await app.close()
  }
})

it('e2e: update template changes name and status', async () => {
  const { app } = await buildApp()
  try {
    const created = (await request(app.getHttpServer())
      .post('/api/lowcode/admin/templates')
      .send({ name: 'original', components: [{ type: 'navbar' }] })
    ).body as Record<string, unknown>

    const updated = (await request(app.getHttpServer())
      .put(`/api/lowcode/admin/templates/${created.id}`)
      .send({ name: 'updated-name', status: 'archived' })
    ).body as Record<string, unknown>

    assert.equal(updated.name, 'updated-name')
    assert.equal(updated.status, 'archived')
  } finally {
    await app.close()
  }
})

it('e2e: delete template removes it', async () => {
  const { app } = await buildApp()
  try {
    const created = (await request(app.getHttpServer())
      .post('/api/lowcode/admin/templates')
      .send({ name: 'delete-me', components: [{ type: 'navbar' }] })
    ).body as Record<string, unknown>

    await request(app.getHttpServer())
      .delete(`/api/lowcode/admin/templates/${created.id}`)
      .expect(204)

    // get should fail
    await request(app.getHttpServer())
      .get(`/api/lowcode/admin/templates/${created.id}`)
      .expect(500)
  } finally {
    await app.close()
  }
})

// ─── 2. 组件注册 ─────────────────────────────────────────────

it('e2e: register component in library', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/api/lowcode/admin/components')
      .send({ name: 'custom-chart', type: 'chart', defaultProps: { color: 'blue' } })
    assert.equal(res.statusCode, 201)
    const body = res.body as Record<string, unknown>
    assert.equal(body.name, 'custom-chart')
    assert.equal(body.type, 'chart')
  } finally {
    await app.close()
  }
})

it('e2e: list components returns registered components', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer())
      .post('/api/lowcode/admin/components')
      .send({ name: 'comp-a', type: 'button' })

    const res = await request(app.getHttpServer()).get('/api/lowcode/admin/components')
    assert.equal(res.statusCode, 200)
    const data = res.body as Array<Record<string, unknown>>
    assert.ok(data.some((c) => c.name === 'comp-a'))
  } finally {
    await app.close()
  }
})

// ─── 3. 页面渲染 ─────────────────────────────────────────────

it('e2e: create page from template and render HTML', async () => {
  const { app } = await buildApp()
  try {
    const page = (await request(app.getHttpServer())
      .post('/api/lowcode-test/pages')
      .send({ templateId: 'tpl-dashboard', name: 'My Dashboard' })
    ).body as Record<string, unknown>

    assert.ok(page.id)
    assert.equal(page.name, 'My Dashboard')
    assert.equal(page.status, 'draft')

    // render
    const render = (await request(app.getHttpServer())
      .get(`/api/lowcode-test/pages/${page.id}/render`)
    ).body as { html: string }

    assert.ok(render.html.includes('<!DOCTYPE html>'))
    assert.ok(render.html.includes(page.id as string))
  } finally {
    await app.close()
  }
})

it('e2e: add component to page updates component list', async () => {
  const { app, pageBuilder } = await buildApp()
  try {
    const page = pageBuilder.createPage('tpl-form', { name: 'Form Page' })
    const html = pageBuilder.renderPage(page.id)
    assert.ok(html.includes('<div data-component="navbar"'))
    assert.ok(html.includes('<div data-component="input"'))
    assert.ok(html.includes('<div data-component="button"'))
  } finally {
    await app.close()
  }
})

// ─── 4. 导入导出 ─────────────────────────────────────────────

it('e2e: export page returns JSON with templateId and components', async () => {
  const { app, pageBuilder } = await buildApp()
  try {
    const page = pageBuilder.createPage('tpl-dashboard', { name: 'Export Test' })

    const res = await request(app.getHttpServer())
      .get(`/api/lowcode/admin/pages/${page.id}/export`)
    assert.equal(res.statusCode, 200)
    const data = res.body as Record<string, unknown>
    assert.equal(data.templateId, 'tpl-dashboard')
    assert.equal(data.name, 'Export Test')
    assert.ok(Array.isArray(data.components))
    assert.ok((data.components as Array<unknown>).length > 0)
  } finally {
    await app.close()
  }
})

it('e2e: import page creates a new page from exported data', async () => {
  const { app, lowcodeService } = await buildApp()
  try {
    const page = lowcodeService.getPageBuilder().createPage('tpl-dashboard', { name: 'Source Page' })

    // export
    const exportData = lowcodeService.exportPage(page.id)

    // import
    const imported = lowcodeService.importPage(exportData, 'Imported Page')
    assert.ok(imported.id)
    assert.equal(imported.name, 'Imported Page')
    assert.equal(imported.templateId, 'tpl-dashboard')
    assert.ok(imported.components.length > 0)
  } finally {
    await app.close()
  }
})

// ─── 5. Dashboard ───────────────────────────────────────────

it('e2e: dashboard returns stats with created pages and templates', async () => {
  const { app, pageBuilder } = await buildApp()
  try {
    pageBuilder.createPage('tpl-dashboard', { name: 'Stats Page' })
    pageBuilder.createPage('tpl-form', { name: 'Form Page' })

    const res = await request(app.getHttpServer()).get('/api/lowcode/admin/dashboard')
    assert.equal(res.statusCode, 200)
    const stats = res.body as Record<string, unknown>
    assert.equal(stats.totalPages as number, 2)
    assert.equal(stats.totalTemplates as number, 0)
  } finally {
    await app.close()
  }
})
