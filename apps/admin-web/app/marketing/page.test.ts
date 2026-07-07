/**
 * marketing/page.test.ts — Page-level tests for the admin marketing page.
 * Tests route config, data integrity, and view-model utility functions.
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 * References: marketing-data.ts, marketing-view-model.ts
 */

import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';

import {
  adminMarketingRoute,
  getAdminMarketingDashboardSnapshot,
} from '../marketing-data';

import {
  formatMemberCount,
  formatCurrency,
  formatPercent,
  campaignStatusLabel,
  campaignChannelLabel,
} from '../marketing-view-model';
import {
  createFallbackMarketingWorkbenchState,
  createMarketingWorkbenchStateFromSnapshot,
} from './live-dashboard';

afterEach(() => {
  cleanup();
});

// ---- 正例 (Positive Cases) ----

describe('marketing-page: 正例', () => {
  describe('route config', () => {
    it('should export correct route config', () => {
      assert.strictEqual(adminMarketingRoute.href, '/marketing');
      assert.strictEqual(adminMarketingRoute.title, '营销管理');
      assert.ok(adminMarketingRoute.description.length > 0);
    });
  });

  describe('data snapshot', () => {
    it('should return full dashboard data shape', () => {
      const data = getAdminMarketingDashboardSnapshot();
      assert.ok(data.managerName);
      assert.ok(data.generatedAt);

      // Growth metrics
      assert.strictEqual(typeof data.growthMetrics.totalMembers, 'number');
      assert.strictEqual(typeof data.growthMetrics.netNewMembers, 'number');
      assert.strictEqual(typeof data.growthMetrics.netNewTrend, 'number');
      assert.strictEqual(typeof data.growthMetrics.activeMembers, 'number');
      assert.strictEqual(typeof data.growthMetrics.activeRate, 'number');
      assert.strictEqual(typeof data.growthMetrics.churnedMembers, 'number');
      assert.strictEqual(typeof data.growthMetrics.churnRate, 'number');

      // Marketing KPI
      assert.strictEqual(typeof data.marketingKpi.totalSpend, 'number');
      assert.strictEqual(typeof data.marketingKpi.cac, 'number');
      assert.strictEqual(typeof data.marketingKpi.ltv, 'number');
      assert.strictEqual(typeof data.marketingKpi.ltvCacRatio, 'number');
      assert.strictEqual(typeof data.marketingKpi.repurchaseRate, 'number');
      assert.strictEqual(typeof data.marketingKpi.monthlyBudgetUtilization, 'number');

      // Campaigns
      assert.ok(Array.isArray(data.recentCampaigns));
      assert.strictEqual(data.recentCampaigns.length, 3);
      const c1 = data.recentCampaigns.find(c => c.id === 'c1');
      assert.ok(c1);
      assert.strictEqual(c1.status, 'running');
      assert.strictEqual(c1.channel, 'wechat');
      assert.strictEqual(c1.roi, 4.2);

      // Quick actions
      assert.ok(Array.isArray(data.quickActions));
      assert.strictEqual(data.quickActions.length, 3);
      const newCampaign = data.quickActions.find(a => a.key === 'new_campaign');
      assert.ok(newCampaign);
      assert.strictEqual(newCampaign.primary, true);
    });
  });
});

// ---- 反例 (Negative / Edge Cases) ----

describe('marketing-view-model: 反例 + 边界', () => {
  describe('formatMemberCount', () => {
    it('should format large numbers to 万', () => {
      assert.strictEqual(formatMemberCount(18420), '1.8万');
      assert.strictEqual(formatMemberCount(10000), '1万');
      assert.strictEqual(formatMemberCount(123456), '12.3万');
    });

    it('should keep small numbers as-is with locale', () => {
      assert.strictEqual(formatMemberCount(9999), '9,999');
      assert.strictEqual(formatMemberCount(0), '0');
      assert.strictEqual(formatMemberCount(100), '100');
    });
  });

  describe('formatCurrency', () => {
    it('should format large amounts to 万元', () => {
      assert.strictEqual(formatCurrency(158000), '15.8万元');
      assert.strictEqual(formatCurrency(10000), '1万元');
    });

    it('should format small amounts with 元 suffix', () => {
      assert.strictEqual(formatCurrency(1200), '1,200元');
      assert.strictEqual(formatCurrency(0), '0元');
      assert.strictEqual(formatCurrency(50), '50元');
    });
  });

  describe('formatPercent', () => {
    it('should format typical percentages', () => {
      assert.strictEqual(formatPercent(12.5), '12.5%');
      assert.strictEqual(formatPercent(0), '0.0%');
      assert.strictEqual(formatPercent(100), '100.0%');
      assert.strictEqual(formatPercent(3.7), '3.7%');
    });
  });

  describe('campaignStatusLabel', () => {
    it('should return Chinese labels for all statuses', () => {
      assert.strictEqual(campaignStatusLabel('running'), '进行中');
      assert.strictEqual(campaignStatusLabel('ended'), '已结束');
      assert.strictEqual(campaignStatusLabel('scheduled'), '已排期');
      assert.strictEqual(campaignStatusLabel('draft'), '草稿');
    });
  });

  describe('campaignChannelLabel', () => {
    it('should return Chinese labels for all channels', () => {
      assert.strictEqual(campaignChannelLabel('wechat'), '微信');
      assert.strictEqual(campaignChannelLabel('app_push'), 'App推送');
      assert.strictEqual(campaignChannelLabel('sms'), '短信');
      assert.strictEqual(campaignChannelLabel('douyin'), '抖音');
      assert.strictEqual(campaignChannelLabel('xiaohongshu'), '小红书');
    });
  });
});

