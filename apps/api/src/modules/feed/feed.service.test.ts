/**
 * feed.service.test.ts — Feed Service 测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { FeedService } from './feed.service'
import { NotFoundException } from '@nestjs/common'

describe('FeedService', () => {
  let service: FeedService

  beforeEach(() => { service = new FeedService() })

  it('should get default feed', () => {
    const feed = service.getFeed()
    expect(feed.length).toBeGreaterThanOrEqual(2)
  })

  it('should filter by channel', () => {
    const promos = service.getFeed('promotion')
    expect(promos.every((p) => p.channel === 'promotion')).toBe(true)
  })

  it('should get post by id', () => {
    const feed = service.getFeed()
    const p = service.getPost(feed[0].id)
    expect(p.id).toBe(feed[0].id)
  })

  it('should throw on nonexistent post', () => {
    expect(() => service.getPost('nonexistent')).toThrow(NotFoundException)
  })

  it('should create post', () => {
    const p = service.createPost({
      channel: 'activity', title: '活动通知', content: '本周末有活动',
      authorId: 'admin', authorName: '管理员',
    })
    expect(p.title).toBe('活动通知')
    expect(p.status).toBe('published')
  })

  it('should like a post', () => {
    const feed = service.getFeed()
    const before = feed[0].likes
    const p = service.likePost(feed[0].id, 'user-1')
    expect(p.likes).toBe(before + 1)
  })

  it('should not increment on double like', () => {
    const feed = service.getFeed()
    service.likePost(feed[0].id, 'user-1')
    const before = feed[0].likes
    service.likePost(feed[0].id, 'user-1')
    expect(feed[0].likes).toBe(before)
  })

  it('should unlike a post', () => {
    const feed = service.getFeed()
    service.likePost(feed[0].id, 'user-1')
    const before = feed[0].likes
    service.unlikePost(feed[0].id, 'user-1')
    expect(feed[0].likes).toBe(before - 1)
  })

  it('should comment on a post', () => {
    const feed = service.getFeed()
    const comment = service.commentPost(feed[0].id, { userId: 'u1', userName: '张三', content: '好' })
    expect(comment.content).toBe('好')
    expect(feed[0].comments).toHaveLength(1)
  })

  it('should subscribe to channel', () => {
    const sub = service.subscribeFeed('u1', 'activity')
    expect(sub.channel).toBe('activity')
  })

  it('should not duplicate subscription', () => {
    service.subscribeFeed('u1', 'activity')
    const sub = service.subscribeFeed('u1', 'activity')
    const subs = service.getSubscriptions('u1')
    expect(subs.filter((s) => s.channel === 'activity')).toHaveLength(1)
  })

  it('should unsubscribe from channel', () => {
    service.subscribeFeed('u1', 'activity')
    service.subscribeFeed('u1', 'promotion')
    service.unsubscribeFeed('u1', 'activity')
    const subs = service.getSubscriptions('u1')
    expect(subs.find((s) => s.channel === 'activity')).toBeUndefined()
  })

  it('should return empty subscriptions for new user', () => {
    expect(service.getSubscriptions('unknown')).toHaveLength(0)
  })

  it('should support pagination', () => {
    for (let i = 0; i < 5; i++) {
      service.createPost({ channel: 'activity', title: `Post ${i}`, content: '', authorId: 'a', authorName: 'A' })
    }
    const page1 = service.getFeed(undefined, 'published', 3, 0)
    const page2 = service.getFeed(undefined, 'published', 3, 3)
    expect(page1.length).toBe(3)
    expect(page2.length).toBeGreaterThanOrEqual(1)
  })
})
// Total: 14 tests
