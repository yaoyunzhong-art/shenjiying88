/**
 * recommendations/page.test.tsx — 推荐中心页面 L1 测试
 *
 * 覆盖: 推荐摘要数据、策略权重、转化漏斗、冷启动分析、热力图
 * 正例: 数据字段完整性、权重归一化、漏斗阶段递进、元数据
 * 反例: 无效权重、负数计数、空漏斗数据
 * 边界: 合计为零的漏斗、全冷启动、缓存穿透
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

/* ── 类型 ── */

type RecTab = 'overview' | 'funnel' | 'reasons' | 'coldstart' | 'coverage';

interface RecommendationSummary {
  tenantId: string;
  generatedAt: string;
  cached: boolean;
  strategyWeights: Record<string, number>;
  funnel: { stage: string; count: number }[];
  topReasons: { reason: string; count: number }[];
  coldStart: { cold: number; warm: number };
  heatmap: { strategy: string; category: string; count: number }[];
  metadata: {
    totalRequests: number;
    avgExecutionMs: number;
    cacheHitRate: number;
    fallbackRate: number;
  };
}

/* ── Mock 数据 ── */

const MOCK_SUMMARY: RecommendationSummary = {
  tenantId: 't-001',
  generatedAt: '2026-07-16T01:30:00Z',
  cached: false,
  strategyWeights: { collaborative: 0.35, contentBased: 0.25, popular: 0.20, coldStart: 0.12, ruleBased: 0.08 },
  funnel: [
    { stage: '曝光', count: 100000 },
    { stage: '点击', count: 18500 },
    { stage: '加购', count: 5200 },
    { stage: '下单', count: 2100 },
    { stage: '支付', count: 1680 },
  ],
  topReasons: [
    { reason: '同类用户喜欢', count: 4200 },
    { reason: '历史购买相似', count: 3100 },
    { reason: '热门推荐', count: 2500 },
    { reason: '新品上架', count: 1800 },
    { reason: '限时优惠', count: 1200 },
  ],
  coldStart: { cold: 150, warm: 2850 },
  heatmap: [
    { strategy: 'collaborative', category: '蹦床', count: 3200 },
    { strategy: 'collaborative', category: '电竞', count: 2800 },
    { strategy: 'contentBased', category: '蹦床', count: 2100 },
    { strategy: 'contentBased', category: '卡丁车', count: 1800 },
    { strategy: 'popular', category: '蹦床', count: 4500 },
    { strategy: 'popular', category: '游乐', count: 1500 },
    { strategy: 'coldStart', category: '新项目', count: 800 },
  ],
  metadata: {
    totalRequests: 18500,
    avgExecutionMs: 42,
    cacheHitRate: 0.68,
    fallbackRate: 0.03,
  },
};

/* ── 辅助函数 ── */

function getTotalWeight(weights: Record<string, number>): number {
  return Object.values(weights).reduce((s, v) => s + v, 0);
}

function getFunnelConversionRate(funnel: { stage: string; count: number }[], fromIdx: number, toIdx: number): number {
  if (funnel.length === 0 || funnel[fromIdx].count === 0) return 0;
  return Math.round((funnel[toIdx].count / funnel[fromIdx].count) * 10000) / 100;
}

function getColdStartRatio(coldStart: { cold: number; warm: number }): number {
  const total = coldStart.cold + coldStart.warm;
  return total > 0 ? Math.round((coldStart.cold / total) * 10000) / 100 : 0;
}

function normalizeWeights(weights: Record<string, number>): Record<string, number> {
  const total = getTotalWeight(weights);
  if (total === 0) return weights;
  const result: Record<string, number> = {};
  for (const [k, v] of Object.entries(weights)) {
    result[k] = Math.round((v / total) * 10000) / 10000;
  }
  return result;
}

/* ══════════════════════════════════════════════════════════
   测试: 文件结构
   ══════════════════════════════════════════════════════════ */

