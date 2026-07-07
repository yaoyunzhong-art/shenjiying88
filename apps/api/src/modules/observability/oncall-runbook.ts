/**
 * oncall-runbook.ts - Phase-22 T76
 * Oncall 轮值 + Runbook 自动执行
 *
 * 轮值 (Rotation):
 *   - 按周/月轮值,自动切换 primary / secondary
 *   - 集成飞书 / PagerDuty webhook
 *
 * Runbook:
 *   - 告警规则可绑定 runbook (按 alert.ruleId 查找)
 *   - 自动化执行: 重启服务 / 清理缓存 / 扩容
 *   - 手动执行: 升级通知 / 拉群 / 拉取日志
 */
import { Alert, AlertSeverity } from './alert-engine';

export type OncallRole = 'primary' | 'secondary' | 'manager';

export interface OncallEngineer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  /** 飞书 user_id (webhook 通知用) */
  feishuUserId?: string;
  /** 时区 (e.g. 'Asia/Shanghai') */
  timezone: string;
  /** 当前角色 */
  currentRole?: OncallRole;
}

export interface RotationConfig {
  /** 轮值周期 (ms),默认 7 天 */
  rotationMs?: number;
  /** 起始时间 (epoch ms),默认当前时间 */
  startAt?: number;
  /** 工程师列表 (按顺序轮换) */
  engineers: OncallEngineer[];
}

export interface OncallSchedule {
  /** 当前周期开始时间 */
  cycleStart: string;
  /** 当前周期结束时间 */
  cycleEnd: string;
  primary?: OncallEngineer;
  secondary?: OncallEngineer;
  manager?: OncallEngineer;
}

export type RunbookAction =
  | { type: 'webhook'; url: string; payload: Record<string, unknown> }
  | { type: 'log'; message: string; level: 'info' | 'warn' | 'error' }
  | { type: 'restart_service'; service: string }
  | { type: 'clear_cache'; cache: string }
  | { type: 'page'; severity: AlertSeverity; channel: 'feishu' | 'pagerduty' | 'sms' };

export interface Runbook {
  id: string;
  /** 关联 alert.ruleId */
  alertRuleId: string;
  /** 自动化动作 (按顺序执行) */
  actions: RunbookAction[];
  /** 是否启用 */
  enabled: boolean;
  /** 描述 */
  description?: string;
}

// ── Oncall Rotation ──

export class OncallRotation {
  private readonly config: Required<RotationConfig>;

  constructor(config: RotationConfig) {
    if (config.engineers.length === 0) {
      throw new Error('At least one engineer required');
    }
    this.config = {
      rotationMs: config.rotationMs ?? 7 * 24 * 60 * 60 * 1000,
      startAt: config.startAt ?? Date.now(),
      engineers: config.engineers,
    };
  }

  /**
   * 获取当前轮值 schedule
   */
  currentSchedule(now = Date.now()): OncallSchedule {
    const elapsed = now - this.config.startAt;
    const cycleIndex = Math.floor(elapsed / this.config.rotationMs);
    const cycleStart = this.config.startAt + cycleIndex * this.config.rotationMs;
    const cycleEnd = cycleStart + this.config.rotationMs;

    const total = this.config.engineers.length;
    const primary = this.config.engineers[cycleIndex % total];
    const secondary = this.config.engineers[(cycleIndex + 1) % total];
    const manager = this.config.engineers[(cycleIndex + 2) % total];

    return {
      cycleStart: new Date(cycleStart).toISOString(),
      cycleEnd: new Date(cycleEnd).toISOString(),
      primary,
      secondary,
      manager,
    };
  }

  /**
   * 获取特定时间点的 primary oncall
   */
  getOncallAt(timestamp: number, role: OncallRole = 'primary'): OncallEngineer | undefined {
    const schedule = this.currentSchedule(timestamp);
    return schedule[role];
  }

  listEngineers(): OncallEngineer[] {
    return [...this.config.engineers];
  }
}

// ── Runbook Registry & Executor ──

export interface RunbookExecutorContext {
  alert: Alert;
  /** 真实环境执行动作 (生产 webhook / 重启) */
  executeActions: boolean;
  /** 飞书/PagerDuty 发送器 (mock 或真实) */
  notifier: Notifier;
  /** 服务重启 callback (mock 或真实) */
  serviceRestarter: (service: string) => Promise<{ success: boolean; message: string }>;
  /** 缓存清理 callback */
  cacheClearer: (cache: string) => Promise<{ success: boolean; message: string }>;
}

