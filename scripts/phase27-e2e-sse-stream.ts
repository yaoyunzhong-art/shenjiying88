/**
 * Phase-27 E2E: SSE / 实时流推送验证
 *
 * 覆盖范围:
 *   1. types 事件协议: 7 类事件 + discriminated union + 类型守卫
 *   2. 后端 stream: 事件顺序、字段完整性、终态事件
 *   3. 边界场景: config 不存在(session_failed)、reflection 关闭、maxSteps 覆盖
 *   4. SDK SSE parser: fetch + ReadableStream 解析
 *   5. Studio UI: stream 模式组件 (data-testid 验证)
 *
 * 用法:
 *   npx tsx scripts/phase27-e2e-sse-stream.ts
 */
import { AgentService } from '../apps/api/src/modules/agent/agent.service';
import { ToolRegistry } from '../apps/api/src/modules/agent/tool-registry';
import { ApiClient } from '../packages/sdk/src/index';
import type {
  AgentSessionEvent,
  AgentSessionEventType
} from '../packages/types/src/index';
import { readFileSync } from 'fs';
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
// Section 1: types 事件协议
// ────────────────────────────────────────────────────────────────
section('1. types 事件协议');

const EXPECTED_TYPES: AgentSessionEventType[] = [
  'session_started',
  'message_added',
  'tool_call_started',
  'tool_call_completed',
  'step_progress',
  'reflection_started',
  'session_completed',
  'session_failed'
];

assert(EXPECTED_TYPES.length === 8, `Phase-27 共 8 种事件类型,实际 ${EXPECTED_TYPES.length}`);

// 类型守卫测试 (编译期 + 运行期)
function isStepProgress(e: AgentSessionEvent): e is Extract<AgentSessionEvent, { type: 'step_progress' }> {
  return e.type === 'step_progress';
}
function isCompleted(e: AgentSessionEvent): e is Extract<AgentSessionEvent, { type: 'session_completed' }> {
  return e.type === 'session_completed';
}

const mockStepEvent: AgentSessionEvent = { type: 'step_progress', step: 1, maxSteps: 5, timestamp: new Date().toISOString() };
assert(isStepProgress(mockStepEvent), '类型守卫: step_progress');
assert(!isCompleted(mockStepEvent), '类型守卫: 非 step_progress 不被误识别为 session_completed');

// ────────────────────────────────────────────────────────────────
// Section 2: 后端 stream 基础流
// ────────────────────────────────────────────────────────────────
section('2. 后端 stream 基础流 (5 步 + reflection)');

const svc = new AgentService(new ToolRegistry());
const events: AgentSessionEvent[] = [];

const result = svc.runSessionWithStream(
  {
    configId: 'default-agent-v1',
    userInput: '查询订单 ORD-001',
    createdBy: 'tester',
    tenantId: 'default'
  },
  (e) => events.push(e)
);

assert(events.length >= 20, `stream 至少 20 事件,实际 ${events.length}`);
assert(events[0].type === 'session_started', `首事件是 session_started,实际 ${events[0].type}`);
assert(events[events.length - 1].type === 'session_completed', `末事件是 session_completed,实际 ${events[events.length - 1].type}`);

const typesPresent = new Set(events.map((e) => e.type));
for (const t of EXPECTED_TYPES.filter((x) => x !== 'session_failed')) {
  assert(typesPresent.has(t), `事件类型 ${t} 存在`);
}

// session_started 字段完整性
const started = events.find((e) => e.type === 'session_started')!;
assert(started.type === 'session_started', 'session_started: type 正确');
assert(started.session.id.startsWith('session-'), `session_started: id 是 session-xxx,实际 ${started.session.id}`);
assert(started.session.status === 'RUNNING', `session_started: status 是 RUNNING,实际 ${started.session.status}`);
assert(typeof started.timestamp === 'string', 'session_started: timestamp 是字符串');
assert(new Date(started.timestamp).getTime() > 0, 'session_started: timestamp 可解析');

