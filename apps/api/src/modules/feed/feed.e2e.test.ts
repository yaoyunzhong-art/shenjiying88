import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Feed 信息流 HTTP 链路
 *
 * 链路:
 *   HTTP → TestFeedController → FeedService
 *
 * 验证:
 *   - 信息流列表与过滤
 *   - 帖子创建与查询
 *   - 点赞/取消点赞
 *   - 评论与频道订阅
 *   - 边界值与异常场景
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Controller, Get, Inject, Post, Delete, Body, Param, Query } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { FeedService, type FeedChannel, type PostStatus } from './feed.service'

@Controller('test/feed')
class TestFeedController {
  constructor(
    @Inject(FeedService) private readonly svc: FeedService,
  ) {}

  @Get()
  getFeed(@Query('channel') channel?: FeedChannel, @Query('status') status?: PostStatus, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    const posts = this.svc.getFeed(channel, status, limit ? Number(limit) : 20, offset ? Number(offset) : 0)
    return { posts, total: posts.length }
  }

  @Get('posts/:id')
  getPost(@Param('id') id: string) {
    return this.svc.getPost(id)
  }

  @Post('posts')
  createPost(@Body() body: { channel: FeedChannel; title: string; content: string; authorId: string; authorName: string; tags?: string[] }) {
    return this.svc.createPost(body)
  }

  @Post('posts/:id/like')
  likePost(@Param('id') id: string, @Body() body: { userId: string }) {
    return this.svc.likePost(id, body.userId)
  }

  @Post('posts/:id/unlike')
  unlikePost(@Param('id') id: string, @Body() body: { userId: string }) {
    return this.svc.unlikePost(id, body.userId)
  }

  @Post('posts/:id/comments')
  commentPost(@Param('id') id: string, @Body() body: { userId: string; userName: string; content: string }) {
    return this.svc.commentPost(id, body)
  }

  @Post('subscriptions')
  subscribe(@Body() body: { userId: string; channel: FeedChannel }) {
    return this.svc.subscribeFeed(body.userId, body.channel)
  }

  @Delete('subscriptions')
  unsubscribe(@Body() body: { userId: string; channel: FeedChannel }) {
    this.svc.unsubscribeFeed(body.userId, body.channel)
    return null
  }

  @Get('subscriptions')
  getSubscriptions(@Query('userId') userId: string) {
    const subscriptions = this.svc.getSubscriptions(userId)
    return { subscriptions, total: subscriptions.length }
  }
}

async function buildApp() {
  const feedService = new FeedService()
  const moduleRef = await Test.createTestingModule({
    controllers: [TestFeedController],
    providers: [
      { provide: FeedService, useValue: feedService },
    ],
  }).compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, feedService }
}

// ────── Feed List & Filter Tests ──────

it('e2e: get feed returns default posts', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/test/feed')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.total, 2)
    assert.ok(res.body.data.posts.some((p: any) => p.title.includes('系统升级')))
  } finally {
    await app.close()
  }
})

it('e2e: filter feed by channel', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/test/feed?channel=promotion')
    assert.equal(res.body.data.total, 1)
    assert.equal(res.body.data.posts[0].channel, 'promotion')
  } finally {
    await app.close()
  }
})

it('e2e: filter feed by non-existent channel returns empty', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/test/feed?channel=member')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.total, 0)
    assert.deepEqual(res.body.data.posts, [])
  } finally {
    await app.close()
  }
})

it('e2e: feed with limit parameter returns reduced results', async () => {
  const { app, feedService } = await buildApp()
  try {
    feedService.createPost({ channel: 'activity', title: 'Post 1', content: 'c1', authorId: 'u1', authorName: 'u1' })
    feedService.createPost({ channel: 'activity', title: 'Post 2', content: 'c2', authorId: 'u2', authorName: 'u2' })
    feedService.createPost({ channel: 'activity', title: 'Post 3', content: 'c3', authorId: 'u3', authorName: 'u3' })
    const res = await request(app.getHttpServer()).get('/test/feed?limit=2')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.total, 2)
  } finally {
    await app.close()
  }
})

