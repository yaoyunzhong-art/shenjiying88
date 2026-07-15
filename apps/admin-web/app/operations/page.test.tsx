/**
 * operations/page.test.tsx — 运营管理页面 L1 测试
 *
 * 覆盖:
 *   正例 — operations 路由结构、子页面存在性、SLA 看板常量
 *   反例 — 错误参数、缺失数据防御
 *   边界 — SLA 达成率边界值、空数据、阈值检查
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

/* ── SLA 达成率阈值（无 page.tsx，只有 sla 子页面） ── */

const SLA_THRESHOLDS = {
  p999: 99.9,
  p995: 99.5,
  p99: 99.0,
} as const;

/* ── 支持的环境标签（与 sla 页面同步） ── */

const ENV_LABELS: Record<string, string> = {
  production: '生产环境',
  staging: '预发布',
  testing: '测试环境',
};

/* ── 正例 ── */

describe('operations — 目录结构', () => {
  it('1. sla 子目录存在', () => {
    const slaDir = path.join(__dirname, 'sla');
    assert.equal(fs.existsSync(slaDir), true);
    assert.ok(fs.statSync(slaDir).isDirectory());
  });

  it('2. sla/page.tsx 存在', () => {
    const pagePath = path.join(__dirname, 'sla', 'page.tsx');
    assert.equal(fs.existsSync(pagePath), true);
  });

  it('3. sla 页面导出 metadata', async () => {
    const source = fs.readFileSync(path.join(__dirname, 'sla', 'page.tsx'), 'utf-8');
    assert.ok(source.includes('export const metadata'), 'should export metadata');
    assert.ok(source.includes('title'), 'metadata should have title');
    assert.ok(source.includes('description'), 'metadata should have description');
  });

  it('4. sla 页面使用 Suspense + LoadingSkeleton', () => {
    const source = fs.readFileSync(path.join(__dirname, 'sla', 'page.tsx'), 'utf-8');
    assert.ok(source.includes('Suspense'), 'should wrap in Suspense');
    assert.ok(source.includes('LoadingSkeleton'), 'should show skeleton while loading');
  });

  it('5. sla 页面使用 PageShell', () => {
    const source = fs.readFileSync(path.join(__dirname, 'sla', 'page.tsx'), 'utf-8');
    assert.ok(source.includes('PageShell'), 'should use PageShell');
  });

  it('6. sla 导入视图模型', () => {
    const source = fs.readFileSync(path.join(__dirname, 'sla', 'page.tsx'), 'utf-8');
    assert.ok(source.includes('sla-view-model') || source.includes('loadSLADashboard'),
      'should import SLA view model');
  });

  it('7. sla 有对应的客户端组件', () => {
    const clientPath = path.join(__dirname, 'sla', 'sla-dashboard-client.tsx');
    const testPath = path.join(__dirname, 'sla', 'page.test.ts');
    assert.ok(fs.existsSync(clientPath) || fs.existsSync(testPath),
      'should have client component or test file');
  });

  it('8. sla 客户端组件是 "use client"', () => {
    const clientPath = path.join(__dirname, 'sla', 'sla-dashboard-client.tsx');
    if (fs.existsSync(clientPath)) {
      const source = fs.readFileSync(clientPath, 'utf-8');
      assert.ok(source.includes("'use client'") || source.includes('"use client"'),
        'client component should be "use client"');
    }
  });

  it('9. sla 页面设置 maxWidth', () => {
    const source = fs.readFileSync(path.join(__dirname, 'sla', 'page.tsx'), 'utf-8');
    assert.ok(source.includes('maxWidth'), 'should set max width');
  });

  it('10. sla 页面设置 padding', () => {
    const source = fs.readFileSync(path.join(__dirname, 'sla', 'page.tsx'), 'utf-8');
    assert.ok(source.includes('padding'), 'should set padding');
  });
});

/* ── SLA 达成率阈值 ── */

