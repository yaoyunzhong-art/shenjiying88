/**
 * Phase-31 E2E: 多租户隔离
 *
 * 覆盖范围:
 *   1. TenantGuard: 缺失 x-tenant-id → 401
 *   2. TenantGuard: 存在 → 写入 request.tenantId
 *   3. AgentService row-level filter: getConfigs / getSessions / getConfig / getSession / getEvaluations
 *   4. 跨租户隔离: tenant-A 看不到 tenant-B 数据
 *   5. 同租户可见: tenant-A 看自己
 *   6. 边界: 空 tenantId → undefined 行为
 *
 * 用法:
 *   npx tsx --tsconfig=apps/api/tsconfig.json scripts/phase31-e2e-tenant.ts
 */
import { AgentService } from '../apps/api/src/modules/agent/agent.service';
import { ToolRegistry } from '../apps/api/src/modules/agent/tool-registry';
import { TenantGuard } from '../apps/api/src/modules/agent/tenant.guard';
import { UnauthorizedException } from '@nestjs/common';
import type { AgentConfig, AgentSession, QualityEvaluation } from '../packages/types/src/index';
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
  // Section 1: TenantGuard 行为
  // ────────────────────────────────────────────────────────────────
  section('1. TenantGuard 行为');

  const guard = new TenantGuard();
  // mockContext 接受外部传入的 request 对象,以便 guard 修改后能读到 tenantId
  // (cast 为 unknown 绕过 ExecutionContext 类型严格检查)
  const mockContext = (req: any): any => ({
    switchToHttp: () => ({
      getRequest: () => req
    })
  });

  // 缺失 header
  let error: Error | null = null;
  try {
    const req: any = { headers: {}, query: {} };
    guard.canActivate(mockContext(req));
  } catch (e) {
    error = e as Error;
  }
  assert(error !== null, '缺失 x-tenant-id 抛错');
  assert(
    error instanceof UnauthorizedException,
    `错误类型 = UnauthorizedException,实际: ${error?.constructor?.name}`
  );
  assert(
    error?.message?.includes('Missing x-tenant-id') || error?.message?.includes('x-tenant-id'),
    `错误信息含 x-tenant-id`
  );

  // 空 header
  error = null;
  try {
    const req: any = { headers: { 'x-tenant-id': '   ' }, query: {} };
    guard.canActivate(mockContext(req));
  } catch (e) {
    error = e as Error;
  }
  assert(error !== null, '空白 tenantId 抛错');

  // 正常 header
  const req1: any = { headers: { 'x-tenant-id': 'tenant-A' }, query: {} };
  const ok = guard.canActivate(mockContext(req1));
  assert(ok === true, '正常 header 返回 true');
  assert(req1.tenantId === 'tenant-A', `request.tenantId 注入 = tenant-A,实际: ${req1.tenantId}`);

  // 大小写兼容
  const req2: any = { headers: { 'X-Tenant-Id': 'tenant-B' }, query: {} };
  guard.canActivate(mockContext(req2));
  assert(req2.tenantId === 'tenant-B', `X-Tenant-Id 大写也兼容`);

  // query 参数兜底
  const req3: any = { headers: {}, query: { tenantId: 'tenant-C' } };
  guard.canActivate(mockContext(req3));
  assert(req3.tenantId === 'tenant-C', `query.tenantId 兜底`);

  // ────────────────────────────────────────────────────────────────
  // Section 2: AgentService 多租户 filter
  // ────────────────────────────────────────────────────────────────
  section('2. AgentService row-level filter');

  const svc = new AgentService(new ToolRegistry());

  // 注入测试数据: tenant-A 和 tenant-B 各 2 个 config + session
  const cfgA1: AgentConfig = {
    id: 'cfg-A-1',
    name: 'Tenant-A Agent 1',
    systemPrompt: 'A1',
    model: 'deepseek-v4',
    maxSteps: 5,
    enableReflection: false,
    allowedTools: ['a1'],
    timeoutMs: 30000,
    enabled: true,
    createdAt: '2026-06-26T00:00:00.000Z',
    updatedAt: '2026-06-26T00:00:00.000Z',
    tenantId: 'tenant-A'
  };
  const cfgA2: AgentConfig = { ...cfgA1, id: 'cfg-A-2', name: 'Tenant-A Agent 2' };
  const cfgB1: AgentConfig = { ...cfgA1, id: 'cfg-B-1', name: 'Tenant-B Agent 1', tenantId: 'tenant-B' };
  const cfgB2: AgentConfig = { ...cfgA1, id: 'cfg-B-2', name: 'Tenant-B Agent 2', tenantId: 'tenant-B' };

  svc.createConfig(cfgA1);
  svc.createConfig(cfgA2);
  svc.createConfig(cfgB1);
  svc.createConfig(cfgB2);

  // 全量 (包含默认 config + 4 个新增)
  const allConfigs = svc.getConfigs();
  assert(allConfigs.length >= 4, `全量 configs >= 4,实际 ${allConfigs.length}`);

  // tenant-A 过滤 (只看到自己新建的 2 个)
  const aConfigs = svc.getConfigs('tenant-A');
  assert(aConfigs.length === 2, `tenant-A configs = 2,实际 ${aConfigs.length}`);
  assert(
    aConfigs.every((c) => c.tenantId === 'tenant-A'),
    'tenant-A 所有 config.tenantId = tenant-A'
  );

  // tenant-B 过滤
  const bConfigs = svc.getConfigs('tenant-B');
  assert(bConfigs.length === 2, `tenant-B configs = 2,实际 ${bConfigs.length}`);
  assert(
    bConfigs.every((c) => c.tenantId === 'tenant-B'),
    'tenant-B 所有 config.tenantId = tenant-B'
  );

  // tenant-C 过滤
  const cConfigs = svc.getConfigs('tenant-C');
  assert(cConfigs.length === 0, `tenant-C configs = 0,实际 ${cConfigs.length}`);

  // 单 config 跨租户
  const aConfigGet = svc.getConfig('cfg-A-1', 'tenant-A');
  assert(aConfigGet !== undefined, 'tenant-A getConfig(cfg-A-1) 可见');
  const aGetFromB = svc.getConfig('cfg-A-1', 'tenant-B');
  assert(aGetFromB === undefined, 'tenant-B getConfig(cfg-A-1) 不可见');
  const aGetNoTenant = svc.getConfig('cfg-A-1');
  assert(aGetNoTenant !== undefined, '无 tenantId 参数 getConfig 可见(向后兼容)');

  // ────────────────────────────────────────────────────────────────
  // Section 3: getSessions 跨租户
  // ────────────────────────────────────────────────────────────────
  section('3. getSessions 跨租户');

  // 创建 sessions (通过 run 模拟)
  const sessA1: AgentSession = {
    id: 'sess-A-1',
    configId: 'cfg-A-1',
    status: 'COMPLETED',
    userInput: 'A test 1',
    currentStep: 3,
    maxSteps: 5,
    enableReflection: false,
    messages: [],
    createdAt: '2026-06-26T00:00:00.000Z',
    createdBy: 'user-A',
    tenantId: 'tenant-A'
  };
  const sessA2: AgentSession = { ...sessA1, id: 'sess-A-2', userInput: 'A test 2' };
  const sessB1: AgentSession = { ...sessA1, id: 'sess-B-1', configId: 'cfg-B-1', userInput: 'B test 1', tenantId: 'tenant-B' };
  const sessB2: AgentSession = { ...sessA1, id: 'sess-B-2', configId: 'cfg-B-1', userInput: 'B test 2', tenantId: 'tenant-B' };

  // 直接注入(模拟测试数据)
  (svc as any).sessions.push(sessA1, sessA2, sessB1, sessB2);

  const allSessions = svc.getSessions();
  assert(allSessions.length >= 4, `全量 sessions >= 4,实际 ${allSessions.length}`);

  const aSessions = svc.getSessions('tenant-A');
  assert(aSessions.length === 2, `tenant-A sessions = 2,实际 ${aSessions.length}`);
  assert(
    aSessions.every((s) => s.tenantId === 'tenant-A'),
    'tenant-A 所有 session.tenantId = tenant-A'
  );

  const bSessions = svc.getSessions('tenant-B');
  assert(bSessions.length === 2, `tenant-B sessions = 2`);
  assert(
    bSessions.every((s) => s.tenantId === 'tenant-B'),
    'tenant-B 所有 session.tenantId = tenant-B'
  );

  // 跨租户 getSession
  const getA1 = svc.getSession('sess-A-1', 'tenant-A');
  assert(getA1 !== undefined, 'tenant-A getSession(sess-A-1) 可见');
  const getA1FromB = svc.getSession('sess-A-1', 'tenant-B');
  assert(getA1FromB === undefined, 'tenant-B getSession(sess-A-1) 不可见');

  // 不存在的 session
  const getNone = svc.getSession('non-existent', 'tenant-A');
  assert(getNone === undefined, '不存在的 session 返回 undefined');

  // ────────────────────────────────────────────────────────────────
  // Section 4: getEvaluations 跨租户
  // ────────────────────────────────────────────────────────────────
  section('4. getEvaluations 跨租户');

  const evalA: QualityEvaluation = {
    id: 'eval-A-1',
    sessionId: 'sess-A-1',
    userInput: 'A test',
    agentOutput: 'A output',
    relevanceScore: 0.9,
    accuracyScore: 0.85,
    completenessScore: 0.8,
    safetyScore: 1.0,
    helpfulnessScore: 0.9,
    concisenessScore: 0.85,
    overallScore: 0.9,
    feedback: 'A good',
    evaluatedAt: '2026-06-26T00:00:00.000Z',
    evaluatedBy: 'eval-sys',
    tenantId: 'tenant-A'
  };
  const evalB: QualityEvaluation = { ...evalA, id: 'eval-B-1', sessionId: 'sess-B-1', tenantId: 'tenant-B' };

  (svc as any).evaluations.push(evalA, evalB);

  const aEvals = svc.getEvaluations('tenant-A');
  assert(aEvals.length === 1, `tenant-A evaluations = 1,实际 ${aEvals.length}`);
  assert(aEvals[0].tenantId === 'tenant-A', 'tenant-A eval 正确');

  const bEvals = svc.getEvaluations('tenant-B');
  assert(bEvals.length === 1, `tenant-B evaluations = 1`);
  assert(bEvals[0].tenantId === 'tenant-B', 'tenant-B eval 正确');

  // ────────────────────────────────────────────────────────────────
  // Section 5: getStats 跨租户 (已存在)
  // ────────────────────────────────────────────────────────────────
  section('5. getStats 跨租户');

  const statsA = svc.getStats('tenant-A');
  const statsB = svc.getStats('tenant-B');
  const statsAll = svc.getStats();

  assert(statsA.tenantId === 'tenant-A', `statsA.tenantId = tenant-A`);
  assert(statsB.tenantId === 'tenant-B', `statsB.tenantId = tenant-B`);
  // tenant-A 只有 2 sessions completed
  assert(statsA.totalSessions === 2, `statsA.totalSessions = 2`);
  assert(statsB.totalSessions === 2, `statsB.totalSessions = 2`);
  // 全量 >= 4
  assert(statsAll.totalSessions >= 4, `statsAll.totalSessions >= 4`);

  // ────────────────────────────────────────────────────────────────
  // Section 6: 端到端隔离 (create + run)
  // ────────────────────────────────────────────────────────────────
  section('6. 端到端隔离 (create + run + list)');

  // tenant-A 创建一个新 config, tenant-B 不应可见
  const newCfgA: AgentConfig = {
    ...cfgA1,
    id: 'cfg-A-new',
    name: 'Tenant-A New'
  };
  svc.createConfig(newCfgA);
  assert(
    svc.getConfig('cfg-A-new', 'tenant-A') !== undefined,
    'tenant-A 可见新 config'
  );
  assert(
    svc.getConfig('cfg-A-new', 'tenant-B') === undefined,
    'tenant-B 不可见 tenant-A 新 config'
  );

  // ────────────────────────────────────────────────────────────────
  // Section 7: 边界 (空字符串 / null / undefined)
  // ────────────────────────────────────────────────────────────────
  section('7. 边界');

  const allConfigs2 = svc.getConfigs('');
  assert(allConfigs2.length >= 4, `空字符串 tenantId 返回全量(向后兼容),实际 ${allConfigs2.length}`);

  const undefinedConfigs = svc.getConfigs(undefined);
  assert(undefinedConfigs.length >= 4, `undefined tenantId 返回全量, 实际 ${undefinedConfigs.length}`);

  // ────────────────────────────────────────────────────────────────
  // Section 8: 文件静态扫描
  // ────────────────────────────────────────────────────────────────
  section('8. 文件静态扫描');

  const guardSrc = readFileSync(
    join(__dirname, '../apps/api/src/modules/agent/tenant.guard.ts'),
    'utf-8'
  );
  assert(guardSrc.includes('CanActivate'), 'TenantGuard 实现 CanActivate');
  assert(guardSrc.includes('UnauthorizedException'), '缺失抛 UnauthorizedException');
  assert(guardSrc.includes('x-tenant-id'), '读取 x-tenant-id header');
  assert(guardSrc.includes('request.tenantId'), '写入 request.tenantId');

  const svcSrc = readFileSync(
    join(__dirname, '../apps/api/src/modules/agent/agent.service.ts'),
    'utf-8'
  );
  assert(svcSrc.includes('getConfigs(tenantId?: string)'), 'getConfigs 支持 tenantId');
  assert(svcSrc.includes('getSessions(tenantId?: string)'), 'getSessions 支持 tenantId');
  assert(svcSrc.includes('getConfig(id: string, tenantId?: string)'), 'getConfig 支持 tenantId');
  assert(svcSrc.includes('getSession(id: string, tenantId?: string)'), 'getSession 支持 tenantId');
  assert(svcSrc.includes('getEvaluations(tenantId?: string)'), 'getEvaluations 支持 tenantId');

  // ────────────────────────────────────────────────────────────────
  // 汇总
  // ────────────────────────────────────────────────────────────────
  console.log(`\n═══════════════════════════════════════`);
  console.log(`Phase-31 E2E 结果: ${pass} pass / ${fail} fail`);
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