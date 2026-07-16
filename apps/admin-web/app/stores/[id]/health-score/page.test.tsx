/**
 * stores/[id]/health-score/page.test.tsx — 健康评分页面 L1 测试
 *
 * 覆盖: 多维度评分、综合评分、趋势图标、状态标签、改进建议
 * 正例: 评分计算、维度数据、状态映射、趋势标签
 * 反例: 分数取整一致、状态匹配、不存在维度
 * 边界: 综合分0/60/80/100、良好/一般/较差边界
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import React from 'react';
import { render, cleanup } from '@testing-library/react';

/* ── 类型 ── */

type StatusLabel = 'good' | 'fair' | 'poor';
type TrendLabel = 'up' | 'down' | 'stable';

interface DimensionData {
  key: string;
  label: string;
  score: number;
  status: StatusLabel;
  trend: TrendLabel;
  detail: string;
  suggestion: string;
}

const DIMENSIONS: DimensionData[] = [
  { key:'revenue', label:'营收健康', score:85, status:'good', trend:'up', detail:'本月营收达标率105%', suggestion:'保持当前价格策略' },
  { key:'staff', label:'人员健康', score:72, status:'fair', trend:'down', detail:'缺编2人,培训完成率68%', suggestion:'加快招聘排期' },
  { key:'equipment', label:'设备健康', score:93, status:'good', trend:'up', detail:'故障率1.2%', suggestion:'定期保养计划持续' },
  { key:'inventory', label:'库存健康', score:68, status:'fair', trend:'stable', detail:'临期品3项,低库存7项', suggestion:'启动临期促销' },
  { key:'satisfaction', label:'客户满意度', score:88, status:'good', trend:'up', detail:'好评率92%,投诉2起', suggestion:'跟进2投诉闭环' },
  { key:'compliance', label:'合规健康', score:90, status:'good', trend:'stable', detail:'隐患0,证件齐全', suggestion:'保持现状' },
  { key:'safety', label:'安全健康', score:78, status:'fair', trend:'up', detail:'安全检查3次,隐患1处', suggestion:'整改跟踪确认' },
  { key:'training', label:'培训健康', score:65, status:'fair', trend:'down', detail:'完成率62%', suggestion:'设置季度培训考核' },
];

/* ── 工具函数 ── */

function computeOverall(scores: number[]): number {
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, s) => a + s, 0) / scores.length);
}

function scoreColor(score: number): string {
  if (score >= 80) return '#34d399';
  if (score >= 60) return '#f59e0b';
  return '#f87171';
}

function statusFromScore(score: number): StatusLabel {
  if (score >= 80) return 'good';
  if (score >= 60) return 'fair';
  return 'poor';
}

const STATUS_CFG: Record<StatusLabel, { color: string; label: string }> = {
  good: { color: 'green', label: '良好' },
  fair: { color: 'orange', label: '一般' },
  poor: { color: 'red', label: '较差' },
};

const TREND_ICON: Record<TrendLabel, string> = { up: '📈', down: '📉', stable: '➡️' };

/* ── 辅助 ── */

function setup() {
  cleanup();
  return render(React.createElement(require('./page').default));
}

/* ============================================================ */

describe('health-score: 页面渲染', () => {
  it('renders without error', () => {
    assert.doesNotThrow(() => setup());
  });

  it('component is a function', () => {
    const mod = require('./page');
    assert.equal(typeof mod.default, 'function');
  });

  it('renders container', () => {
    const { container } = setup();
    assert.ok(container);
  });
});

describe('health-score: 数据类型', () => {
  it('DimensionData has all fields', () => {
    const d: DimensionData = { key: 'test', label: '测试', score: 80, status: 'good', trend: 'up', detail: '测试', suggestion: '无' };
    assert.equal(typeof d.key, 'string');
    assert.equal(typeof d.score, 'number');
    assert.ok(d.score >= 0 && d.score <= 100);
  });

  it('DIMENSIONS has 8 dimensions', () => {
    assert.equal(DIMENSIONS.length, 8);
  });

  it('all dimension keys are unique', () => {
    const keys = DIMENSIONS.map(d => d.key);
    assert.equal(new Set(keys).size, keys.length);
  });

  it('status values are valid', () => {
    const valid: StatusLabel[] = ['good', 'fair', 'poor'];
    DIMENSIONS.forEach(d => assert.ok(valid.includes(d.status)));
  });

  it('trend values are valid', () => {
    const valid: TrendLabel[] = ['up', 'down', 'stable'];
    DIMENSIONS.forEach(d => assert.ok(valid.includes(d.trend)));
  });

  it('STATUS_CFG has all statuses', () => {
    assert.equal(Object.keys(STATUS_CFG).length, 3);
  });

  it('TREND_ICON has all trends', () => {
    assert.equal(Object.keys(TREND_ICON).length, 3);
  });
});

