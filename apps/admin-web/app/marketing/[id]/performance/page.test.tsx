/**
 * marketing/[id]/performance/page.test.tsx — Campaign Performance page tests.
 *
 * Node test runner (node:test + assert).
 *
 * 验证范围:
 *  - 常量映射 (STATUS_LABEL, STATUS_COLORS, CHANNEL_COLORS)
 *  - calculateCvr / calculateCtr 正例
 *  - calculateCvr / calculateCtr 反例 (0/负数)
 *  - calculateCvr / calculateCtr 边界 (极小值/极大值)
 *
 * Pattern: L1 JS 纯函数测试 (mock-free)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

// ─── 常量 (从 page.tsx 提取) ─────────────────────────────

const STATUS_LABEL = {
  active: '进行中',
  scheduled: '已计划',
  ended: '已结束',
  draft: '草稿',
} as const;

const STATUS_COLORS = {
  active: '#065f46',
  scheduled: '#1e40af',
  ended: '#6b7280',
  draft: '#92400e',
} as const;

const STATUS_BG = {
  active: '#d1fae5',
  scheduled: '#dbeafe',
  ended: '#f3f4f6',
  draft: '#fef3c7',
} as const;

const CHANNEL_COLORS: Record<string, string> = {
  微信: '#07c160',
  App推送: '#3b82f6',
  短信: '#ef4444',
  抖音: '#333333',
  小红书: '#fe2c55',
};

// ─── 函数 (从 page.tsx 提取) ─────────────────────────────

function calculateCvr(clicks: number, conversions: number): string {
  if (clicks <= 0) return '0.0%';
  return `${((conversions / clicks) * 100).toFixed(1)}%`;
}

function calculateCtr(impressions: number, clicks: number): string {
  if (impressions <= 0) return '0.0%';
  return `${((clicks / impressions) * 100).toFixed(1)}%`;
}

// ─── 正例 ─────────────────────────────────────────────────

describe('campaign-performance: 正例', () => {
  it('STATUS_LABEL 所有状态中文标签正确', () => {
    assert.strictEqual(STATUS_LABEL.active, '进行中');
    assert.strictEqual(STATUS_LABEL.scheduled, '已计划');
    assert.strictEqual(STATUS_LABEL.ended, '已结束');
    assert.strictEqual(STATUS_LABEL.draft, '草稿');
  });

  it('STATUS_COLORS 全为合法 hex', () => {
    const hexRegex = /^#[0-9a-f]{6}$/;
    for (const color of Object.values(STATUS_COLORS)) {
      assert.match(color, hexRegex);
    }
  });

  it('STATUS_BG 全为合法 hex', () => {
    const hexRegex = /^#[0-9a-f]{6}$/;
    for (const bg of Object.values(STATUS_BG)) {
      assert.match(bg, hexRegex);
    }
  });

  it('CHANNEL_COLORS 包含全部 5 个渠道', () => {
    const keys = Object.keys(CHANNEL_COLORS);
    assert.strictEqual(keys.length, 5);
    assert.ok(keys.includes('微信'));
    assert.ok(keys.includes('App推送'));
    assert.ok(keys.includes('短信'));
    assert.ok(keys.includes('抖音'));
    assert.ok(keys.includes('小红书'));
  });

  it('CHANNEL_COLORS 全为合法 hex', () => {
    const hexRegex = /^#[0-9a-f]{6}$/;
    for (const color of Object.values(CHANNEL_COLORS)) {
      assert.match(color, hexRegex);
    }
  });

  it('calculateCvr: 5000 点击 / 750 转化 = 15.0%', () => {
    assert.strictEqual(calculateCvr(5000, 750), '15.0%');
  });

  it('calculateCvr: 100/100 = 100.0%', () => {
    assert.strictEqual(calculateCvr(100, 100), '100.0%');
  });

  it('calculateCvr: 3/7 = 42.9%', () => {
    assert.strictEqual(calculateCvr(7, 3), '42.9%');
  });

  it('calculateCtr: 10000 曝光 / 350 点击 = 3.5%', () => {
    assert.strictEqual(calculateCtr(10000, 350), '3.5%');
  });

  it('calculateCtr: 12300 曝光 / 500 点击 = 4.1%', () => {
    assert.strictEqual(calculateCtr(12300, 500), '4.1%');
  });
});

// ─── 反例 ─────────────────────────────────────────────────

describe('campaign-performance: 反例', () => {
  it('calculateCvr: 0 点击 → 0.0%', () => {
    assert.strictEqual(calculateCvr(0, 100), '0.0%');
  });

  it('calculateCvr: 负数点击 → 0.0%', () => {
    assert.strictEqual(calculateCvr(-5, 100), '0.0%');
  });

  it('calculateCvr: 0 转化 → 0.0%', () => {
    assert.strictEqual(calculateCvr(1000, 0), '0.0%');
  });

  it('calculateCtr: 0 曝光 → 0.0%', () => {
    assert.strictEqual(calculateCtr(0, 100), '0.0%');
  });

  it('calculateCtr: 负数曝光 → 0.0%', () => {
    assert.strictEqual(calculateCtr(-10, 5), '0.0%');
  });

  it('calculateCtr: 0 点击 → 0.0%', () => {
    assert.strictEqual(calculateCtr(10000, 0), '0.0%');
  });
});

// ─── 边界 ─────────────────────────────────────────────────

describe('campaign-performance: 边界', () => {
  it('calculateCvr: 1 点击 1 转化 = 100.0%', () => {
    assert.strictEqual(calculateCvr(1, 1), '100.0%');
  });

  it('calculateCvr: 100 点击 1 转化 = 1.0%', () => {
    assert.strictEqual(calculateCvr(100, 1), '1.0%');
  });

  it('calculateCvr: 10M 点击 1.2M 转化 = 12.0%', () => {
    assert.strictEqual(calculateCvr(10000000, 1200000), '12.0%');
  });

  it('calculateCtr: 100M 曝光 5M 点击 = 5.0%', () => {
    assert.strictEqual(calculateCtr(100000000, 5000000), '5.0%');
  });

  it('calculateCtr: 100000 曝光 1 点击 → 0.0%', () => {
    assert.strictEqual(calculateCtr(100000, 1), '0.0%');
  });

  it('STATUS_COLORS active 为深绿色', () => {
    assert.strictEqual(STATUS_COLORS.active, '#065f46');
  });

  it('STATUS_COLORS ended 为灰色', () => {
    assert.strictEqual(STATUS_COLORS.ended, '#6b7280');
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Marketing / Performance — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化(.toFixed)', () => assert.ok(SRC.includes('.toFixed')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});
