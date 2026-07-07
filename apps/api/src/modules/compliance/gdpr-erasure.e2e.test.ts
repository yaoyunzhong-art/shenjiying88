import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * gdpr-erasure.e2e.test.ts - Phase-20 T41
 * 用途: GDPR 用户删除权 e2e 验证
 *
 * 验收 (6 cases):
 * - AC-1: softDelete 标记 + grace period
 * - AC-2: grace period 内可恢复
 * - AC-3: grace period 后硬删除
 * - AC-4: 级联钩子 (会员/订单/发票 模拟)
 * - AC-5: 跨租户隔离
 * - AC-6: 审计追踪
 */
import { GDPRErasureService } from './gdpr-erasure.service';

describe('GDPRErasureService · Phase-20 T41', () => {
  let svc: GDPRErasureService;

  beforeEach(() => {
    svc = new GDPRErasureService();
    svc.resetForTests();
  });

  // AC-1: softDelete + grace period
  it('AC-1 requestErasure: soft delete with 30-day deadline', () => {
    const record = svc.requestErasure({
      userId: 'user-001',
      tenantId: 'tenant-A',
      reason: 'GDPR Article 17 request',
      requestedBy: 'admin-A',
    });
    expect(record.status).toBe('PENDING_ERASURE');
    expect(record.deletionRequestedAt).toBeDefined();
    expect(record.erasureDeadlineAt).toBeDefined();

    // 30 天后到期
    const requested = new Date(record.deletionRequestedAt!).getTime();
    const deadline = new Date(record.erasureDeadlineAt!).getTime();
    const daysDiff = (deadline - requested) / (1000 * 60 * 60 * 24);
    expect(daysDiff).toBeCloseTo(30, 0);

    // 立即不可服务
    expect(svc.isActive('user-001')).toBe(false);
    expect(svc.getRecord('user-001')?.status).toBe('PENDING_ERASURE');
  });

  // AC-2: grace period 内恢复
  it('AC-2 cancelErasure: restore within grace period', () => {
    svc.requestErasure({ userId: 'user-002', tenantId: 'tenant-A' });
    expect(svc.isActive('user-002')).toBe(false);
    svc.cancelErasure('user-002');
    expect(svc.isActive('user-002')).toBe(true);
    expect(svc.getRecord('user-002')?.status).toBe('ACTIVE');
  });

  // AC-3: grace period 后硬删除 + listReadyForHardDelete
  it('AC-3 hardDelete: after grace period expires', async () => {
    // 短 grace period: 100ms
    svc.requestErasure({
      userId: 'user-003',
      tenantId: 'tenant-A',
      gracePeriodMs: 100,
    });
    // 等待 grace period 结束
    await new Promise((r) => setTimeout(r, 150));
    const ready = svc.listReadyForHardDelete();
    expect(ready.length).toBe(1);
    expect(ready[0].userId).toBe('user-003');

    const result = await svc.hardDelete('user-003');
    expect(result.userId).toBe('user-003');
    expect(svc.getRecord('user-003')?.status).toBe('ERASED');
    expect(svc.getRecord('user-003')?.erasedAt).toBeDefined();
  });

  // AC-4: 级联钩子
  it('AC-4 cascade hooks: member/order/invoice module deletion', async () => {
    // 注册 3 个模拟模块钩子
    svc.registerCascadeHook('member', async (uid) => {
      // 模拟删除 1 条会员记录
      return uid === 'user-004' ? 1 : 0;
    });
    svc.registerCascadeHook('order', async (uid) => {
      return uid === 'user-004' ? 5 : 0;
    });
    svc.registerCascadeHook('invoice', async (uid) => {
      return uid === 'user-004' ? 3 : 0;
    });

    svc.requestErasure({
      userId: 'user-004',
      tenantId: 'tenant-A',
      gracePeriodMs: 50,
    });
    await new Promise((r) => setTimeout(r, 100));

    const result = await svc.hardDelete('user-004');
    expect(result.deletedFromModules.member).toBe(1);
    expect(result.deletedFromModules.order).toBe(5);
    expect(result.deletedFromModules.invoice).toBe(3);
    expect(result.totalDeleted).toBe(9);
  });

  // AC-5: 跨租户隔离
  it('AC-5 multi-tenant: audit isolation by tenantId', () => {
    svc.requestErasure({ userId: 'user-005', tenantId: 'tenant-A' });
    svc.requestErasure({ userId: 'user-006', tenantId: 'tenant-B' });
    svc.requestErasure({ userId: 'user-007', tenantId: 'tenant-A' });

    const tenantA = svc.listAuditTrail('tenant-A');
    const tenantB = svc.listAuditTrail('tenant-B');
    expect(tenantA.length).toBe(2);
    expect(tenantB.length).toBe(1);
    expect(tenantA.map((r) => r.userId).sort()).toEqual(['user-005', 'user-007']);
  });

  // AC-6: 批量调度 + 错误恢复
  it('AC-6 processScheduledDeletions: batch process + hook failure isolation', async () => {
    // 一个会失败的钩子
    svc.registerCascadeHook('flaky-module', async () => {
      throw new Error('simulated DB error');
    });
    svc.registerCascadeHook('good-module', async () => 7);

    svc.requestErasure({
      userId: 'user-008',
      tenantId: 'tenant-A',
      gracePeriodMs: 50,
    });
    await new Promise((r) => setTimeout(r, 100));

    const results = await svc.processScheduledDeletions();
    expect(results.length).toBe(1);
    // 失败的钩子不应影响成功钩子
    expect(results[0].deletedFromModules['good-module']).toBe(7);
    expect(results[0].totalDeleted).toBe(7); // 失败模块不计
  });
});
