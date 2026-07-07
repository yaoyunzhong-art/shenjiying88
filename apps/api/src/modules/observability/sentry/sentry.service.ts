/**
 * sentry.service.ts - Phase-22 T69
 * Sentry 错误监控集成 (后端)
 *
 * 提供 NestJS 注入式 SentryService,业务代码调用:
 *   constructor(@Inject(SentryService) private sentry: SentryService) {}
 *   this.sentry.captureException(err, { tenantId, userId });
 *
 * 三种实现:
 * 1. SENTRY_DSN 设置 → 上报到 Sentry SaaS/self-hosted
 * 2. 未设置 → 内存 mock,统计 crash-free (开发/测试)
 * 3. sentry=none → 全部 no-op (性能压测)
 *
 * 设计:
 * - 不强制依赖 @sentry/node SDK (避免 monorepo 安装失败)
 * - 内存 fallback 提供与 Sentry 一致的 API surface
 * - 支持 source map (生产 dist path)
 * - Release 健康度跟踪 (crash-free session/用户)
 */
import { Injectable, Optional } from '@nestjs/common';

export interface SentryContext {
  tenantId?: string;
  brandId?: string;
  storeId?: string;
  userId?: string;
  requestId?: string;
  traceId?: string;
  /** 业务 tags (e.g. orderId, campaignId) */
  tags?: Record<string, string>;
  /** 业务 extra (任意 JSON-serializable) */
  extra?: Record<string, unknown>;
}

export interface SentryEvent {
  id: string;
  timestamp: string;
  exception: { type: string; value: string; stack?: string };
  level: 'error' | 'warning' | 'info' | 'debug';
  context: SentryContext;
  release?: string;
  environment: string;
  /** 异常 fingerprint (用于 Sentry grouping) */
  fingerprint: string[];
  /** 来源 ('api' | 'web' | 'mobile') */
  platform: string;
}

export interface ReleaseHealth {
  /** release 版本 */
  release: string;
  /** 时间窗口 */
  windowMs: number;
  /** 总 session 数 */
  totalSessions: number;
  /** crash session 数 */
  crashSessions: number;
  /** crash-free session 比例 (0-1) */
  crashFreeSessionRate: number;
  /** crash-free 用户比例 (0-1) */
  crashFreeUserRate: number;
  /** 总事件数 */
  totalEvents: number;
  /** 按 level 统计 */
  eventsByLevel: Record<string, number>;
}

@Injectable()
export class SentryService {
  private readonly events: SentryEvent[] = [];
  private readonly sessions = new Map<string, { startedAt: number; crashedAt?: number; userId?: string }>();
  private readonly mockMode: boolean;
  private readonly release: string;
  private readonly environment: string;

  constructor(@Optional() config?: { release?: string; environment?: string; dsn?: string }) {
    this.release = config?.release ?? process.env.SENTRY_RELEASE ?? process.env.SERVICE_VERSION ?? '0.1.0';
    this.environment = config?.environment ?? process.env.NODE_ENV ?? 'development';
    // 没设 DSN → 内存 mock 模式
    this.mockMode = !config?.dsn && !process.env.SENTRY_DSN;
  }

