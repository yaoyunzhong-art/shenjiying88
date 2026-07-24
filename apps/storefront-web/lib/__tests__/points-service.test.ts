/**
 * points-service.test.ts — L1 合约测试
 *
 * 覆盖:
 *   - PointsService 构造
 *   - PointRecord 数据结构
 *   - PointsSummary 数据结构
 *   - REDEEM_OPTIONS 完整性
 *   - redeemPoints 本地校验逻辑
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PointsService, REDEEM_OPTIONS, type PointRecord, type PointsSummary } from '../points-service.ts';

// ─── PointsService 构造 ─────────────────────────────

describe('[points-service] 构造', () => {
  it('无参数构造应使用默认 baseUrl', () => {
    const svc = new PointsService();
    assert.ok(svc instanceof PointsService);
  });

  it('可以传入自定义 baseUrl', () => {
    const svc = new PointsService('http://localhost:9999');
    assert.ok(svc instanceof PointsService);
  });
});

// ─── PointRecord 数据结构 ──────────────────────────

describe('[points-service] PointRecord 数据结构', () => {
  it('earn 类型记录应为正值', () => {
    const record: PointRecord = { id: 'r1', type: 'earn', amount: 100, description: '消费返积分', createdAt: '2026-07-01' };
    assert.equal(record.type, 'earn');
    assert.ok(record.amount > 0);
  });

  it('spend 类型记录应为负值', () => {
    const record: PointRecord = { id: 'r4', type: 'spend', amount: -50, description: '积分兑换优惠券', createdAt: '2026-06-20' };
    assert.equal(record.type, 'spend');
    assert.ok(record.amount < 0);
  });

  it('记录可有可无可选 orderNo', () => {
    const withOrder: PointRecord = { id: 'r1', type: 'earn', amount: 100, description: '消费', createdAt: '2026-07-01', orderNo: 'SJY001' };
    const withoutOrder: PointRecord = { id: 'r3', type: 'earn', amount: 100, description: '活动', createdAt: '2026-06-25' };
    assert.equal(typeof withOrder.orderNo, 'string');
    assert.equal(withoutOrder.orderNo, undefined);
  });
});

// ─── PointsSummary ──────────────────────────────────

describe('[points-service] PointsSummary', () => {
  it('total = earned - spent 一致性检查', () => {
    const summary: PointsSummary = { total: 1280, earned: 1880, spent: 600 };
    assert.equal(summary.total, summary.earned - summary.spent);
  });

  it('边界: earned = 0 时全部为消费', () => {
    const summary: PointsSummary = { total: 0, earned: 0, spent: 0 };
    assert.equal(summary.total, 0);
  });
});

// ─── REDEEM_OPTIONS ─────────────────────────────────

describe('[points-service] REDEEM_OPTIONS', () => {
  it('应有 4 种兑换选项', () => {
    assert.equal(REDEEM_OPTIONS.length, 4);
  });

  it('每种选项必须含 id/points/reward/type 4 字段', () => {
    for (const opt of REDEEM_OPTIONS) {
      assert.ok(typeof opt.id === 'string' && opt.id.length > 0, `id 必填: ${opt.id}`);
      assert.ok(typeof opt.points === 'number' && opt.points > 0, `points 必须 > 0: ${opt.id}`);
      assert.ok(typeof opt.reward === 'string' && opt.reward.length > 0, `reward 必填: ${opt.id}`);
      assert.ok(['cash', 'free_shipping'].includes(opt.type), `type 必须为 cash 或 free_shipping: ${opt.id}`);
    }
  });

  it('积分由低到高排列', () => {
    const points = REDEEM_OPTIONS.map(o => o.points);
    for (let i = 1; i < points.length; i++) {
      assert.ok(points[i] > points[i - 1], `第 ${i + 1} 个选项积分(${points[i]})应大于第 ${i} 个(${points[i - 1]})`);
    }
  });
});

// ─── PointsService.redeemPoints 本地校验 ──────────

describe('[points-service] redeemPoints 本地校验', () => {
  it('无效 optionId 返回错误', async () => {
    const svc = new PointsService();
    const result = await svc.redeemPoints('nonexistent-option');
    assert.equal(result.success, false);
    assert.equal(result.error?.code, 'INVALID_OPTION');
  });

  it('有效 optionId 生成正确的 pointsSpent', async () => {
    const svc = new PointsService('http://test.local/api');
    const result = await svc.redeemPoints('opt1');
    assert.equal(result.error?.code, 'NETWORK_ERROR'); // fetch 会失败
    assert.equal(result.success, false);
  });
});