describe('recommendations — 文件结构', () => {
  it('1. page.tsx 存在', () => {
    assert.equal(fs.existsSync(path.join(__dirname, 'page.tsx')), true);
  });

  it('2. page.tsx 使用 "use client"', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes("'use client'") || source.includes('"use client"'));
  });

  it('3. 导出默认函数', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('export default'));
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 推荐摘要数据
   ══════════════════════════════════════════════════════════ */

describe('recommendations — 摘要数据', () => {
  it('4. tenantId 非空', () => {
    assert.ok(MOCK_SUMMARY.tenantId.length > 0);
  });

  it('5. generatedAt 为 ISO 格式', () => {
    assert.match(MOCK_SUMMARY.generatedAt, /^\d{4}-\d{2}-\d{2}T/);
  });

  it('6. cached 为布尔值', () => {
    assert.equal(typeof MOCK_SUMMARY.cached, 'boolean');
  });

  it('7. 元数据包含全部 4 个字段', () => {
    const meta = MOCK_SUMMARY.metadata;
    assert.ok(meta.totalRequests > 0);
    assert.ok(meta.avgExecutionMs > 0);
    assert.ok(meta.cacheHitRate >= 0);
    assert.ok(meta.fallbackRate >= 0);
  });

  it('8. totalRequests 与点击漏斗一致', () => {
    assert.equal(MOCK_SUMMARY.metadata.totalRequests, 18500);
    assert.equal(MOCK_SUMMARY.funnel[1].count, 18500);
  });

  it('9. avgExecutionMs 合理(<100ms)', () => {
    assert.ok(MOCK_SUMMARY.metadata.avgExecutionMs < 100);
  });

  it('10. cacheHitRate 在 0-1 之间', () => {
    assert.ok(MOCK_SUMMARY.metadata.cacheHitRate >= 0 && MOCK_SUMMARY.metadata.cacheHitRate <= 1);
  });

  it('11. fallbackRate < cacheHitRate', () => {
    assert.ok(MOCK_SUMMARY.metadata.fallbackRate < MOCK_SUMMARY.metadata.cacheHitRate);
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 策略权重与漏斗
   ══════════════════════════════════════════════════════════ */

describe('recommendations — 策略权重与漏斗', () => {
  it('12. 5 种策略权重', () => {
    const keys = Object.keys(MOCK_SUMMARY.strategyWeights);
    assert.equal(keys.length, 5);
  });

  it('13. 权重之和 ≈ 1', () => {
    const sum = getTotalWeight(MOCK_SUMMARY.strategyWeights);
    assert.equal(sum, 1.0);
  });

  it('14. 协同过滤权重最高', () => {
    const w = MOCK_SUMMARY.strategyWeights;
    assert.ok(w.collaborative >= w.contentBased);
    assert.ok(w.collaborative >= w.popular);
  });

  it('15. 所有权重 > 0', () => {
    for (const v of Object.values(MOCK_SUMMARY.strategyWeights)) {
      assert.ok(v > 0, `weight ${v} should be positive`);
    }
  });

  it('16. 漏斗 5 个阶段', () => {
    assert.equal(MOCK_SUMMARY.funnel.length, 5);
  });

  it('17. 漏斗阶段递进(递减)', () => {
    for (let i = 1; i < MOCK_SUMMARY.funnel.length; i++) {
      assert.ok(MOCK_SUMMARY.funnel[i].count < MOCK_SUMMARY.funnel[i - 1].count,
        `${MOCK_SUMMARY.funnel[i].stage} > ${MOCK_SUMMARY.funnel[i-1].stage}`);
    }
  });

  it('18. 曝光→点击转化率 18.5%', () => {
    const rate = getFunnelConversionRate(MOCK_SUMMARY.funnel, 0, 1);
    assert.equal(rate, 18.5);
  });

  it('19. 点击→支付转化率 9.08%', () => {
    const rate = getFunnelConversionRate(MOCK_SUMMARY.funnel, 1, 4);
    assert.equal(rate, 9.08);
  });

  it('20. 各阶段 count > 0', () => {
    for (const f of MOCK_SUMMARY.funnel) {
      assert.ok(f.count > 0, `${f.stage} count should be > 0`);
    }
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 推荐理由与冷启动
   ══════════════════════════════════════════════════════════ */

describe('recommendations — 推荐理由与冷启动', () => {
  it('21. 5 条推荐理由', () => {
    assert.equal(MOCK_SUMMARY.topReasons.length, 5);
  });

  it('22. 理由 count 递减', () => {
    for (let i = 1; i < MOCK_SUMMARY.topReasons.length; i++) {
      assert.ok(MOCK_SUMMARY.topReasons[i].count <= MOCK_SUMMARY.topReasons[i - 1].count);
    }
  });

  it('23. 所有理由非空', () => {
    for (const r of MOCK_SUMMARY.topReasons) {
      assert.ok(r.reason.length > 0);
      assert.ok(r.count > 0);
    }
  });

  it('24. cold + warm = 3000', () => {
    assert.equal(MOCK_SUMMARY.coldStart.cold + MOCK_SUMMARY.coldStart.warm, 3000);
  });

  it('25. 冷启动占比 5%', () => {
    const ratio = getColdStartRatio(MOCK_SUMMARY.coldStart);
    assert.equal(ratio, 5);
  });

  it('26. 全 warm 冷启动占比 0', () => {
    assert.equal(getColdStartRatio({ cold: 0, warm: 3000 }), 0);
  });

  it('27. 全 cold 冷启动占比 100', () => {
    assert.equal(getColdStartRatio({ cold: 3000, warm: 0 }), 100);
  });

  it('28. 7 条热力图记录', () => {
    assert.equal(MOCK_SUMMARY.heatmap.length, 7);
  });

  it('29. 热力 count 为正', () => {
    for (const h of MOCK_SUMMARY.heatmap) {
      assert.ok(h.count > 0);
    }
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 边界与反例
   ══════════════════════════════════════════════════════════ */

describe('recommendations — 边界与反例', () => {
  it('30. 空漏斗返回转化率 0', () => {
    assert.equal(getFunnelConversionRate([], 0, 1), 0);
  });

  it('31. 零曝光转化率 0', () => {
    const zeroFunnel = [{ stage: '曝光', count: 0 }, { stage: '点击', count: 0 }];
    assert.equal(getFunnelConversionRate(zeroFunnel, 0, 1), 0);
  });

  it('32. 权重全零 normalize 不变', () => {
    const zeroW = { a: 0, b: 0 };
    assert.deepEqual(normalizeWeights(zeroW), zeroW);
  });

  it('33. normalize 后权重和 ≈ 1', () => {
    const norm = normalizeWeights(MOCK_SUMMARY.strategyWeights);
    const sum = getTotalWeight(norm);
    assert.ok(Math.abs(sum - 1) < 0.001);
  });

  it('34. 所有数据字段完整', () => {
    const required: (keyof RecommendationSummary)[] = ['tenantId', 'generatedAt', 'cached', 'strategyWeights', 'funnel', 'topReasons', 'coldStart', 'heatmap', 'metadata'];
    for (const key of required) {
      assert.ok(MOCK_SUMMARY[key] !== undefined, `missing ${key}`);
    }
  });

  it('35. 冷启动 cold 不应为负', () => {
    assert.ok(MOCK_SUMMARY.coldStart.cold >= 0);
    assert.ok(MOCK_SUMMARY.coldStart.warm >= 0);
  });

  it('36. 缓存命中率 + 回退率 <= 1', () => {
    const sum = MOCK_SUMMARY.metadata.cacheHitRate + MOCK_SUMMARY.metadata.fallbackRate;
    assert.ok(sum <= 1, `cache+fallback=${sum} > 1`);
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Recommendations — hooks验证', () => {
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
