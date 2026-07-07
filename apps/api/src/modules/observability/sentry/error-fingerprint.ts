/**
 * error-fingerprint.ts - Phase-22 T72
 * Error Fingerprint 计算 + 聚合
 *
 * 独立工具,与 SentryService 解耦:
 * - computeFingerprint(err, options): 自定义 fingerprint 规则
 * - groupErrors(events): 按 fingerprint 分组
 * - dedupeStackFrames(stack): 归一化 stack trace (去除变量值/路径噪音)
 *
 * 用于:
 * - 不同异常源 (API/MQ/Cron) 自定义分组
 * - 相同错误的不同堆栈归一化 (用户输入/路径前缀)
 * - 跨服务错误聚合
 */

export interface FingerprintOptions {
  /** 是否包含错误信息到 fingerprint (默认 false,避免变量值干扰) */
  includeMessage?: boolean;
  /** 自定义追加 fingerprint parts */
  custom?: string[];
}

export interface ErrorGroup {
  fingerprint: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  samples: Array<{ type: string; message: string; stack?: string }>;
  /** 受影响用户数 (需外部提供) */
  affectedUsers?: number;
}

/**
 * 计算异常的 fingerprint
 * 默认: [error, type, normalizedFirstFrame]
 */
export function computeFingerprint(err: Error, options: FingerprintOptions = {}): string[] {
  const stack = err.stack ?? '';
  const firstFrame = extractAppFrame(stack);
  const parts = ['error', err.name, firstFrame];
  if (options.includeMessage) parts.push(err.message.slice(0, 100));
  if (options.custom) parts.push(...options.custom);
  return parts;
}

export function fingerprintToString(parts: string[]): string {
  return parts.join('|');
}

/**
 * 归一化 stack trace 帧 (用于更稳定的 fingerprint)
 * - 移除绝对路径前缀 (只保留相对路径)
 * - 替换行内变量值噪音 (UUID, 时间戳)
 */
export function normalizeStackFrame(frame: string): string {
  return frame
    // macOS: /Users/<name>/<...>/app/foo.ts → /USER/app/foo.ts (保留末尾 2 段应用路径)
    .replace(/\/Users\/[^/\s)]+(?:\/[^/\s)]+)*\/app\/[^/\s)]+/g, (match) => {
      const parts = match.split('/');
      return '/USER/' + parts.slice(-2).join('/');
    })
    // 通用: /Users/<name> 单独替换
    .replace(/\/Users\/[^/\s)]+/g, '/USER')
    // Linux: /home/<name>/<...>/app/foo.ts → /HOME/app/foo.ts
    .replace(/\/home\/[^/\s)]+(?:\/[^/\s)]+)*\/app\/[^/\s)]+/g, (match) => {
      const parts = match.split('/');
      return '/HOME/' + parts.slice(-2).join('/');
    })
    .replace(/\/home\/[^/\s)]+/g, '/HOME')
    // 噪音归一化
    .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, '<UUID>')
    .replace(/\d{10,13}/g, '<TIMESTAMP>')
    .replace(/0x[a-f0-9]+/gi, '<HEX>');
}

function extractAppFrame(stack: string): string {
  const lines = stack.split('\n');
  for (const line of lines) {
    if (line.includes('node_modules') || line.includes('node:')) continue;
    const m = line.match(/at\s+(.+?)\s+\((.+?):\d+:\d+\)/);
    if (m) {
      const normalized = normalizeStackFrame(m[2]);
      const parts = normalized.split('/');
      return `${m[1]} (${parts.slice(-3).join('/')})`;
    }
  }
  return 'unknown';
}

export interface ErrorEventForGrouping {
  fingerprint: string[];
  type: string;
  message: string;
  stack?: string;
  timestamp: string;
  userId?: string;
}

/**
 * 按 fingerprint 分组事件
 */
export function groupErrors(events: ErrorEventForGrouping[]): ErrorGroup[] {
  const groups = new Map<string, ErrorGroup & { users: Set<string> }>();

  for (const e of events) {
    const fp = fingerprintToString(e.fingerprint);
    let group = groups.get(fp);
    if (!group) {
      group = {
        fingerprint: fp,
        count: 0,
        firstSeen: e.timestamp,
        lastSeen: e.timestamp,
        samples: [],
        users: new Set(),
      };
      groups.set(fp, group);
    }
    group.count++;
    if (e.timestamp < group.firstSeen) group.firstSeen = e.timestamp;
    if (e.timestamp > group.lastSeen) group.lastSeen = e.timestamp;
    if (group.samples.length < 5) {
      group.samples.push({ type: e.type, message: e.message, stack: e.stack });
    }
    if (e.userId) group.users.add(e.userId);
  }

  return Array.from(groups.values())
    .map((g) => ({ ...g, affectedUsers: g.users.size }))
    .sort((a, b) => b.count - a.count);
}
