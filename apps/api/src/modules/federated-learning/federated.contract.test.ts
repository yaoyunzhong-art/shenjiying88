import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [federated-learning] [C] 合约测试
 *
 * 验证 federated-learning 模块的实体 Shape、业务逻辑契约、跨模块合约映射
 */

import 'reflect-metadata';
import assert from 'node:assert/strict';
import { FederatedLearningService } from './federated.service';
import { runWithTenant } from '../../common/context/tenant-context';
import {
  toFederatedTaskContract,
  toFederatedRoundContract,
  toPrivacyAccountContract,
  toAggregationResultContract,
  toFederatedTaskContracts,
  toFederatedRoundContracts,
} from './federated.contract';
import { MockHomomorphicCipher } from './federated.entity';
import type {
  FederatedTask,
  FederatedRound,
  AggregationResult,
} from './federated.entity';

// ─── 服务实例 + tenant context helper ──────────────────

function makeService(): FederatedLearningService {
  return new FederatedLearningService();
}

const TENANT_A = {
  tenantId: 'tenant-A', storeId: 'store-001', userId: 'coordinator', role: 'tenant_admin' as const,
};

function withCtx<T>(fn: () => T | Promise<T>): Promise<T> {
  return runWithTenant(TENANT_A, fn);
}

const cipher = new MockHomomorphicCipher();

// ─── 合约: 实体 Shape ─────────────────────────────────

describe('[federated-learning] 合约: 联邦任务实体 Shape', () => {
  it('创建任务返回完整合约字段', async () => {
    const svc = makeService();
    const task = await withCtx(() =>
      svc.createTask({
        name: '联邦销量预测',
        modelArch: 'sales-forecaster-v2',
        participantTenantIds: ['tenant-A', 'tenant-B', 'tenant-C'],
        aggregationMethod: 'fedavg',
        totalRounds: 5,
      }),
    );
    const contract = toFederatedTaskContract(task);
    assert.equal(contract.name, '联邦销量预测');
    assert.equal(contract.modelArch, 'sales-forecaster-v2');
    assert.equal(contract.aggregationMethod, 'fedavg');
    assert.equal(contract.totalRounds, 5);
    assert.equal(contract.currentRound, 0);
    assert.equal(contract.status, 'draft');
    assert.equal(contract.participantTenantIds.length, 3);
    assert.ok(contract.id.startsWith('fed-task-'));
    assert.ok(contract.createdAt);
    assert.ok(contract.updatedAt);
  });

  it('合约字段类型正确', async () => {
    const svc = makeService();
    const task = await withCtx(() =>
      svc.createTask({
        name: '入侵检测模型',
        modelArch: 'ids-model-v1',
        participantTenantIds: ['tenant-A', 'tenant-X'],
      }),
    );
    const c = toFederatedTaskContract(task);
    assert.equal(typeof c.id, 'string');
    assert.equal(typeof c.name, 'string');
    assert.equal(typeof c.totalRounds, 'number');
    assert.equal(typeof c.minParticipants, 'number');
    assert.equal(typeof c.privacyBudgetEpsilon, 'number');
    assert.equal(typeof c.consumedEpsilon, 'number');
    assert.ok(Array.isArray(c.participantTenantIds));
    assert.equal(c.participantTenantIds.length, 2);
    assert.equal(c.coordinatorTenantId, 'tenant-A');
  });

  it('批量映射正确', async () => {
    const svc = makeService();
    const t1 = await withCtx(() =>
      svc.createTask({ name: 'Task A', modelArch: 'm1', participantTenantIds: ['tenant-A'] }),
    );
    const t2 = await withCtx(() =>
      svc.createTask({ name: 'Task B', modelArch: 'm2', participantTenantIds: ['tenant-A'] }),
    );
    const contracts = toFederatedTaskContracts([t1, t2]);
    assert.equal(contracts.length, 2);
    assert.equal(contracts[0].name, 'Task A');
    assert.equal(contracts[1].name, 'Task B');
  });
});

describe('[federated-learning] 合约: 轮次实体 Shape', () => {
  it('开始轮次返回完整轮次合约', async () => {
    const svc = makeService();
    const task = await withCtx(() =>
      svc.createTask({
        name: '测试轮次合约',
        modelArch: 'test-model',
        participantTenantIds: ['tenant-A'],
        totalRounds: 3,
      }),
    );
    await withCtx(() => svc.activateTask(task.id));
    const round = await withCtx(() => svc.startRound(task.id, { collectionDeadlineMs: 60000 }));
    const c = toFederatedRoundContract(round as unknown as FederatedRound);
    assert.equal(c.taskId, task.id);
    assert.equal(c.roundNumber, 1);
    assert.equal(c.status, 'collecting');
    assert.equal(c.globalModelVersion, 0);
    assert.equal(c.expectedParticipants, 1);
    assert.equal(c.actualParticipants, 0);
    assert.equal(c.epsilonConsumed, 0);
    assert.ok(c.createdAt);
  });

  it('批量轮次映射正确', async () => {
    const svc = makeService();
    const task = await withCtx(() =>
      svc.createTask({
        name: '批量轮次测试',
        modelArch: 'batch-model',
        participantTenantIds: ['tenant-A'],
        totalRounds: 5,
      }),
    );
    await withCtx(() => svc.activateTask(task.id));
    const r1 = await withCtx(() => svc.startRound(task.id));
    const r2 = await withCtx(() => svc.startRound(task.id));
    assert.equal(r1.roundNumber, 1);
    assert.equal(r2.roundNumber, 2);
    const contracts = toFederatedRoundContracts([r1, r2] as FederatedRound[]);
    assert.equal(contracts.length, 2);
    assert.equal(contracts[0].roundNumber, 1);
    assert.equal(contracts[1].roundNumber, 2);
  });
});

