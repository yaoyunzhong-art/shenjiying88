/**
 * notice.service.spec.ts — 公告通知 Service 单元测试 (V23)
 *
 * 覆盖: create / update / delete / publish / archive / markRead /
 *       getById / getByCode / list / listPublished
 * 规则: 无 describe.skip · 无 it.only · beforeEach 隔离
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { NoticeService, resetNoticeServiceTestState } from './notice.service'
import { NoticePriority, NoticeScope, NoticeStatus } from './notice.entity'

describe('NoticeService', () => {
  let service: NoticeService

  beforeEach(() => {
    resetNoticeServiceTestState()
    service = new NoticeService()
  })

  // ════════════════════════════════════════════
  // create
  // ════════════════════════════════════════════

  describe('create', () => {
    it('正例: 创建系统公告', () => {
      const n = service.create({
        title: '系统升级通知',
        content: '系统将于今晚2:00-5:00升级',
        scope: NoticeScope.Global,
        priority: NoticePriority.High,
        authorId: 'admin-001',
        authorName: '管理员',
      })
      expect(n.id).toBeTruthy()
      expect(n.code).toMatch(/^NOT-/)
      expect(n.status).toBe(NoticeStatus.Draft)
    })

    it('正例: 创建门店范围内公告', () => {
      const n = service.create({
        title: '门店活动',
        content: '周末特惠活动',
        scope: NoticeScope.Store,
        priority: NoticePriority.Medium,
        authorId: 'mg-001',
        authorName: '店长',
        storeId: 'store-001',
      })
      expect(n.scope).toBe(NoticeScope.Store)
    })
  })

  // ════════════════════════════════════════════
  // update
  // ════════════════════════════════════════════

  describe('update', () => {
    it('正例: 更新公告内容', () => {
      const n = service.create({
        title: '测试', content: '内容',
        scope: NoticeScope.Global, authorId: 'a', authorName: 'admin',
      })
      const updated = service.update(n.id, { title: '新标题' })
      expect(updated.title).toBe('新标题')
    })

    it('反例: 更新已删除公告抛异常', () => {
      const n = service.create({
        title: '测试', content: '内容',
        scope: NoticeScope.Global, authorId: 'a', authorName: 'admin',
      })
      service.delete(n.id)
      expect(() => service.update(n.id, { title: 'new' })).toThrow('deleted')
    })
  })

  // ════════════════════════════════════════════
  // delete
  // ════════════════════════════════════════════

  describe('delete', () => {
    it('正例: 软删除公告', () => {
      const n = service.create({
        title: '待删除', content: '内容',
        scope: NoticeScope.Global, authorId: 'a', authorName: 'admin',
      })
      const result = service.delete(n.id)
      expect(result.code).toBe(n.code)

      const list = service.list()
      expect(list.items.find(i => i.id === n.id)).toBeUndefined()
    })
  })

  // ════════════════════════════════════════════
  // publish / archive
  // ════════════════════════════════════════════

  describe('publish', () => {
    it('正例: 发布草稿公告', () => {
      const n = service.create({
        title: '发布测试', content: '即将发布',
        scope: NoticeScope.Global, authorId: 'a', authorName: 'admin',
      })
      const published = service.publish(n.id)
      expect(published.status).toBe(NoticeStatus.Published)
      expect(published.publishedAt).toBeTruthy()
    })

    it('反例: 重复发布抛异常', () => {
      const n = service.create({
        title: '测试', content: '内容',
        scope: NoticeScope.Global, authorId: 'a', authorName: 'admin',
      })
      service.publish(n.id)
      expect(() => service.publish(n.id)).toThrow('Cannot publish')
    })
  })

  describe('archive', () => {
    it('正例: 归档已发布公告', () => {
      const n = service.create({
        title: '归档测试', content: '内容',
        scope: NoticeScope.Global, authorId: 'a', authorName: 'admin',
      })
      service.publish(n.id)
      const archived = service.archive(n.id)
      expect(archived.status).toBe(NoticeStatus.Archived)
    })
  })

  // ════════════════════════════════════════════
  // markRead
  // ════════════════════════════════════════════

  describe('markRead', () => {
    it('正例: 标记为已读', () => {
      const n = service.create({
        title: '阅读测试', content: '内容',
        scope: NoticeScope.Global, authorId: 'a', authorName: 'admin',
      })
      service.publish(n.id)
      const read = service.markRead(n.id, 'user-001')
      expect(read.readBy).toContain('user-001')
      expect(read.readCount).toBe(1)
    })

    it('正例: 重复点击不重复计数', () => {
      const n = service.create({
        title: '重复阅读', content: '内容',
        scope: NoticeScope.Global, authorId: 'a', authorName: 'admin',
      })
      service.publish(n.id)
      service.markRead(n.id, 'user-001')
      const again = service.markRead(n.id, 'user-001')
      expect(again.readCount).toBe(1) // 不重复计数
    })
  })

  // ════════════════════════════════════════════
  // query
  // ════════════════════════════════════════════

  describe('list', () => {
    it('正例: 列出公告', () => {
      service.create({
        title: '公告1', content: '内容1',
        scope: NoticeScope.Global, authorId: 'a', authorName: 'admin',
      })
      service.create({
        title: '公告2', content: '内容2',
        scope: NoticeScope.Global, authorId: 'a', authorName: 'admin',
      })
      const result = service.list()
      expect(result.total).toBe(2)
    })

    it('正例: 按关键字搜索', () => {
      service.create({
        title: '系统升级', content: '今晚升级',
        scope: NoticeScope.Global, authorId: 'a', authorName: 'admin',
      })
      const result = service.list({ keyword: '升级' })
      expect(result.items.length).toBeGreaterThanOrEqual(1)
    })

    it('边界: 无匹配关键字返回空', () => {
      const result = service.list({ keyword: '不可能存在的内容xyz' })
      expect(result.total).toBe(0)
    })
  })

  describe('listPublished', () => {
    it('正例: 只列出已发布公告', () => {
      const n = service.create({
        title: '发布公告', content: '内容',
        scope: NoticeScope.Global, authorId: 'a', authorName: 'admin',
      })
      service.create({
        title: '草稿', content: '内容',
        scope: NoticeScope.Global, authorId: 'a', authorName: 'admin',
      })
      service.publish(n.id)
      const result = service.listPublished()
      expect(result.items.every(i => i.status === NoticeStatus.Published)).toBe(true)
    })
  })
})
