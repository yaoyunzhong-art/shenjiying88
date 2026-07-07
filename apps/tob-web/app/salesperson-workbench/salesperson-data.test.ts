/**
 * salesperson-workbench/salesperson-data.test.ts — 导购数据 L1 测试
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  MOCK_TASKS,
  MOCK_DAILY_METRICS,
  MOCK_RECENT_CUSTOMERS,
  getCurrentSalesperson,
  TASK_PRIORITY_MAP,
  TASK_STATUS_MAP,
  CUSTOMER_INTENT_MAP,
  type SalesTask,
  type DailyMetric,
  type RecentCustomer,
} from './salesperson-data';

describe('salesperson-data — 正例', () => {
  it('应正确获取当前导购', () => {
    const name = getCurrentSalesperson();
    assert.equal(typeof name, 'string');
    assert.ok(name.length > 0);
  });

  it('MOCK_TASKS 应包含任务', () => {
    assert.ok(Array.isArray(MOCK_TASKS));
    assert.ok(MOCK_TASKS.length > 0);
  });

  it('MOCK_DAILY_METRICS 应包含 4 项指标', () => {
    assert.equal(MOCK_DAILY_METRICS.length, 4);
  });

  it('MOCK_RECENT_CUSTOMERS 应包含客户', () => {
    assert.ok(Array.isArray(MOCK_RECENT_CUSTOMERS));
    assert.ok(MOCK_RECENT_CUSTOMERS.length > 0);
  });

  it('每个任务应有必要字段', () => {
    for (const task of MOCK_TASKS) {
      assert.ok(task.id);
      assert.ok(task.title);
      assert.ok(task.customerName);
      assert.ok(['urgent', 'high', 'normal', 'low'].includes(task.priority));
      assert.ok(['pending', 'in_progress', 'completed'].includes(task.status));
    }
  });

  it('映射表应包含所有键', () => {
    assert.ok(TASK_PRIORITY_MAP.urgent);
    assert.ok(TASK_STATUS_MAP.pending);
    assert.ok(CUSTOMER_INTENT_MAP.ready);
    assert.equal(Object.keys(TASK_PRIORITY_MAP).length, 4);
    assert.equal(Object.keys(TASK_STATUS_MAP).length, 3);
    assert.equal(Object.keys(CUSTOMER_INTENT_MAP).length, 4);
  });
});

describe('salesperson-data — 边界', () => {
  it('MOCK_DAILY_METRICS 每项应有趋势方向', () => {
    for (const m of MOCK_DAILY_METRICS) {
      assert.ok(['up', 'down', 'flat'].includes(m.trend));
      assert.equal(typeof m.changePercent, 'number');
    }
  });

  it('MOCK_RECENT_CUSTOMERS 每项应有预估价值', () => {
    for (const c of MOCK_RECENT_CUSTOMERS) {
      assert.equal(typeof c.estimatedValue, 'number');
      assert.ok(c.estimatedValue > 0);
    }
  });
});
