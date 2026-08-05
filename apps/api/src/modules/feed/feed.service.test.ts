/**
 * feed.service.spec.ts — 信息流服务 V23 全覆盖测试
 *
 * 覆盖:
 *   - getFeed (无筛选/按渠道/按状态/分页)
 *   - getPost (存在/不存在)
 *   - createPost
 *   - likePost / unlikePost (点赞/取消/幂等)
 *   - commentPost
 *   - subscribeFeed / unsubscribeFeed / getSubscriptions
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { FeedService } from './feed.service'

describe('FeedService', () => {
  let service: FeedService

  beforeEach(() => {
    service = new FeedService()
  })

  // ── getFeed ──────────────────────────────────────────────────────────────

  describe('getFeed', () => {
    it('正例: 应返回已发布的帖子', () => {
      const feed = service.getFeed()
      expect(feed.length).toBeGreaterThan(0)
      feed.forEach(p => expect(p.status).toBe('published'))
    })

    it('正例: 按渠道筛选', () => {
      const system = service.getFeed('system')
      system.forEach(p => expect(p.channel).toBe('system'))
    })

    it('正例: 按状态筛选', () => {
      const drafts = service.getFeed(undefined, 'draft')
      expect(drafts).toHaveLength(0) // no drafts initially
    })

    it('正例: 分页应正确', () => {
      // Create extra posts
      service.createPost({ channel: 'promotion', title: '额外1', content: 'c', authorId: 'u1', authorName: 'u1' })
      service.createPost({ channel: 'promotion', title: '额外2', content: 'c', authorId: 'u1', authorName: 'u1' })
      const first = service.getFeed(undefined, undefined, 2, 0)
      expect(first).toHaveLength(2)
      const second = service.getFeed(undefined, undefined, 2, 2)
      expect(second).toHaveLength(1)
    })
  })

  // ── getPost ──────────────────────────────────────────────────────────────

  describe('getPost', () => {
    it('正例: 按 ID 获取应返回帖子', () => {
      const feed = service.getFeed()
      const post = service.getPost(feed[0].id)
      expect(post.title).toBeTruthy()
    })

    it('异常: 不存应抛 NotFoundException', () => {
      expect(() => service.getPost('nonexistent')).toThrow()
    })
  })

  // ── createPost ───────────────────────────────────────────────────────────

  describe('createPost', () => {
    it('正例: 创建帖子应返回 published 状态', () => {
      const post = service.createPost({
        channel: 'activity', title: '新活动上线',
        content: '暑期特惠已开启', authorId: 'u1', authorName: '运营',
        tags: ['活动'],
      })
      expect(post.id).toBeTruthy()
      expect(post.status).toBe('published')
      expect(post.likes).toBe(0)
      expect(post.likedBy).toEqual([])
    })
  })

  // ── likePost / unlikePost ────────────────────────────────────────────────

  describe('likes', () => {
    it('正例: likePost 应增加点赞数', () => {
      const feed = service.getFeed()
      const post = service.likePost(feed[0].id, 'user-1')
      expect(post.likes).toBe(feed[0].likes + 1)
      expect(post.likedBy).toContain('user-1')
    })

    it('正例: 重复点赞应幂等', () => {
      const feed = service.getFeed()
      service.likePost(feed[0].id, 'user-1')
      const again = service.likePost(feed[0].id, 'user-1')
      expect(again.likes).toBe(feed[0].likes + 1)
    })

    it('正例: unlikePost 应减少点赞', () => {
      const feed = service.getFeed()
      service.likePost(feed[0].id, 'user-1')
      const post = service.unlikePost(feed[0].id, 'user-1')
      expect(post.likes).toBe(feed[0].likes)
      expect(post.likedBy).not.toContain('user-1')
    })

    it('正例: 取消未点赞不应减少', () => {
      const feed = service.getFeed()
      const post = service.unlikePost(feed[0].id, 'non-liker')
      expect(post.likes).toBe(feed[0].likes)
    })
  })

  // ── commentPost ──────────────────────────────────────────────────────────

  describe('commentPost', () => {
    it('正例: commentPost 应添加评论', () => {
      const feed = service.getFeed()
      const comment = service.commentPost(feed[0].id, {
        userId: 'u1', userName: '用户1', content: '好活动！',
      })
      expect(comment.id).toBeTruthy()
      expect(comment.content).toBe('好活动！')
      const post = service.getPost(feed[0].id)
      expect(post.comments).toHaveLength(1)
    })
  })

  // ── subscribe / unsubscribe / getSubscriptions ───────────────────────────

  describe('subscriptions', () => {
    it('正例: subscribeFeed 应添加订阅', () => {
      const sub = service.subscribeFeed('user-1', 'promotion')
      expect(sub.channel).toBe('promotion')
      expect(service.getSubscriptions('user-1')).toHaveLength(1)
    })

    it('正例: 重复订阅应幂等', () => {
      service.subscribeFeed('user-1', 'promotion')
      service.subscribeFeed('user-1', 'promotion')
      expect(service.getSubscriptions('user-1')).toHaveLength(1)
    })

    it('正例: unsubscribeFeed 应取消订阅', () => {
      service.subscribeFeed('user-1', 'promotion')
      service.subscribeFeed('user-1', 'system')
      service.unsubscribeFeed('user-1', 'promotion')
      const subs = service.getSubscriptions('user-1')
      expect(subs).toHaveLength(1)
      expect(subs[0].channel).toBe('system')
    })

    it('边缘: 无订阅用户应返回空数组', () => {
      expect(service.getSubscriptions('nobody')).toEqual([])
    })
  })
})
