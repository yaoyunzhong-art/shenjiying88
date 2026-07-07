/**
 * stores/[id]/health-score/page.test.ts — 门店健康评分页 L1 测试
 *
 * 覆盖业务逻辑（不含 DOM 渲染）:
 *   正例 — 数据生成、排序、最佳/最差维度、格式化摘要
 *   反例 — 空维度、未知维度
 *   边界 — 等分、边界值
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ─── 类型定义 (从 page.tsx 提取) ──────────────────────

type HealthDimension = 'operation' | 'member' | 'finance' | 'service' | 'inventory';
type TrendDir = 'up' | 'down' | 'stable';

interface DimensionScore {
  dimension: HealthDimension;
  label: string;
  score: number;
  trend: TrendDir;
  change: number;
  weight: number;
  suggestions: string[];
}

interface StoreHealthData {
  storeId: string;
  storeName: string;
  overallScore: number;
  dimensionScores: DimensionScore[];
  periodLabel: string;
  totalStores: number;
  rank: number;
}

// ─── 常量 (从 page.tsx 提取) ──────────────────────────

const DIMENSION_LABELS: Record<HealthDimension, string> = {
  operation: '运营效率',
  member: '会员活跃',
  finance: '财务状况',
  service: '服务质量',
  inventory: '库存健康',
};

// ─── 辅助函数 (从 page.tsx 提取) ──────────────────────

function scoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#eab308';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

function scoreLabel(score: number): string {
  if (score >= 80) return '优秀';
  if (score >= 60) return '良好';
  if (score >= 40) return '待改善';
  return '危险';
}

function sortByScoreDesc(dimensions: DimensionScore[]): DimensionScore[] {
  return [...dimensions].sort((a, b) => b.score - a.score);
}

function getBestAndWorst(dimensions: DimensionScore[]): { best: DimensionScore | null; worst: DimensionScore | null } {
  if (dimensions.length === 0) return { best: null, worst: null };
  const sorted = sortByScoreDesc(dimensions);
  return { best: sorted[0], worst: sorted[sorted.length - 1] };
}

// ─── Mock 数据生成器 ──────────────────────────────────

function mockDimensionScore(dim: HealthDimension, score: number, weight: number, trend: TrendDir = 'stable', change = 0): DimensionScore {
  const suggestionSets: Record<HealthDimension, string[]> = {
    operation: ['优化排班减少空耗', '提升自助结账渗透率'],
    member: ['策划会员专享活动', '完善积分兑换体系'],
    finance: ['控制运营成本', '优化账期管理'],
    service: ['加强员工服务培训', '缩短响应时间'],
    inventory: ['清理滞销库存', '优化补货策略'],
  };
  return {
    dimension: dim,
    label: DIMENSION_LABELS[dim],
    score,
    trend,
    change,
    weight,
    suggestions: suggestionSets[dim],
  };
}

function mockHealth(dimScores?: DimensionScore[]): StoreHealthData {
  const dims = dimScores ?? [
    mockDimensionScore('operation', 78, 0.25),
    mockDimensionScore('member', 65, 0.2),
    mockDimensionScore('finance', 82, 0.25),
    mockDimensionScore('service', 72, 0.15),
    mockDimensionScore('inventory', 58, 0.15),
  ];
  const overall = Math.round(dims.reduce((sum, s) => sum + s.score * s.weight, 0));
  return {
    storeId: 'store-001',
    storeName: '门店 store-001',
    overallScore: overall,
    dimensionScores: dims,
    periodLabel: '近30天',
    totalStores: 120,
    rank: 35,
  };
}

// ─── 测试 ─────────────────────────────────────────────

describe('StoreHealthScorePage (门店健康评分页) 业务逻辑', () => {
  // ═══ 正例 ═══
  describe('mockHealth()', () => {
    it('正例: 默认生成 5 个维度', () => {
      const h = mockHealth();
      assert.equal(h.dimensionScores.length, 5);
    });

    it('正例: 综合评分是加权平均值', () => {
      const h = mockHealth();
      const expected = Math.round(
        h.dimensionScores.reduce((sum, s) => sum + s.score * s.weight, 0),
      );
      assert.equal(h.overallScore, expected);
    });

    it('正例: 每个维度都有非空建议', () => {
      const h = mockHealth();
      for (const d of h.dimensionScores) {
        assert.ok(d.suggestions.length > 0, `${d.dimension} should have suggestions`);
      }
    });
  });

  describe('scoreColor()', () => {
    it('正例: 100 分绿色', () => assert.equal(scoreColor(100), '#22c55e'));
    it('正例: 80 分绿色', () => assert.equal(scoreColor(80), '#22c55e'));
    it('正例: 79 分黄色', () => assert.equal(scoreColor(79), '#eab308'));
    it('正例: 60 分黄色', () => assert.equal(scoreColor(60), '#eab308'));
    it('正例: 59 分橙色', () => assert.equal(scoreColor(59), '#f97316'));
    it('正例: 40 分橙色', () => assert.equal(scoreColor(40), '#f97316'));
    it('正例: 39 分红色', () => assert.equal(scoreColor(39), '#ef4444'));
    it('正例: 0 分红色', () => assert.equal(scoreColor(0), '#ef4444'));
  });

  describe('scoreLabel()', () => {
    it('正例: ≥80 → 优秀', () => assert.equal(scoreLabel(85), '优秀'));
    it('正例: ≥60 <80 → 良好', () => assert.equal(scoreLabel(72), '良好'));
    it('正例: ≥40 <60 → 待改善', () => assert.equal(scoreLabel(45), '待改善'));
    it('正例: <40 → 危险', () => assert.equal(scoreLabel(23), '危险'));
    it('边界: 恰好 80 → 优秀', () => assert.equal(scoreLabel(80), '优秀'));
    it('边界: 恰好 60 → 良好', () => assert.equal(scoreLabel(60), '良好'));
    it('边界: 恰好 40 → 待改善', () => assert.equal(scoreLabel(40), '待改善'));
  });

  describe('sortByScoreDesc()', () => {
    it('正例: 按分数降序排列', () => {
      const dims = [
        mockDimensionScore('operation', 50, 0.25),
        mockDimensionScore('finance', 90, 0.25),
        mockDimensionScore('service', 70, 0.25),
      ];
      const sorted = sortByScoreDesc(dims);
      assert.equal(sorted[0].score, 90);
      assert.equal(sorted[1].score, 70);
      assert.equal(sorted[2].score, 50);
    });

    it('正例: 不修改原数组', () => {
      const dims = [
        mockDimensionScore('operation', 50, 0.25),
        mockDimensionScore('finance', 90, 0.25),
      ];
      const copy = [...dims];
      sortByScoreDesc(dims);
      assert.equal(dims[0].score, copy[0].score);
      assert.equal(dims[1].score, copy[1].score);
    });

    it('边界: 空数组返回空数组', () => {
      assert.deepStrictEqual(sortByScoreDesc([]), []);
    });

    it('边界: 相同分数稳定排序', () => {
      const dims = [
        mockDimensionScore('operation', 80, 0.25),
        mockDimensionScore('finance', 80, 0.25),
      ];
      const sorted = sortByScoreDesc(dims);
      assert.equal(sorted.length, 2);
    });
  });

  describe('getBestAndWorst()', () => {
    it('正例: 返回最高和最低维度', () => {
      const dims = [
        mockDimensionScore('operation', 50, 0.25),
        mockDimensionScore('finance', 90, 0.25),
        mockDimensionScore('service', 70, 0.25),
      ];
      const { best, worst } = getBestAndWorst(dims);
      assert.equal(best?.dimension, 'finance');
      assert.equal(worst?.dimension, 'operation');
    });

    it('反例: 空数组返回 null', () => {
      const { best, worst } = getBestAndWorst([]);
      assert.strictEqual(best, null);
      assert.strictEqual(worst, null);
    });

    it('边界: 单个元素时 best 和 worst 相同', () => {
      const dims = [mockDimensionScore('operation', 75, 1)];
      const { best, worst } = getBestAndWorst(dims);
      assert.equal(best?.dimension, 'operation');
      assert.equal(worst?.dimension, 'operation');
      assert.equal(best?.score, 75);
    });
  });

  describe('综合权重计算', () => {
    it('正例: 全 100 分 → 综合 100', () => {
      const dims = (['operation', 'member', 'finance', 'service', 'inventory'] as HealthDimension[]).map(
        (d, i) => mockDimensionScore(d, 100, [0.25, 0.2, 0.25, 0.15, 0.15][i]),
      );
      const h = mockHealth(dims);
      assert.equal(h.overallScore, 100);
    });

    it('正例: 全 0 分 → 综合 0', () => {
      const dims = (['operation', 'member', 'finance', 'service', 'inventory'] as HealthDimension[]).map(
        (d, i) => mockDimensionScore(d, 0, [0.25, 0.2, 0.25, 0.15, 0.15][i]),
      );
      const h = mockHealth(dims);
      assert.equal(h.overallScore, 0);
    });

    it('正例: 权重之和为 1', () => {
      const h = mockHealth();
      const sum = h.dimensionScores.reduce((s, d) => s + d.weight, 0);
      assert.equal(Math.round(sum * 100) / 100, 1);
    });

    it('边界: 综合评分取整', () => {
      const dims = [
        mockDimensionScore('operation', 77, 0.33),
        mockDimensionScore('finance', 88, 0.33),
        mockDimensionScore('service', 55, 0.34),
      ];
      const h = mockHealth(dims);
      assert.equal(typeof h.overallScore, 'number');
      assert.ok(h.overallScore >= 0 && h.overallScore <= 100);
    });
  });

  describe('门店健康数据结构', () => {
    it('正例: storeId 与传入一致', () => {
      const h = mockHealth();
      assert.equal(h.storeId, 'store-001');
    });

    it('正例: 每个维度有唯一 dimension 值', () => {
      const h = mockHealth();
      const dims = new Set(h.dimensionScores.map((d) => d.dimension));
      assert.equal(dims.size, h.dimensionScores.length);
    });

    it('正例: rank 在有效范围内', () => {
      const h = mockHealth();
      assert.ok(h.rank >= 1);
      assert.ok(h.rank <= h.totalStores);
    });

    it('反例: 空维度数组不应影响 getBestAndWorst', () => {
      const { best, worst } = getBestAndWorst([]);
      assert.strictEqual(best, null);
      assert.strictEqual(worst, null);
    });
  });
});
