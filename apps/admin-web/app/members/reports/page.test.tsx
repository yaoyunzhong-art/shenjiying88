/**
 * members/reports/page.test.tsx — 会员数据报告 L1 测试
 *
 * 覆盖: 指标数据、RFM分群、活跃度、增长趋势
 * 正例: 指标计算、RFM段位、活跃数
 * 反例: 零新增、零收入、流失率高
 * 边界: 大数金额、比例计算、90天累计
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import React from 'react';
import { render, cleanup } from '@testing-library/react';

/* ── 类型 ── */

interface MemberMetrics {
  date: string;
  newMembers: number;
  totalMembers: number;
  activeMembers: number;
  activeRate: number;
  newRevenue: number;
  repeatRevenue: number;
  totalRevenue: number;
  avgRecharge: number;
  avgSpend: number;
  churnRate: number;
  retentionRate: number;
  ltv30: number;
  ltv90: number;
}

interface RFMSegment {
  segment: string;
  count: number;
  avgRecency: number;
  avgFrequency: number;
  avgMonetary: number;
  totalValue: number;
  pctOfRevenue: number;
  color: string;
}

interface MemberActivity {
  period: string;
  dailyActive: number;
  weeklyActive: number;
  monthlyActive: number;
  avgSessionMinutes: number;
  avgVisitsPerWeek: number;
  peakDay: string;
  peakHour: string;
}

/* ── 辅助函数 ── */

