import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { FeedController } from './feed.controller'

describe('FeedController metadata', () => {
  it('controller should keep api/feed path', () => {
    assert.equal(Reflect.getMetadata('path', FeedController), 'api/feed')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [FeedController.prototype.getFeed, 0, '/'],
      [FeedController.prototype.getPost, 0, 'posts/:id'],
      [FeedController.prototype.createPost, 1, 'posts'],
      [FeedController.prototype.likePost, 1, 'posts/:id/like'],
      [FeedController.prototype.unlikePost, 1, 'posts/:id/unlike'],
      [FeedController.prototype.commentPost, 1, 'posts/:id/comments'],
      [FeedController.prototype.subscribe, 1, 'subscriptions'],
      [FeedController.prototype.unsubscribe, 3, 'subscriptions'],
      [FeedController.prototype.getSubscriptions, 0, 'subscriptions'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
