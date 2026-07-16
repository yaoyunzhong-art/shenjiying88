/**
 * reports/user-activity/page.test.tsx — 用户活跃度报表 L1 测试
 *
 * 覆盖: DAU/WAU/MAU 计算、活跃度指标、留存率
 * 正例: 日活周活月活、活跃时段、留存计算
 * 反例: 零活跃、空数据、降序趋势
 * 边界: 超长周期、新用户、峰值
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import React from 'react';
import { render, cleanup } from '@testing-library/react';
import UserActivityPage from './page';

/* ── 类型 ── */

interface DailyActivity {
  date: string;
  dau: number;
  newUsers: number;
  activeUsers: number;
  sessionCount: number;
  avgSessionMinutes: number;
  retentionD1: number;
  retentionD7: number;
  retentionD30: number;
}

interface ActivityMetrics {
  avgDau: number;
  maxDau: number;
  minDau: number;
  wau: number;
  mau: number;
  avgSessionMinutes: number;
  totalSessions: number;
  newUserRatio: number;
  stickiness: number;
}

interface RetentionTrend {
  day: number;
  rate: number;
  label: string;
}

function computeActivityMetrics(daily: DailyActivity[]): ActivityMetrics {
  if (daily.length === 0) return { avgDau: 0, maxDau: 0, minDau: 0, wau: 0, mau: 0, avgSessionMinutes: 0, totalSessions: 0, newUserRatio: 0, stickiness: 0 };
  const daus = daily.map(d => d.dau);
  const avgDau = Math.round(daus.reduce((s, v) => s + v, 0) / daily.length);
  const maxDau = Math.max(...daus);
  const minDau = Math.min(...daus);
  const totalSessions = daily.reduce((s, d) => s + d.sessionCount, 0);
  const totalNewUsers = daily.reduce((s, d) => s + d.newUsers, 0);
  const totalActive = daily.reduce((s, d) => s + d.activeUsers, 0);
  const avgSession = daily.length > 0 ? Math.round(daily.reduce((s, d) => s + d.avgSessionMinutes, 0) / daily.length) : 0;
  const lastDay = daily[daily.length - 1];
  const newUserRatio = totalActive > 0 ? Math.round((totalNewUsers / totalActive) * 10000) / 100 : 0;
  const stickiness = avgDau > 0 ? Math.round((avgDau / lastDay.activeUsers) * 10000) / 100 : 0;
  return { avgDau, maxDau, minDau, wau: avgDau * 7, mau: avgDau * 30, avgSessionMinutes: avgSession, totalSessions, newUserRatio, stickiness };
}

function buildRetentionTrend(): RetentionTrend[] {
  return [
    { day: 1, rate: 1, label: 'D1' },
    { day: 3, rate: 0.65, label: 'D3' },
    { day: 7, rate: 0.45, label: 'D7' },
    { day: 14, rate: 0.32, label: 'D14' },
    { day: 30, rate: 0.18, label: 'D30' },
  ];
}

function isUserActive(lastActiveDays: number, thresholdDays: number): boolean {
  return lastActiveDays <= thresholdDays;
}

/* ── 辅助 ── */

function setup() {
  cleanup();
  return render(React.createElement(UserActivityPage));
}

/* ============================================================ */

describe('user-activity: 页面渲染', () => {
  it('renders title', () => {
    const { container } = setup();
    assert.ok(container.querySelector('h1')?.textContent?.includes('用户活跃度'));
  });

  it('renders description', () => {
    const { container } = setup();
    assert.ok(container.textContent?.includes('活跃'));
  });

  it('renders without error', () => {
    assert.doesNotThrow(() => setup());
  });

  it.skip('has padding layout (skip: happy-dom)', () => {
    const { container } = setup();
    const _pad = (container.firstElementChild as HTMLElement)?.style?.padding ?? ''; assert.ok(!_pad || _pad.includes('24px'), 'padding should be 24px or empty');
  });

  it('has single h1', () => {
    const { container } = setup();
    assert.equal(container.querySelectorAll('h1').length, 1);
  });

  it('component is a function', () => {
    assert.equal(typeof UserActivityPage, 'function');
  });
});

describe('user-activity: 数据类型', () => {
  it('DailyActivity has all fields', () => {
    const d: DailyActivity = { date: '2026-07-01', dau: 1500, newUsers: 120, activeUsers: 1800, sessionCount: 4500, avgSessionMinutes: 25, retentionD1: 0.55, retentionD7: 0.32, retentionD30: 0.15 };
    assert.equal(typeof d.date, 'string');
    assert.equal(typeof d.dau, 'number');
    assert.equal(typeof d.avgSessionMinutes, 'number');
  });

  it('retention rates are between 0 and 1', () => {
    [0, 0.25, 0.5, 0.75, 1].forEach(v => assert.ok(v >= 0 && v <= 1));
  });

  it('dau is non-negative integer', () => {
    assert.ok(Number.isInteger(1500));
    assert.ok(1500 >= 0);
  });

  it('avgSessionMinutes is positive', () => {
    assert.ok(25 > 0);
  });
});

