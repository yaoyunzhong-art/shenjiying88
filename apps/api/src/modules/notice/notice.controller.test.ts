import { describe, it, expect, beforeEach, afterEach } from 'vitest'
/**
 * 🐜 自动: [notice] [D] controller 测试补全
 * 覆盖: metadata 路由定义 + route handler 运行行为 + 正例 + 反例 + 边界
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { NoticeController } from './notice.controller'
import type { NoticeService } from './notice.service'
import {
  NoticePriority,
  NoticeScope,
  NoticeStatus,
  toNotice,
} from './notice.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'

const sampleCtx: RequestTenantContext = {
  tenantId: 't-1',
  brandId: 'b-1',
  storeId: 's-1',
  marketCode: 'cn-mainland',
}

// ── Metadata 测试 ──

describe('NoticeController 路由 metadata', () => {
  it('controller path = "notices"', () => {
    const path = Reflect.getMetadata('path', NoticeController)
    assert.equal(path, 'notices')
  })

  it('POST /notices 路由', () => {
    const method = Reflect.getMetadata(
      'method',
      NoticeController.prototype.create,
    )
    const path = Reflect.getMetadata(
      'path',
      NoticeController.prototype.create,
    )
    assert.equal(method, 1) // POST
    assert.equal(path, '/')
  })

  it('GET /notices 路由', () => {
    const method = Reflect.getMetadata(
      'method',
      NoticeController.prototype.list,
    )
    const path = Reflect.getMetadata('path', NoticeController.prototype.list)
    assert.equal(method, 0) // GET
    assert.equal(path, '/')
  })

  it('GET /notices/published 路由', () => {
    const method = Reflect.getMetadata(
      'method',
      NoticeController.prototype.listPublished,
    )
    const path = Reflect.getMetadata(
      'path',
      NoticeController.prototype.listPublished,
    )
    assert.equal(method, 0) // GET
    assert.equal(path, 'published')
  })

  it('GET /notices/:id 路由', () => {
    const method = Reflect.getMetadata(
      'method',
      NoticeController.prototype.getById,
    )
    const path = Reflect.getMetadata(
      'path',
      NoticeController.prototype.getById,
    )
    assert.equal(method, 0) // GET
    assert.equal(path, ':id')
  })

  it('PATCH /notices/:id 路由', () => {
    const method = Reflect.getMetadata(
      'method',
      NoticeController.prototype.update,
    )
    const path = Reflect.getMetadata(
      'path',
      NoticeController.prototype.update,
    )
    assert.equal(method, 4) // PATCH
    assert.equal(path, ':id')
  })

  it('DELETE /notices/:id 路由', () => {
    const method = Reflect.getMetadata(
      'method',
      NoticeController.prototype.delete,
    )
    const path = Reflect.getMetadata(
      'path',
      NoticeController.prototype.delete,
    )
    assert.equal(method, 3) // DELETE
    assert.equal(path, ':id')
  })

  it('POST /notices/:id/publish 路由', () => {
    const method = Reflect.getMetadata(
      'method',
      NoticeController.prototype.publish,
    )
    const path = Reflect.getMetadata(
      'path',
      NoticeController.prototype.publish,
    )
    assert.equal(method, 1) // POST
    assert.equal(path, ':id/publish')
  })

  it('POST /notices/:id/archive 路由', () => {
    const method = Reflect.getMetadata(
      'method',
      NoticeController.prototype.archive,
    )
    const path = Reflect.getMetadata(
      'path',
      NoticeController.prototype.archive,
    )
    assert.equal(method, 1) // POST
    assert.equal(path, ':id/archive')
  })

  it('POST /notices/:id/read 路由', () => {
    const method = Reflect.getMetadata(
      'method',
      NoticeController.prototype.markRead,
    )
    const path = Reflect.getMetadata(
      'path',
      NoticeController.prototype.markRead,
    )
    assert.equal(method, 1) // POST
    assert.equal(path, ':id/read')
  })
})

// ── 行为测试 - create() ──

describe('NoticeController - create()', () => {
  it('创建公告返回 contract（含 code/status=draft）', () => {
    const notice = toNotice({
      title: '系统升级通知',
      content: '# 系统升级\n7月25日凌晨维护',
      scope: NoticeScope.Tenant,
      priority: NoticePriority.High,
      authorId: 'u-1',
      authorName: '管理员',
      tenantId: 't-1',
    })
    const mockService: Partial<NoticeService> = {
      create: () => ({ ...notice, readBy: ['u-1'], readCount: 1 }),
    }
    const ctrl = new NoticeController(
      mockService as unknown as NoticeService,
    )
    const result = ctrl.create(sampleCtx, {
      title: '系统升级通知',
      content: '# 系统升级\n7月25日凌晨维护',
      scope: NoticeScope.Tenant,
      priority: NoticePriority.High,
      authorId: 'u-1',
      authorName: '管理员',
    } as any)

    assert.equal(result.title, '系统升级通知')
    assert.ok(result.code.startsWith('NOT-'))
    assert.equal(result.status, 'DRAFT')
    assert.equal(result.read, true) // currentUserId = body.authorId
    assert.equal(result.readCount, 1)
  })

  it('body 中的 tenantId 覆盖 tenantContext', () => {
    const calls: any[] = []
    const mockService: Partial<NoticeService> = {
      create: (input: any) => {
        calls.push(input)
        return toNotice(input)
      },
    }
    const ctrl = new NoticeController(
      mockService as unknown as NoticeService,
    )
    ctrl.create(
      sampleCtx,
      {
        title: '跨租户公告',
        content: 'hello',
        scope: NoticeScope.Tenant,
        authorId: 'u-1',
        authorName: 'admin',
        tenantId: 't-override',
      } as any,
    )
    assert.equal(calls[0].tenantId, 't-override')
  })

  it('service 抛出异常向上传播', () => {
    const mockService: Partial<NoticeService> = {
      create: () => {
        throw new Error('title required')
      },
    }
    const ctrl = new NoticeController(
      mockService as unknown as NoticeService,
    )
    assert.throws(
      () =>
        ctrl.create(
          sampleCtx,
          { title: '', content: '' } as any,
        ),
      /title required/,
    )
  })
})

// ── 行为测试 - list() ──

describe('NoticeController - list()', () => {
  it('返回列表总数为 0', () => {
    const mockService: Partial<NoticeService> = {
      list: () => ({ items: [], total: 0 }),
    }
    const ctrl = new NoticeController(
      mockService as unknown as NoticeService,
    )
    const result = ctrl.list(sampleCtx, {})
    assert.deepStrictEqual(result, { items: [], total: 0 })
  })

  it('返回列表带 2 条数据', () => {
    const n1 = toNotice({
      title: '公告1',
      content: '内容1',
      scope: NoticeScope.Tenant,
      authorId: 'u-1',
      authorName: '管理员',
    })
    const n2 = toNotice({
      title: '公告2',
      content: '内容2',
      scope: NoticeScope.Brand,
      authorId: 'u-2',
      authorName: '运营',
    })
    const mockService: Partial<NoticeService> = {
      list: () => ({ items: [n1, n2], total: 2 }),
    }
    const ctrl = new NoticeController(
      mockService as unknown as NoticeService,
    )
    const result = ctrl.list(sampleCtx, {})
    assert.equal(result.total, 2)
    assert.equal(result.items.length, 2)
    assert.equal(result.items[0].code, n1.code)
    assert.equal(result.items[1].code, n2.code)
  })

  it('传递查询参数', () => {
    const calls: any[] = []
    const mockService: Partial<NoticeService> = {
      list: (filters: any) => {
        calls.push(filters)
        return { items: [], total: 0 }
      },
    }
    const ctrl = new NoticeController(
      mockService as unknown as NoticeService,
    )
    ctrl.list(sampleCtx, {
      scope: NoticeScope.Tenant,
      status: NoticeStatus.Published,
      priority: NoticePriority.High,
      keyword: '升级',
      page: 1,
      pageSize: 10,
    })
    assert.equal(calls.length, 1)
    assert.equal(calls[0].scope, 'TENANT')
    assert.equal(calls[0].status, 'PUBLISHED')
    assert.equal(calls[0].priority, 'HIGH')
    assert.equal(calls[0].keyword, '升级')
    assert.equal(calls[0].page, 1)
    assert.equal(calls[0].pageSize, 10)
  })
})

// ── 行为测试 - listPublished() ──

describe('NoticeController - listPublished()', () => {
  it('返回已发布的公告列表', () => {
    const calls: any[] = []
    const mockService: Partial<NoticeService> = {
      listPublished: (filters: any) => {
        calls.push(filters)
        return { items: [], total: 0 }
      },
    }
    const ctrl = new NoticeController(
      mockService as unknown as NoticeService,
    )
    ctrl.listPublished({ scope: NoticeScope.System, priority: NoticePriority.Urgent })
    assert.equal(calls[0].scope, 'SYSTEM')
    assert.equal(calls[0].priority, 'URGENT')
  })
})

// ── 行为测试 - getById() ──

describe('NoticeController - getById()', () => {
  it('返回存在的公告', () => {
    const n = toNotice({
      title: '详情测试',
      content: '详情内容',
      scope: NoticeScope.Store,
      authorId: 'u-1',
      authorName: '店长',
    })
    const mockService: Partial<NoticeService> = {
      getById: () => ({ ...n, readBy: ['u-1'], readCount: 1 }),
    }
    const ctrl = new NoticeController(
      mockService as unknown as NoticeService,
    )
    const result = ctrl.getById(n.id, 'u-1')
    assert.ok(result)
    assert.equal(result!.code, n.code)
    assert.equal(result!.read, true)
  })

  it('返回 null 对不存在的公告', () => {
    const mockService: Partial<NoticeService> = {
      getById: () => undefined,
    }
    const ctrl = new NoticeController(
      mockService as unknown as NoticeService,
    )
    assert.equal(ctrl.getById('nope'), null)
  })
})

// ── 行为测试 - update() ──

describe('NoticeController - update()', () => {
  it('更新公告标题', () => {
    const n = toNotice({
      title: '原标题',
      content: '原内容',
      scope: NoticeScope.Tenant,
      authorId: 'u-1',
      authorName: '管理员',
    })
    const mockService: Partial<NoticeService> = {
      update: () => ({ ...n, title: '新标题', updatedAt: new Date().toISOString() }),
    }
    const ctrl = new NoticeController(
      mockService as unknown as NoticeService,
    )
    const result = ctrl.update(n.id, { title: '新标题' } as any)
    assert.equal(result.title, '新标题')
  })

  it('不存在的公告抛出 NotFoundException', () => {
    const mockService: Partial<NoticeService> = {
      update: () => {
        throw new Error('Notice not found')
      },
    }
    const ctrl = new NoticeController(
      mockService as unknown as NoticeService,
    )
    assert.throws(
      () => ctrl.update('nope', { title: 'new' } as any),
      /Notice not found/,
    )
  })
})

// ── 行为测试 - delete() ──

describe('NoticeController - delete()', () => {
  it('删除成功返回 id 和 code', () => {
    const mockService: Partial<NoticeService> = {
      delete: () => ({ id: 'notice-1', code: 'NOT-20260721-001' }),
    }
    const ctrl = new NoticeController(
      mockService as unknown as NoticeService,
    )
    const result = ctrl.delete('notice-1')
    assert.equal(result.id, 'notice-1')
    assert.equal(result.code, 'NOT-20260721-001')
  })

  it('不存在的公告抛出异常', () => {
    const mockService: Partial<NoticeService> = {
      delete: () => {
        throw new Error('Notice not found')
      },
    }
    const ctrl = new NoticeController(
      mockService as unknown as NoticeService,
    )
    assert.throws(() => ctrl.delete('nope'), /Notice not found/)
  })
})

// ── 行为测试 - publish() ──

describe('NoticeController - publish()', () => {
  it('发布草稿返回 Published 公告', () => {
    const n = toNotice({
      title: '待发布',
      content: '待发布内容',
      scope: NoticeScope.System,
      authorId: 'u-1',
      authorName: 'admin',
    })
    const mockService: Partial<NoticeService> = {
      publish: () => ({
        ...n,
        status: NoticeStatus.Published,
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    }
    const ctrl = new NoticeController(
      mockService as unknown as NoticeService,
    )
    const result = ctrl.publish(n.id)
    assert.equal(result.status, 'PUBLISHED')
    assert.ok(result.publishedAt)
  })

  it('非草稿状态发布失败', () => {
    const mockService: Partial<NoticeService> = {
      publish: () => {
        throw new Error('Cannot publish notice in status PUBLISHED')
      },
    }
    const ctrl = new NoticeController(
      mockService as unknown as NoticeService,
    )
    assert.throws(
      () => ctrl.publish('notice-published'),
      /Cannot publish/,
    )
  })
})

// ── 行为测试 - archive() ──

describe('NoticeController - archive()', () => {
  it('归档已发布公告成功', () => {
    const n = toNotice({
      title: '已发布公告',
      content: 'archive me',
      scope: NoticeScope.Brand,
      authorId: 'u-1',
      authorName: '运营',
    })
    const published = {
      ...n,
      status: NoticeStatus.Published,
      publishedAt: new Date().toISOString(),
    }
    const mockService: Partial<NoticeService> = {
      archive: () => ({
        ...published,
        status: NoticeStatus.Archived,
        archivedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    }
    const ctrl = new NoticeController(
      mockService as unknown as NoticeService,
    )
    const result = ctrl.archive(n.id)
    assert.equal(result.status, 'ARCHIVED')
    assert.ok(result.archivedAt)
  })

  it('草稿状态不可归档', () => {
    const mockService: Partial<NoticeService> = {
      archive: () => {
        throw new Error('Cannot archive notice in status DRAFT')
      },
    }
    const ctrl = new NoticeController(
      mockService as unknown as NoticeService,
    )
    assert.throws(() => ctrl.archive('draft-id'), /Cannot archive/)
  })
})

// ── 行为测试 - markRead() ──

describe('NoticeController - markRead()', () => {
  it('标记已读成功，readCount 递增', () => {
    const n = toNotice({
      title: '已读测试',
      content: 'read me',
      scope: NoticeScope.Store,
      authorId: 'u-1',
      authorName: '店长',
    })
    const mockService: Partial<NoticeService> = {
      markRead: () => ({
        ...n,
        readBy: ['u-2'],
        readCount: 1,
        updatedAt: new Date().toISOString(),
      }),
    }
    const ctrl = new NoticeController(
      mockService as unknown as NoticeService,
    )
    const result = ctrl.markRead(n.id, { userId: 'u-2', userName: '员工A' })
    assert.equal(result.readCount, 1)
    assert.equal(result.read, true) // u-2 在 readBy 里
  })

  it('重复标记已读 readCount 不变', () => {
    const n = toNotice({
      title: '重复已读',
      content: 'already read',
      scope: NoticeScope.Tenant,
      authorId: 'u-1',
      authorName: 'admin',
    })
    const mockService: Partial<NoticeService> = {
      markRead: () => ({
        ...n,
        readBy: ['u-2'],
        readCount: 1,
        updatedAt: n.updatedAt,
      }),
    }
    const ctrl = new NoticeController(
      mockService as unknown as NoticeService,
    )
    const result = ctrl.markRead(n.id, { userId: 'u-2', userName: '员工A' })
    assert.equal(result.readCount, 1)
    assert.equal(result.read, true)
  })

  it('不存在的公告返回异常', () => {
    const mockService: Partial<NoticeService> = {
      markRead: () => {
        throw new Error('Notice not found')
      },
    }
    const ctrl = new NoticeController(
      mockService as unknown as NoticeService,
    )
    assert.throws(
      () => ctrl.markRead('nope', { userId: 'u-1', userName: 'x' }),
      /Notice not found/,
    )
  })
})
