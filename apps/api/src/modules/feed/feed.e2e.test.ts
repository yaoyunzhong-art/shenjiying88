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
  getFeed(@Query('channel') channel?: FeedChannel) {
    const posts = this.svc.getFeed(channel)
    return { success: true, data: { posts, total: posts.length } }
  }

  @Get('posts/:id')
  getPost(@Param('id') id: string) {
    const post = this.svc.getPost(id)
    return { success: true, data: post }
  }

  @Post('posts')
  createPost(@Body() body: { channel: FeedChannel; title: string; content: string; authorId: string; authorName: string; tags?: string[] }) {
    const post = this.svc.createPost(body)
    return { success: true, data: post }
  }

  @Post('posts/:id/like')
  likePost(@Param('id') id: string, @Body() body: { userId: string }) {
    const post = this.svc.likePost(id, body.userId)
    return { success: true, data: post }
  }

  @Post('posts/:id/unlike')
  unlikePost(@Param('id') id: string, @Body() body: { userId: string }) {
    const post = this.svc.unlikePost(id, body.userId)
    return { success: true, data: post }
  }

  @Post('posts/:id/comments')
  commentPost(@Param('id') id: string, @Body() body: { userId: string; userName: string; content: string }) {
    const comment = this.svc.commentPost(id, body)
    return { success: true, data: comment }
  }

  @Post('subscriptions')
  subscribe(@Body() body: { userId: string; channel: FeedChannel }) {
    const sub = this.svc.subscribeFeed(body.userId, body.channel)
    return { success: true, data: sub }
  }

  @Get('subscriptions')
  getSubscriptions(@Query('userId') userId: string) {
    const subscriptions = this.svc.getSubscriptions(userId)
    return { success: true, data: { subscriptions, total: subscriptions.length } }
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

it('e2e: like then unlike a post', async () => {
  const { app, feedService } = await buildApp()
  try {
    const posts = feedService.getFeed()
    const postId = posts[0].id

    const likeRes = await request(app.getHttpServer())
      .post(`/test/feed/posts/${postId}/like`)
      .send({ userId: 'user-001' })
    assert.equal(likeRes.body.data.likes, posts[0].likes + 1)

    const unlikeRes = await request(app.getHttpServer())
      .post(`/test/feed/posts/${postId}/unlike`)
      .send({ userId: 'user-001' })
    assert.equal(unlikeRes.body.data.likes, posts[0].likes)
  } finally {
    await app.close()
  }
})

it('e2e: comment on post then subscribe to channel', async () => {
  const { app, feedService } = await buildApp()
  try {
    const posts = feedService.getFeed()
    const postId = posts[0].id

    const cmtRes = await request(app.getHttpServer())
      .post(`/test/feed/posts/${postId}/comments`)
      .send({ userId: 'user-002', userName: '测试用户', content: '收到，谢谢！' })
    assert.equal(cmtRes.statusCode, 201)
    assert.equal(cmtRes.body.data.content, '收到，谢谢！')

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
