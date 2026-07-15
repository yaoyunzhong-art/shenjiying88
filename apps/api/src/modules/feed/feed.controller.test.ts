/**
 * feed.controller.test.ts — Feed Controller 测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { FeedController } from './feed.controller'
import { FeedService } from './feed.service'

describe('FeedController', () => {
  let controller: FeedController
  let service: FeedService

  beforeEach(() => {
    service = new FeedService()
    controller = new FeedController(service)
  })

  // ── Get Feed ──

  it('should get default feed', () => {
    const res = controller.getFeed({})
    expect(res.success).toBe(true)
    expect(res.data.total).toBeGreaterThanOrEqual(2)
  })

  it('should filter feed by channel', () => {
    const res = controller.getFeed({ channel: 'system' })
    expect(res.success).toBe(true)
    expect(res.data.posts.every((p: { channel: string }) => p.channel === 'system')).toBe(true)
  })

  it('should filter feed by promotion channel', () => {
    const res = controller.getFeed({ channel: 'promotion' })
    expect(res.success).toBe(true)
    expect(res.data.posts.every((p: { channel: string }) => p.channel === 'promotion')).toBe(true)
  })

  it('should paginate feed', () => {
    for (let i = 0; i < 5; i++) {
      service.createPost({ channel: 'activity', title: `Post ${i}`, content: '', authorId: 'a', authorName: 'A' })
    }
    const page1 = controller.getFeed({ limit: 3, offset: 0 })
    const page2 = controller.getFeed({ limit: 3, offset: 3 })
    expect(page1.data.posts.length).toBe(3)
    expect(page2.data.posts.length).toBeGreaterThanOrEqual(1)
  })

  it('should return empty for non-existent channel', () => {
    const res = controller.getFeed({ channel: 'member' })
    // member channel exists but no posts yet
    expect(res.data.total).toBe(0)
  })

  // ── Get Post ──

  it('should get post by id', () => {
    const feed = controller.getFeed({})
    const postId = feed.data.posts[0].id
    const res = controller.getPost(postId)
    expect(res.success).toBe(true)
    expect(res.data.id).toBe(postId)
  })

  it('should throw for nonexistent post', () => {
    expect(() => controller.getPost('nonexistent')).toThrow()
  })

  // ── Create Post ──

  it('should create a new post', () => {
    const res = controller.createPost({
      channel: 'activity',
      title: '新活动通知',
      content: '本周六有大型活动',
      authorId: 'admin',
      authorName: '管理员',
      tags: ['活动'],
    })
    expect(res.success).toBe(true)
    expect(res.data.title).toBe('新活动通知')
    expect(res.data.status).toBe('published')
    expect(res.data.tags).toContain('活动')
  })

  it('should create post without tags', () => {
    const res = controller.createPost({
      channel: 'system',
      title: '纯文本',
      content: '无标签内容',
      authorId: 'admin',
      authorName: '管理员',
    })
    expect(res.success).toBe(true)
    expect(res.data.tags).toHaveLength(0)
  })

  // ── Like / Unlike ──

  it('should like a post', () => {
    const feed = controller.getFeed({})
    const postId = feed.data.posts[0].id
    const before = feed.data.posts[0].likes
    const res = controller.likePost(postId, { userId: 'user-1' })
    expect(res.success).toBe(true)
    expect(res.data.likes).toBe(before + 1)
  })

  it('should not increment on duplicate like', () => {
    const feed = controller.getFeed({})
    const postId = feed.data.posts[0].id
    controller.likePost(postId, { userId: 'user-1' })
    const res = controller.likePost(postId, { userId: 'user-1' })
    const feed2 = controller.getFeed({})
    expect(res.data.likes).toBe(feed2.data.posts[0].likes)
  })

  it('should unlike a post', () => {
    const feed = controller.getFeed({})
    const postId = feed.data.posts[0].id
    controller.likePost(postId, { userId: 'user-1' })
    const res = controller.unlikePost(postId, { userId: 'user-1' })
    expect(res.success).toBe(true)
    expect(res.data.likes).toBe(feed.data.posts[0].likes)
  })

  it('should not decrement on unlike without like', () => {
    const feed = controller.getFeed({})
    const postId = feed.data.posts[0].id
    const before = feed.data.posts[0].likes
    const res = controller.unlikePost(postId, { userId: 'user-1' })
    expect(res.data.likes).toBe(before)
  })

  // ── Comments ──

  it('should comment on a post', () => {
    const feed = controller.getFeed({})
    const postId = feed.data.posts[0].id
    const res = controller.commentPost(postId, {
      userId: 'u1', userName: '张三', content: '好文章',
    })
    expect(res.success).toBe(true)
    expect(res.data.content).toBe('好文章')
  })

  // ── Subscriptions ──

  it('should subscribe to channel', () => {
    const res = controller.subscribe({ userId: 'u1', channel: 'activity' })
    expect(res.success).toBe(true)
    expect(res.data.channel).toBe('activity')
  })

  it('should not duplicate subscription', () => {
    controller.subscribe({ userId: 'u1', channel: 'activity' })
    controller.subscribe({ userId: 'u1', channel: 'activity' })
    const subsRes = controller.getSubscriptions({ userId: 'u1' })
    expect(subsRes.data.subscriptions.filter((s: { channel: string }) => s.channel === 'activity')).toHaveLength(1)
  })

  it('should unsubscribe from channel', () => {
    controller.subscribe({ userId: 'u1', channel: 'activity' })
    controller.subscribe({ userId: 'u1', channel: 'promotion' })
    const unsubRes = controller.unsubscribe({ userId: 'u1', channel: 'activity' })
    expect(unsubRes.success).toBe(true)
    const subsRes = controller.getSubscriptions({ userId: 'u1' })
    expect(subsRes.data.subscriptions.find((s: { channel: string }) => s.channel === 'activity')).toBeUndefined()
  })

  it('should get empty subscriptions for new user', () => {
    const res = controller.getSubscriptions({ userId: 'new-user' })
    expect(res.success).toBe(true)
    expect(res.data.subscriptions).toHaveLength(0)
  })

  it('should subscribe to multiple channels', () => {
    controller.subscribe({ userId: 'u1', channel: 'activity' })
    controller.subscribe({ userId: 'u1', channel: 'system' })
    controller.subscribe({ userId: 'u1', channel: 'promotion' })
    const res = controller.getSubscriptions({ userId: 'u1' })
    expect(res.data.total).toBe(3)
  })
})
// Total: 20 tests
