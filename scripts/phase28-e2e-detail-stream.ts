/**
 * Phase-28 E2E: Session 详情页接入 Stream
 *
 * 覆盖范围:
 *   1. 详情页 stream 集成: 状态条 / 进度条 / 事件计数 / 订阅按钮
 *   2. message 合并: 原 session.messages + stream 增量去重
 *   3. 步骤进度更新: streamStep.current/max 同步
 *   4. 终态事件: session_completed / session_failed 切换状态
 *   5. UI 静态扫描: 5 个 data-testid 存在
 *   6. 边界: non-RUNNING 不订阅 / streamError 显示
 *   7. 错误恢复: resubscribe 按钮可用
 *
 * 用法:
 *   npx tsx scripts/phase28-e2e-detail-stream.ts
 */
import { AgentService } from '../apps/api/src/modules/agent/agent.service';
import { ToolRegistry } from '../apps/api/src/modules/agent/tool-registry';
import type {
  AgentSessionEvent,
  AgentSessionStatus,
  AgentMessage
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
  // Section 1: 后端 stream 复现原 session 行为
  // ────────────────────────────────────────────────────────────────
  section('1. 后端 stream 行为(replay 同一 config + userInput)');

  const svc = new AgentService(new ToolRegistry());

  // 模拟 Session 详情页订阅: re-run 同一 config + userInput
  const replayEvents: AgentSessionEvent[] = [];
  const replayResult = svc.runSessionWithStream(
    {
      configId: 'default-agent-v1',
      userInput: '查询订单 ORD-20260618-001',
      maxSteps: 5,
      enableReflection: true,
      createdBy: 'user-001-detail-replay',
      tenantId: 'default'
    },
    (e) => replayEvents.push(e)
  );

  assert(replayEvents.length >= 30, `replay stream 至少 30 事件,实际 ${replayEvents.length}`);
  assert(replayEvents[0].type === 'session_started', 'replay 首事件 = session_started');
  assert(replayEvents[replayEvents.length - 1].type === 'session_completed', 'replay 末事件 = session_completed');

  const streamMessageEvents = replayEvents.filter(
    (e): e is Extract<AgentSessionEvent, { type: 'message_added' }> => e.type === 'message_added'
  );
  assert(streamMessageEvents.length === 13, `message_added 数量 = 13 (system+user+5thought+5tool+1reflection),实际 ${streamMessageEvents.length}`);

  const streamStepEvents = replayEvents.filter(
    (e): e is Extract<AgentSessionEvent, { type: 'step_progress' }> => e.type === 'step_progress'
  );
  assert(streamStepEvents.length === 5, `step_progress 数量 = 5,实际 ${streamStepEvents.length}`);

  const completedEv = replayEvents.find(
    (e): e is Extract<AgentSessionEvent, { type: 'session_completed' }> => e.type === 'session_completed'
  )!;
  assert(completedEv.session.status === 'COMPLETED', 'replay 完成后 session.status = COMPLETED');
  assert(completedEv.execution.steps === 5, 'replay execution.steps = 5');

  // ────────────────────────────────────────────────────────────────
  // Section 2: 消息合并去重
  // ────────────────────────────────────────────────────────────────
  section('2. 消息合并去重 (session.messages ∪ stream messages)');

  // 模拟原 session 的初始消息 (system + user)
  const originalMessages: AgentMessage[] = [
    {
      id: 'msg-original-sys',
      sessionId: 'session-original',
      role: 'system',
      content: 'You are a helpful assistant',
      timestamp: '2026-06-26T08:00:00.000Z'
    },
    {
      id: 'msg-original-user',
      sessionId: 'session-original',
      role: 'user',
      content: '查询订单 ORD-20260618-001',
      timestamp: '2026-06-26T08:00:01.000Z'
    }
  ];

  // 模拟详情页合并逻辑 (累积 seen 去重,防止 stream 重复推送)
  function mergeMessages(
    original: AgentMessage[],
    streamMsgs: AgentMessage[]
  ): AgentMessage[] {
    if (streamMsgs.length === 0) return original;
    const seen = new Set(original.map((m) => m.id));
    const extras: AgentMessage[] = [];
    for (const m of streamMsgs) {
      if (!seen.has(m.id)) {
        extras.push(m);
        seen.add(m.id);
      }
    }
    return [...original, ...extras];
  }

  const streamMsgsFromReplay = streamMessageEvents.map((e) => e.message);
  const merged = mergeMessages(originalMessages, streamMsgsFromReplay);

  assert(merged.length === originalMessages.length + streamMsgsFromReplay.length,
    `合并后 = ${originalMessages.length} + ${streamMsgsFromReplay.length} = ${merged.length},实际 ${merged.length}`);

  // 去重: 给定包含重复的 stream messages, 合并后不应增加
  const duplicateStream = [streamMsgsFromReplay[0], streamMsgsFromReplay[0], streamMsgsFromReplay[1]];
  const mergedDup = mergeMessages(originalMessages, duplicateStream);
  assert(mergedDup.length === originalMessages.length + 2,
    `去重合并 = ${originalMessages.length} + 2 = ${originalMessages.length + 2},实际 ${mergedDup.length}`);

  // messageFilter = assistant 过滤
  const assistants = merged.filter((m) => m.role === 'assistant');
  assert(assistants.length >= 5, `assistant 消息 >= 5 (含 thought + reflection),实际 ${assistants.length}`);

  // messageFilter = tool 过滤
  const tools = merged.filter((m) => m.role === 'tool');
  assert(tools.length === 5, `tool 消息 = 5,实际 ${tools.length}`);

  // ────────────────────────────────────────────────────────────────
  // Section 3: 步骤进度同步
  // ────────────────────────────────────────────────────────────────
  section('3. 步骤进度同步(streamStep 跟踪 step_progress)');

  let lastStep = { current: 0, max: 5 };
  for (const ev of replayEvents) {
    if (ev.type === 'step_progress') {
      lastStep = { current: ev.step, max: ev.maxSteps };
    }
  }
  assert(lastStep.current === 5, `streamStep.current 最终 = 5,实际 ${lastStep.current}`);
  assert(lastStep.max === 5, `streamStep.max = 5,实际 ${lastStep.max}`);

  // 流式 step 应该是单调递增
  const stepValues = streamStepEvents.map((e) => e.step);
  for (let i = 1; i < stepValues.length; i++) {
    assert(stepValues[i] > stepValues[i - 1], `step_progress 单调递增: ${stepValues[i - 1]} < ${stepValues[i]}`);
  }

  // ────────────────────────────────────────────────────────────────
  // Section 4: 终态事件切换 streamStatus
  // ────────────────────────────────────────────────────────────────
  section('4. 终态事件切换 streamStatus');

  let simulatedStatus: AgentSessionStatus = 'RUNNING';
  for (const ev of replayEvents) {
    if (ev.type === 'session_completed') {
      simulatedStatus = 'COMPLETED';
    } else if (ev.type === 'session_failed') {
      simulatedStatus = 'FAILED';
    }
  }
  assert(simulatedStatus === 'COMPLETED', `replay 后 simulatedStatus = COMPLETED,实际 ${simulatedStatus}`);

  // session_failed 路径
  const svc2 = new AgentService(new ToolRegistry());
  const events2: AgentSessionEvent[] = [];
  try {
    svc2.runSessionWithStream(
      { configId: 'non-existent', userInput: 'x', createdBy: 't', tenantId: 'd' },
      (e) => events2.push(e)
    );
  } catch {
    // throw before stream starts
  }
  // 不应发射任何事件 (因为在 emit session_started 之前就 throw)
  assert(events2.length === 0, `config 不存在时不应发射 stream,实际 ${events2.length}`);

  // listener 异常路径 — service 内部 try/catch 吞错, events 流到 step 2 中断
  const svc3 = new AgentService(new ToolRegistry());
  const events3: AgentSessionEvent[] = [];
  try {
    svc3.runSessionWithStream(
      { configId: 'default-agent-v1', userInput: 'fail test', createdBy: 't', tenantId: 'd' },
      (e) => {
        events3.push(e);
        if (e.type === 'step_progress' && e.step === 2) {
          throw new Error('intentional listener error');
        }
      }
    );
  } catch {
    // listener throw 可能上抛也可能被吞
  }
  // 关键: events 应在 listener throw 时停止,不再继续
  const stepEvents = events3.filter((e) => e.type === 'step_progress');
  assert(stepEvents.length >= 1 && stepEvents.length < 5,
    `listener 异常应中断 stream,step_progress 数量 = 1-4,实际 ${stepEvents.length}`);

  // ────────────────────────────────────────────────────────────────
  // Section 5: UI 静态扫描
  // ────────────────────────────────────────────────────────────────
  section('5. UI 静态扫描 (data-testid + 状态条)');

  const detailSrc = readFileSync(
    join(__dirname, '../apps/admin-web/app/agents/sessions/[id]/session-detail-client.tsx'),
    'utf-8'
  );

  assert(detailSrc.includes("'use client'"), '详情页是 client component');
  assert(detailSrc.includes('useEffect'), '详情页引入 useEffect');
  assert(detailSrc.includes('useRef'), '详情页引入 useRef (streamCancelledRef)');
  assert(detailSrc.includes('runAgentSessionStream'), '详情页引入 runAgentSessionStream');

  assert(detailSrc.includes('detail-stream-status'), 'stream 状态条 testid 存在');
  assert(detailSrc.includes('detail-stream-event-count'), '事件计数 testid 存在');
  assert(detailSrc.includes('detail-stream-progress'), '进度条 testid 存在');
  assert(detailSrc.includes('detail-stream-resubscribe'), '重新订阅按钮 testid 存在');
  assert(detailSrc.includes('detail-stream-cancel'), '取消订阅按钮 testid 存在');

  assert(detailSrc.includes('mergedMessages'), '详情页使用 mergedMessages 合并');
  assert(detailSrc.includes('effectiveStatus'), '详情页使用 effectiveStatus');
  assert(detailSrc.includes('subscribeStream'), '详情页定义 subscribeStream');
  assert(detailSrc.includes('streamCancelledRef'), '详情页有取消 ref');

  assert(detailSrc.includes('🟢 实时流式订阅中'), '状态条文案:订阅中');
  assert(detailSrc.includes('✅ 已完成 (历史快照)'), '状态条文案:历史快照');
  assert(detailSrc.includes('❌ 执行失败'), '状态条文案:失败');
  assert(detailSrc.includes('⏸ 未订阅'), '状态条文案:未订阅');

  assert(detailSrc.includes('-detail-replay'), 'replay 用 createdBy 区分');

  // ────────────────────────────────────────────────────────────────
  // Section 6: 边界场景
  // ────────────────────────────────────────────────────────────────
  section('6. 边界场景');

  // non-RUNNING 会话不应自动订阅
  assert(detailSrc.includes('initialIsRunning = session.status === \'RUNNING\''),
    'initialIsRunning 仅在 RUNNING 状态为 true');
  assert(detailSrc.includes('streamEnabled && initialIsRunning'),
    'useEffect 仅在 initialIsRunning 时调用 subscribeStream');

  // 详情页 fallback 模式(stream 不应尝试订阅)
  assert(detailSrc.includes('deliveryMode === \'fallback\''),
    '详情页 fallback 模式存在分支');

  // stream 取消清理
  assert(detailSrc.includes('return () => {') && detailSrc.includes('streamCancelledRef.current = true'),
    'useEffect cleanup 设置 cancelled');

  // ────────────────────────────────────────────────────────────────
  // Section 7: 错误恢复(resubscribe)
  // ────────────────────────────────────────────────────────────────
  section('7. 错误恢复 (resubscribe 按钮)');

  assert(detailSrc.includes('🔁 重新订阅'), 'resubscribe 按钮文案存在');
  assert(detailSrc.includes('detail-stream-resubscribe'), 'resubscribe testid 存在');
  assert(detailSrc.includes('subscribeStream()'), 'resubscribe 调用 subscribeStream');

  // 当 streamError 有值时, 显示错误
  assert(detailSrc.includes('执行失败') && detailSrc.includes('streamError'),
    'FAILED 时显示 streamError 信息');

  // ────────────────────────────────────────────────────────────────
  // Section 8: view-model wrapper
  // ────────────────────────────────────────────────────────────────
  section('8. view-model stream wrapper');

  const vmSrc = readFileSync(
    join(__dirname, '../apps/admin-web/app/agents/agent-view-model.ts'),
    'utf-8'
  );

  assert(vmSrc.includes('export async function* runAgentSessionStream'), 'view-model export runAgentSessionStream wrapper');
  assert(vmSrc.includes('createAgentClient().runAgentSessionStream'), 'wrapper 委托 SDK stream');
  assert(vmSrc.includes('AsyncGenerator<AgentSessionEvent'), 'wrapper 返回 AsyncGenerator<AgentSessionEvent>');

  // ────────────────────────────────────────────────────────────────
  // 汇总
  // ────────────────────────────────────────────────────────────────
  console.log(`\n═══════════════════════════════════════`);
  console.log(`Phase-28 E2E 结果: ${pass} pass / ${fail} fail`);
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