/**
 * feed.service.ts — 信息流 Service
 */
import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { randomUUID as uuid } from 'crypto'

export type FeedChannel = 'activity' | 'promotion' | 'system' | 'member'
export type PostStatus = 'published' | 'draft' | 'archived'

export interface FeedPost {
  id: string
  channel: FeedChannel
  title: string
  content: string
  authorId: string
  authorName: string
  tags: string[]
  status: PostStatus
  createdAt: string
  updatedAt: string
  likes: number
  comments: FeedComment[]
  likedBy: string[]
}

export interface FeedComment {
  id: string
  postId: string
  userId: string
  userName: string
  content: string
  createdAt: string
}

export interface FeedSubscription {
  userId: string
  channel: FeedChannel
  subscribedAt: string
}

@Injectable()
export class FeedService {
  private readonly logger = new Logger(FeedService.name)
  private posts: Map<string, FeedPost> = new Map()
  private subscriptions: Map<string, FeedSubscription[]> = new Map()

  constructor() {
    this.initializeDefaults()
  }

  private initializeDefaults(): void {
    const now = new Date().toISOString()
    const post1: FeedPost = {
      id: uuid(), channel: 'system', title: '系统升级通知',
      content: '神机营SaaS将于今晚3:00-5:00进行系统升级', authorId: 'admin',
      authorName: '系统管理员', tags: ['系统'], status: 'published',
      createdAt: now, updatedAt: now, likes: 5, comments: [], likedBy: [],
    }
    const post2: FeedPost = {
      id: uuid(), channel: 'promotion', title: '暑期大促火热进行',
      content: '全场8折优惠，会员专享赠品', authorId: 'marketing',
      authorName: '运营部', tags: ['促销'], status: 'published',
      createdAt: now, updatedAt: now, likes: 12, comments: [], likedBy: [],
    }
    this.posts.set(post1.id, post1)
    this.posts.set(post2.id, post2)
  }

  getFeed(channel?: FeedChannel, status?: PostStatus, limit = 20, offset = 0): FeedPost[] {
    let result = Array.from(this.posts.values())
    if (channel) result = result.filter((p) => p.channel === channel)
    if (status) result = result.filter((p) => p.status === status)
    else result = result.filter((p) => p.status === 'published')
    result.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return result.slice(offset, offset + limit)
  }

  getPost(id: string): FeedPost {
    const p = this.posts.get(id)
    if (!p) throw new NotFoundException(`帖子 ${id} 不存在`)
    return p
  }

  createPost(data: {
    channel: FeedChannel; title: string; content: string
    authorId: string; authorName: string; tags?: string[]
  }): FeedPost {
    const post: FeedPost = {
      id: uuid(), channel: data.channel, status: 'published',
      title: data.title, content: data.content,
      authorId: data.authorId, authorName: data.authorName,
      tags: data.tags ?? [], likes: 0, comments: [], likedBy: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }
    this.posts.set(post.id, post)
    this.logger.log(`Post created: ${post.id}`)
    return post
  }

  likePost(postId: string, userId: string): FeedPost {
    const p = this.getPost(postId)
    if (p.likedBy.includes(userId)) {
      return p // already liked, idempotent
    }
    p.likes++
    p.likedBy.push(userId)
    p.updatedAt = new Date().toISOString()
    return p
  }

  unlikePost(postId: string, userId: string): FeedPost {
    const p = this.getPost(postId)
    const idx = p.likedBy.indexOf(userId)
    if (idx === -1) return p
    p.likes = Math.max(0, p.likes - 1)
    p.likedBy.splice(idx, 1)
    p.updatedAt = new Date().toISOString()
    return p
  }

  commentPost(postId: string, data: { userId: string; userName: string; content: string }): FeedComment {
    const p = this.getPost(postId)
    const comment: FeedComment = {
      id: uuid(), postId,
      userId: data.userId, userName: data.userName,
      content: data.content, createdAt: new Date().toISOString(),
    }
    p.comments.push(comment)
    p.updatedAt = new Date().toISOString()
    return comment
  }

  subscribeFeed(userId: string, channel: FeedChannel): FeedSubscription {
    const subs = this.subscriptions.get(userId) ?? []
    const existing = subs.find((s) => s.channel === channel)
    if (existing) return existing
    const sub: FeedSubscription = { userId, channel, subscribedAt: new Date().toISOString() }
    subs.push(sub)
    this.subscriptions.set(userId, subs)
    return sub
  }

  unsubscribeFeed(userId: string, channel: FeedChannel): void {
    const subs = this.subscriptions.get(userId)
    if (!subs) return
    this.subscriptions.set(userId, subs.filter((s) => s.channel !== channel))
  }

  getSubscriptions(userId: string): FeedSubscription[] {
    return this.subscriptions.get(userId) ?? []
  }
}
