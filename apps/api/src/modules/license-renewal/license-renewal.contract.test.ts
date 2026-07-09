import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [license-renewal] [C] 合约测试
 *
 * 验证 license-renewal 模块的实体 Shape、业务逻辑契约、创建/查询/更新/统计流程
 */

import 'reflect-metadata';
import assert from 'node:assert/strict';
import { LicenseRenewalService } from './license-renewal.service';
import type { RenewalRecordResponseDto, RenewalRecordListResponseDto, NotificationResponseDto, NotificationListResponseDto, RenewalStatsResponseDto } from './license-renewal.dto';

// ─── 服务实例 helper ──────────────────────────────────

function makeService(): LicenseRenewalService {
  return new LicenseRenewalService();
}

// ─── 合约: 续费记录 Shape ────────────────────────────

describe('[license-renewal] 合约: 续费记录实体', () => {
  it('创建续费记录 — 返回完整 DTO shape', async () => {
    const svc = makeService();
    const result = await svc.createRecord({
      licenseId: 'lic-test-001',
      tenantId: 'tenant-test',
      packageId: 'pkg-test',
      packageName: '测试套餐',
      price: 1999,
      status: 'pending',
    });
    assert.equal(typeof result.id, 'string');
    assert.ok(result.id.startsWith('renewal-'));
    assert.equal(result.licenseId, 'lic-test-001');
    assert.equal(result.tenantId, 'tenant-test');
    assert.equal(result.packageId, 'pkg-test');
    assert.equal(result.packageName, '测试套餐');
    assert.equal(result.price, 1999);
    assert.equal(result.status, 'pending');
    assert.equal(typeof result.createdAt, 'string');
    assert.equal(typeof result.updatedAt, 'string');
    // 可选字段未传应为 undefined
    assert.equal(result.previousExpireAt, undefined);
    assert.equal(result.newExpireAt, undefined);
    assert.equal(result.errorMessage, undefined);
    assert.equal(result.paymentId, undefined);
    assert.equal(result.paidAt, undefined);
  });

  it('创建续费记录 — 带过期时间参数', async () => {
    const svc = makeService();
    const result = await svc.createRecord({
      licenseId: 'lic-test-002',
      tenantId: 'tenant-test',
      price: 0,
      previousExpireAt: '2026-06-01T00:00:00.000Z',
      newExpireAt: '2027-06-01T00:00:00.000Z',
    });
    assert.equal(result.previousExpireAt, '2026-06-01T00:00:00.000Z');
    assert.equal(result.newExpireAt, '2027-06-01T00:00:00.000Z');
    assert.equal(result.status, 'pending');
    assert.equal(result.price, 0);
  });
});

describe('[license-renewal] 合约: 查询列表', () => {
  it('列表默认分页 — 返回 data + total + page + pageSize', async () => {
    const svc = makeService();
    const list = await svc.listRecords({});
    assert.ok(Array.isArray(list.data));
    assert.equal(typeof list.total, 'number');
    assert.equal(typeof list.page, 'number');
    assert.equal(typeof list.pageSize, 'number');
    assert.ok(list.total >= 2); // seed data has 2 records
    assert.equal(list.page, 1);
    assert.equal(list.pageSize, 10);
  });

  it('按 licenseId 筛选 — 返回匹配记录', async () => {
    const svc = makeService();
    const list = await svc.listRecords({ licenseId: 'lic-seed-paid' });
    assert.ok(list.data.length >= 1);
    for (const r of list.data) {
      assert.equal(r.licenseId, 'lic-seed-paid');
    }
  });

  it('按 status 筛选 — 只返回对应状态的记录', async () => {
    const svc = makeService();
    const list = await svc.listRecords({ status: 'pending' });
    for (const r of list.data) {
      assert.equal(r.status, 'pending');
    }
  });

  it('按 tenantId 筛选 — 只返回对应租户的记录', async () => {
    const svc = makeService();
    const list = await svc.listRecords({ tenantId: 'tenant-A' });
    for (const r of list.data) {
      assert.equal(r.tenantId, 'tenant-A');
    }
  });

  it('按日期范围筛选 — 在范围内的才返回', async () => {
    const svc = makeService();
    const list = await svc.listRecords({ startDate: '2025-01-01T00:00:00.000Z', endDate: '2026-12-31T00:00:00.000Z' });
    assert.ok(list.total > 0);
    // seed data dates are within range
    assert.ok(list.data.every(r => r.createdAt >= '2025-01-01T00:00:00.000Z'));
  });
});