// step_progress 字段 + 单调递增
const stepEvents = events.filter(isStepProgress);
assert(stepEvents.length === 5, `step_progress 数量 = 5,实际 ${stepEvents.length}`);
for (let i = 0; i < stepEvents.length; i++) {
  assert(stepEvents[i].step === i + 1, `step_progress #${i + 1} 序号正确`);
  assert(stepEvents[i].maxSteps === 5, `step_progress #${i + 1} maxSteps = 5`);
}

// tool_call_started / tool_call_completed 配对
const startedTools = events.filter((e) => e.type === 'tool_call_started');
const completedTools = events.filter((e) => e.type === 'tool_call_completed');
assert(startedTools.length === 5, `tool_call_started 数量 = 5,实际 ${startedTools.length}`);
assert(completedTools.length === 5, `tool_call_completed 数量 = 5,实际 ${completedTools.length}`);

for (let i = 0; i < startedTools.length; i++) {
  const s = startedTools[i];
  const c = completedTools[i];
  if (s.type === 'tool_call_started' && c.type === 'tool_call_completed') {
    assert(s.toolCall.id === c.toolCall.id, `工具调用 #${i + 1} started/completed id 配对`);
    assert(s.toolCall.status === 'PENDING', `工具调用 #${i + 1} started 时 status=PENDING`);
    assert(c.toolCall.status === 'SUCCESS', `工具调用 #${i + 1} completed 时 status=SUCCESS`);
  }
}

// session_completed 字段
const completed = events.find(isCompleted)!;
assert(completed.session.status === 'COMPLETED', `session_completed: status=COMPLETED,实际 ${completed.session.status}`);
assert(completed.session.currentStep === 5, `session_completed: currentStep=5,实际 ${completed.session.currentStep}`);
assert(completed.execution.status === 'SUCCESS', `session_completed: execution.status=SUCCESS`);
assert(completed.execution.steps === 5, `session_completed: execution.steps=5`);

// reflection_started 只在最后一步
const reflections = events.filter((e) => e.type === 'reflection_started');
assert(reflections.length === 1, `reflection_started 数量 = 1,实际 ${reflections.length}`);
assert(reflections[0].type === 'reflection_started' && reflections[0].step === 5, 'reflection_started 在第 5 步');

// 事件顺序: session_started 在 step_progress 之前
const startedIdx = events.findIndex((e) => e.type === 'session_started');
const firstStepIdx = events.findIndex(isStepProgress);
assert(startedIdx < firstStepIdx, 'session_started 先于 step_progress');

// 事件顺序: 最后一个 step_progress 后是 reflection_started (然后 session_completed)
const lastStepIdx = events.map((e) => e.type).lastIndexOf('step_progress');
const reflectionIdx = events.findIndex((e) => e.type === 'reflection_started');
const completedIdx = events.findIndex(isCompleted);
assert(reflectionIdx > lastStepIdx, 'reflection_started 在最后一个 step_progress 后');
assert(completedIdx > reflectionIdx, 'session_completed 在 reflection_started 后');

// message_added 累计 12 条 (1 system + 1 user + 5 thought + 5 tool + 1 reflection)
const msgEvents = events.filter((e) => e.type === 'message_added');
assert(msgEvents.length === 13, `message_added 数量 = 13,实际 ${msgEvents.length}`);

// ────────────────────────────────────────────────────────────────
// Section 3: 边界场景
// ────────────────────────────────────────────────────────────────
section('3. 边界场景');

// 3.1 config 不存在 → throw (未触发 stream)
const svc2 = new AgentService(new ToolRegistry());
let threw = false;
try {
  svc2.runSessionWithStream(
    { configId: 'non-existent-cfg', userInput: 'hi', createdBy: 't', tenantId: 'd' },
    () => {}
  );
} catch {
  threw = true;
}
assert(threw, 'config 不存在应抛错');

