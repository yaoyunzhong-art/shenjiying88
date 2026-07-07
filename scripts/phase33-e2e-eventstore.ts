/**
 * Phase-33 E2E: EventStore Postgres 持久化 (in-memory 实现)
 *
 * 覆盖范围 (44 断言):
 *   1. Postgres schema 文件存在 + 关键字段      — 4 断言
 *   2. EventStoreService.persist 写入成功        — 6 断言
 *   3. EventStoreService.loadAfter 读取正确       — 6 断言
 *   4. EventBuffer 双写 (内存 + EventStore)       — 6 断言
 *   5. LISTEN/NOTIFY 订阅机制                   — 6 断言
 *   6. 多租户隔离 (tenant_id)                   — 5 断言
 *   7. Phase-32 接口兼容 (replayAfter 仍可用)   — 5 断言
 *   8. 静态扫描 (EventStore / persist / notify) — 6 断言
 *
 * 用法:
 *   npx tsx --tsconfig=apps/api/tsconfig.json scripts/phase33-e2e-eventstore.ts
 */
import { EventStoreService } from '../apps/api/src/modules/agent/event-store.service';
import { EventBufferService } from '../apps/api/src/modules/agent/event-buffer.service';
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
  // Section 1: Postgres schema 文件 + 关键字段
  // ────────────────────────────────────────────────────────────────
  section('1. Postgres schema 文件 + 关键字段');

  const schemaPath = join(__dirname, '../apps/api/src/database/migrations/001_agent_events.sql');
  assert(existsSync(schemaPath), 'schema migration 文件存在');
  const schemaSrc = readFileSync(schemaPath, 'utf-8');
  assert(schemaSrc.includes('CREATE TABLE IF NOT EXISTS agent_events'), 'CREATE TABLE 语句');
  assert(schemaSrc.includes('session_id'), '表含 session_id 字段');
  assert(schemaSrc.includes('event_id'), '表含 event_id 字段');
  assert(schemaSrc.includes('tenant_id'), '表含 tenant_id 字段 (Phase-31 多租户)');
  assert(schemaSrc.includes('payload'), '表含 payload JSONB');
  assert(schemaSrc.includes('UNIQUE (session_id, event_id)'), 'session 内 event_id 唯一');
  assert(schemaSrc.includes('pg_notify'), 'pg_notify 触发器');
  assert(schemaSrc.includes("'agent_events'"), 'notify channel 名正确');

  // ────────────────────────────────────────────────────────────────
  // Section 2: EventStoreService.persist 写入成功
  // ────────────────────────────────────────────────────────────────
  section('2. EventStoreService.persist');

  const store = new EventStoreService();
  const sampleEvent: AgentSessionEvent = {
    type: 'session_started',
    session: {
      id: 'sess-p33-1',
      configId: 'cfg-1',
      status: 'RUNNING',
      userInput: 'test',
      currentStep: 0,
      maxSteps: 5,
      enableReflection: false,
      messages: [],
      createdAt: '2026-06-27T00:00:00.000Z',
      createdBy: 'phase33',
      tenantId: 'default'
    },
    timestamp: '2026-06-27T00:00:00.000Z'
  } as AgentSessionEvent & { id: number };

  await store.persist('sess-p33-1', { ...sampleEvent, id: 1 }, 'tenant-A');
  assert(store.has('sess-p33-1'), 'persist 后 has(sessionId) = true');
  assert(store.size('sess-p33-1') === 1, `size = 1,实际 ${store.size('sess-p33-1')}`);

  await store.persist('sess-p33-1', { ...sampleEvent, id: 2, type: 'message_added' } as unknown as typeof sampleEvent, 'tenant-A');
  await store.persist('sess-p33-1', { ...sampleEvent, id: 3, type: 'step_progress' } as unknown as typeof sampleEvent, 'tenant-A');
  assert(store.size('sess-p33-1') === 3, `3 次 persist 后 size = 3`);

  // persist 不抛异常
  let persistThrew = false;
  try {
    await store.persist('sess-p33-1', { ...sampleEvent, id: 4 } as unknown as typeof sampleEvent, 'tenant-A');
  } catch {
    persistThrew = true;
  }
  assert(persistThrew === false, 'persist 永不抛异常 (fire-and-forget)');

  // ────────────────────────────────────────────────────────────────
  // Section 3: EventStoreService.loadAfter 读取正确
  // ────────────────────────────────────────────────────────────────
  section('3. EventStoreService.loadAfter');

  const after1 = await store.loadAfter('sess-p33-1', 1);
  assert(after1.length === 3, `loadAfter(1) 返回 3 条,实际 ${after1.length}`);
  assert(after1[0].id === 2, `首事件 id = 2`);
  assert(after1[2].id === 4, `末事件 id = 4`);

  const after2 = await store.loadAfter('sess-p33-1', 4);
  assert(after2.length === 0, `loadAfter(4) 返回 0 (没有更新事件)`);

  const after3 = await store.loadAfter('sess-p33-1', 0);
  assert(after3.length === 4, `loadAfter(0) 返回全部 4 条`);

  // 不存在的 session
  const after4 = await store.loadAfter('non-existent', 0);
  assert(after4.length === 0, `non-existent session 返回 0`);

  // getSessionHistory
  const history = await store.getSessionHistory('sess-p33-1');
  assert(history.length === 4, `getSessionHistory 返回 4 条`);

  // ────────────────────────────────────────────────────────────────
  // Section 4: EventBuffer 双写 (内存 + EventStore)
  // ────────────────────────────────────────────────────────────────
  section('4. EventBuffer 双写');

  const buffer = new EventBufferService();
  const storeForDual = new EventStoreService();
  buffer.setEventStore(storeForDual);

  const bufEvt: AgentSessionEvent = {
    type: 'session_started',
    session: {
      id: 'sess-buf-1',
      configId: 'cfg-1',
      status: 'RUNNING',
      userInput: 'test',
      currentStep: 0,
      maxSteps: 5,
      enableReflection: false,
      messages: [],
      createdAt: '2026-06-27T00:00:00.000Z',
      createdBy: 'phase33-buf',
      tenantId: 'tenant-A'
    },
    timestamp: '2026-06-27T00:00:00.000Z'
  } as AgentSessionEvent & { id: number };

  const b1 = buffer.append('sess-buf-1', bufEvt, 'tenant-A');
  assert(b1.id === 1, `EventBuffer.append id = 1`);
  assert(buffer.size('sess-buf-1') === 1, 'EventBuffer 内存 size = 1');

  // 等待 EventStore 异步持久化
  await new Promise((r) => setTimeout(r, 50));
  assert(storeForDual.size('sess-buf-1') === 1, `EventStore 双写 size = 1`);

  buffer.append('sess-buf-1', { ...bufEvt, type: 'message_added' } as unknown as AgentSessionEvent, 'tenant-A');
  buffer.append('sess-buf-1', { ...bufEvt, type: 'step_progress' } as unknown as AgentSessionEvent, 'tenant-A');
  await new Promise((r) => setTimeout(r, 50));
  assert(buffer.size('sess-buf-1') === 3, '内存 3 条');
  assert(storeForDual.size('sess-buf-1') === 3, 'EventStore 双写 3 条');

  // ────────────────────────────────────────────────────────────────
  // Section 5: LISTEN/NOTIFY 订阅机制
  // ────────────────────────────────────────────────────────────────
  section('5. LISTEN/NOTIFY 订阅');

  const storeForNotify = new EventStoreService();
  let notifiedCount = 0;
  let lastEventId = 0;
  const unsub = storeForNotify.subscribeChannel('sess-notify-1', (n) => {
    notifiedCount += 1;
    lastEventId = n.eventId;
  });

  await storeForNotify.persist(
    'sess-notify-1',
    { ...bufEvt, id: 1, session: { ...bufEvt.session!, id: 'sess-notify-1' } } as unknown as AgentSessionEvent & { id: number },
    'tenant-X'
  );
  assert(notifiedCount === 1, `第 1 次 persist 通知 listener,实际 ${notifiedCount}`);
  assert(lastEventId === 1, `lastEventId = 1,实际 ${lastEventId}`);

  await storeForNotify.persist(
    'sess-notify-1',
    { ...bufEvt, id: 2, type: 'message_added', session: { ...bufEvt.session!, id: 'sess-notify-1' } } as unknown as AgentSessionEvent & { id: number },
    'tenant-X'
  );
  assert(notifiedCount === 2, `第 2 次 persist 通知`);
  assert(lastEventId === 2, `lastEventId = 2,实际 ${lastEventId}`);

  // unsubscribe 后不再通知
  unsub();
  await storeForNotify.persist(
    'sess-notify-1',
    { ...bufEvt, id: 3, type: 'step_progress', session: { ...bufEvt.session!, id: 'sess-notify-1' } } as unknown as AgentSessionEvent & { id: number },
    'tenant-X'
  );
  assert(notifiedCount === 2, `unsubscribe 后不再通知,仍 ${notifiedCount}`);

  // ────────────────────────────────────────────────────────────────
  // Section 6: 多租户隔离
  // ────────────────────────────────────────────────────────────────
  section('6. 多租户隔离 (tenant_id)');

  const storeTenant = new EventStoreService();
  await storeTenant.persist(
    'sess-tenant-A',
    { ...bufEvt, id: 1, session: { ...bufEvt.session!, id: 'sess-tenant-A' } } as unknown as typeof bufEvt & { id: number },
    'tenant-A'
  );
  await storeTenant.persist(
    'sess-tenant-A',
    { ...bufEvt, id: 2, session: { ...bufEvt.session!, id: 'sess-tenant-A' } } as unknown as typeof bufEvt & { id: number },
    'tenant-A'
  );

  // tenant-A 可读
  const tenantARead = await storeTenant.loadAfter('sess-tenant-A', 0, 'tenant-A');
  assert(tenantARead.length === 2, `tenant-A 可读 2 条,实际 ${tenantARead.length}`);

  // tenant-B 不可读 (跨租户)
  const tenantBRead = await storeTenant.loadAfter('sess-tenant-A', 0, 'tenant-B');
  assert(tenantBRead.length === 0, `tenant-B 跨租户读取返回 0`);

  // 不带 tenantId 参数 (向后兼容)
  const noTenantRead = await storeTenant.loadAfter('sess-tenant-A', 0);
  assert(noTenantRead.length === 2, `无 tenantId 参数仍可读`);

  // ────────────────────────────────────────────────────────────────
  // Section 7: Phase-32 接口兼容
  // ────────────────────────────────────────────────────────────────
  section('7. Phase-32 接口兼容');

  const bufferCompat = new EventBufferService();
  bufferCompat.append('sess-compat-1', bufEvt, 'tenant-A');
  bufferCompat.append('sess-compat-1', { ...bufEvt, type: 'message_added' } as unknown as AgentSessionEvent, 'tenant-A');
  bufferCompat.append('sess-compat-1', { ...bufEvt, type: 'step_progress' } as unknown as AgentSessionEvent, 'tenant-A');

  // Phase-32 同步 API 仍可用
  const compatReplay = bufferCompat.replayAfter('sess-compat-1', 1);
  assert(compatReplay.found === true, 'replayAfter 同步 API 仍返回 found=true');
  assert(compatReplay.events.length === 2, `replayAfter 返回 2 条`);

  // Phase-33 新异步 API
  const asyncReplay = await bufferCompat.replayAfterAsync('sess-compat-1', 1, 'tenant-A');
  assert(asyncReplay.events.length >= 2, `replayAfterAsync 返回 ≥ 2 条`);

  // 没有 EventStore 时, replayAfterAsync fallback 到内存
  const bufferNoStore = new EventBufferService();
  bufferNoStore.append('sess-fallback', bufEvt, 'tenant-Z');
  const fallback = await bufferNoStore.replayAfterAsync('sess-fallback', 0, 'tenant-Z');
  assert(fallback.events.length === 1, `无 EventStore 时 fallback 到内存返回 1 条`);

  // ────────────────────────────────────────────────────────────────
  // Section 8: 静态扫描
  // ────────────────────────────────────────────────────────────────
  section('8. 静态扫描');

  const storeSrc = readFileSync(
    join(__dirname, '../apps/api/src/modules/agent/event-store.service.ts'),
    'utf-8'
  );
  assert(storeSrc.includes('@Injectable'), 'EventStoreService @Injectable 装饰器');
  assert(storeSrc.includes('async persist'), 'EventStoreService.persist 方法');
  assert(storeSrc.includes('async loadAfter'), 'EventStoreService.loadAfter 方法');
  assert(storeSrc.includes('subscribeChannel'), 'EventStoreService.subscribeChannel 方法');
  assert(storeSrc.includes('tenantId'), 'EventStoreService 含 tenantId 字段');

  const bufferSrc = readFileSync(
    join(__dirname, '../apps/api/src/modules/agent/event-buffer.service.ts'),
    'utf-8'
  );
  assert(bufferSrc.includes('setEventStore'), 'EventBufferService.setEventStore setter');
  assert(bufferSrc.includes('eventStore.persist'), 'EventBuffer 双写 eventStore.persist');
  assert(bufferSrc.includes('replayAfterAsync'), 'EventBuffer replayAfterAsync 异步 API');

  const moduleSrc = readFileSync(
    join(__dirname, '../apps/api/src/modules/agent/agent.module.ts'),
    'utf-8'
  );
  assert(moduleSrc.includes('EventStoreService'), 'agent.module 注册 EventStoreService');
  assert(moduleSrc.includes('onModuleInit'), 'AgentModule onModuleInit 注入');
  assert(moduleSrc.includes('setEventStore'), 'AgentModule 调 setEventStore');

  const poolSrc = readFileSync(
    join(__dirname, '../apps/api/src/database/pg-pool.ts'),
    'utf-8'
  );
  assert(poolSrc.includes('Pool'), 'pg-pool.ts 用 Pool');

  // ────────────────────────────────────────────────────────────────
  // 汇总
  // ────────────────────────────────────────────────────────────────
  console.log(`\n═══════════════════════════════════════`);
  console.log(`Phase-33 E2E 结果: ${pass} pass / ${fail} fail`);
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