describe('[license-renewal] 合约: 获取详情', () => {
  it('存在的记录 — 返回完整详情', async () => {
    const svc = makeService();
    const record = await svc.getRecord('renewal-seed-1');
    assert.equal(record.id, 'renewal-seed-1');
    assert.equal(record.licenseId, 'lic-seed-paid');
    assert.equal(record.status, 'success');
    assert.equal(record.price, 2999);
  });

  it('不存在的记录 — 抛出 NotFoundException', async () => {
    const svc = makeService();
    await expect(svc.getRecord('renewal-non-existent')).rejects.toThrow('续费记录不存在');
  });
});

describe('[license-renewal] 合约: 更新状态', () => {
  it('更新待处理记录为成功 — 自动设置 paidAt', async () => {
    const svc = makeService();
    const updated = await svc.updateStatus('renewal-seed-2', {
      status: 'success',
      paymentId: 'pay-test-001',
    });
    assert.equal(updated.status, 'success');
    assert.equal(updated.paymentId, 'pay-test-001');
    assert.ok(updated.paidAt); // auto-set to now
  });

  it('更新为失败 — 携带错误信息', async () => {
    const svc = makeService();
    // create a record first
    const created = await svc.createRecord({
      licenseId: 'lic-fail-test',
      tenantId: 'tenant-test',
      price: 999,
    });
    const updated = await svc.updateStatus(created.id, {
      status: 'failed',
      errorMessage: '余额不足',
    });
    assert.equal(updated.status, 'failed');
    assert.equal(updated.errorMessage, '余额不足');
  });

  it('不存在的记录更新 — 抛出 NotFoundException', async () => {
    const svc = makeService();
    await expect(svc.updateStatus('renewal-nonexist', { status: 'success' })).rejects.toThrow('续费记录不存在');
  });
});

// ─── 合约: 续费通知 ──────────────────────────────────

describe('[license-renewal] 合约: 续费通知', () => {
  it('创建通知 — 返回完整 DTO shape', async () => {
    const svc = makeService();
    const result = await svc.createNotification({
      licenseId: 'lic-notif-test',
      tenantId: 'tenant-test',
      type: 'reminder',
      reminderDays: 7,
      sentAt: new Date().toISOString(),
    });
    assert.equal(typeof result.id, 'string');
    assert.ok(result.id.startsWith('notif-'));
    assert.equal(result.licenseId, 'lic-notif-test');
    assert.equal(result.tenantId, 'tenant-test');
    assert.equal(result.type, 'reminder');
    assert.equal(result.reminderDays, 7);
    assert.equal(typeof result.sentAt, 'string');
    assert.equal(typeof result.createdAt, 'string');
  });

  it('查询通知 — 按 licenseId 筛选', async () => {
    const svc = makeService();
    const list = await svc.listNotifications('lic-seed-paid');
    assert.ok(list.data.length >= 1);
    for (const n of list.data) {
      assert.equal(n.licenseId, 'lic-seed-paid');
    }
  });

  it('查询通知 — 按 tenantId 筛选', async () => {
    const svc = makeService();
    const list = await svc.listNotifications(undefined, 'tenant-B');
    assert.ok(list.data.length >= 1);
    for (const n of list.data) {
      assert.equal(n.tenantId, 'tenant-B');
    }
  });

  it('查询通知 — 无匹配返回空列表', async () => {
    const svc = makeService();
    const list = await svc.listNotifications('lic-nonexistent', 'tenant-Z');
    assert.equal(list.data.length, 0);
    assert.equal(list.total, 0);
  });
});

// ─── 合约: 续费统计 ──────────────────────────────────