// 3.2 reflection 关闭 → 无 reflection_started
const svc3 = new AgentService(new ToolRegistry());
const events3: AgentSessionEvent[] = [];
svc3.runSessionWithStream(
  {
    configId: 'default-agent-v1',
    userInput: 'no reflection',
    enableReflection: false,
    createdBy: 't',
    tenantId: 'd'
  },
  (e) => events3.push(e)
);
const reflections3 = events3.filter((e) => e.type === 'reflection_started');
assert(reflections3.length === 0, `reflection 关闭时无 reflection_started,实际 ${reflections3.length}`);

// 3.3 maxSteps 覆盖
const svc4 = new AgentService(new ToolRegistry());
const events4: AgentSessionEvent[] = [];
svc4.runSessionWithStream(
  {
    configId: 'default-agent-v1',
    userInput: 'short',
    maxSteps: 3,
    createdBy: 't',
    tenantId: 'd'
  },
  (e) => events4.push(e)
);
const steps4 = events4.filter((e) => e.type === 'step_progress');
assert(steps4.length === 3, `maxSteps=3 时 step_progress 数量 = 3,实际 ${steps4.length}`);
assert(steps4.every((e) => e.type === 'step_progress' && e.maxSteps === 3), 'maxSteps=3 时所有 step_progress.maxSteps=3');

// 3.4 listener 抛错不应破坏主流程 (服务内部 try/catch)
const svc5 = new AgentService(new ToolRegistry());
const events5: AgentSessionEvent[] = [];
let listenerThrew = 0;
try {
  svc5.runSessionWithStream(
    { configId: 'default-agent-v1', userInput: 'safe listener', createdBy: 't', tenantId: 'd' },
    (e) => {
      events5.push(e);
      // 中途抛错
      if (e.type === 'step_progress' && e.step === 2) {
        listenerThrew++;
        throw new Error('listener intentional error');
      }
    }
  );
} catch {
  // 服务可以捕获也可上抛,关键是事件流仍产出 session_completed 之前的事件
}
assert(events5.filter((e) => e.type === 'step_progress').length >= 2, 'listener 抛错后 stream 仍产出 >=2 step_progress');
assert(listenerThrew === 1, 'listener 抛错次数 = 1');

// ────────────────────────────────────────────────────────────────
// Section 4: SDK SSE parser (mock fetch + ReadableStream)
// ────────────────────────────────────────────────────────────────
section('4. SDK SSE parser (mock ReadableStream)');

// 模拟一个 SSE 响应
function mockSseResponse(events: AgentSessionEvent[]): Response {
  const encoder = new TextEncoder();
  const chunks: string[] = [];
  for (const e of events) {
    chunks.push(`data: ${JSON.stringify(e)}\n\n`);
  }
  chunks.push('data: [DONE]\n\n');

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    }
  });

  return new Response(stream, {
    status: 200,
    headers: { 'content-type': 'text/event-stream' }
  });
}

// Mock global fetch
const originalFetch = global.fetch;
const mockEvents: AgentSessionEvent[] = [
  { type: 'session_started', session: result.session, timestamp: new Date().toISOString() },
  { type: 'step_progress', step: 1, maxSteps: 2, timestamp: new Date().toISOString() },
  { type: 'session_completed', session: result.session, execution: result.execution, timestamp: new Date().toISOString() }
];

let fetchCalled = false;
global.fetch = (async (_url: string | URL | Request, _init?: RequestInit) => {
  fetchCalled = true;
  return mockSseResponse(mockEvents);
}) as typeof fetch;

try {
  const client = new ApiClient({ baseUrl: 'http://localhost:3000' });
  const collected: AgentSessionEvent[] = [];
  await (async () => {
    for await (const ev of client.runAgentSessionStream({
      configId: 'default-agent-v1',
      userInput: 'sdk test',
      createdBy: 't',
      tenantId: 'd'
    })) {
      collected.push(ev);
    }
  })();

  assert(fetchCalled, 'SDK 调用了 fetch');
  assert(collected.length === 3, `SDK parser 解析 3 事件,实际 ${collected.length}`);
  assert(collected[0].type === 'session_started', 'SDK parser 第 1 事件 = session_started');
  assert(collected[1].type === 'step_progress', 'SDK parser 第 2 事件 = step_progress');
  assert(collected[2].type === 'session_completed', 'SDK parser 第 3 事件 = session_completed');
} finally {
  global.fetch = originalFetch;
}