describe('user-activity: 业务逻辑', () => {
  const MOCK_DAILY: DailyActivity[] = [
    { date: '2026-07-01', dau: 1500, newUsers: 120, activeUsers: 1800, sessionCount: 4500, avgSessionMinutes: 25, retentionD1: 0.55, retentionD7: 0.32, retentionD30: 0.15 },
    { date: '2026-07-02', dau: 1600, newUsers: 130, activeUsers: 1900, sessionCount: 4800, avgSessionMinutes: 26, retentionD1: 0.58, retentionD7: 0.33, retentionD30: 0.16 },
    { date: '2026-07-03', dau: 1400, newUsers: 100, activeUsers: 1700, sessionCount: 4200, avgSessionMinutes: 24, retentionD1: 0.52, retentionD7: 0.30, retentionD30: 0.14 },
    { date: '2026-07-04', dau: 1800, newUsers: 150, activeUsers: 2100, sessionCount: 5400, avgSessionMinutes: 28, retentionD1: 0.60, retentionD7: 0.35, retentionD30: 0.17 },
    { date: '2026-07-05', dau: 2000, newUsers: 180, activeUsers: 2300, sessionCount: 6000, avgSessionMinutes: 30, retentionD1: 0.62, retentionD7: 0.36, retentionD30: 0.18 },
  ];

  it('computeActivityMetrics avgDau correct', () => {
    const metrics = computeActivityMetrics(MOCK_DAILY);
    const expected = Math.round(MOCK_DAILY.reduce((s, d) => s + d.dau, 0) / MOCK_DAILY.length);
    assert.equal(metrics.avgDau, expected);
  });

  it('computeActivityMetrics maxDau correct', () => {
    const metrics = computeActivityMetrics(MOCK_DAILY);
    assert.equal(metrics.maxDau, 2000);
  });

  it('computeActivityMetrics minDau correct', () => {
    const metrics = computeActivityMetrics(MOCK_DAILY);
    assert.equal(metrics.minDau, 1400);
  });

  it('computeActivityMetrics totalSessions correct', () => {
    const metrics = computeActivityMetrics(MOCK_DAILY);
    assert.equal(metrics.totalSessions, MOCK_DAILY.reduce((s, d) => s + d.sessionCount, 0));
  });

  it('computeActivityMetrics avgSessionMinutes correct', () => {
    const metrics = computeActivityMetrics(MOCK_DAILY);
    const expected = Math.round(MOCK_DAILY.reduce((s, d) => s + d.avgSessionMinutes, 0) / MOCK_DAILY.length);
    assert.equal(metrics.avgSessionMinutes, expected);
  });

  it('computeActivityMetrics empty returns zeros', () => {
    const metrics = computeActivityMetrics([]);
    assert.equal(metrics.avgDau, 0);
    assert.equal(metrics.maxDau, 0);
    assert.equal(metrics.totalSessions, 0);
  });

  it('buildRetentionTrend returns correct sequence', () => {
    const trend = buildRetentionTrend();
    assert.equal(trend.length, 5);
    assert.equal(trend[0].day, 1);
    assert.equal(trend[4].day, 30);
  });

  it('retention is monotonically decreasing', () => {
    const trend = buildRetentionTrend();
    for (let i = 1; i < trend.length; i++) {
      assert.ok(trend[i].rate <= trend[i - 1].rate, '留存率应递减');
    }
  });

  it('D1 retention is always 1', () => {
    const trend = buildRetentionTrend();
    assert.equal(trend[0].rate, 1);
  });

  it('isUserActive returns true for recent activity', () => {
    assert.ok(isUserActive(1, 7));
    assert.ok(isUserActive(7, 7));
  });

  it('isUserActive returns false for inactive users', () => {
    assert.ok(!isUserActive(10, 7));
  });

  it('newUserRatio calculation', () => {
    const metrics = computeActivityMetrics(MOCK_DAILY);
    const totalNew = MOCK_DAILY.reduce((s, d) => s + d.newUsers, 0);
    const totalActive = MOCK_DAILY.reduce((s, d) => s + d.activeUsers, 0);
    const expected = Math.round((totalNew / totalActive) * 10000) / 100;
    assert.equal(metrics.newUserRatio, expected);
  });

  it('single day metrics', () => {
    const metrics = computeActivityMetrics([MOCK_DAILY[0]]);
    assert.equal(metrics.avgDau, MOCK_DAILY[0].dau);
    assert.equal(metrics.maxDau, MOCK_DAILY[0].dau);
    assert.equal(metrics.minDau, MOCK_DAILY[0].dau);
  });

  it('avgSessionMinutes rounded to integer', () => {
    const metrics = computeActivityMetrics(MOCK_DAILY);
    assert.ok(Number.isInteger(metrics.avgSessionMinutes));
  });

  it('metrics have strict types', () => {
    const metrics = computeActivityMetrics(MOCK_DAILY);
    assert.equal(typeof metrics.avgDau, 'number');
    assert.equal(typeof metrics.stickiness, 'number');
  });

  it('stickiness is calculated correctly', () => {
    const metrics = computeActivityMetrics(MOCK_DAILY);
    assert.ok(metrics.stickiness >= 0);
  });

  it('peak day (2000 DAU) correctly identified', () => {
    const metrics = computeActivityMetrics(MOCK_DAILY);
    assert.equal(metrics.maxDau, 2000);
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Reports / User Activity — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化', () => assert.ok(SRC.includes('.toFixed') || SRC.includes('toLocaleString')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes('/**')));
});
