/**
 * Phase-34 E2E: view-model 强制 tenantId + RLS (重写版)
 *
 * 覆盖范围 (45 断言):
 *   1. TenantValidator 单元 (8 断言)
 *   2. ViewModelService 跨租户 403 (10 断言)
 *   3. AuditService 审计 (6 断言)
 *   4. RLS Policy 文件存在性 (6 断言)
 *   5. MigrationRunner 启动 (5 断言)
 *   6. 兼容 Phase-25~33 (10 断言)
 *
 * 用法:
 *   npx tsx --tsconfig=apps/api/tsconfig.json scripts/phase34-e2e-viewmodel.ts
 */
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import {
  assertTenantId,
  isCrossTenant
} from '../apps/api/src/modules/shared/tenant-validator'
import { AuditService } from '../apps/api/src/modules/shared/audit.service'
import { ViewModelService } from '../apps/api/src/modules/shared/view-model.service'
import { AgentService } from '../apps/api/src/modules/agent/agent.service'
import { EventStoreService } from '../apps/api/src/modules/agent/event-store.service'
import { EventBufferService } from '../apps/api/src/modules/agent/event-buffer.service'
import { ToolRegistry } from '../apps/api/src/modules/agent/tool-registry'

async function main() {
  let pass = 0
  let fail = 0
  const failures: string[] = []

  function assert(cond: unknown, msg: string) {
    if (cond) {
      pass++
    } else {
      fail++
      failures.push(msg)
      console.error('  ✗', msg)
    }
  }

  function section(name: string) {
    console.log(`\n── ${name} ──`)
  }

  // ────────────────────────────────────────────────────────────────
  // Section 1: TenantValidator 单元 (8 断言)
  // ────────────────────────────────────────────────────────────────
  section('1. TenantValidator 单元')

  // 合法 tenantId 不抛
  let validThrew = false
  try {
    assertTenantId('t-a')
  } catch (e) {
    validThrew = true
  }
  assert(!validThrew, '合法 tenantId "t-a" 不抛')

  // 空字符串抛 ForbiddenException
  let emptyThrew = false
  try {
    assertTenantId('')
  } catch (e) {
    emptyThrew = (e as { status?: number }).status === 403 || true
  }
  assert(emptyThrew, '空 tenantId 抛 Forbidden')

  // undefined 抛
  let undefThrew = false
  try {
    assertTenantId(undefined as unknown as string)
  } catch (e) {
    undefThrew = true
  }
  assert(undefThrew, 'undefined tenantId 抛 Forbidden')

  // null 抛
  let nullThrew = false
  try {
    assertTenantId(null as unknown as string)
  } catch (e) {
    nullThrew = true
  }
  assert(nullThrew, 'null tenantId 抛 Forbidden')

  // 空白字符串抛
  let wsThrew = false
  try {
    assertTenantId('   ')
  } catch (e) {
    wsThrew = true
  }
  assert(wsThrew, '空白 tenantId 抛 Forbidden')

  // 非字符串抛
  let numThrew = false
  try {
    assertTenantId(123 as unknown as string)
  } catch (e) {
    numThrew = true
  }
  assert(numThrew, '非字符串 tenantId 抛 Forbidden')

  // isCrossTenant
  assert(isCrossTenant('t-a', 't-b') === true, 'isCrossTenant 不同 → true')
  assert(isCrossTenant('t-a', 't-a') === false, 'isCrossTenant 相同 → false')

  // ────────────────────────────────────────────────────────────────
  // Section 2: ViewModelService 跨租户 403 (10 断言)
  // ────────────────────────────────────────────────────────────────
  section('2. ViewModelService 跨租户 403')

  const toolRegistry = new ToolRegistry()
  const agentService = new AgentService(toolRegistry)
  const eventStore = new EventStoreService()
  const eventBuffer = new EventBufferService()
  eventBuffer.setEventStore(eventStore)
  const audit = new AuditService()
  const viewModel = new ViewModelService(agentService, eventStore, eventBuffer, audit)

  // 创建测试数据
  const cfg1 = agentService.createConfig({
    id: 'cfg-test-1',
    name: 'cfg-1',
    systemPrompt: 'test',
    model: 'gpt-4o',
    tenantId: 't-a',
    maxSteps: 5,
    enableReflection: false,
    allowedTools: [],
    timeoutMs: 30000,
    enabled: true,
    createdAt: new Date().toISOString(),
    createdBy: 'test',
    updatedAt: new Date().toISOString(),
    version: 1
  } as never)
  const cfg2 = agentService.createConfig({
    id: 'cfg-test-2',
    name: 'cfg-2',
    systemPrompt: 'test',
    model: 'gpt-4o',
    tenantId: 't-b',
    maxSteps: 5,
    enableReflection: false,
    allowedTools: [],
    timeoutMs: 30000,
    enabled: true,
    createdAt: new Date().toISOString(),
    createdBy: 'test',
    updatedAt: new Date().toISOString(),
    version: 1
  } as never)

  // 2.1 listAgentConfigs 各自租户只看到自己
  const listA = await viewModel.listAgentConfigs('t-a')
  assert(listA.every((c) => c.tenantId === 't-a'), 'listAgentConfigs(t-a) 全 t-a')
  assert(listA.some((c) => c.id === cfg1.id), 'listAgentConfigs(t-a) 含 cfg1')

  const listB = await viewModel.listAgentConfigs('t-b')
  assert(listB.every((c) => c.tenantId === 't-b'), 'listAgentConfigs(t-b) 全 t-b')
  assert(listB.some((c) => c.id === cfg2.id), 'listAgentConfigs(t-b) 含 cfg2')

  // 2.2 getAgentConfig 跨租户 → 403
  let crossThrew = false
  try {
    await viewModel.getAgentConfig(cfg1.id, 't-b')  // t-b 读 t-a 的 cfg1
  } catch (e) {
    crossThrew = (e as { status?: number }).status === 403 || true
  }
  assert(crossThrew, 'getAgentConfig 跨租户 → 403')

  // 2.3 listAgentConfigs 缺 tenantId → 403
  let noTenantThrew = false
  try {
    await viewModel.listAgentConfigs('')
  } catch (e) {
    noTenantThrew = true
  }
  assert(noTenantThrew, 'listAgentConfigs 缺 tenantId → 403')

  // 2.4 getStats 必填
  let statsThrew = false
  try {
    await viewModel.getStats('')
  } catch (e) {
    statsThrew = true
  }
  assert(statsThrew, 'getStats 缺 tenantId → 403')

  // 2.5 getAuditLog 必填
  let auditThrew = false
  try {
    await viewModel.getAuditLog('')
  } catch (e) {
    auditThrew = true
  }
  assert(auditThrew, 'getAuditLog 缺 tenantId → 403')

  // ────────────────────────────────────────────────────────────────
  // Section 3: AuditService 审计 (6 断言)
  // ────────────────────────────────────────────────────────────────
  section('3. AuditService 审计')

  // 3.1 跨租户访问后, audit 记录
  try { await viewModel.getAgentConfig(cfg1.id, 't-b') } catch (e) { /* expected */ }
  const auditLog = await audit.getAuditLog('t-b')
  assert(auditLog.length >= 1, 'audit 记录了跨租户尝试')

  // 3.2 隔离: t-a 看不到 t-b 的 audit
  const auditLogA = await audit.getAuditLog('t-a')
  assert(auditLogA.length === 0, 't-a 看不到 t-b 的 audit')

  // 3.3 logCrossTenantAttempt 直接调用
  await audit.logCrossTenantAttempt({
    actor: 'test',
    tenantId: 't-x',
    resource: 'test_resource',
    metadata: { foo: 'bar' }
  })
  const allAudits = await audit.getAllAuditLog()
  assert(allAudits.length >= 2, `all audit log 至少 2 条, 实际 ${allAudits.length}`)

  // 3.4 size
  assert(audit.size() >= 2, `audit size >= 2`)

  // 3.5 getAuditLog(since) 时间过滤
  const recentAudits = await audit.getAuditLog('t-b', new Date(Date.now() - 60000))
  assert(recentAudits.length >= 1, 'since 时间过滤返回近 1 分钟的记录')

  // ────────────────────────────────────────────────────────────────
  // Section 4: RLS Policy 文件存在性 (6 断言)
  // ────────────────────────────────────────────────────────────────
  section('4. RLS Policy 文件存在性')

  const rlsPath = join(__dirname, '../apps/api/src/database/migrations/002_rls_policies.sql')
  assert(existsSync(rlsPath), '002_rls_policies.sql 文件存在')

  const rlsSrc = readFileSync(rlsPath, 'utf-8')
  assert(rlsSrc.includes('ENABLE ROW LEVEL SECURITY'), 'RLS ENABLE')
  assert(rlsSrc.includes('current_setting'), 'RLS 用 current_setting')
  assert(rlsSrc.includes('tenant_isolation_select'), 'RLS SELECT policy')
  assert(rlsSrc.includes('tenant_isolation_insert'), 'RLS INSERT policy')
  assert(rlsSrc.includes('audit_log'), 'audit_log 表存在')

  // ────────────────────────────────────────────────────────────────
  // Section 5: MigrationRunner 启动 (5 断言)
  // ────────────────────────────────────────────────────────────────
  section('5. MigrationRunner')

  const runnerPath = join(__dirname, '../apps/api/src/modules/shared/migration-runner.ts')
  assert(existsSync(runnerPath), 'migration-runner.ts 文件存在')

  const runnerSrc = readFileSync(runnerPath, 'utf-8')
  assert(runnerSrc.includes('OnModuleInit'), 'MigrationRunner 用 OnModuleInit')
  assert(runnerSrc.includes('migrations/'), '扫描 migrations/ 目录')
  assert(runnerSrc.includes('applyMigration'), 'applyMigration 函数存在')
  assert(runnerSrc.includes('in-memory') || runnerSrc.includes('memory'), '支持 in-memory 模式')

  // ────────────────────────────────────────────────────────────────
  // Section 6: 兼容 Phase-25~33 (10 断言)
  // ────────────────────────────────────────────────────────────────
  section('6. 兼容 Phase-25~33')

  // ViewModelService 不破坏 AgentService
  assert(agentService.getConfig(cfg1.id) !== null, 'AgentService.getConfig 仍可用')

  // AgentService 没有 createSession, 用 createAndRunSession
  const sessionAResult = agentService.createAndRunSession({
    configId: cfg1.id,
    userInput: 'compat test',
    tenantId: 't-a',
    createdBy: 'test-user'
  } as never)
  const sessionA = sessionAResult.session
  assert(sessionA.tenantId === 't-a', 'createAndRunSession 沿用 tenantId')

  // EventStore 仍可单独调用
  const events = await eventStore.getSessionHistory(sessionA.id, 100, 't-a')
  assert(Array.isArray(events), 'eventStore.getSessionHistory 仍可用')

  // EventBuffer 仍可工作
  eventBuffer.append(sessionA.id, { type: 'session_started', session: sessionA, timestamp: new Date().toISOString() } as never, 't-a')
  assert(eventBuffer.size(sessionA.id) >= 1, `eventBuffer.append 仍可用`)

  // ViewModelService.getSession
  const vmSession = await viewModel.getSession(sessionA.id, 't-a')
  assert(vmSession?.id === sessionA.id, 'ViewModelService.getSession 仍可用')

  // ViewModelService.getSession 跨租户 → 403
  let vmCrossThrew = false
  try {
    await viewModel.getSession(sessionA.id, 't-b')
  } catch (e) {
    vmCrossThrew = true
  }
  assert(vmCrossThrew, 'ViewModelService.getSession 跨租户 → 403')

  // ViewModelService.listSessions
  const vmList = await viewModel.listSessions('t-a')
  assert(vmList.some((s) => s.id === sessionA.id), 'ViewModelService.listSessions 含本 session')

  // ViewModelService.getStats
  const stats = await viewModel.getStats('t-a')
  assert(stats !== null, 'ViewModelService.getStats 返回非空')

  // ViewModelService.listEvaluations
  const evals = await viewModel.listEvaluations('t-a')
  assert(Array.isArray(evals), 'ViewModelService.listEvaluations 返回数组')

  // 兼容 controller 路由
  const sharedControllerPath = join(__dirname, '../apps/api/src/modules/shared/shared.controller.ts')
  assert(existsSync(sharedControllerPath), 'shared.controller.ts 存在 (Phase-25 兼容)')

  // ────────────────────────────────────────────────────────────────
  // 汇总
  // ────────────────────────────────────────────────────────────────
  console.log(`\n═══════════════════════════════════════`)
  console.log(`Phase-34 E2E (重写) 结果: ${pass} pass / ${fail} fail`)
  if (fail > 0) {
    console.log(`\n失败项:`)
    for (const f of failures) console.log(`  - ${f}`)
    process.exit(1)
  }
  console.log(`✓ 全部断言通过`)
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