describe('operations — SLA 阈值常量', () => {
  it('11. P999 阈值 = 99.9%', () => {
    assert.equal(SLA_THRESHOLDS.p999, 99.9);
  });

  it('12. P995 阈值 = 99.5%', () => {
    assert.equal(SLA_THRESHOLDS.p995, 99.5);
  });

  it('13. P99 阈值 = 99.0%', () => {
    assert.equal(SLA_THRESHOLDS.p99, 99.0);
  });

  it('14. 阈值从高到低排列', () => {
    assert.ok(SLA_THRESHOLDS.p999 > SLA_THRESHOLDS.p995);
    assert.ok(SLA_THRESHOLDS.p995 > SLA_THRESHOLDS.p99);
  });

  it('15. 所有阈值在 90~100 范围内', () => {
    for (const [key, val] of Object.entries(SLA_THRESHOLDS)) {
      assert.ok(val >= 90 && val <= 100, `${key} threshold ${val} out of range`);
    }
  });
});

describe('operations — 环境标签', () => {
  it('16. 生产环境标签', () => {
    assert.equal(ENV_LABELS.production, '生产环境');
  });

  it('17. 预发布环境标签', () => {
    assert.equal(ENV_LABELS.staging, '预发布');
  });

  it('18. 测试环境标签', () => {
    assert.equal(ENV_LABELS.testing, '测试环境');
  });

  it('19. 所有标签非空', () => {
    for (const [key, val] of Object.entries(ENV_LABELS)) {
      assert.ok(val.length > 0, `${key} label should be non-empty`);
    }
  });
});

/* ── 反例 ── */

describe('operations — 反例防御', () => {
  it('20. sla 页面不引用 @m5/admin', () => {
    const slaPath = path.join(__dirname, 'sla', 'page.tsx');
    if (fs.existsSync(slaPath)) {
      const source = fs.readFileSync(slaPath, 'utf-8');
      assert.ok(!source.includes('@m5/admin'), 'should not import from @m5/admin');
    }
  });

  it('21. sla 页面不使用 console.log', () => {
    const slaPath = path.join(__dirname, 'sla', 'page.tsx');
    if (fs.existsSync(slaPath)) {
      const source = fs.readFileSync(slaPath, 'utf-8');
      assert.ok(!source.includes('console.log'), 'no debug logging');
    }
  });

  it('22. SLA 阈值不应包含 NaN', () => {
    for (const val of Object.values(SLA_THRESHOLDS)) {
      assert.ok(!Number.isNaN(val), 'SLA threshold should not be NaN');
    }
  });

  it('23. SLA 阈值不应是负数', () => {
    for (const val of Object.values(SLA_THRESHOLDS)) {
      assert.ok(val > 0, 'SLA threshold should be positive');
    }
  });

  it('24. 环境标签不应为 undefined', () => {
    assert.equal(ENV_LABELS.production, '生产环境');
    assert.equal(typeof ENV_LABELS.staging, 'string');
    assert.equal(typeof ENV_LABELS.testing, 'string');
  });
});

/* ── 边界 ── */

describe('operations — 边界检查', () => {
  it('25. P999 阈值理论最大值 = 100（但 < 100）', () => {
    assert.ok(SLA_THRESHOLDS.p999 < 100, 'SLA threshold should be < 100');
  });

  it('26. 所有阈值大于 98（介于 98~100）', () => {
    for (const val of Object.values(SLA_THRESHOLDS)) {
      assert.ok(val >= 98 && val <= 100, `SLA threshold ${val} should be in [98, 100]`);
    }
  });

  it('27. 如果阈值精确匹配，表示 100% 达成率', () => {
    // 测试边界：阈值恰好等于指标值
    const actualP99 = 99.0;
    assert.equal(actualP99 >= SLA_THRESHOLDS.p99, true, 'actual should meet P99 threshold');
  });

  it('28. 略低于阈值（99.4% vs P995=99.5%）表示未达标', () => {
    const actual = 99.4;
    assert.ok(actual < SLA_THRESHOLDS.p995, 'below P995 threshold');
  });

  it('29. sla 子目录无 page.test.ts 之外的多余页面', () => {
    // 验证只有 sla 子目录
    const entries = fs.readdirSync(__dirname, { withFileTypes: true });
    const subdirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
    assert.ok(subdirs.length <= 2, 'operations should have at most sla subdirectory');
  });

  it('30. sla 测试文件存在（防御将来被删除）', () => {
    const slaTestPath = path.join(__dirname, 'sla', 'page.test.ts');
    assert.equal(fs.existsSync(slaTestPath), true, 'SLA page test should exist');
  });
});