it('e2e: feed with offset skips posts', async () => {
  const { app, feedService } = await buildApp()
  try {
    feedService.createPost({ channel: 'activity', title: 'First post', content: 'c1', authorId: 'u1', authorName: 'u1' })
    feedService.createPost({ channel: 'activity', title: 'Second post', content: 'c2', authorId: 'u2', authorName: 'u2' })
    const firstPage = await request(app.getHttpServer()).get('/test/feed?limit=1&offset=0')
    const secondPage = await request(app.getHttpServer()).get('/test/feed?limit=1&offset=1')
    assert.equal(firstPage.body.data.total, 1)
    assert.equal(secondPage.body.data.total, 1)
    assert.notEqual(firstPage.body.data.posts[0].id, secondPage.body.data.posts[0].id)
  } finally {
    await app.close()
  }
})

// ────── Post CRUD Tests ──────

it('e2e: create post then query by id', async () => {
  const { app } = await buildApp()
  try {
    const createRes = await request(app.getHttpServer())
      .post('/test/feed/posts')
      .send({ channel: 'activity', title: '团建活动通知', content: '本周五下午团建', authorId: 'hr-01', authorName: '人力资源部', tags: ['活动'] })
    assert.equal(createRes.statusCode, 201)
    const postId = createRes.body.data.id

    const getRes = await request(app.getHttpServer()).get(`/test/feed/posts/${postId}`)
    assert.equal(getRes.body.data.title, '团建活动通知')
    assert.equal(getRes.body.data.authorName, '人力资源部')
  } finally {
    await app.close()
  }
})

it('e2e: create post with tags includes tags in response', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/test/feed/posts')
      .send({ channel: 'system', title: 'Update', content: 'System update', authorId: 'adm', authorName: 'Admin', tags: ['重要', '系统', '维护'] })
    assert.equal(res.statusCode, 201)
    assert.deepEqual(res.body.data.tags, ['重要', '系统', '维护'])
  } finally {
    await app.close()
  }
})

it('e2e: create post without tags returns empty tags array', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/test/feed/posts')
      .send({ channel: 'member', title: 'Member news', content: 'For members only', authorId: 'vip', authorName: 'VIP' })
    assert.equal(res.statusCode, 201)
    assert.deepEqual(res.body.data.tags, [])
  } finally {
    await app.close()
  }
})

it('e2e: get non-existent post returns 404', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/test/feed/posts/non-existent-id')
    assert.equal(res.statusCode, 404)
  } finally {
    await app.close()
  }
})

// ────── Like/Unlike Tests ──────

it('e2e: like then unlike a post', async () => {
  const { app, feedService } = await buildApp()
  try {
    const posts = feedService.getFeed()
    const postId = posts[0].id
    const initialLikes = posts[0].likes

    const likeRes = await request(app.getHttpServer())
      .post(`/test/feed/posts/${postId}/like`)
      .send({ userId: 'user-001' })
    assert.equal(likeRes.body.data.likes, initialLikes + 1)

    const unlikeRes = await request(app.getHttpServer())
      .post(`/test/feed/posts/${postId}/unlike`)
      .send({ userId: 'user-001' })
    assert.equal(unlikeRes.body.data.likes, initialLikes)
  } finally {
    await app.close()
  }
})

it('e2e: double like is idempotent — likes do not increase again', async () => {
  const { app, feedService } = await buildApp()
  try {
    const posts = feedService.getFeed()
    const postId = posts[0].id
    const initialLikes = posts[0].likes

    await request(app.getHttpServer()).post(`/test/feed/posts/${postId}/like`).send({ userId: 'user-idempotent' })
    const secondLike = await request(app.getHttpServer()).post(`/test/feed/posts/${postId}/like`).send({ userId: 'user-idempotent' })
    assert.equal(secondLike.body.data.likes, initialLikes + 1)
  } finally {
    await app.close()
  }
})

it('e2e: unlike without prior like is idempotent', async () => {
  const { app, feedService } = await buildApp()
  try {
    const posts = feedService.getFeed()
    const postId = posts[0].id
    const initialLikes = posts[0].likes

    const res = await request(app.getHttpServer())
      .post(`/test/feed/posts/${postId}/unlike`)
      .send({ userId: 'never-liked-user' })
    assert.equal(res.body.data.likes, initialLikes)
  } finally {
    await app.close()
  }
})