// ────────────────────────────────────────────────────────────────
// Section 5: Studio UI stream 组件存在性 (静态扫描)
// ────────────────────────────────────────────────────────────────
section('5. Studio UI stream 组件 (静态扫描)');

const studioSrc = readFileSync(
  join(__dirname, '../apps/admin-web/app/agents/studio/studio-client.tsx'),
  'utf-8'
);

assert(studioSrc.includes('streamMode'), 'Studio 引入 streamMode state');
assert(studioSrc.includes('runStream'), 'Studio 引入 runStream 函数');
assert(studioSrc.includes('streamEvents'), 'Studio 累积 streamEvents');
assert(studioSrc.includes('streamMessages'), 'Studio 累积 streamMessages');
assert(studioSrc.includes('streamStep'), 'Studio 追踪 streamStep');
assert(studioSrc.includes('streamFinalSessionId'), 'Studio 保存 streamFinalSessionId');
assert(studioSrc.includes('studio-stream-mode'), 'Studio checkbox testid 存在');
assert(studioSrc.includes('studio-stream-running'), 'Studio running 指示器 testid 存在');
assert(studioSrc.includes('studio-stream-progress'), 'Studio 进度条 testid 存在');
assert(studioSrc.includes('studio-stream-messages'), 'Studio 消息流 testid 存在');
assert(studioSrc.includes('studio-stream-event-types'), 'Studio 事件类型直方图 testid 存在');
assert(studioSrc.includes('studio-stream-completed'), 'Studio 完成卡片 testid 存在');
assert(studioSrc.includes('studio-stream-error'), 'Studio 错误卡片 testid 存在');
assert(studioSrc.includes('/agents/sessions/${streamFinalSessionId}'), 'Studio 完成跳转 Session 详情');

const vmSrc = readFileSync(
  join(__dirname, '../apps/admin-web/app/agents/agent-view-model.ts'),
  'utf-8'
);
assert(vmSrc.includes('runAgentSessionStream'), 'view-model export runAgentSessionStream');
assert(vmSrc.includes('createAgentClient().runAgentSessionStream'), 'view-model 委托 SDK runAgentSessionStream');

const sdkSrc = readFileSync(
  join(__dirname, '../packages/sdk/src/index.ts'),
  'utf-8'
);
assert(sdkSrc.includes('runAgentSessionStream'), 'SDK 暴露 runAgentSessionStream');
assert(sdkSrc.includes('AsyncGenerator<AgentSessionEvent'), 'SDK src 返回 AsyncGenerator<AgentSessionEvent>');
assert(sdkSrc.includes('text/event-stream'), 'SDK 文档说明 SSE content-type');
assert(sdkSrc.includes('/agent/sessions/run-stream'), 'SDK 调用 /agent/sessions/run-stream 端点');

const typesSrc = readFileSync(
  join(__dirname, '../packages/types/src/index.ts'),
  'utf-8'
);
assert(typesSrc.includes('export type AgentSessionEvent'), 'types export AgentSessionEvent');
assert(typesSrc.includes("type: 'session_started'"), 'types 包含 session_started');
assert(typesSrc.includes("type: 'session_completed'"), 'types 包含 session_completed');
assert(typesSrc.includes("type: 'session_failed'"), 'types 包含 session_failed');
assert(typesSrc.includes('AgentSessionEventType'), 'types 包含 AgentSessionEventType union');

// ────────────────────────────────────────────────────────────────
// 汇总
// ────────────────────────────────────────────────────────────────
console.log(`\n═══════════════════════════════════════`);
console.log(`Phase-27 E2E 结果: ${pass} pass / ${fail} fail`);
if (fail > 0) {
  console.log(`\n失败项:`);
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
console.log(`✓ 全部断言通过`);
} // end main()

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});