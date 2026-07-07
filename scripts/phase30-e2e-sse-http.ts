/**
 * Phase-30 E2E: HTTP SSE 集成层验证
 *
 * 覆盖范围:
 *   1. Controller @Sse endpoint 注册与导出
 *   2. Observable<SseMessageEvent> 推送正确事件序列
 *   3. SSE 协议格式化 (data: {...}\n\n)
 *   4. SDK SSE parser 端到端解析
 *   5. 错误路径: config 不存在 → session_failed 终态
 *   6. 边界: subscribe 立即 unsubscribe / 多次订阅 / Subject 关闭
 *
 * 用法:
 *   npx tsx scripts/phase30-e2e-sse-http.ts
 */
import { AgentController } from '../apps/api/src/modules/agent/agent.controller';
import { AgentService } from '../apps/api/src/modules/agent/agent.service';
import { ToolRegistry } from '../apps/api/src/modules/agent/tool-registry';
import type { AgentSessionEvent } from '../packages/types/src/index';
import { readFileSync } from 'fs';
import { join } from 'path';

interface ObservableLike<T> {
  subscribe(observer: { next?: (v: T) => void; complete?: () => void }): {
    unsubscribe: () => void;
  };
}

interface SseMessage {
  data: AgentSessionEvent | string;
}

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
  // Section 1: Controller @Sse endpoint 注册
  // ────────────────────────────────────────────────────────────────
  section('1. Controller @Sse endpoint 注册');

  const ctrlSrc = readFileSync(
    join(__dirname, '../apps/api/src/modules/agent/agent.controller.ts'),
    'utf-8'
  );

  assert(ctrlSrc.includes("@Sse('sessions/run-stream')"), '@Sse 端点路径正确');
  assert(ctrlSrc.includes('runSessionStream'), 'runSessionStream 方法定义');
  assert(ctrlSrc.includes('Observable<SseMessageEvent>'), '返回 Observable<SseMessageEvent>');
  assert(ctrlSrc.includes('runSessionWithStream'), '委托 AgentService.runSessionWithStream');
  assert(ctrlSrc.includes('queueMicrotask'), 'queueMicrotask 桥接 sync → async');
  assert(ctrlSrc.includes('subject.next({ data: event })'), '推送 SseMessageEvent');

  // 错误处理
  assert(ctrlSrc.includes("type: 'session_failed'"), 'catch 推送 session_failed 终态');
  assert(ctrlSrc.includes('subject.complete()'), 'Subject 关闭');

  // ────────────────────────────────────────────────────────────────
  // Section 2: Observable 推送正确事件序列
  // ────────────────────────────────────────────────────────────────
  section('2. Observable 事件序列');

  const svc = new AgentService(new ToolRegistry());
  const ctrl = new AgentController(svc);

  const events1Promise = new Promise<{ data: AgentSessionEvent | string }>((resolve) => {
    (ctrl.runSessionStream({
      configId: 'default-agent-v1',
      userInput: '查询订单 ORD-20260618-001',
      maxSteps: 5,
      enableReflection: true,
      createdBy: 'phase30-http-test',
      tenantId: 'default'
    }) as ObservableLike<{ data: AgentSessionEvent | string }>).subscribe({
      next: (e) => resolve(e)
    });
  });

  // Subscribe to full stream (cast to ObservableLike 避免 rxjs 依赖)
  let collectedEvents: Array<{ data: AgentSessionEvent | string }> = [];
  let subCompleted = false;
  const sub = (ctrl.runSessionStream({
    configId: 'default-agent-v1',
    userInput: '查询订单 ORD-20260618-002',
    maxSteps: 4,
    enableReflection: false,
    createdBy: 'phase30-http-test-2',
    tenantId: 'default'
  }) as ObservableLike<{ data: AgentSessionEvent | string }>).subscribe({
    next: (e) => collectedEvents.push(e),
    complete: () => {
      subCompleted = true;
    }
  });

  // wait microtasks to flush
  await new Promise((r) => setTimeout(r, 50));

  assert(subCompleted, 'Subject.complete() 触发,Observable 关闭');
  assert(collectedEvents.length >= 8, `stream 至少 8 事件,实际 ${collectedEvents.length}`);

  const types = collectedEvents.map((e) => {
    const d = e.data;
    if (typeof d === 'string') return 'string';
    return d.type;
  });
  assert(types[0] === 'session_started', `首事件 = session_started,实际 ${types[0]}`);
  assert(types[types.length - 1] === 'session_completed', `末事件 = session_completed`);
  assert(types.includes('message_added'), '含 message_added');
  assert(types.includes('step_progress'), '含 step_progress');
  assert(types.includes('tool_call_started'), '含 tool_call_started');
  assert(types.includes('tool_call_completed'), '含 tool_call_completed');
  // reflection-enabled stream: separate subscription
  let reflEvents: Array<SseMessage> = [];
  let reflCompleted = false;
  const reflSub = (ctrl.runSessionStream({
    configId: 'default-agent-v1',
    userInput: 'reflection test',
    maxSteps: 5,
    enableReflection: true,
    createdBy: 'phase30-reflection-test',
    tenantId: 'default'
  }) as ObservableLike<SseMessage>).subscribe({
    next: (e: SseMessage) => reflEvents.push(e),
    complete: () => {
      reflCompleted = true;
    }
  });
  await new Promise((r) => setTimeout(r, 50));
  assert(reflCompleted, 'reflection stream complete');
  const reflTypes = reflEvents.map((e) =>
    typeof e.data === 'string' ? 'string' : e.data.type
  );
  assert(reflTypes.includes('reflection_started'), `reflection_enabled stream 含 reflection_started,实际: ${reflTypes.join(',')}`);
  assert(reflTypes.includes('tool_call_started'), 'reflection_enabled stream 含 tool_call_started');
  assert(reflTypes.includes('tool_call_completed'), 'reflection_enabled stream 含 tool_call_completed');
  assert(reflTypes[reflTypes.length - 1] === 'session_completed', 'reflection_enabled stream 末事件 = session_completed');
  reflSub.unsubscribe();

  // first event captured
  const firstEv = await events1Promise;
  assert(
    typeof firstEv.data === 'object' && (firstEv.data as AgentSessionEvent).type === 'session_started',
    `首事件 = session_started`
  );

  sub.unsubscribe();

  // ────────────────────────────────────────────────────────────────
  // Section 3: SSE 协议格式化 (data: {...}\n\n)
  // ────────────────────────────────────────────────────────────────
  section('3. SSE 协议格式化');

  function formatSse(event: AgentSessionEvent | string): string {
    const data = typeof event === 'string' ? event : JSON.stringify(event);
    return `data: ${data}\n\n`;
  }

  const sampleEvent: AgentSessionEvent = {
    type: 'step_progress',
    step: 3,
    maxSteps: 5,
    timestamp: '2026-06-26T10:00:00.000Z'
  };
  const sseText = formatSse(sampleEvent);
  assert(sseText.startsWith('data: '), 'SSE 格式以 `data: ` 开头');
  assert(sseText.endsWith('\n\n'), 'SSE 格式以 `\\n\\n` 结尾');
  assert(sseText.includes('"type":"step_progress"'), 'JSON 内嵌 type 字段');
  assert(sseText.includes('"step":3'), 'JSON 内嵌 step 字段');

  // 多事件串联
  const multiText = collectedEvents.map((e) => formatSse(e.data as AgentSessionEvent)).join('');
  assert(multiText.split('\n\n').length >= collectedEvents.length, `多事件 chunk 数 >= ${collectedEvents.length}`);
  assert(multiText.includes('"type":"session_started"'), '多事件含 session_started');
  assert(multiText.includes('"type":"session_completed"'), '多事件含 session_completed');

  // ────────────────────────────────────────────────────────────────
  // Section 4: SDK SSE parser 端到端解析
  // ────────────────────────────────────────────────────────────────
  section('4. SDK SSE parser 端到端解析');

  // 复用 SDK 的 SSE parser 逻辑 (来自 packages/sdk/src/index.ts)
  function parseSseText(buffer: string): Array<AgentSessionEvent> {
    const events: AgentSessionEvent[] = [];
    let sepIdx = buffer.indexOf('\n\n');
    while (sepIdx !== -1) {
      const block = buffer.slice(0, sepIdx);
      buffer = buffer.slice(sepIdx + 2);
      const dataLines: string[] = [];
      for (const line of block.split('\n')) {
        if (line.startsWith('data: ')) {
          dataLines.push(line.slice(6));
        }
      }
      if (dataLines.length > 0) {
        try {
          const parsed = JSON.parse(dataLines.join('\n')) as AgentSessionEvent;
          events.push(parsed);
        } catch {
          // ignore malformed
        }
      }
      sepIdx = buffer.indexOf('\n\n');
    }
    return events;
  }

  const parsedEvents = parseSseText(multiText);
  assert(parsedEvents.length === collectedEvents.length, `解析事件数 = ${collectedEvents.length},实际 ${parsedEvents.length}`);
  assert(parsedEvents[0].type === 'session_started', '解析首事件 = session_started');
  assert(
    parsedEvents[parsedEvents.length - 1].type === 'session_completed',
    '解析末事件 = session_completed'
  );

  // 跨 chunk 边界测试: 切碎输入验证 buffer 处理
  const chunked: string[] = [];
  const chunkSize = 32;
  for (let i = 0; i < multiText.length; i += chunkSize) {
    chunked.push(multiText.slice(i, i + chunkSize));
  }
  let chunkedParsed: AgentSessionEvent[] = [];
  let buf = '';
  for (const chunk of chunked) {
    buf += chunk;
    chunkedParsed = chunkedParsed.concat(parseSseText(buf));
    // 模拟 SDK 清除已解析的 buffer
    const lastSep = buf.lastIndexOf('\n\n');
    if (lastSep !== -1) buf = buf.slice(lastSep + 2);
  }
  assert(chunkedParsed.length === collectedEvents.length, `chunked 解析数 = ${collectedEvents.length},实际 ${chunkedParsed.length}`);

  // ────────────────────────────────────────────────────────────────
  // Section 5: 错误路径 (config 不存在 → session_failed 终态)
  // ────────────────────────────────────────────────────────────────
  section('5. 错误路径 (config 不存在)');

  let errEvents: Array<{ data: AgentSessionEvent | string }> = [];
  let errCompleted = false;
  const errSub = (ctrl.runSessionStream({
      configId: 'non-existent-config-id',
      userInput: 'test',
      createdBy: 'phase30-err-test',
      tenantId: 'default'
    }) as ObservableLike<SseMessage>).subscribe({
      next: (e: SseMessage) => errEvents.push(e),
      complete: () => {
        errCompleted = true;
      }
    });

  await new Promise((r) => setTimeout(r, 50));

  assert(errCompleted, '错误路径 Subject.complete() 触发');
  assert(errEvents.length === 1, `错误路径仅 1 个事件,实际 ${errEvents.length}`);
  assert(
    typeof errEvents[0].data === 'object' &&
      (errEvents[0].data as AgentSessionEvent).type === 'session_failed',
    '错误路径推送 session_failed'
  );

  const failedEv = errEvents[0].data as Extract<AgentSessionEvent, { type: 'session_failed' }>;
  assert(
    failedEv.error.includes('non-existent-config-id') ||
      failedEv.error.includes('not found'),
    `错误信息含 configId 或 not found,实际: ${failedEv.error}`
  );
  assert(failedEv.session.status === 'FAILED', 'session.status = FAILED');
  assert(failedEv.session.configId === 'non-existent-config-id', 'session.configId 透传');

  errSub.unsubscribe();

  // disabled config 也应触发 session_failed
  let disabledEvents: Array<{ data: AgentSessionEvent | string }> = [];
  let disabledCompleted = false;
  ctrl
    .runSessionStream({
      configId: 'agent-cfg-ops', // FALLBACK_AGENT_CONFIGS 中 enabled=false
      userInput: 'test disabled',
      createdBy: 'phase30-disabled-test',
      tenantId: 'default'
    })
    .subscribe({
      next: (e) => disabledEvents.push(e),
      complete: () => {
        disabledCompleted = true;
      }
    });
  await new Promise((r) => setTimeout(r, 50));
  assert(disabledCompleted, 'disabled config Subject.complete() 触发');
  assert(
    disabledEvents.length === 1 &&
      (disabledEvents[0].data as AgentSessionEvent).type === 'session_failed',
    'disabled config → session_failed 终态'
  );

  // ────────────────────────────────────────────────────────────────
  // Section 6: 边界 (subscribe 立即 unsubscribe / 多次订阅)
  // ────────────────────────────────────────────────────────────────
  section('6. 边界 (subscribe / unsubscribe / 多次订阅)');

  // 立即 unsubscribe
  const earlySub = (ctrl.runSessionStream({
      configId: 'default-agent-v1',
      userInput: 'early unsub',
      maxSteps: 3,
      enableReflection: false,
      createdBy: 'phase30-early-unsub',
      tenantId: 'default'
    }) as ObservableLike<SseMessage>).subscribe({});
  earlySub.unsubscribe();
  assert(true, '立即 unsubscribe 不抛错');

  // 多次独立订阅 → 各自独立事件流
  const subAEvents: AgentSessionEvent[] = [];
  const subBEvents: AgentSessionEvent[] = [];
  let subAComplete = false;
  let subBComplete = false;
  const subA = (ctrl.runSessionStream({
    configId: 'default-agent-v1',
    userInput: 'multi-sub-A',
    maxSteps: 3,
    enableReflection: false,
    createdBy: 'phase30-multi-A',
    tenantId: 'default'
  }) as ObservableLike<SseMessage>).subscribe({
    next: (e: SseMessage) => subAEvents.push(e.data as AgentSessionEvent),
    complete: () => {
      subAComplete = true;
    }
  });
  const subB = (ctrl.runSessionStream({
    configId: 'default-agent-v1',
    userInput: 'multi-sub-B',
    maxSteps: 3,
    enableReflection: false,
    createdBy: 'phase30-multi-B',
    tenantId: 'default'
  }) as ObservableLike<SseMessage>).subscribe({
    next: (e: SseMessage) => subBEvents.push(e.data as AgentSessionEvent),
    complete: () => {
      subBComplete = true;
    }
  });
  await new Promise((r) => setTimeout(r, 50));
  assert(subAComplete && subBComplete, 'A 与 B 都 complete');
  assert(subAEvents.length >= 8, `A 至少 8 事件,实际 ${subAEvents.length}`);
  assert(subBEvents.length >= 8, `B 至少 8 事件,实际 ${subBEvents.length}`);
  // sessionId 不同
  assert(
    subAEvents[0].type === 'session_started' &&
      subBEvents[0].type === 'session_started',
    'A 与 B 首事件都是 session_started'
  );
  const sessionA = (subAEvents[0] as Extract<AgentSessionEvent, { type: 'session_started' }>).session;
  const sessionB = (subBEvents[0] as Extract<AgentSessionEvent, { type: 'session_started' }>).session;
  assert(sessionA.id !== sessionB.id, `A 与 B session.id 不同 (${sessionA.id} vs ${sessionB.id})`);
  assert(
    sessionA.createdBy === 'phase30-multi-A' && sessionB.createdBy === 'phase30-multi-B',
    'createdBy 隔离正确'
  );

  subA.unsubscribe();
  subB.unsubscribe();

  // ────────────────────────────────────────────────────────────────
  // Section 7: 后端 Service 状态正确性
  // ────────────────────────────────────────────────────────────────
  section('7. 后端 Service 状态');

  // 通过 controller 跑完后,session 应存入 service
  const allSessions = svc.getSessions();
  assert(allSessions.length >= 3, `service 会话数 >= 3,实际 ${allSessions.length}`);
  const startedIds = collectedEvents
    .filter((e) => typeof e.data === 'object' && (e.data as AgentSessionEvent).type === 'session_started')
    .map((e) => (e.data as Extract<AgentSessionEvent, { type: 'session_started' }>).session.id);
  assert(startedIds.length >= 1, '至少 1 个 session_started 事件');
  assert(
    allSessions.some((s) => startedIds.includes(s.id)),
    'session 持久化到 service'
  );

  // ────────────────────────────────────────────────────────────────
  // Section 8: SDK URL 协议对齐
  // ────────────────────────────────────────────────────────────────
  section('8. SDK URL 协议对齐');

  const sdkSrc = readFileSync(
    join(__dirname, '../packages/sdk/src/index.ts'),
    'utf-8'
  );
  assert(sdkSrc.includes('/agent/sessions/run-stream'), 'SDK 指向 /agent/sessions/run-stream');
  assert(sdkSrc.includes('text/event-stream') || sdkSrc.includes('data: '), 'SDK 解析 SSE 格式');
  assert(sdkSrc.includes("data: ") || sdkSrc.includes("'data: '"), 'SDK 期望 `data: ` 前缀');
  assert(sdkSrc.includes('\\n\\n'), 'SDK 按 \\n\\n 分块');

  // controller 路径必须与 SDK 一致
  assert(
    ctrlSrc.includes("'sessions/run-stream'"),
    'controller @Sse 路径 = sessions/run-stream (与 SDK 对齐)'
  );

  // ────────────────────────────────────────────────────────────────
  // 汇总
  // ────────────────────────────────────────────────────────────────
  console.log(`\n═══════════════════════════════════════`);
  console.log(`Phase-30 E2E 结果: ${pass} pass / ${fail} fail`);
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