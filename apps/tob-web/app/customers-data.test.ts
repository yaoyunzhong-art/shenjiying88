import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  MOCK_CUSTOMERS,
  CUSTOMER_LIST_STATUSES,
  CUSTOMER_LIST_STATUS_MAP,
  buildCustomerStats,
  buildFallbackCustomerList,
  getLatestCustomerTimestamp,
  mapLegacyCustomerToListItem,
} from './customers-data';

describe('customers-data', () => {
  it('fallback 映射应保留基础联系信息', () => {
    const mapped = mapLegacyCustomerToListItem(MOCK_CUSTOMERS[0]!);
    assert.equal(mapped.companyName, MOCK_CUSTOMERS[0]!.companyName);
    assert.equal(mapped.contactEmail, MOCK_CUSTOMERS[0]!.contactEmail);
    assert.equal(mapped.contactPhone, MOCK_CUSTOMERS[0]!.contactPhone);
  });

  it('fallback 映射应把 suspended/pending 收敛为 CRM 状态集', () => {
    const suspended = mapLegacyCustomerToListItem(
      MOCK_CUSTOMERS.find((item) => item.status === 'suspended')!,
    );
    const pending = mapLegacyCustomerToListItem(
      MOCK_CUSTOMERS.find((item) => item.status === 'pending')!,
    );
    assert.equal(suspended.status, 'inactive');
    assert.equal(pending.status, 'lead');
  });

  it('fallback 列表应为每条记录生成最小 CRM 展示字段', () => {
    const fallback = buildFallbackCustomerList();
    assert.equal(fallback.length, MOCK_CUSTOMERS.length);
    assert.ok(fallback.every((item) => Array.isArray(item.tags)));
    assert.ok(fallback.every((item) => typeof item.totalSpentCents === 'number'));
  });

  it('状态标签映射应覆盖全部 CRM 列表状态', () => {
    for (const status of CUSTOMER_LIST_STATUSES) {
      assert.ok(CUSTOMER_LIST_STATUS_MAP[status], `missing status map for ${status}`);
      assert.ok(CUSTOMER_LIST_STATUS_MAP[status].label.length > 0);
    }
  });

  it('聚合统计应返回 total/byStatus/avgScore/totalSpentCents', () => {
    const stats = buildCustomerStats(buildFallbackCustomerList());
    assert.equal(stats.total, MOCK_CUSTOMERS.length);
    assert.equal(
      stats.byStatus.active + stats.byStatus.inactive + stats.byStatus.churned + stats.byStatus.lead,
      stats.total,
    );
    assert.ok(stats.avgScore >= 0 && stats.avgScore <= 100);
    assert.ok(stats.totalSpentCents > 0);
  });

  it('latest timestamp 应取列表中的最大 lastActivity', () => {
    const latest = getLatestCustomerTimestamp([
      { lastActivity: '2026-01-01' },
      { lastActivity: '2026-03-05' },
      { lastActivity: '2026-02-01' },
    ]);
    assert.equal(latest, '2026-03-05');
  });
});