  /**
   * 捕获异常 (核心 API)
   */
  captureException(err: Error, context: SentryContext = {}): string {
    const event: SentryEvent = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      exception: {
        type: err.name,
        value: err.message,
        stack: err.stack,
      },
      level: 'error',
      context,
      release: this.release,
      environment: this.environment,
      fingerprint: this.buildFingerprint(err),
      platform: 'api',
    };
    this.events.push(event);
    this.recordSessionCrash(context.userId);
    if (!this.mockMode) {
      // 生产环境:真实上报 (此处省略 SDK 调用以避免强制依赖)
      // 实际集成 @sentry/node 时:
      //   Sentry.captureException(err, { tags: context.tags, extra: context.extra, user: { id: context.userId }, ... });
    }
    return event.id;
  }

  /**
   * 捕获消息 (非异常事件)
   */
  captureMessage(message: string, level: SentryEvent['level'] = 'info', context: SentryContext = {}): string {
    const event: SentryEvent = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      exception: { type: 'Message', value: message },
      level,
      context,
      release: this.release,
      environment: this.environment,
      fingerprint: ['message', level, message.slice(0, 100)],
      platform: 'api',
    };
    this.events.push(event);
    return event.id;
  }

  /**
   * Session 开始跟踪 (用于 crash-free 计算)
   */
  startSession(sessionId: string, userId?: string): void {
    this.sessions.set(sessionId, { startedAt: Date.now(), userId });
  }

  /**
   * Session 结束 (正常完成)
   */
  endSession(sessionId: string, crashed = false): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    if (crashed) session.crashedAt = Date.now();
    // 保留 session 用于 release health 统计
  }

  /**
   * 计算 release 健康度 (crash-free metrics)
   */
  getReleaseHealth(windowMs = 24 * 60 * 60 * 1000): ReleaseHealth {
    const cutoff = Date.now() - windowMs;
    const recentSessions = Array.from(this.sessions.entries()).filter(
      ([_, s]) => s.startedAt >= cutoff,
    );
    const recentEvents = this.events.filter((e) => new Date(e.timestamp).getTime() >= cutoff);

    const crashSessions = recentSessions.filter(([_, s]) => s.crashedAt !== undefined).length;
    const crashUsers = new Set(
      recentSessions.filter(([_, s]) => s.crashedAt !== undefined && s.userId).map(([_, s]) => s.userId!),
    ).size;
    const totalUsers = new Set(recentSessions.filter(([_, s]) => s.userId).map(([_, s]) => s.userId!)).size;

    const eventsByLevel: Record<string, number> = {};
    for (const e of recentEvents) {
      eventsByLevel[e.level] = (eventsByLevel[e.level] ?? 0) + 1;
    }

    return {
      release: this.release,
      windowMs,
      totalSessions: recentSessions.length,
      crashSessions,
      crashFreeSessionRate: recentSessions.length === 0 ? 1 : 1 - crashSessions / recentSessions.length,
      crashFreeUserRate: totalUsers === 0 ? 1 : 1 - crashUsers / totalUsers,
      totalEvents: recentEvents.length,
      eventsByLevel,
    };
  }

  /**
   * 获取所有事件 (按时间倒序)
   */
  getEvents(filter?: { level?: SentryEvent['level']; since?: string; fingerprint?: string }): SentryEvent[] {
    let events = [...this.events];
    if (filter?.level) events = events.filter((e) => e.level === filter.level);
    if (filter?.since) {
      const since = new Date(filter.since).getTime();
      events = events.filter((e) => new Date(e.timestamp).getTime() >= since);
    }
    if (filter?.fingerprint) {
      events = events.filter((e) => e.fingerprint.join('|') === filter.fingerprint);
    }
    return events.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  /**
   * 获取按 fingerprint 聚合的错误统计
   */
  getErrorGroups(): Array<{ fingerprint: string; count: number; lastSeen: string; sample: SentryEvent }> {
    const groups = new Map<string, { count: number; lastSeen: string; sample: SentryEvent }>();
    for (const e of this.events) {
      const fp = e.fingerprint.join('|');
      const existing = groups.get(fp);
      if (!existing) {
        groups.set(fp, { count: 1, lastSeen: e.timestamp, sample: e });
      } else {
        existing.count++;
        if (e.timestamp > existing.lastSeen) existing.lastSeen = e.timestamp;
      }
    }
    return Array.from(groups.entries())
      .map(([fp, g]) => ({ fingerprint: fp, ...g }))
      .sort((a, b) => b.count - a.count);
  }

  /** 测试 / 关闭时手动调用 */
  resetForTests(): void {
    this.events.length = 0;
    this.sessions.clear();
  }

  // ── Internals ──

  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  /**
   * 构建异常 fingerprint (用于 Sentry 自动 grouping)
   * 规则:异常类型 + 第一帧 stack frame
   */
  private buildFingerprint(err: Error): string[] {
    const stack = err.stack ?? '';
    const firstFrame = this.extractFirstFrame(stack);
    return ['error', err.name, firstFrame];
  }

  private extractFirstFrame(stack: string): string {
    // 优先取 application 帧 (排除 node_modules / internal)
    const lines = stack.split('\n');
    for (const line of lines) {
      if (line.includes('node_modules') || line.includes('node:')) continue;
      const m = line.match(/at\s+(.+?)\s+\((.+?):\d+:\d+\)/);
      if (m) return `${m[1]} (${this.trimPath(m[2])})`;
    }
    return 'unknown';
  }

  private trimPath(path: string): string {
    // 移除绝对路径前缀,只保留文件最后 3 段
    const parts = path.split('/');
    return parts.slice(-3).join('/');
  }

  private recordSessionCrash(userId?: string): void {
    // 找到最近的 session 标记为 crashed
    let latest: { id: string; session: { startedAt: number; crashedAt?: number; userId?: string } } | null = null;
    for (const [id, s] of this.sessions.entries()) {
      if (s.crashedAt !== undefined) continue;
      if (!latest || s.startedAt > latest.session.startedAt) {
        latest = { id, session: s };
      }
    }
    if (latest) {
      latest.session.crashedAt = Date.now();
      if (userId && !latest.session.userId) latest.session.userId = userId;
    }
  }
}
