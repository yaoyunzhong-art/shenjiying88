/**
 * feed.controller.ts — 信息流 API 端点
 *
 * 提供信息流获取、帖子管理、点赞评论、频道订阅等能力。
 *
 * 端点:
 *   GET    /api/feed                    — 获取信息流
 *   GET    /api/feed/posts/:id          — 查询帖子
 *   POST   /api/feed/posts              — 创建帖子
 *   POST   /api/feed/posts/:id/like     — 点赞帖子
 *   POST   /api/feed/posts/:id/unlike   — 取消点赞
 *   POST   /api/feed/posts/:id/comments — 评论帖子
 *   POST   /api/feed/subscriptions      — 订阅频道
 *   DELETE /api/feed/subscriptions      — 取消订阅
 *   GET    /api/feed/subscriptions      — 获取订阅列表
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common'
import {
  FeedService,
  type FeedChannel,
  type PostStatus,
} from './feed.service'

class GetFeedQueryDto {
  channel?: FeedChannel
  status?: PostStatus
  limit?: number
  offset?: number
}

class CreatePostDto {
  channel!: FeedChannel
  title!: string
  content!: string
  authorId!: string
  authorName!: string
  tags?: string[]
}

class LikePostDto {
  userId!: string
}

class CommentPostDto {
  userId!: string
  userName!: string
  content!: string
}

class SubscribeDto {
  userId!: string
  channel!: FeedChannel
}

class UnsubscribeDto {
  userId!: string
  channel!: FeedChannel
}

class GetSubscriptionsQueryDto {
  userId!: string
}

@Controller('api/feed')
export class FeedController {
  constructor(private readonly svc: FeedService) {}

  /**
   * GET /api/feed
   * 获取信息流列表，支持过滤和分页。
   */
  @Get()
  getFeed(@Query() query: GetFeedQueryDto) {
    const posts = this.svc.getFeed(query.channel, query.status, query.limit, query.offset)
    return { success: true, data: { posts, total: posts.length } }
  }

  /**
   * GET /api/feed/posts/:id
   * 查询帖子详情。
   */
  @Get('posts/:id')
  getPost(@Param('id') id: string) {
    const post = this.svc.getPost(id)
    return { success: true, data: post }
  }

  /**
   * POST /api/feed/posts
   * 创建新帖子。
   */
  @Post('posts')
  @HttpCode(HttpStatus.CREATED)
  createPost(@Body() body: CreatePostDto) {
    const post = this.svc.createPost(body)
    return { success: true, data: post }
  }

  /**
   * POST /api/feed/posts/:id/like
   * 点赞帖子。
   */
  @Post('posts/:id/like')
  @HttpCode(HttpStatus.OK)
  likePost(@Param('id') id: string, @Body() body: LikePostDto) {
    const post = this.svc.likePost(id, body.userId)
    return { success: true, data: post }
  }

  /**
   * POST /api/feed/posts/:id/unlike
   * 取消点赞。
   */
  @Post('posts/:id/unlike')
  @HttpCode(HttpStatus.OK)
  unlikePost(@Param('id') id: string, @Body() body: LikePostDto) {
    const post = this.svc.unlikePost(id, body.userId)
    return { success: true, data: post }
  }

  /**
   * POST /api/feed/posts/:id/comments
   * 评论帖子。
   */
  @Post('posts/:id/comments')
  @HttpCode(HttpStatus.CREATED)
  commentPost(@Param('id') id: string, @Body() body: CommentPostDto) {
    const comment = this.svc.commentPost(id, body)
    return { success: true, data: comment }
  }

  /**
   * POST /api/feed/subscriptions
   * 订阅频道。
   */
  @Post('subscriptions')
  @HttpCode(HttpStatus.CREATED)
  subscribe(@Body() body: SubscribeDto) {
    const sub = this.svc.subscribeFeed(body.userId, body.channel)
    return { success: true, data: sub }
  }

  /**
   * DELETE /api/feed/subscriptions
   * 取消订阅频道。
   */
  @Delete('subscriptions')
  @HttpCode(HttpStatus.OK)
  unsubscribe(@Body() body: UnsubscribeDto) {
    this.svc.unsubscribeFeed(body.userId, body.channel)
    return { success: true, message: `已取消订阅 ${body.channel} 频道` }
  }

  /**
   * GET /api/feed/subscriptions
   * 获取用户的订阅列表。
   */
  @Get('subscriptions')
  getSubscriptions(@Query() query: GetSubscriptionsQueryDto) {
    const subscriptions = this.svc.getSubscriptions(query.userId)
    return { success: true, data: { subscriptions, total: subscriptions.length } }
  }
}