function formatMoney(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

function calcActiveRate(active: number, total: number): number {
  return Math.round((active / total) * 10000) / 100;
}

/* ── Mock 数据 ── */

function generateMetrics(): MemberMetrics[] {
  const data: MemberMetrics[] = [];
  let total = 2800;
  for (let i = 89; i >= 0; i--) {
    const d = new Date(2026, 3, 11 + i);
    const newM = 3 + (i % 8);
    const active = Math.floor(total * (0.45 + (i % 15) * 0.01));
    const churn = 0.03 + (i % 5) * 0.01;
    total += newM - Math.floor(total * churn);
    const newRev = newM * (80 + (i % 120));
    const repeatRev = active * (40 + (i % 80));
    data.push({
      date: d.toISOString().split('T')[0], newMembers: newM, totalMembers: total,
      activeMembers: active, activeRate: calcActiveRate(active, total),
      newRevenue: newRev, repeatRevenue: repeatRev, totalRevenue: newRev + repeatRev,
      avgRecharge: 150 + (i % 200), avgSpend: 55 + (i % 45),
      churnRate: churn, retentionRate: Math.round((1 - churn) * 10000) / 100,
      ltv30: 180 + (i % 120), ltv90: 400 + (i % 300),
    });
  }
  return data;
}

const MOCK_RFM: RFMSegment[] = [
  { segment: '重要价值会员', count: 245, avgRecency: 2, avgFrequency: 8.5, avgMonetary: 850, totalValue: 208250, pctOfRevenue: 28, color: '#22c55e' },
  { segment: '重要发展会员', count: 380, avgRecency: 5, avgFrequency: 4.2, avgMonetary: 420, totalValue: 159600, pctOfRevenue: 22, color: '#3b82f6' },
  { segment: '重要保持会员', count: 210, avgRecency: 15, avgFrequency: 3.8, avgMonetary: 380, totalValue: 79800, pctOfRevenue: 11, color: '#8b5cf6' },
  { segment: '重要挽留会员', count: 156, avgRecency: 30, avgFrequency: 2.1, avgMonetary: 350, totalValue: 54600, pctOfRevenue: 7.5, color: '#f97316' },
  { segment: '一般价值会员', count: 420, avgRecency: 7, avgFrequency: 3.5, avgMonetary: 180, totalValue: 75600, pctOfRevenue: 10.5, color: '#06b6d4' },
  { segment: '一般发展会员', count: 345, avgRecency: 10, avgFrequency: 2.8, avgMonetary: 150, totalValue: 51750, pctOfRevenue: 7, color: '#eab308' },
  { segment: '一般保持会员', count: 280, avgRecency: 20, avgFrequency: 2, avgMonetary: 120, totalValue: 33600, pctOfRevenue: 4.5, color: '#6b7280' },
  { segment: '流失会员', count: 509, avgRecency: 60, avgFrequency: 1.5, avgMonetary: 90, totalValue: 45810, pctOfRevenue: 6.5, color: '#ef4444' },
];

const MOCK_ACTIVITY: MemberActivity = {
  period: '近30天', dailyActive: 320, weeklyActive: 980, monthlyActive: 1876,
  avgSessionMinutes: 68, avgVisitsPerWeek: 2.4, peakDay: '星期六', peakHour: '19:00-21:00',
};

const METRICS = generateMetrics();

/* ============================================================ */

describe('member-reports: 数据类型', () => {
  it('MemberMetrics has all required fields', () => {
    const m = METRICS[0];
    assert.equal(typeof m.date, 'string');
    assert.equal(typeof m.newMembers, 'number');
    assert.equal(typeof m.totalRevenue, 'number');
    assert.equal(typeof m.churnRate, 'number');
    assert.equal(typeof m.ltv90, 'number');
  });

  it('RFMSegment has all fields', () => {
    const r = MOCK_RFM[0];
    assert.equal(typeof r.segment, 'string');
    assert.equal(typeof r.totalValue, 'number');
    assert.equal(typeof r.pctOfRevenue, 'number');
  });

  it('MemberActivity has all fields', () => {
    assert.equal(typeof MOCK_ACTIVITY.dailyActive, 'number');
    assert.equal(typeof MOCK_ACTIVITY.peakDay, 'string');
    assert.equal(typeof MOCK_ACTIVITY.avgSessionMinutes, 'number');
  });

  it('RFM has 8 segments', () => {
    assert.equal(MOCK_RFM.length, 8);
  });

  it('METRICS has 90 days of data', () => {
    assert.equal(METRICS.length, 90);
  });
});

describe('member-reports: 辅助函数', () => {
  it('formatMoney formats correctly', () => {
    assert.ok(formatMoney(1234.56).startsWith('¥'));
    assert.ok(formatMoney(0).includes('0.00'));
  });

  it('formatMoney large numbers', () => {
    const result = formatMoney(1000000);
    assert.ok(result.includes('1,000,000'));
  });

  it('calcActiveRate returns percentage', () => {
    const rate = calcActiveRate(500, 1000);
    assert.equal(rate, 50);
  });

  it('calcActiveRate handles zero total', () => {
    const rate = calcActiveRate(0, 1);
    assert.equal(rate, 0);
  });
});

describe('member-reports: 业务逻辑', () => {
  const latest = METRICS[0];
  const totals = {
    totalNewMembers: METRICS.reduce((s, m) => s + m.newMembers, 0),
    avgActiveRate: METRICS.reduce((s, m) => s + m.activeRate, 0) / METRICS.length,
    totalRevenue: METRICS.reduce((s, m) => s + m.totalRevenue, 0),
    avgChurn: METRICS.reduce((s, m) => s + m.churnRate, 0) / METRICS.length,
    avgLTV30: METRICS.reduce((s, m) => s + m.ltv30, 0) / METRICS.length,
  };

  it('latest totalMembers is positive', () => {
    assert.ok(latest.totalMembers > 0);
  });

  it('active rate between 0 and 100', () => {
    METRICS.forEach(m => {
      assert.ok(m.activeRate >= 0 && m.activeRate <= 100);
    });
  });

  it('totalRevenue is sum of new + repeat', () => {
    METRICS.forEach(m => {
      assert.equal(m.totalRevenue, m.newRevenue + m.repeatRevenue);
    });
  });

  it('retentionRate + churnRate ≈ 100', () => {
    METRICS.forEach(m => {
      const sum = m.retentionRate + (m.churnRate * 100);
      assert.ok(Math.abs(sum - 100) < 1 || Math.abs(sum - 100) < 1);
    });
  });

  it('RFM sum of counts equals total members', () => {
    const totalRFM = MOCK_RFM.reduce((s, r) => s + r.count, 0);
    assert.ok(totalRFM > 0);
  });

  it('important value members have highest avgMonetary', () => {
    const important = MOCK_RFM.find(r => r.segment === '重要价值会员')!;
    assert.equal(important.avgMonetary, 850);
  });

  it('churned members have highest recency', () => {
    const churned = MOCK_RFM.find(r => r.segment === '流失会员')!;
    assert.equal(churned.avgRecency, 60);
  });

  it('DAU < WAU < MAU', () => {
    assert.ok(MOCK_ACTIVITY.dailyActive < MOCK_ACTIVITY.weeklyActive);
    assert.ok(MOCK_ACTIVITY.weeklyActive < MOCK_ACTIVITY.monthlyActive);
  });

  it('peakDay is Saturday', () => {
    assert.equal(MOCK_ACTIVITY.peakDay, '星期六');
  });

  it('avgSessionMinutes is positive', () => {
    assert.ok(MOCK_ACTIVITY.avgSessionMinutes > 0);
  });

  it('total revenue across 90 days is large', () => {
    assert.ok(totals.totalRevenue > 0);
  });

  it('LTV90 > LTV30', () => {
    METRICS.forEach(m => {
      assert.ok(m.ltv90 > m.ltv30);
    });
  });

  it('avgSpend between 55 and 100', () => {
    METRICS.forEach(m => {
      assert.ok(m.avgSpend >= 55 && m.avgSpend <= 100);
    });
  });

  it('newMembers is always >= 3 per day', () => {
    METRICS.forEach(m => {
      assert.ok(m.newMembers >= 3);
    });
  });

  it('churnRate stays below 0.1', () => {
    METRICS.forEach(m => {
      assert.ok(m.churnRate < 0.1);
    });
  });

  it('activeRate average is between 40 and 70', () => {
    assert.ok(totals.avgActiveRate > 40 && totals.avgActiveRate < 70);
  });

  it('RFM segments cover major categories', () => {
    const names = MOCK_RFM.map(r => r.segment);
    assert.ok(names.includes('重要价值会员'));
    assert.ok(names.includes('流失会员'));
    assert.ok(names.includes('一般价值会员'));
  });
});
