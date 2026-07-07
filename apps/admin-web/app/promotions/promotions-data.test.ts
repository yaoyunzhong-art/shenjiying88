/**
 * promotions-data.test.ts — 促销活动数据层单元测试
 *
 * 使用 Node 内置 test runner
 * 运行: node --import tsx --test apps/admin-web/app/promotions/*.test.ts
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';
import type { PromotionItem } from './promotion-types';
import { getPromotions } from './promotions-data';

describe('getPromotions()', () => {
  it('返回非空数组', () => {
    const promotions = getPromotions();
    assert.ok(Array.isArray(promotions), '应为数组');
    assert.ok(promotions.length > 0, '至少有一条促销活动数据');
  });

  it('每条数据包含必需字段', () => {
    const promotions = getPromotions();
    for (const p of promotions) {
      assert.ok(typeof p.id === 'string', `活动 ${p.name} 缺少 id`);
      assert.ok(typeof p.name === 'string', `活动缺少 name`);
      assert.ok(typeof p.type === 'string', `活动 ${p.name} 缺少 type`);
      assert.ok(typeof p.status === 'string', `活动 ${p.name} 缺少 status`);
      assert.ok(typeof p.storeId === 'string', `活动 ${p.name} 缺少 storeId`);
      assert.ok(typeof p.storeName === 'string', `活动 ${p.name} 缺少 storeName`);
      assert.ok(typeof p.budget === 'number', `活动 ${p.name} 缺少 budget`);
      assert.ok(typeof p.usedBudget === 'number', `活动 ${p.name} 缺少 usedBudget`);
      assert.ok(typeof p.startAt === 'string', `活动 ${p.name} 缺少 startAt`);
      assert.ok(typeof p.endAt === 'string', `活动 ${p.name} 缺少 endAt`);
      assert.ok(typeof p.createdBy === 'string', `活动 ${p.name} 缺少 createdBy`);
      assert.ok(typeof p.createdAt === 'string', `活动 ${p.name} 缺少 createdAt`);
      assert.ok(typeof p.updatedAt === 'string', `活动 ${p.name} 缺少 updatedAt`);
      assert.ok(typeof p.description === 'string', `活动 ${p.name} 缺少 description`);
    }
  });

  it('status 字段是合法值', () => {
    const validStatuses = new Set(['draft', 'scheduled', 'active', 'paused', 'expired', 'cancelled']);
    const promotions = getPromotions();
    for (const p of promotions) {
      assert.ok(
        validStatuses.has(p.status),
        `活动 ${p.name} 的 status="${p.status}" 不合法，允许: ${[...validStatuses].join(', ')}`
      );
    }
  });

  it('type 字段是合法值', () => {
    const validTypes = new Set(['discount', 'coupon', 'cashback', 'gift', 'bundle', 'clearance']);
    const promotions = getPromotions();
    for (const p of promotions) {
      assert.ok(
        validTypes.has(p.type),
        `活动 ${p.name} 的 type="${p.type}" 不合法，允许: ${[...validTypes].join(', ')}`
      );
    }
  });

  it('预算与已使用金额非负', () => {
    const promotions = getPromotions();
    for (const p of promotions) {
      assert.ok(p.budget >= 0, `活动 ${p.name} 预算为负数 ${p.budget}`);
      assert.ok(p.usedBudget >= 0, `活动 ${p.name} 已使用金额为负数 ${p.usedBudget}`);
      assert.ok(p.usedBudget <= p.budget, `活动 ${p.name} 已使用金额 ${p.usedBudget} 超过预算 ${p.budget}`);
    }
  });

  it('时间范围有效 (startAt <= endAt)', () => {
    const promotions = getPromotions();
    for (const p of promotions) {
      const start = new Date(p.startAt).getTime();
      const end = new Date(p.endAt).getTime();
      assert.ok(
        !Number.isNaN(start) && !Number.isNaN(end),
        `活动 ${p.name} 日期格式无效`
      );
      assert.ok(
        start <= end,
        `活动 ${p.name} 开始时间 ${p.startAt} 晚于结束时间 ${p.endAt}`
      );
    }
  });
});