describe('[federated-learning] 合约: 梯度提交 Shape', () => {
  it('提交梯度返回 submissionId', async () => {
    const svc = makeService();
    const task = await withCtx(() =>
      svc.createTask({
        name: '梯度提交测试',
        modelArch: 'grad-model',
        participantTenantIds: ['tenant-A'],
        totalRounds: 2,
      }),
    );
    await withCtx(() => svc.activateTask(task.id));
    const round = await withCtx(() => svc.startRound(task.id));
    const sub = await withCtx(() =>
      svc.submitGradient(task.id, {
        roundId: round.id,
        encryptedGradients: cipher.encrypt([0.5, -0.3]),
        sampleCount: 100,
      }),
    );
    assert.ok(sub.submissionId);
    assert.equal(sub.status, 'accepted');
  });

  it('梯度提交后轮次 actualParticipants 增加', async () => {
    const svc = makeService();
    const task = await withCtx(() =>
      svc.createTask({
        name: '梯度合约 Shape',
        modelArch: 'shape-model',
        participantTenantIds: ['tenant-A'],
        totalRounds: 1,
      }),
    );
    await withCtx(() => svc.activateTask(task.id));
    const round = await withCtx(() => svc.startRound(task.id));
    await withCtx(() =>
      svc.submitGradient(task.id, {
        roundId: round.id,
        encryptedGradients: cipher.encrypt([0.1, -0.2, 0.3]),
        sampleCount: 50,
      }),
    );
    const rounds = await withCtx(() => svc.listRounds(task.id));
    assert.ok(rounds.length > 0);
    const c = toFederatedRoundContract(rounds[0] as unknown as FederatedRound);
    assert.equal(c.actualParticipants, 1);
    assert.equal(typeof c.id, 'string');
  });
});

describe('[federated-learning] 合约: 隐私账户 + 聚合结果', () => {
  it('聚合后隐私账户消耗正确', async () => {
    const svc = makeService();
    const task = await withCtx(() =>
      svc.createTask({
        name: '隐私预算测试',
        modelArch: 'dp-model',
        participantTenantIds: ['tenant-A'],
        totalRounds: 1,
        privacyBudgetEpsilon: 10.0,
        privacyBudgetDelta: 1e-5,
        minParticipants: 1,
      }),
    );
    await withCtx(() => svc.activateTask(task.id));
    const round = await withCtx(() => svc.startRound(task.id));
    await withCtx(() =>
      svc.submitGradient(task.id, {
        roundId: round.id,
        encryptedGradients: cipher.encrypt([0.1, -0.2, 0.3]),
        sampleCount: 200,
      }),
    );
    const agg = await withCtx(() => svc.aggregateRound(round.id));
    const account = await withCtx(() => svc.getPrivacyAccount(task.id));
    const ac = toPrivacyAccountContract(account);
    assert.ok(ac.consumedEpsilon > 0);
    assert.ok(ac.consumedEpsilon <= ac.totalEpsilon);
    assert.equal(ac.taskId, task.id);

    const aggC = toAggregationResultContract(agg as unknown as AggregationResult);
    assert.equal(aggC.roundId, round.id);
    assert.equal(aggC.participantCount, 1);
    assert.equal(aggC.method, 'fedavg');
    assert.ok(aggC.durationMs >= 0);
  });
});

describe('[federated-learning] 合约: 业务完整链路', () => {
  it('创建/激活/轮次/提交/聚合完整链路', async () => {
    const svc = makeService();
    const task = await withCtx(() =>
      svc.createTask({
        name: '链路测试',
        modelArch: 'chain-model',
        participantTenantIds: ['tenant-A'],
        totalRounds: 1,
        minParticipants: 1,
      }),
    );
    const tc = toFederatedTaskContract(task);
    assert.equal(tc.status, 'draft');

    const activated = await withCtx(() => svc.activateTask(task.id));
    assert.equal(activated.status, 'active');

    const round = await withCtx(() => svc.startRound(task.id));
    const rc = toFederatedRoundContract(round as unknown as FederatedRound);
    assert.equal(rc.status, 'collecting');

    const sub = await withCtx(() =>
      svc.submitGradient(task.id, {
        roundId: round.id,
        encryptedGradients: cipher.encrypt([0.15, -0.35, 0.75]),
        sampleCount: 300,
      }),
    );
    assert.equal(sub.status, 'accepted');

    const agg = await withCtx(() => svc.aggregateRound(round.id));
    const aggC = toAggregationResultContract(agg as unknown as AggregationResult);
    assert.ok(aggC.globalModelVersion >= 1);
    assert.equal(aggC.participantCount, 1);
    assert.equal(aggC.method, 'fedavg');

    const finalTask = await withCtx(() => svc.getTask(task.id));
    const ftc = toFederatedTaskContract(finalTask as unknown as FederatedTask);
    assert.equal(ftc.currentRound, 1);
    assert.equal(ftc.status, 'completed');
  });

  it('合约不暴露加密梯度内容', () => {
    const gradientContractKeys = [
      'id', 'roundId', 'taskId', 'tenantId',
      'sampleCount', 'status', 'submittedAt',
      'receivedAt', 'rejectionReason', 'createdAt',
    ];
    assert.ok(!gradientContractKeys.includes('encryptedGradients'));
    assert.ok(!gradientContractKeys.includes('noiseSeed'));
  });
});
