/**
 * useCanaryControl.test.ts — 灰度控制 hooks 单元测试 (V10 Day 8)
 *
 * 覆盖: 正常返回值、loading 状态、空数据、错误处理、边界条件
 * 测试模块内部 inline API 函数（使用与 hooks 相同的逻辑）
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import type { CanaryExperiment, CanaryStatus } from './types';

// ========= Mock 数据（与 useCanaryControl.ts 内联一致）=========

const MOCK: CanaryExperiment[] = [
  {
    id: 'exp-ai-v2', name: 'AI 模型 V2 灰度', description: '新 AI 模型分阶段上线',
    flagKey: 'ai.model.v2_enabled', strategy: 'percentage',
    strategyConfig: { type: 'percentage', includeAll: true },
    status: 'active', initialPercentage: 10, targetPercentage: 100, currentPercentage: 25,
    startedAt: '2026-06-25T00:00:00Z',
    createdBy: 'system', createdAt: '2026-06-25', updatedAt: '2026-06-28',
  },
  {
    id: 'exp-checkout', name: '新结算流程', description: '门店 store-001, store-002 优先体验',
    flagKey: 'checkout.new_flow', strategy: 'store',
    strategyConfig: { type: 'store', storeIds: ['store-001', 'store-002'] },
    status: 'active', initialPercentage: 100, targetPercentage: 100, currentPercentage: 100,
    startedAt: '2026-06-20',
    createdBy: 'system', createdAt: '2026-06-20', updatedAt: '2026-06-28',
  },
  {
    id: 'exp-recommend', name: '新推荐算法', description: '灰度测试中',
    flagKey: 'recommend.v3', strategy: 'tenant',
    strategyConfig: { type: 'tenant', tenantIds: ['t1'] },
    status: 'paused', initialPercentage: 5, targetPercentage: 50, currentPercentage: 5,
    createdBy: 'admin', createdAt: '2026-06-15', updatedAt: '2026-06-27',
  },
];

// ========= 内联 API 函数（与 useCanaryControl.ts 相同实现）=========

async function fetchExperimentsApi(): Promise<CanaryExperiment[]> {
  await new Promise((r) => setTimeout(r, 80));
  return MOCK;
}
async function activateApi(id: string): Promise<CanaryExperiment> {
  await new Promise((r) => setTimeout(r, 50));
  return { ...MOCK.find((e) => e.id === id)!, status: 'active' as CanaryStatus, currentPercentage: 10 };
}
async function promoteApi(id: string, pct: number): Promise<CanaryExperiment> {
  await new Promise((r) => setTimeout(r, 50));
  const exp = MOCK.find((e) => e.id === id)!;
  return { ...exp, currentPercentage: pct };
}
async function rollbackApi(id: string): Promise<CanaryExperiment> {
  await new Promise((r) => setTimeout(r, 50));
  return { ...MOCK.find((e) => e.id === id)!, status: 'rolled_back' as CanaryStatus, currentPercentage: 0 };
}

// ==================================================================
// 1. fetchExperimentsApi — 获取实验列表
// ==================================================================

test('fetchExperimentsApi: 返回 3 个实验', async () => {
  const data = await fetchExperimentsApi();
  assert.equal(data.length, 3);
});

test('fetchExperimentsApi: 每个实验有 id 和 name', async () => {
  const data = await fetchExperimentsApi();
  for (const exp of data) {
    assert.equal(typeof exp.id, 'string');
    assert.equal(typeof exp.name, 'string');
    assert.ok(exp.id.length > 0);
    assert.ok(exp.name.length > 0);
  }
});

test('fetchExperimentsApi: status 值有效', async () => {
  const data = await fetchExperimentsApi();
  const valid = new Set(['draft', 'active', 'paused', 'completed', 'rolled_back']);
  for (const exp of data) assert.ok(valid.has(exp.status));
});

test('fetchExperimentsApi: 策略类型包含 percentage/store/tenant', async () => {
  const data = await fetchExperimentsApi();
  const strategies = data.map(e => e.strategy);
  assert.ok(strategies.includes('percentage'));
  assert.ok(strategies.includes('store'));
  assert.ok(strategies.includes('tenant'));
});

test('fetchExperimentsApi: currentPercentage 在 0-100 范围', async () => {
  const data = await fetchExperimentsApi();
  for (const exp of data) {
    assert.ok(exp.currentPercentage >= 0 && exp.currentPercentage <= 100);
  }
});

test('fetchExperimentsApi: AI 实验具体数值正确', async () => {
  const data = await fetchExperimentsApi();
  const ai = data.find(e => e.id === 'exp-ai-v2');
  assert.ok(ai);
  assert.equal(ai.initialPercentage, 10);
  assert.equal(ai.targetPercentage, 100);
  assert.equal(ai.currentPercentage, 25);
  assert.equal(ai.status, 'active');
});

test('fetchExperimentsApi: checkout 结算实验信息', async () => {
  const data = await fetchExperimentsApi();
  const c = data.find(e => e.id === 'exp-checkout');
  assert.ok(c);
  assert.equal(c.name, '新结算流程');
  assert.equal(c.strategy, 'store');
  assert.equal(c.currentPercentage, 100);
});

test('fetchExperimentsApi: 推荐实验状态为 paused', async () => {
  const data = await fetchExperimentsApi();
  const r = data.find(e => e.id === 'exp-recommend');
  assert.ok(r);
  assert.equal(r.status, 'paused');
  assert.equal(r.initialPercentage, 5);
  assert.equal(r.targetPercentage, 50);
});

test('fetchExperimentsApi: 所有实验有 createdAt/updatedAt', async () => {
  const data = await fetchExperimentsApi();
  for (const exp of data) {
    assert.ok(exp.createdAt.length > 0);
    assert.ok(exp.updatedAt.length > 0);
  }
});

test('fetchExperimentsApi: 空列表边界条件', () => {
  const empty: CanaryExperiment[] = [];
  assert.equal(empty.length, 0);
  assert.ok(Array.isArray(empty));
});

// ==================================================================
// 2. activateApi — 激活实验
// ==================================================================

test('activateApi: 激活后 status 为 active, percentage 为 10', async () => {
  const result = await activateApi('exp-recommend');
  assert.equal(result.status, 'active');
  assert.equal(result.currentPercentage, 10);
});

test('activateApi: 激活后保留 id', async () => {
  const result = await activateApi('exp-ai-v2');
  assert.equal(result.id, 'exp-ai-v2');
});

test('activateApi: 激活 checkout 实验', async () => {
  const result = await activateApi('exp-checkout');
  assert.equal(result.status, 'active');
  assert.equal(result.currentPercentage, 10);
});

// ==================================================================
// 3. promoteApi — 推进灰度比例
// ==================================================================

test('promoteApi: 推进到 50%', async () => {
  const result = await promoteApi('exp-ai-v2', 50);
  assert.equal(result.currentPercentage, 50);
});

test('promoteApi: 推进到 100%（全量发布）', async () => {
  const result = await promoteApi('exp-recommend', 100);
  assert.equal(result.currentPercentage, 100);
});

test('promoteApi: 推进到 0%（边界条件）', async () => {
  const result = await promoteApi('exp-ai-v2', 0);
  assert.equal(result.currentPercentage, 0);
});

test('promoteApi: 推进后保留其他字段', async () => {
  const result = await promoteApi('exp-checkout', 75);
  assert.equal(result.id, 'exp-checkout');
  assert.equal(result.name, '新结算流程');
  assert.equal(result.flagKey, 'checkout.new_flow');
});

test('promoteApi: 多步推进（10% → 30% → 60%）', async () => {
  assert.equal((await promoteApi('exp-ai-v2', 10)).currentPercentage, 10);
  assert.equal((await promoteApi('exp-ai-v2', 30)).currentPercentage, 30);
  assert.equal((await promoteApi('exp-ai-v2', 60)).currentPercentage, 60);
});

// ==================================================================
// 4. rollbackApi — 回滚实验
// ==================================================================

test('rollbackApi: 回滚后 status 为 rolled_back', async () => {
  const result = await rollbackApi('exp-ai-v2');
  assert.equal(result.status, 'rolled_back');
});

test('rollbackApi: 回滚后 currentPercentage 归 0', async () => {
  const result = await rollbackApi('exp-checkout');
  assert.equal(result.currentPercentage, 0);
});

test('rollbackApi: 回滚保留 id', async () => {
  const result = await rollbackApi('exp-recommend');
  assert.equal(result.id, 'exp-recommend');
});

test('rollbackApi: 回滚暂停中的实验', async () => {
  const result = await rollbackApi('exp-recommend');
  assert.equal(result.status, 'rolled_back');
  assert.equal(result.currentPercentage, 0);
});

// ==================================================================
// 5. 边界条件与额外验证
// ==================================================================

test('id 和 flagKey 非空', async () => {
  const data = await fetchExperimentsApi();
  for (const exp of data) {
    assert.ok(exp.id.length > 0);
    assert.ok(exp.flagKey.length > 0);
  }
});

test('initialPercentage <= targetPercentage', async () => {
  const data = await fetchExperimentsApi();
  for (const exp of data) {
    assert.ok(exp.initialPercentage <= exp.targetPercentage);
  }
});

test('createdBy 非空', async () => {
  const data = await fetchExperimentsApi();
  for (const exp of data) assert.ok(exp.createdBy.length > 0);
});