describe('[license-renewal] 合约: 续费统计', () => {
  it('统计 — 返回完整 stats shape', async () => {
    const svc = makeService();
    const stats = await svc.getStats();
    assert.equal(typeof stats.totalRenewals, 'number');
    assert.equal(typeof stats.successCount, 'number');
    assert.equal(typeof stats.failedCount, 'number');
    assert.equal(typeof stats.pendingCount, 'number');
    assert.equal(typeof stats.successRate, 'number');
    assert.equal(typeof stats.totalRevenue, 'number');
    assert.ok(stats.totalRenewals >= 2);
    assert.ok(stats.successCount >= 1);
  });

  it('统计 — 按 tenantId 筛选', async () => {
    const svc = makeService();
    const stats = await svc.getStats('tenant-A');
    assert.ok(stats.totalRenewals >= 1);
    // tenant-A has 1 success record with price 2999
    assert.equal(stats.successCount, 1);
    assert.equal(stats.totalRevenue, 2999);
  });

  it('统计 — 新增记录后统计更新', async () => {
    const svc = makeService();
    const before = await svc.getStats('tenant-New');
    assert.equal(before.totalRenewals, 0);
    assert.equal(before.successRate, 0);
    assert.equal(before.totalRevenue, 0);

    await svc.createRecord({
      licenseId: 'lic-new',
      tenantId: 'tenant-New',
      price: 5000,
    });
    await svc.createRecord({
      licenseId: 'lic-new-2',
      tenantId: 'tenant-New',
      price: 3000,
    });

    const after = await svc.getStats('tenant-New');
    assert.equal(after.totalRenewals, 2);
    assert.equal(after.pendingCount, 2);
    assert.equal(after.successCount, 0);
    assert.equal(after.totalRevenue, 0);
  });
});

// ─── 合约: 边界与异常 ─────────────────────────────────

describe('[license-renewal] 合约: 边界与异常', () => {
  it('大量续费记录 — 分页正常工作', async () => {
    const svc = makeService();
    // create 25 records
    for (let i = 0; i < 25; i++) {
      await svc.createRecord({
        licenseId: `lic-bulk-${i}`,
        tenantId: 'tenant-bulk',
        price: 1000 + i,
      });
    }
    const page1 = await svc.listRecords({ tenantId: 'tenant-bulk', page: 1, pageSize: 10 });
    assert.equal(page1.data.length, 10);
    assert.equal(page1.total, 25);
    assert.equal(page1.page, 1);

    const page2 = await svc.listRecords({ tenantId: 'tenant-bulk', page: 2, pageSize: 10 });
    assert.equal(page2.data.length, 10);
    assert.equal(page2.page, 2);

    const page3 = await svc.listRecords({ tenantId: 'tenant-bulk', page: 3, pageSize: 10 });
    assert.equal(page3.data.length, 5);
    assert.equal(page3.page, 3);
  });

  it('空租户 — 统计全是零', async () => {
    const svc = makeService();
    const stats = await svc.getStats('tenant-vacant');
    assert.equal(stats.totalRenewals, 0);
    assert.equal(stats.successCount, 0);
    assert.equal(stats.failedCount, 0);
    assert.equal(stats.pendingCount, 0);
    assert.equal(stats.successRate, 0);
    assert.equal(stats.totalRevenue, 0);
  });

  it('多种状态混入 — 统计数字准确', async () => {
    const svc = makeService();
    await svc.createRecord({ licenseId: 'lic-mix-1', tenantId: 'tenant-mix', price: 100 });
    const r2 = await svc.createRecord({ licenseId: 'lic-mix-2', tenantId: 'tenant-mix', price: 200 });
    await svc.updateStatus(r2.id, { status: 'success', paymentId: 'pay-mix-1' });
    const r3 = await svc.createRecord({ licenseId: 'lic-mix-3', tenantId: 'tenant-mix', price: 300 });
    await svc.updateStatus(r3.id, { status: 'failed', errorMessage: '支付失败' });

    const stats = await svc.getStats('tenant-mix');
    assert.equal(stats.totalRenewals, 3);
    assert.equal(stats.successCount, 1);
    assert.equal(stats.failedCount, 1);
    assert.equal(stats.pendingCount, 1);
    assert.equal(stats.totalRevenue, 200);
    // successRate = 1/3 = 33.33%
    assert.ok(stats.successRate > 33 && stats.successRate < 34);
  });
});
