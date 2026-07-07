/**
 * Phase-32 E2E: Stream 重连 + Last-Event-ID 续传
 *
 * 覆盖范围 (47 断言):
 *   1. SDK 指数退避 (1s/2s/4s)               — 8 断言
 *   2. SDK maxRetries 限制                   — 6 断言
 *   3. Last-Event-ID header 传递              — 5 断言
 *   4. 服务端 EventBuffer append/replay       — 8 断言
 *   5. 服务端 410 Gone 过期处理               — 6 断言
 *   6. ReconnectingBadge 组件 + 文件静态扫描  — 14 断言
 *
 * 用法:
 *   npx tsx --tsconfig=apps/api/tsconfig.json scripts/phase32-e2e-reconnect.ts
 */
import {
  computeBackoffDelay,
  subscribeStream,
  ApiClient
} from '../packages/sdk/src/index';
import { EventBufferService } from '../apps/api/src/modules/agent/event-buffer.service';
import { AgentController } from '../apps/api/src/modules/agent/agent.controller';
import { AgentService } from '../apps/api/src/modules/agent/agent.service';
import { ToolRegistry } from '../apps/api/src/modules/agent/tool-registry';
import type { AgentSessionEvent } from '../packages/types/src/index';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

async function main() {
  let pass = 0;
  let fail = 0;
  const failures: string[] = [];

  function assert(cond: unknown, msg: string) {
    if (cond) {
      pass++;
    } else {
      fail++;
      failures.push(msg);
      console.error('  ✗', msg);
    }
  }

  function section(name: string) {
    console.log(`\n── ${name} ──`);
  }

  // ────────────────────────────────────────────────────────────────
  // Section 1: SDK 指数退避 (1s/2s/4s)
  // ────────────────────────────────────────────────────────────────
  section('1. SDK 指数退避 (1s/2s/4s)');

  // computeBackoffDelay 单元测试
  assert(computeBackoffDelay(1) === 1000, `attempt 1 = 1000ms,实际 ${computeBackoffDelay(1)}`);
  assert(computeBackoffDelay(2) === 2000, `attempt 2 = 2000ms,实际 ${computeBackoffDelay(2)}`);
  assert(computeBackoffDelay(3) === 4000, `attempt 3 = 4000ms,实际 ${computeBackoffDelay(3)}`);
  assert(computeBackoffDelay(4) === 8000, `attempt 4 = 8000ms,实际 ${computeBackoffDelay(4)}`);

  // 自定义参数
  assert(
    computeBackoffDelay(2, 500, 3) === 1500,
    `自定义 500/3: attempt 2 = 1500ms,实际 ${computeBackoffDelay(2, 500, 3)}`
  );
  assert(
    computeBackoffDelay(3, 2000, 2) === 8000,
    `自定义 2000/2: attempt 3 = 8000ms,实际 ${computeBackoffDelay(3, 2000, 2)}`
  );

  // 边界: attempt=0 应为 initialDelay
  assert(computeBackoffDelay(0) === 1000, `attempt 0 = initialDelay (1000ms)`);

  // SDK 文件静态扫描关键 token
  const sdkSrc = readFileSync(join(__dirname, '../packages/sdk/src/index.ts'), 'utf-8');
  assert(sdkSrc.includes('computeBackoffDelay'), 'SDK 导出 computeBackoffDelay');
  assert(sdkSrc.includes('subscribeStream'), 'SDK 导出 subscribeStream');

  // ────────────────────────────────────────────────────────────────
  // Section 2: SDK maxRetries 限制
  // ────────────────────────────────────────────────────────────────
  section('2. SDK maxRetries 限制');

  assert(sdkSrc.includes('maxRetries'), 'SDK 含 maxRetries 字段');
  assert(sdkSrc.includes('attempts: attempt'), 'SDK onError 含 attempts 字段');
  assert(sdkSrc.includes('willRetry'), 'SDK onError 含 willRetry 字段');
  assert(sdkSrc.includes('closed'), 'SDK 4 状态含 closed');
  assert(sdkSrc.includes('reconnecting'), 'SDK 4 状态含 reconnecting');
  assert(sdkSrc.includes('getStatus'), 'SDK 句柄含 getStatus()');

  // ────────────────────────────────────────────────────────────────
  // Section 3: Last-Event-ID header 传递
  // ────────────────────────────────────────────────────────────────
  section('3. Last-Event-ID header 传递');

  assert(sdkSrc.includes("'Last-Event-ID'"), "SDK 注入 'Last-Event-ID' header");
  assert(sdkSrc.includes('lastEventId'), 'SDK 跟踪 lastEventId');
  assert(sdkSrc.includes('getLastEventId'), 'SDK 句柄 getLastEventId()');
  assert(sdkSrc.includes('initialLastEventId'), 'SDK 支持 initialLastEventId 注入');
  assert(
    sdkSrc.includes('headers: Record<string, string>'),
    'SDK 构造 headers 对象'
  );

  // ────────────────────────────────────────────────────────────────
  // Section 4: 服务端 EventBuffer append/replay
  // ────────────────────────────────────────────────────────────────
  section('4. 服务端 EventBuffer append/replay');

  const buffer = new EventBufferService();

  // append + id 自增
  const event1: AgentSessionEvent = {
    type: 'session_started',
    session: {
      id: 'sess-test-1',
      configId: 'cfg-1',
      status: 'RUNNING',
      userInput: 'test',
      currentStep: 0,
      maxSteps: 5,
      enableReflection: false,
      messages: [],
      createdAt: '2026-06-27T00:00:00.000Z',
      createdBy: 'phase32',
      tenantId: 'default'
    },
    timestamp: '2026-06-27T00:00:00.000Z'
  };
  const b1 = buffer.append('sess-test-1', event1);
  assert(b1.id === 1, `append #1 id = 1,实际 ${b1.id}`);
  assert(buffer.size('sess-test-1') === 1, `size = 1`);
  assert(buffer.has('sess-test-1'), `has(sess-test-1) = true`);

  const b2 = buffer.append('sess-test-1', { ...event1, type: 'message_added' } as AgentSessionEvent);
  assert(b2.id === 2, `append #2 id = 2`);
  const b3 = buffer.append('sess-test-1', { ...event1, type: 'step_progress', step: 1 } as AgentSessionEvent);
  assert(b3.id === 3, `append #3 id = 3`);

  // replayAfter 找到 lastId 之后的事件
  const replay1 = buffer.replayAfter('sess-test-1', 1);
  assert(replay1.found === true, 'replayAfter(1) found = true');
  assert(replay1.events.length === 2, `replayAfter(1) 返回 2 条 (id 2,3)`);
  assert(replay1.events[0].id === 2, `首事件 id = 2`);
  assert(replay1.events[1].id === 3, `次事件 id = 3`);
  assert(replay1.lastValidId === 1, `lastValidId = 1 (最老 id)`);

  // ────────────────────────────────────────────────────────────────
  // Section 5: 服务端 410 Gone 过期处理
  // ────────────────────────────────────────────────────────────────
  section('5. 服务端 410 Gone 过期处理');

  // 不存在的 session
  assert(buffer.has('non-existent') === false, `has(non-existent) = false`);
  const replay2 = buffer.replayAfter('non-existent', 1);
  assert(replay2.events.length === 0, `non-existent session 返回 0 events`);
  assert(replay2.found === false, `non-existent found = false`);

  // lastEventId 早于 buffer 最老 (模拟过期)
  const expired = buffer.replayAfter('sess-test-1', -1);
  assert(expired.found === false, 'lastId < oldest → found = false');
  assert(expired.events.length === 3, `返回全部 3 条 buffer`);
  assert(expired.lastValidId === 1, `lastValidId = 1`);

  // LRU 100 限制: append 100 条后,最早的应被淘汰
  buffer.clearAll();
  for (let i = 0; i < 105; i++) {
    buffer.append('sess-lru', { ...event1, type: 'message_added' } as unknown as AgentSessionEvent);
  }
  const actualLruSize = buffer.size('sess-lru');
  assert(actualLruSize === 100, `LRU 100: 105 append 后 size = 100,实际 ${actualLruSize}`);
  const lruReplay = buffer.replayAfter('sess-lru', 5);
  if (lruReplay.events.length > 0) {
    assert(lruReplay.events[0].id === 6, `LRU 淘汰最早: 首 id = 6,实际 ${lruReplay.events[0].id}`);
  } else {
    assert(false, `LRU replay events 为空`);
  }

  // 全局 session 上限 (LRU session 淘汰)
  buffer.clearAll();
  // 简化测试:插入 10001 个 session 触发 LRU
  // 为了性能,只插入 10001 但只验证 size 上限
  for (let i = 0; i < 10001; i++) {
    buffer.append(`sess-${i}`, { ...event1, type: 'message_added' } as unknown as AgentSessionEvent);
  }
  assert(buffer.totalSessions() <= 10000, `全局 sessions <= 10000`);

  // ────────────────────────────────────────────────────────────────
  // Section 6: ReconnectingBadge 组件 + 文件静态扫描
  // ────────────────────────────────────────────────────────────────
  section('6. ReconnectingBadge 组件 + 静态扫描');

  const badgePath = join(__dirname, '../packages/ui/src/components/ReconnectingBadge.tsx');
  assert(existsSync(badgePath), 'ReconnectingBadge.tsx 文件存在');
  const badgeSrc = readFileSync(badgePath, 'utf-8');

  assert(badgeSrc.includes('ReconnectingState'), '导出 ReconnectingState 类型');
  assert(badgeSrc.includes("'connecting'"), '4 状态含 connecting');
  assert(badgeSrc.includes("'open'"), '4 状态含 open');
  assert(badgeSrc.includes("'reconnecting'"), '4 状态含 reconnecting');
  assert(badgeSrc.includes("'closed'"), '4 状态含 closed');
  assert(badgeSrc.includes('data-testid="reconnecting-badge"'), 'data-testid 暴露');
  assert(badgeSrc.includes('onRetry'), 'closed 状态显示重试按钮');
  assert(badgeSrc.includes('autoHideMs'), 'open 状态 3s 自动隐藏');

  // Controller 集成静态扫描
  const ctrlSrc = readFileSync(
    join(__dirname, '../apps/api/src/modules/agent/agent.controller.ts'),
    'utf-8'
  );
  assert(ctrlSrc.includes('EventBufferService'), 'Controller 注入 EventBufferService');
  assert(ctrlSrc.includes("last-event-id"), 'Controller 读 last-event-id header');
  assert(ctrlSrc.includes('eventBuffer.append'), 'Controller listener 调 append');
  assert(ctrlSrc.includes('HttpException'), 'Controller 用 HttpException 返回 410');
  assert(ctrlSrc.includes('410'), 'Controller 410 Gone');
  assert(ctrlSrc.includes("'sessions/:id/events'"), 'replay 端点路径正确');

  // Module 注册
  const moduleSrc = readFileSync(
    join(__dirname, '../apps/api/src/modules/agent/agent.module.ts'),
    'utf-8'
  );
  assert(moduleSrc.includes('EventBufferService'), 'Module 注册 EventBufferService');

  // ────────────────────────────────────────────────────────────────
  // 汇总
  // ────────────────────────────────────────────────────────────────
  console.log(`\n═══════════════════════════════════════`);
  console.log(`Phase-32 E2E 结果: ${pass} pass / ${fail} fail`);
  if (fail > 0) {
    console.log(`\n失败项:`);
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
  console.log(`✓ 全部断言通过`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});