it('e2e: multiple users can like the same post', async () => {
  const { app, feedService } = await buildApp()
  try {
    const posts = feedService.getFeed()
    const postId = posts[0].id
    const initialLikes = posts[0].likes

    await request(app.getHttpServer()).post(`/test/feed/posts/${postId}/like`).send({ userId: 'user-a' })
    await request(app.getHttpServer()).post(`/test/feed/posts/${postId}/like`).send({ userId: 'user-b' })
    await request(app.getHttpServer()).post(`/test/feed/posts/${postId}/like`).send({ userId: 'user-c' })

    const post = feedService.getPost(postId)
    assert.equal(post.likes, initialLikes + 3)
    assert.ok(post.likedBy.includes('user-a'))
    assert.ok(post.likedBy.includes('user-b'))
    assert.ok(post.likedBy.includes('user-c'))
  } finally {
    await app.close()
  }
})

// ────── Comment Tests ──────

it('e2e: comment on post returns the comment', async () => {
  const { app, feedService } = await buildApp()
  try {
    const posts = feedService.getFeed()
    const postId = posts[0].id

    const cmtRes = await request(app.getHttpServer())
      .post(`/test/feed/posts/${postId}/comments`)
      .send({ userId: 'user-002', userName: '测试用户', content: '收到，谢谢！' })
    assert.equal(cmtRes.statusCode, 201)
    assert.equal(cmtRes.body.data.content, '收到，谢谢！')
  } finally {
    await app.close()
  }
})

it('e2e: multiple comments on same post are all stored', async () => {
  const { app, feedService } = await buildApp()
  try {
    const posts = feedService.getFeed()
    const postId = posts[0].id

    await request(app.getHttpServer()).post(`/test/feed/posts/${postId}/comments`).send({ userId: 'u1', userName: 'User1', content: 'Comment 1' })
    await request(app.getHttpServer()).post(`/test/feed/posts/${postId}/comments`).send({ userId: 'u2', userName: 'User2', content: 'Comment 2' })
    await request(app.getHttpServer()).post(`/test/feed/posts/${postId}/comments`).send({ userId: 'u3', userName: 'User3', content: 'Comment 3' })

    const post = feedService.getPost(postId)
    assert.equal(post.comments.length, 3)
    assert.equal(post.comments[0].content, 'Comment 1')
    assert.equal(post.comments[2].content, 'Comment 3')
  } finally {
    await app.close()
  }
})

it('e2e: comment on non-existent post returns 404', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/test/feed/posts/non-existent/comments')
      .send({ userId: 'u1', userName: 'User', content: 'Hello' })
    assert.equal(res.statusCode, 404)
  } finally {
    await app.close()
  }
})

// ────── Subscription Tests ──────

it('e2e: subscribe to channel and list subscriptions', async () => {
  const { app, feedService } = await buildApp()
  try {
    const posts = feedService.getFeed()
    const postId = posts[0].id

    const cmtRes = await request(app.getHttpServer())
      .post(`/test/feed/posts/${postId}/comments`)
      .send({ userId: 'user-002', userName: '测试用户', content: '收到，谢谢！' })
    assert.equal(cmtRes.statusCode, 201)

    const subRes = await request(app.getHttpServer())
      .post('/test/feed/subscriptions')
      .send({ userId: 'user-002', channel: 'system' })
    assert.equal(subRes.body.data.channel, 'system')

    const listRes = await request(app.getHttpServer()).get('/test/feed/subscriptions?userId=user-002')
    assert.equal(listRes.body.data.total, 1)
  } finally {
    await app.close()
  }
})

it('e2e: subscribe to multiple channels lists all', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer()).post('/test/feed/subscriptions').send({ userId: 'multi-sub', channel: 'system' })
    await request(app.getHttpServer()).post('/test/feed/subscriptions').send({ userId: 'multi-sub', channel: 'promotion' })
    await request(app.getHttpServer()).post('/test/feed/subscriptions').send({ userId: 'multi-sub', channel: 'member' })

    const listRes = await request(app.getHttpServer()).get('/test/feed/subscriptions?userId=multi-sub')
    assert.equal(listRes.body.data.total, 3)
  } finally {
    await app.close()
  }
})

it('e2e: duplicate subscription is idempotent', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer()).post('/test/feed/subscriptions').send({ userId: 'dup-user', channel: 'system' })
    await request(app.getHttpServer()).post('/test/feed/subscriptions').send({ userId: 'dup-user', channel: 'system' })

    const listRes = await request(app.getHttpServer()).get('/test/feed/subscriptions?userId=dup-user')
    assert.equal(listRes.body.data.total, 1)
  } finally {
    await app.close()
  }
})