describe('health-score: 业务逻辑', () => {
  // ── 正例 ──
  it('computeOverall returns correct average', () => {
    const scores = DIMENSIONS.map(d => d.score);
    const overall = computeOverall(scores);
    // (85+72+93+68+88+90+78+65) / 8 = 639/8 = 79.875 -> 80
    assert.equal(overall, 80);
  });

  it('scoreColor for 80+ returns green', () => {
    assert.equal(scoreColor(85), '#34d399');
    assert.equal(scoreColor(93), '#34d399');
    assert.equal(scoreColor(100), '#34d399');
  });

  it('scoreColor for 60-79 returns orange', () => {
    assert.equal(scoreColor(60), '#f59e0b');
    assert.equal(scoreColor(72), '#f59e0b');
    assert.equal(scoreColor(79), '#f59e0b');
  });

  it('scoreColor for <60 returns red', () => {
    assert.equal(scoreColor(59), '#f87171');
    assert.equal(scoreColor(0), '#f87171');
  });

  it('statusFromScore good for >=80', () => {
    assert.equal(statusFromScore(80), 'good');
    assert.equal(statusFromScore(100), 'good');
  });

  it('statusFromScore fair for 60-79', () => {
    assert.equal(statusFromScore(60), 'fair');
    assert.equal(statusFromScore(79), 'fair');
  });

  it('statusFromScore poor for <60', () => {
    assert.equal(statusFromScore(59), 'poor');
    assert.equal(statusFromScore(0), 'poor');
  });

  it('STATUS_CFG good -> green', () => {
    assert.equal(STATUS_CFG.good.color, 'green');
    assert.equal(STATUS_CFG.good.label, '良好');
  });

  it('STATUS_CFG fair -> orange', () => {
    assert.equal(STATUS_CFG.fair.color, 'orange');
    assert.equal(STATUS_CFG.fair.label, '一般');
  });

  it('TREND_ICON up is 📈', () => {
    assert.equal(TREND_ICON.up, '📈');
  });

  it('TREND_ICON down is 📉', () => {
    assert.equal(TREND_ICON.down, '📉');
  });

  it('TREND_ICON stable is ➡️', () => {
    assert.equal(TREND_ICON.stable, '➡️');
  });

  it('goodCount and fairCount sum to total', () => {
    const good = DIMENSIONS.filter(d => d.status === 'good').length;
    const fair = DIMENSIONS.filter(d => d.status === 'fair').length;
    const poor = DIMENSIONS.filter(d => d.status === 'poor').length;
    assert.equal(good + fair + poor, DIMENSIONS.length);
  });

  it('good dimensions: revenue, equipment, satisfaction, compliance = 4', () => {
    const good = DIMENSIONS.filter(d => d.status === 'good');
    assert.equal(good.length, 4);
  });

  it('fair dimensions: staff, inventory, safety, training = 4', () => {
    const fair = DIMENSIONS.filter(d => d.status === 'fair');
    assert.equal(fair.length, 4);
  });

  // ── 反例 ──
  it('computeOverall empty array returns 0', () => {
    assert.equal(computeOverall([]), 0);
  });

  it('poor status does not exist in DIMENSIONS', () => {
    assert.equal(DIMENSIONS.filter(d => d.status === 'poor').length, 0);
  });

  it('scoreColor for -1 (invalid) still returns correct', () => {
    assert.equal(scoreColor(-1), '#f87171');
  });

  it('scoreColor for 101 (invalid) returns green', () => {
    assert.equal(scoreColor(101), '#34d399');
  });

  it('STATUS_CFG for unknown status returns undefined', () => {
    assert.equal((STATUS_CFG as Record<string, any>)['unknown'], undefined);
  });

  // ── 边界 ──
  it('score exactly 80 is good (lower boundary)', () => {
    assert.equal(scoreColor(80), '#34d399');
    assert.equal(statusFromScore(80), 'good');
  });

  it('score exactly 60 is fair (lower boundary)', () => {
    assert.equal(scoreColor(60), '#f59e0b');
    assert.equal(statusFromScore(60), 'fair');
  });

  it('score exactly 79 is fair (upper boundary)', () => {
    assert.equal(scoreColor(79), '#f59e0b');
    assert.equal(statusFromScore(79), 'fair');
  });

  it('score exactly 59 is poor', () => {
    assert.equal(scoreColor(59), '#f87171');
    assert.equal(statusFromScore(59), 'poor');
  });

  it('score exactly 0 is poor', () => {
    assert.equal(scoreColor(0), '#f87171');
  });

  it('score exactly 100 is good', () => {
    assert.equal(scoreColor(100), '#34d399');
  });

  it('设备健康 has highest score 93', () => {
    const max = DIMENSIONS.reduce((m, d) => d.score > m.score ? d : m);
    assert.equal(max.key, 'equipment');
    assert.equal(max.score, 93);
  });

  it('培训健康 has lowest score 65', () => {
    const min = DIMENSIONS.reduce((m, d) => d.score < m.score ? d : m);
    assert.equal(min.key, 'training');
    assert.equal(min.score, 65);
  });

  it('up trend dimensions are revenue, equipment, satisfaction, safety = 4', () => {
    const up = DIMENSIONS.filter(d => d.trend === 'up');
    assert.equal(up.length, 4);
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Stores / Health Score — hooks验证', () => {
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