describe('marketing live dashboard mapping', () => {
  it('should fall back to mock dashboard state when snapshot is invalid', () => {
    const fallback = createFallbackMarketingWorkbenchState();
    const result = createMarketingWorkbenchStateFromSnapshot({});

    assert.deepStrictEqual(result, fallback);
  });

  it('should map analytics snapshot into coupon monitor and roi cards', () => {
    const result = createMarketingWorkbenchStateFromSnapshot({
      groups: [
        {
          groupKey: 'marketing',
          metrics: [
            { key: 'marketingRoi', value: 1.82 },
            { key: 'leadCloseWonTotal', value: 9 },
            { key: 'campaignTriggerTotal', value: 30 },
            { key: 'notificationDispatchTotal', value: 45 },
          ],
        },
      ],
      totals: [
        { key: 'totalCouponsIssued', value: 12 },
        { key: 'totalNotifications', value: 60 },
      ],
    });

    assert.strictEqual(result.couponMonitor.monthlyBudgetLabel, '10,000 券');
    assert.strictEqual(result.couponMonitor.issuedTodayLabel, '12 券');
    assert.strictEqual(result.couponMonitor.rejectionRateLabel, '0.0%');
    assert.strictEqual(result.campaignExecution.triggeredLabel, '30 次');
    assert.strictEqual(result.campaignExecution.dispatchedLabel, '0 次');
    assert.strictEqual(result.campaignExecution.dispatchRateLabel, '0.0%');
    assert.strictEqual(result.campaignExecution.backlogLabel, '30 次');
    assert.strictEqual(result.roi.campaignId, 'analytics-live');
    assert.strictEqual(result.roi.campaignName, '基础开发11 实时营销聚合');
    assert.strictEqual(result.roi.roi, 1.82);
    assert.strictEqual(result.roi.conversionRate, 0.75);
    assert.strictEqual(result.roi.ctr, 0.5);
    assert.strictEqual(result.roi.cpaCents, 3800);
    assert.strictEqual(result.roi.revenueCents, 90000);
    assert.strictEqual(result.roi.costCents, 6450);
    assert.strictEqual(result.roi.sent, 45);
    assert.strictEqual(result.roi.clicked, 30);
    assert.strictEqual(result.roi.converted, 9);
  });

  it('should map campaign trigger and dispatch metrics into execution card state', () => {
    const result = createMarketingWorkbenchStateFromSnapshot({
      groups: [
        {
          groupKey: 'marketing',
          metrics: [
            { key: 'campaignTriggerTotal', value: 48 },
            { key: 'campaignDispatchedTotal', value: 36 },
          ],
        },
      ],
      totals: [],
    });

    assert.strictEqual(result.campaignExecution.triggeredLabel, '48 次');
    assert.strictEqual(result.campaignExecution.dispatchedLabel, '36 次');
    assert.strictEqual(result.campaignExecution.dispatchRateLabel, '75.0%');
    assert.strictEqual(result.campaignExecution.backlogLabel, '12 次');
  });

  it('should render live campaign execution card from /api/analytics/snapshot', async () => {
    const originalFetch = globalThis.fetch;
    const fetchCalls: Array<{ input: string; headers: HeadersInit | undefined }> = [];

    globalThis.fetch = (async (input, init) => {
      fetchCalls.push({ input: String(input), headers: init?.headers });
      return new Response(
        JSON.stringify({
          groups: [
            {
              groupKey: 'marketing',
              metrics: [
                { key: 'campaignTriggerTotal', value: 48 },
                { key: 'campaignDispatchedTotal', value: 36 },
                { key: 'notificationDispatchTotal', value: 40 },
              ],
            },
          ],
          totals: [{ key: 'totalCouponsIssued', value: 12 }],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }) as typeof fetch;

    try {
      const mod = await import('./page');
      render(React.createElement(mod.default));

      await waitFor(() => {
        assert.ok(screen.getByText('活动执行概览'));
        assert.ok(screen.getByText('48 次'));
        assert.ok(screen.getByText('36 次'));
        assert.ok(screen.getByText('75.0%'));
        assert.ok(screen.getByText('12 次'));
      });

      assert.strictEqual(fetchCalls[0]?.input, '/api/analytics/snapshot?scope=TENANT');
      assert.strictEqual(
        new Headers(fetchCalls[0]?.headers).get('x-tenant-id'),
        'demo-tenant',
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