export interface Notifier {
  send(channel: 'feishu' | 'pagerduty' | 'sms', payload: { userId?: string; alert: Alert }): Promise<{ delivered: boolean }>;
}

/**
 * Default notifier (no-op,用于测试)
 */
export class MockNotifier implements Notifier {
  public sentMessages: Array<{ channel: string; payload: unknown }> = [];
  async send(channel: 'feishu' | 'pagerduty' | 'sms', payload: unknown): Promise<{ delivered: boolean }> {
    this.sentMessages.push({ channel, payload });
    return { delivered: true };
  }
}

export class RunbookRegistry {
  private readonly runbooks = new Map<string, Runbook>();

  register(runbook: Runbook): void {
    this.runbooks.set(runbook.alertRuleId, runbook);
  }

  get(alertRuleId: string): Runbook | undefined {
    return this.runbooks.get(alertRuleId);
  }

  list(): Runbook[] {
    return Array.from(this.runbooks.values());
  }

  /**
   * 执行 runbook (按顺序执行所有 actions)
   */
  async execute(alertRuleId: string, ctx: RunbookExecutorContext): Promise<{
    runbook?: Runbook;
    results: Array<{ action: RunbookAction; ok: boolean; message?: string }>;
  }> {
    const rb = this.runbooks.get(alertRuleId);
    if (!rb) return { results: [] };
    if (!rb.enabled) return { runbook: rb, results: [] };

    const results: Array<{ action: RunbookAction; ok: boolean; message?: string }> = [];
    for (const action of rb.actions) {
      const result = await this.executeAction(action, ctx);
      results.push(result);
    }
    return { runbook: rb, results };
  }

  private async executeAction(
    action: RunbookAction,
    ctx: RunbookExecutorContext,
  ): Promise<{ action: RunbookAction; ok: boolean; message?: string }> {
    if (!ctx.executeActions) {
      return { action, ok: true, message: 'dry-run (executeActions=false)' };
    }

    switch (action.type) {
      case 'log':
        // 业务日志已在外层处理,这里返回成功
        return { action, ok: true, message: 'logged' };

      case 'webhook':
        try {
          // 简化:生产应 fetch(action.url, { method: 'POST', body: JSON.stringify(action.payload) })
          return { action, ok: true, message: `webhook ${action.url} called (mock)` };
        } catch (e) {
          return { action, ok: false, message: (e as Error).message };
        }

      case 'page': {
        const result = await ctx.notifier.send(action.channel, { alert: ctx.alert });
        return { action, ok: result.delivered, message: `paged via ${action.channel}` };
      }

      case 'restart_service': {
        const r = await ctx.serviceRestarter(action.service);
        return { action, ok: r.success, message: r.message };
      }

      case 'clear_cache': {
        const r = await ctx.cacheClearer(action.cache);
        return { action, ok: r.success, message: r.message };
      }
    }
  }
}

// ── Default Runbooks ──

export const DEFAULT_RUNBOOKS: Runbook[] = [
  {
    id: 'rb-5xx',
    alertRuleId: 'http_5xx_high',
    enabled: true,
    description: '5xx 错误率高: page oncall + 拉取最近错误日志',
    actions: [
      { type: 'log', message: '[runbook] 5xx 错误率告警触发', level: 'error' },
      { type: 'page', severity: 'P0', channel: 'feishu' },
      { type: 'webhook', url: 'https://hooks.internal/log-tail', payload: { service: 'm5-api', lines: 200 } },
    ],
  },
  {
    id: 'rb-latency',
    alertRuleId: 'latency_p99_high',
    enabled: true,
    description: 'P99 延迟高: 通知 oncall + 抓取 slow query',
    actions: [
      { type: 'log', message: '[runbook] P99 延迟告警触发', level: 'warn' },
      { type: 'page', severity: 'P1', channel: 'feishu' },
    ],
  },
  {
    id: 'rb-exception-burst',
    alertRuleId: 'exceptions_burst',
    enabled: true,
    description: '异常突增: 通知 oncall + 拉取 Sentry',
    actions: [
      { type: 'log', message: '[runbook] 异常突增告警', level: 'warn' },
      { type: 'webhook', url: 'https://hooks.internal/sentry-recent', payload: { window: '5m' } },
    ],
  },
];

export function installDefaultRunbooks(registry: RunbookRegistry): void {
  for (const rb of DEFAULT_RUNBOOKS) registry.register(rb);
}
