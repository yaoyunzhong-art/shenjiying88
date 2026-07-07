import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [federated-learning] [D] E2E 测试
 *
 * 联邦学习模块 HTTP E2E 链路测试
 *
 * 链路:
 *   HTTP → SafeFederatedController → FederatedLearningService
 *
 * 验证:
 *   - 任务 CRUD (创建/列表/详情/激活)
 *   - 轮次管理 (开始/列表)
 *   - 梯度提交
 *   - 聚合 (FedAvg)
 *   - 隐私预算查询
 *   - 异常输入 (重复提交/客户端不足)
 */

import 'reflect-metadata';
import assert from 'node:assert/strict';
import { Body, Controller, Get, Inject, Param, Post, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';
import { FederatedLearningService } from './federated.service';
import { runWithTenant } from '../../common/context/tenant-context';
import { MockHomomorphicCipher } from './federated.entity';

const TENANT_A = { tenantId: 'tenant-A', storeId: 'store-001', userId: 'coordinator', role: 'tenant_admin' as const };
const cipher = new MockHomomorphicCipher();

@Controller('federated')
class SafeFederatedController {
  constructor(
    @Inject(FederatedLearningService)
    private readonly service: FederatedLearningService,
  ) {}

  @Post('tasks')
  async createTask(@Body() body: Record<string, unknown>) {
    return runWithTenant(TENANT_A, () => this.service.createTask(body as any));
  }

  @Get('tasks')
  async listTasks() {
    return runWithTenant(TENANT_A, () => this.service.listTasks());
  }

  @Get('tasks/:id')
  async getTask(@Param('id') id: string) {
    return runWithTenant(TENANT_A, () => this.service.getTask(id));
  }

  @Post('tasks/:id/activate')
  async activateTask(@Param('id') id: string) {
    return runWithTenant(TENANT_A, () => this.service.activateTask(id));
  }

  @Post('tasks/:taskId/rounds')
  async startRound(@Param('taskId') taskId: string, @Body() body: Record<string, unknown>) {
    return runWithTenant(TENANT_A, () => this.service.startRound(taskId, body as any));
  }

  @Get('tasks/:taskId/rounds')
  async listRounds(@Param('taskId') taskId: string) {
    return runWithTenant(TENANT_A, () => this.service.listRounds(taskId));
  }

  @Post('tasks/:taskId/submit')
  async submitGradient(@Param('taskId') taskId: string, @Body() body: Record<string, unknown>) {
    return runWithTenant(TENANT_A, () => this.service.submitGradient(taskId, body as any));
  }

  @Post('rounds/:roundId/aggregate')
  async aggregateRound(@Param('roundId') roundId: string) {
    return runWithTenant(TENANT_A, () => this.service.aggregateRound(roundId));
  }

  @Get('tasks/:taskId/privacy')
  async getPrivacy(@Param('taskId') taskId: string) {
    return runWithTenant(TENANT_A, () => this.service.getPrivacyAccount(taskId));
  }
}

@Module({
  controllers: [SafeFederatedController],
  providers: [FederatedLearningService],
})
class SafeAppModule {}

async function buildSafeApp() {
  const moduleRef = await Test.createTestingModule({
    imports: [SafeAppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalInterceptors(new ResponseInterceptor());
  await app.init();
  return { app };
}

// Helpers
function d(res: any) { return res.body.data; }
function m(res: any) { return res.body.message; }

// ============ E2E Tests ============

it('e2e: 创建联邦任务成功', async () => {
  const { app } = await buildSafeApp();
  try {
    const res = await request(app.getHttpServer())
      .post('/federated/tasks')
      .send({ name: '销量预测联邦', modelArch: 'sales-forecaster-v2', participantTenantIds: ['tenant-A', 'tenant-B', 'tenant-C'], aggregationMethod: 'fedavg', totalRounds: 10 });
    assert.equal(res.statusCode, 201);
    assert.equal(d(res).name, '销量预测联邦');
    assert.equal(d(res).modelArch, 'sales-forecaster-v2');
    assert.equal(d(res).status, 'draft');
    assert.equal(d(res).currentRound, 0);
    assert.ok(d(res).id.startsWith('fed-task-'));
    assert.equal(d(res).participantTenantIds.length, 3);
  } finally {
    await app.close();
  }
});

it('e2e: 创建任务 - 无参与租户报 400', async () => {
  const { app } = await buildSafeApp();
  try {
    const res = await request(app.getHttpServer()).post('/federated/tasks').send({ name: '空参与任务', modelArch: 'v1', participantTenantIds: [] });
    assert.equal(res.statusCode, 400);
  } finally {
    await app.close();
  }
});

it('e2e: 创建任务 - 负隐私预算报 400', async () => {
  const { app } = await buildSafeApp();
  try {
    const res = await request(app.getHttpServer()).post('/federated/tasks').send({ name: '坏预算', modelArch: 'v1', participantTenantIds: ['tenant-A'], privacyBudgetEpsilon: -1 });
    assert.equal(res.statusCode, 400);
  } finally {
    await app.close();
  }
});

it('e2e: 列出任务', async () => {
  const { app } = await buildSafeApp();
  try {
    await request(app.getHttpServer()).post('/federated/tasks').send({ name: 'T1', modelArch: 'm1', participantTenantIds: ['tenant-A'] });
    await request(app.getHttpServer()).post('/federated/tasks').send({ name: 'T2', modelArch: 'm2', participantTenantIds: ['tenant-A'] });
    const res = await request(app.getHttpServer()).get('/federated/tasks');
    assert.equal(res.statusCode, 200);
    assert.equal(d(res).length, 2);
  } finally {
    await app.close();
  }
});

it('e2e: 获取任务详情', async () => {
  const { app } = await buildSafeApp();
  try {
    const created = await request(app.getHttpServer()).post('/federated/tasks').send({ name: '详情测试', modelArch: 'm1', participantTenantIds: ['tenant-A'] });
    const res = await request(app.getHttpServer()).get(`/federated/tasks/${d(created).id}`);
    assert.equal(res.statusCode, 200);
    assert.equal(d(res).id, d(created).id);
    assert.equal(d(res).name, '详情测试');
  } finally {
    await app.close();
  }
});

it('e2e: 获取不存在任务报 404', async () => {
  const { app } = await buildSafeApp();
  try {
    const res = await request(app.getHttpServer()).get('/federated/tasks/non-existent-task');
    assert.equal(res.statusCode, 404);
  } finally {
    await app.close();
  }
});

it('e2e: 激活任务', async () => {
  const { app } = await buildSafeApp();
  try {
    const created = await request(app.getHttpServer()).post('/federated/tasks').send({ name: '激活测试', modelArch: 'm1', participantTenantIds: ['tenant-A'] });
    const res = await request(app.getHttpServer()).post(`/federated/tasks/${d(created).id}/activate`);
    assert.equal(res.statusCode, 201);
    assert.equal(d(res).status, 'active');
  } finally {
    await app.close();
  }
});

it('e2e: 激活不存在任务报 404', async () => {
  const { app } = await buildSafeApp();
  try {
    const res = await request(app.getHttpServer()).post('/federated/tasks/bad-id/activate');
    assert.equal(res.statusCode, 404);
  } finally {
    await app.close();
  }
});

it('e2e: 开始轮次成功', async () => {
  const { app } = await buildSafeApp();
  try {
    const created = await request(app.getHttpServer()).post('/federated/tasks').send({ name: '轮次测试', modelArch: 'm1', participantTenantIds: ['tenant-A'] });
    await request(app.getHttpServer()).post(`/federated/tasks/${d(created).id}/activate`);
    const res = await request(app.getHttpServer()).post(`/federated/tasks/${d(created).id}/rounds`).send({ collectionDeadlineMs: 60000 });
    assert.equal(res.statusCode, 201);
    assert.equal(d(res).status, 'collecting');
    assert.equal(d(res).roundNumber, 1);
  } finally {
    await app.close();
  }
});

it('e2e: 列表轮次', async () => {
  const { app } = await buildSafeApp();
  try {
    const created = await request(app.getHttpServer()).post('/federated/tasks').send({ name: '轮次列表', modelArch: 'm1', participantTenantIds: ['tenant-A'] });
    await request(app.getHttpServer()).post(`/federated/tasks/${d(created).id}/activate`);
    await request(app.getHttpServer()).post(`/federated/tasks/${d(created).id}/rounds`);
    await request(app.getHttpServer()).post(`/federated/tasks/${d(created).id}/rounds`);
    const res = await request(app.getHttpServer()).get(`/federated/tasks/${d(created).id}/rounds`);
    assert.equal(res.statusCode, 200);
    assert.equal(d(res).length, 2);
  } finally {
    await app.close();
  }
});

it('e2e: 提交梯度成功', async () => {
  const { app } = await buildSafeApp();
  try {
    const created = await request(app.getHttpServer()).post('/federated/tasks').send({ name: '梯度提交', modelArch: 'm1', participantTenantIds: ['tenant-A'] });
    await request(app.getHttpServer()).post(`/federated/tasks/${d(created).id}/activate`);
    const roundRes = await request(app.getHttpServer()).post(`/federated/tasks/${d(created).id}/rounds`);
    const res = await request(app.getHttpServer()).post(`/federated/tasks/${d(created).id}/submit`).send({
      roundId: d(roundRes).id,
      encryptedGradients: cipher.encrypt([0.1, -0.2]),
      sampleCount: 500,
    });
    assert.equal(res.statusCode, 201);
    assert.ok(d(res).submissionId);
    assert.equal(d(res).status, 'accepted');
  } finally {
    await app.close();
  }
});

it('e2e: 同一租户重复提交同一轮次报 400', async () => {
  const { app } = await buildSafeApp();
  try {
    const created = await request(app.getHttpServer()).post('/federated/tasks').send({ name: '重复提交', modelArch: 'm1', participantTenantIds: ['tenant-A'] });
    await request(app.getHttpServer()).post(`/federated/tasks/${d(created).id}/activate`);
    const roundRes = await request(app.getHttpServer()).post(`/federated/tasks/${d(created).id}/rounds`);
    await request(app.getHttpServer()).post(`/federated/tasks/${d(created).id}/submit`).send({ roundId: d(roundRes).id, encryptedGradients: cipher.encrypt([0.3, -0.4]), sampleCount: 100 });
    const res = await request(app.getHttpServer()).post(`/federated/tasks/${d(created).id}/submit`).send({ roundId: d(roundRes).id, encryptedGradients: cipher.encrypt([0.5, -0.6]), sampleCount: 50 });
    assert.equal(res.statusCode, 400);
  } finally {
    await app.close();
  }
});

it('e2e: 聚合成功 (完整链路)', async () => {
  const { app } = await buildSafeApp();
  try {
    const created = await request(app.getHttpServer()).post('/federated/tasks').send({ name: '聚合链路', modelArch: 'agg-model', participantTenantIds: ['tenant-A'], totalRounds: 2, minParticipants: 1 });
    await request(app.getHttpServer()).post(`/federated/tasks/${d(created).id}/activate`);
    const roundRes = await request(app.getHttpServer()).post(`/federated/tasks/${d(created).id}/rounds`);
    await request(app.getHttpServer()).post(`/federated/tasks/${d(created).id}/submit`).send({ roundId: d(roundRes).id, encryptedGradients: cipher.encrypt([0.1, -0.2, 0.3]), sampleCount: 1000 });
    const aggRes = await request(app.getHttpServer()).post(`/federated/rounds/${d(roundRes).id}/aggregate`);
    assert.equal(aggRes.statusCode, 201);
    assert.equal(d(aggRes).roundId, d(roundRes).id);
    assert.equal(d(aggRes).participantCount, 1);
    assert.equal(d(aggRes).globalModelVersion, 1);
    assert.equal(d(aggRes).method, 'fedavg');
    assert.ok(d(aggRes).epsilonConsumed > 0);
    assert.ok(d(aggRes).durationMs >= 0);
  } finally {
    await app.close();
  }
});

it('e2e: 聚合 - 客户端不足报 400', async () => {
  const { app } = await buildSafeApp();
  try {
    const created = await request(app.getHttpServer()).post('/federated/tasks').send({ name: '不足聚合', modelArch: 'm1', participantTenantIds: ['tenant-A'], minParticipants: 2 });
    await request(app.getHttpServer()).post(`/federated/tasks/${d(created).id}/activate`);
    const roundRes = await request(app.getHttpServer()).post(`/federated/tasks/${d(created).id}/rounds`);
    await request(app.getHttpServer()).post(`/federated/tasks/${d(created).id}/submit`).send({ roundId: d(roundRes).id, encryptedGradients: cipher.encrypt([0.1, -0.2]), sampleCount: 100 });
    const res = await request(app.getHttpServer()).post(`/federated/rounds/${d(roundRes).id}/aggregate`);
    assert.equal(res.statusCode, 400);
  } finally {
    await app.close();
  }
});

it('e2e: 获取隐私预算', async () => {
  const { app } = await buildSafeApp();
  try {
    const created = await request(app.getHttpServer()).post('/federated/tasks').send({ name: '隐私预算', modelArch: 'm1', participantTenantIds: ['tenant-A'], privacyBudgetEpsilon: 5.0, minParticipants: 1 });
    await request(app.getHttpServer()).post(`/federated/tasks/${d(created).id}/activate`);
    const roundRes = await request(app.getHttpServer()).post(`/federated/tasks/${d(created).id}/rounds`);
    await request(app.getHttpServer()).post(`/federated/tasks/${d(created).id}/submit`).send({ roundId: d(roundRes).id, encryptedGradients: cipher.encrypt([0.1, -0.2]), sampleCount: 100 });
    await request(app.getHttpServer()).post(`/federated/rounds/${d(roundRes).id}/aggregate`);
    const res = await request(app.getHttpServer()).get(`/federated/tasks/${d(created).id}/privacy`);
    assert.equal(res.statusCode, 200);
    assert.equal(d(res).totalEpsilon, 5.0);
    assert.ok(d(res).consumedEpsilon > 0);
    assert.ok(d(res).consumedEpsilon <= d(res).totalEpsilon);
  } finally {
    await app.close();
  }
});

it('e2e: 任务完整完成两次轮次', async () => {
  const { app } = await buildSafeApp();
  try {
    const created = await request(app.getHttpServer()).post('/federated/tasks').send({ name: '完成链路', modelArch: 'complete-model', participantTenantIds: ['tenant-A'], totalRounds: 2, minParticipants: 1, privacyBudgetEpsilon: 100.0 });
    await request(app.getHttpServer()).post(`/federated/tasks/${d(created).id}/activate`);
    const r1 = await request(app.getHttpServer()).post(`/federated/tasks/${d(created).id}/rounds`);
    await request(app.getHttpServer()).post(`/federated/tasks/${d(created).id}/submit`).send({ roundId: d(r1).id, encryptedGradients: cipher.encrypt([0.1, -0.2]), sampleCount: 100 });
    await request(app.getHttpServer()).post(`/federated/rounds/${d(r1).id}/aggregate`);
    const r2 = await request(app.getHttpServer()).post(`/federated/tasks/${d(created).id}/rounds`);
    await request(app.getHttpServer()).post(`/federated/tasks/${d(created).id}/submit`).send({ roundId: d(r2).id, encryptedGradients: cipher.encrypt([0.3, -0.4]), sampleCount: 150 });
    await request(app.getHttpServer()).post(`/federated/rounds/${d(r2).id}/aggregate`);
    const finalTask = await request(app.getHttpServer()).get(`/federated/tasks/${d(created).id}`);
    assert.equal(d(finalTask).status, 'completed');
    assert.equal(d(finalTask).currentRound, 2);
  } finally {
    await app.close();
  }
});
