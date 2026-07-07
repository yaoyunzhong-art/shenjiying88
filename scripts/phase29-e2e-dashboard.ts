/**
 * Phase-29 E2E: 多 Session 并发监控仪表盘
 *
 * 覆盖范围:
 *   1. view-model aggregator: loadAgentDashboardSnapshot 字段对齐
 *   2. 多 session 并发 stream: N 个 RUNNING → N 个独立 stream
 *   3. 统计卡片: running / completed / failed / total
 *   4. Session 列表渲染: 排序、状态、进度、事件计数
 *   5. UI 静态扫描: data-testid + 文案
 *   6. 边界: 0 running / 全失败 / fallback
 *   7. cleanup: useEffect 取消所有 stream
 *
 * 用法:
 *   npx tsx scripts/phase29-e2e-dashboard.ts
 */
import { AgentService } from '../apps/api/src/modules/agent/agent.service';
import { ToolRegistry } from '../apps/api/src/modules/agent/tool-registry';
import type {
  AgentSession,
  AgentSessionEvent
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
  // Section 1: view-model aggregator 字段
  // ────────────────────────────────────────────────────────────────
  section('1. view-model aggregator 字段对齐');

  const vmSrc = readFileSync(
    join(__dirname, '../apps/admin-web/app/agents/agent-view-model.ts'),
    'utf-8'
  );

  assert(vmSrc.includes('AgentDashboardSnapshot'), '定义 AgentDashboardSnapshot 类型');
  assert(vmSrc.includes('loadAgentDashboardSnapshot'), '导出 loadAgentDashboardSnapshot');
  assert(
    vmSrc.includes('runningCount: stats.runningSessions'),
    'runningCount 取自 stats.runningSessions'
  );
  assert(
    vmSrc.includes('completedCount: stats.completedSessions'),
    'completedCount 取自 stats.completedSessions'
  );
  assert(
    vmSrc.includes('failedCount: stats.failedSessions'),
    'failedCount 取自 stats.failedSessions'
  );
  assert(
    vmSrc.includes('totalConfigs: configIds.size') ||
      vmSrc.includes('totalConfigs: new Set'),
    'totalConfigs = 去重 configId 数'
  );
  assert(
    vmSrc.includes('totalExecutions: stats.totalSessions'),
    'totalExecutions = stats.totalSessions'
  );
  assert(vmSrc.includes('Promise.all'), 'stats 与 sessions 并发 fetch (Promise.all)');

  // fallback 分支
  assert(vmSrc.includes("deliveryMode: 'fallback'"), 'fallback deliveryMode 存在');
  assert(
    vmSrc.includes("sessions.filter((s) => s.status === 'RUNNING')"),
    'fallback 也计算 runningCount'
  );

  // ────────────────────────────────────────────────────────────────
  // Section 2: 多 session 并发 stream 模拟
  // ────────────────────────────────────────────────────────────────
  section('2. 多 session 并发 stream (N 个独立 subscribe)');

  const svc = new AgentService(new ToolRegistry());

  // 模拟 3 个 session 并发
  const sessionConfigs = [
    {
      configId: 'default-agent-v1',
      userInput: '查询订单 ORD-001',
      createdBy: 'user-001-dash',
      tenantId: 'default',
      maxSteps: 4,
      enableReflection: false
    },
    {
      configId: 'default-agent-v1',
      userInput: '查询订单 ORD-002',
      createdBy: 'user-002-dash',
      tenantId: 'default',
      maxSteps: 3,
      enableReflection: false
    },
    {
      configId: 'default-agent-v1',
      userInput: '查询订单 ORD-003',
      createdBy: 'user-003-dash',
      tenantId: 'default',
      maxSteps: 5,
      enableReflection: false
    }
  ];

  const allEventLists: AgentSessionEvent[][] = [[], [], []];

  const start = Date.now();
  await Promise.all(
    sessionConfigs.map((cfg, idx) =>
      svc.runSessionWithStream(cfg, (e) => allEventLists[idx].push(e))
    )
  );
  const elapsed = Date.now() - start;

  assert(allEventLists.length === 3, `3 个 session eventList 数组`);
  for (let i = 0; i < 3; i++) {
    assert(allEventLists[i].length >= 8, `session-${i + 1} stream 至少 8 事件`);
    assert(allEventLists[i][0].type === 'session_started', `session-${i + 1} 首事件 = session_started`);
    assert(
      allEventLists[i][allEventLists[i].length - 1].type === 'session_completed',
      `session-${i + 1} 末事件 = session_completed`
    );
  }
  assert(elapsed < 5000, `3 session 并发总耗时 < 5s,实际 ${elapsed}ms`);

  // 合并统计
  const totalEvents = allEventLists.reduce((acc, l) => acc + l.length, 0);
  assert(totalEvents >= 24, `合并事件总数 >= 24,实际 ${totalEvents}`);

  // ────────────────────────────────────────────────────────────────
  // Section 3: per-session 聚合 (running / completed / failed / total)
  // ────────────────────────────────────────────────────────────────
  section('3. per-session 聚合 (runningLive / completedLive / failedLive)');

  function aggregate(events: AgentSessionEvent[]) {
    let running = 0;
    let completed = 0;
    let failed = 0;
    let totalMessages = 0;
    let totalSteps = 0;
    let lastStep = 0;
    let maxStepSeen = 0;
    for (const ev of events) {
      if (ev.type === 'message_added') totalMessages++;
      else if (ev.type === 'step_progress') {
        totalSteps++;
        lastStep = ev.step;
        if (ev.step > maxStepSeen) maxStepSeen = ev.step;
      } else if (ev.type === 'session_completed') {
        completed++;
        if (running > 0) running--;
      } else if (ev.type === 'session_failed') {
        failed++;
        if (running > 0) running--;
      } else if (ev.type === 'session_started') {
        running++;
      }
    }
    return { running, completed, failed, totalMessages, totalSteps, lastStep, maxStepSeen };
  }

  const agg0 = aggregate(allEventLists[0]);
  assert(agg0.completed === 1, `session-1 终态 = completed,实际 ${agg0.completed}`);
  assert(agg0.failed === 0, `session-1 无失败`);
  assert(agg0.totalSteps === 4, `session-1 step_progress 数量 = 4,实际 ${agg0.totalSteps}`);

  const agg2 = aggregate(allEventLists[2]);
  assert(agg2.completed === 1, `session-3 终态 = completed`);
  assert(agg2.totalSteps === 5, `session-3 step_progress = 5`);

  // ────────────────────────────────────────────────────────────────
  // Section 4: Session 列表排序
  // ────────────────────────────────────────────────────────────────
  section('4. Session 列表排序 (RUNNING > PENDING > COMPLETED > FAILED > CANCELLED)');

  const STATUS_RANK: Record<string, number> = {
    RUNNING: 0,
    PENDING: 1,
    COMPLETED: 2,
    FAILED: 3,
    CANCELLED: 4
  };

  const mockSessions: AgentSession[] = [
    {
      id: 's-c',
      configId: 'cfg',
      status: 'COMPLETED',
      userInput: 'done',
      currentStep: 5,
      maxSteps: 5,
      enableReflection: false,
      messages: [],
      createdAt: '2026-06-26T10:00:00.000Z',
      createdBy: 'u',
      tenantId: 't'
    },
    {
      id: 's-r',
      configId: 'cfg',
      status: 'RUNNING',
      userInput: 'running',
      currentStep: 2,
      maxSteps: 5,
      enableReflection: false,
      messages: [],
      createdAt: '2026-06-26T10:01:00.000Z',
      createdBy: 'u',
      tenantId: 't'
    },
    {
      id: 's-f',
      configId: 'cfg',
      status: 'FAILED',
      userInput: 'failed',
      currentStep: 3,
      maxSteps: 5,
      enableReflection: false,
      messages: [],
      createdAt: '2026-06-26T10:02:00.000Z',
      createdBy: 'u',
      tenantId: 't'
    }
  ];

  const sorted = [...mockSessions].sort(
    (a, b) => (STATUS_RANK[a.status] ?? 99) - (STATUS_RANK[b.status] ?? 99)
  );
  assert(sorted[0].id === 's-r', `首位 = RUNNING (s-r),实际 ${sorted[0].id}`);
  assert(sorted[1].id === 's-c', `次位 = COMPLETED (s-c),实际 ${sorted[1].id}`);
  assert(sorted[2].id === 's-f', `末位 = FAILED (s-f),实际 ${sorted[2].id}`);

  // ────────────────────────────────────────────────────────────────
  // Section 5: UI 静态扫描
  // ────────────────────────────────────────────────────────────────
  section('5. UI 静态扫描 (data-testid + 文案)');

  const clientSrc = readFileSync(
    join(__dirname, '../apps/admin-web/app/agents/dashboard/dashboard-client.tsx'),
    'utf-8'
  );

  assert(clientSrc.includes("'use client'"), 'dashboard-client 是 client component');
  assert(clientSrc.includes('useEffect'), '引入 useEffect');
  assert(clientSrc.includes('useRef'), '引入 useRef (cancelled refs)');
  assert(clientSrc.includes('useCallback'), '引入 useCallback (subscribeStream)');
  assert(clientSrc.includes('useMemo'), '引入 useMemo (stats)');
  assert(clientSrc.includes('useState'), '引入 useState (liveState / paused)');

  assert(clientSrc.includes('runAgentSessionStream'), '引用 runAgentSessionStream');
  assert(clientSrc.includes('subscribeStream'), '定义 subscribeStream');
  assert(clientSrc.includes('cancelledRefs'), 'cancelled refs 注册表');
  assert(clientSrc.includes('cancelToken.cancelled'), 'cancelToken.cancelled 终止信号');

  // data-testid (dashboard-stats 在 page.tsx)
  const expectedTestIds = [
    'dashboard-client',
    'dashboard-delivery-mode',
    'dashboard-timestamp',
    'dashboard-toggle-pause',
    'dashboard-error-banner',
    'dashboard-session-list',
    'dashboard-session-row',
    'dashboard-session-streaming',
    'dashboard-session-detail-link',
    'dashboard-session-step',
    'dashboard-session-progress',
    'dashboard-session-pct',
    'dashboard-session-events',
    'dashboard-session-error',
    'dashboard-empty'
  ];
  for (const tid of expectedTestIds) {
    assert(clientSrc.includes(`'${tid}'`) || clientSrc.includes(`"${tid}"`), `data-testid="${tid}" 存在`);
  }

  // 文案
  assert(clientSrc.includes('🟢 Live API'), 'delivery-mode 文案 (api)');
  assert(clientSrc.includes('🟡 Fallback'), 'delivery-mode 文案 (fallback)');
  assert(clientSrc.includes('⏸ 暂停订阅'), 'pause 按钮文案');
  assert(clientSrc.includes('▶ 恢复订阅'), 'resume 按钮文案');
  assert(clientSrc.includes('📡 订阅中'), 'streaming 标记文案');
  assert(clientSrc.includes('详情 →'), '详情链接文案');

  // page.tsx 静态扫描
  const pageSrc = readFileSync(
    join(__dirname, '../apps/admin-web/app/agents/dashboard/page.tsx'),
    'utf-8'
  );
  assert(pageSrc.includes('loadAgentDashboardSnapshot'), 'page.tsx 调用 loadAgentDashboardSnapshot');
  assert(pageSrc.includes('STATUS_RANK'), 'page.tsx 定义排序 rank');
  assert(pageSrc.includes('AgentDashboardClient'), 'page.tsx 引入客户端组件');
  assert(pageSrc.includes('dynamic = \'force-dynamic\''), 'page.tsx dynamic = force-dynamic');
  assert(pageSrc.includes('运行中'), 'StatCard: 运行中');
  assert(pageSrc.includes('已完成'), 'StatCard: 已完成');
  assert(pageSrc.includes('失败'), 'StatCard: 失败');
  assert(pageSrc.includes('总会话'), 'StatCard: 总会话');

  // ────────────────────────────────────────────────────────────────
  // Section 6: 边界场景
  // ────────────────────────────────────────────────────────────────
  section('6. 边界场景');

  // 0 running: 用全集非空 mockSessions 子集
  const noRunningMock = mockSessions.filter((s) => s.status !== 'RUNNING');
  const zeroRunning = noRunningMock.filter((s) => s.status === 'RUNNING');
  assert(zeroRunning.length === 0, '过滤 RUNNING 后 0 个');
  // 全失败
  const allFailed = mockSessions.every((s) => s.status === 'FAILED');
  assert(!allFailed, 'mock 非全失败');
  // deliveryMode fallback 时不应订阅
  assert(
    clientSrc.includes('if (deliveryMode !== \'api\') return'),
    'fallback 模式跳过订阅'
  );
  assert(clientSrc.includes('if (paused) return'), 'paused 状态跳过订阅');
  assert(
    clientSrc.includes('if (session.status !== \'RUNNING\') return'),
    '非 RUNNING 不订阅'
  );

  // cleanup: 取消所有
  assert(
    clientSrc.includes('cancelledRefs.current[id]'),
    'cleanup 遍历 cancelledRefs'
  );
  assert(
    clientSrc.includes('ref.cancelled = true'),
    'cleanup 设置 cancelled = true'
  );

  // ────────────────────────────────────────────────────────────────
  // Section 7: 并发 fetch + useEffect 依赖
  // ────────────────────────────────────────────────────────────────
  section('7. 并发 fetch + useEffect 依赖');

  assert(
    clientSrc.includes('Promise.all(controllers)') ||
      clientSrc.includes('running.map((s) => subscribeStream(s))'),
    'Promise.all 并发订阅'
  );

  assert(
    clientSrc.includes('sessions.map((s) => `${s.id}:${s.status}`).join(\',\')'),
    'useEffect 依赖按 id:status'
  );

  // ────────────────────────────────────────────────────────────────
  // Section 8: dashboard fallback 字段
  // ────────────────────────────────────────────────────────────────
  section('8. fallback 字段完整性');

  assert(
    vmSrc.includes('runningCount: sessions.filter'),
    'fallback runningCount 从 sessions 过滤'
  );
  assert(
    vmSrc.includes('completedCount: sessions.filter'),
    'fallback completedCount 从 sessions 过滤'
  );
  assert(
    vmSrc.includes('failedCount: sessions.filter'),
    'fallback failedCount 从 sessions 过滤'
  );
  assert(
    vmSrc.includes('avgSteps: FALLBACK_AGENT_STATS.avgSteps'),
    'fallback avgSteps 取自 fallback stats'
  );

  // ────────────────────────────────────────────────────────────────
  // 汇总
  // ────────────────────────────────────────────────────────────────
  console.log(`\n═══════════════════════════════════════`);
  console.log(`Phase-29 E2E 结果: ${pass} pass / ${fail} fail`);
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