it('e2e: unsubscribe removes subscription', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer()).post('/test/feed/subscriptions').send({ userId: 'unsub-user', channel: 'system' })
    await request(app.getHttpServer()).post('/test/feed/subscriptions').send({ userId: 'unsub-user', channel: 'promotion' })

    let listRes = await request(app.getHttpServer()).get('/test/feed/subscriptions?userId=unsub-user')
    assert.equal(listRes.body.data.total, 2)

    await request(app.getHttpServer()).delete('/test/feed/subscriptions').send({ userId: 'unsub-user', channel: 'system' })

    listRes = await request(app.getHttpServer()).get('/test/feed/subscriptions?userId=unsub-user')
    assert.equal(listRes.body.data.total, 1)
    assert.equal(listRes.body.data.subscriptions[0].channel, 'promotion')
  } finally {
    await app.close()
  }
})

it('e2e: user with no subscriptions returns empty array', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/test/feed/subscriptions?userId=never-subbed')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.total, 0)
    assert.deepEqual(res.body.data.subscriptions, [])
  } finally {
    await app.close()
  }
})

// ────── Edge Case & Error Tests ──────

it('e2e: empty channel query returns all posts', async () => {
  const { app } = await buildApp()
  try {
    const allRes = await request(app.getHttpServer()).get('/test/feed')
    const channelRes = await request(app.getHttpServer()).get('/test/feed?channel=')
    assert.equal(allRes.body.data.total, channelRes.body.data.total)
  } finally {
    await app.close()
  }
})

it('e2e: create post then like and comment in sequence', async () => {
  const { app } = await buildApp()
  try {
    const createRes = await request(app.getHttpServer())
      .post('/test/feed/posts')
      .send({ channel: 'system', title: 'Sequential test', content: 'Seq content', authorId: 'seq', authorName: 'Seq', tags: ['test'] })
    assert.equal(createRes.statusCode, 201)
    const postId = createRes.body.data.id

    const likeRes = await request(app.getHttpServer()).post(`/test/feed/posts/${postId}/like`).send({ userId: 'seq-user' })
    assert.equal(likeRes.body.data.likes, 1)

    const cmtRes = await request(app.getHttpServer()).post(`/test/feed/posts/${postId}/comments`).send({ userId: 'seq-user', userName: 'SeqUser', content: 'Nice post' })
    assert.equal(cmtRes.body.data.content, 'Nice post')

    const getRes = await request(app.getHttpServer()).get(`/test/feed/posts/${postId}`)
    assert.equal(getRes.body.data.likes, 1)
    assert.equal(getRes.body.data.comments.length, 1)
  } finally {
    await app.close()
  }
})

it('e2e: like post then comment shows correct counts', async () => {
  const { app, feedService } = await buildApp()
  try {
    const posts = feedService.getFeed()
    const postId = posts[0].id
    const initialLikes = posts[0].likes

    await request(app.getHttpServer()).post(`/test/feed/posts/${postId}/like`).send({ userId: 'count-check' })
    await request(app.getHttpServer()).post(`/test/feed/posts/${postId}/comments`).send({ userId: 'c1', userName: 'C1', content: 'First!' })
    await request(app.getHttpServer()).post(`/test/feed/posts/${postId}/comments`).send({ userId: 'c2', userName: 'C2', content: 'Second!' })

    const post = feedService.getPost(postId)
    assert.equal(post.likes, initialLikes + 1)
    assert.equal(post.comments.length, 2)
  } finally {
    await app.close()
  }
})

it('e2e: create posts in all four channel types and verify via filter', async () => {
  const { app, feedService } = await buildApp()
  try {
    const channels: FeedChannel[] = ['system', 'promotion', 'activity', 'member']
    for (const ch of channels) {
      feedService.createPost({ channel: ch, title: `Post for ${ch}`, content: `Content for ${ch}`, authorId: 'u1', authorName: 'U1' })
    }
    for (const ch of channels) {
      const res = await request(app.getHttpServer()).get(`/test/feed?channel=${ch}`)
      // system and promotion have 1 default post + 1 new post = 2; activity and member have 1 new post = 1
      const expected = ch === 'system' || ch === 'promotion' ? 2 : 1
      assert.equal(res.body.data.total, expected, `Expected ${expected} posts for channel ${ch}`)
    }
  } finally {
    await app.close()
  }
})
