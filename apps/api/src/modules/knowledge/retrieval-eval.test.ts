import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * retrieval-eval.test.ts - Phase-23 T83
 * 检索评估指标单元测试
 */
import assert from 'node:assert/strict';
import {
  RetrievalEvaluator,
  computeRecallAtK,
  computePrecisionAtK,
  computeMRR,
  computeNDCGAtK,
  SAMPLE_GOLDEN_DATASET,
} from './retrieval-eval';

describe('computeRecallAtK', () => {
  it('AC-1 完美召回', () => {
    assert.equal(computeRecallAtK(['d1', 'd2', 'd3'], ['d1', 'd2'], 3), 1);
  });

  it('AC-2 部分召回', () => {
    assert.equal(computeRecallAtK(['d1', 'd3', 'd4'], ['d1', 'd2'], 3), 0.5);
  });

  it('AC-3 K 小于 relevant 数', () => {
    assert.equal(computeRecallAtK(['d1'], ['d1', 'd2', 'd3'], 1), 1 / 3);
  });

  it('AC-4 空 relevant', () => {
    assert.equal(computeRecallAtK(['d1'], [], 1), 0);
  });
});

describe('computePrecisionAtK', () => {
  it('AC-5 完美准确', () => {
    assert.equal(computePrecisionAtK(['d1', 'd2'], ['d1', 'd2'], 2), 1);
  });

  it('AC-6 部分准确', () => {
    assert.equal(computePrecisionAtK(['d1', 'd3'], ['d1'], 2), 0.5);
  });

  it('AC-7 全部不命中', () => {
    assert.equal(computePrecisionAtK(['d3', 'd4'], ['d1'], 2), 0);
  });

  it('AC-8 K=0 → 0', () => {
    assert.equal(computePrecisionAtK([], ['d1'], 0), 0);
  });
});

describe('computeMRR', () => {
  it('AC-9 第一个命中', () => {
    assert.equal(computeMRR(['d1', 'd2'], ['d1']), 1);
  });

  it('AC-10 第二个命中', () => {
    assert.equal(computeMRR(['d3', 'd1'], ['d1']), 0.5);
  });

  it('AC-11 第三个命中', () => {
    assert.ok(Math.abs(computeMRR(['d3', 'd4', 'd1'], ['d1']) - 1 / 3) < 1e-9);
  });

  it('AC-12 未命中 → 0', () => {
    assert.equal(computeMRR(['d3', 'd4'], ['d1']), 0);
  });
});

describe('computeNDCGAtK', () => {
  it('AC-13 ideal ranking → NDCG = 1', () => {
    const score = computeNDCGAtK(
      ['d1', 'd2', 'd3'],
      { d1: 3, d2: 2, d3: 1 },
      ['d1', 'd2', 'd3'],
      3,
    );
    assert.ok(Math.abs(score - 1) < 1e-9);
  });

  it('AC-14 完全错序 (binary,无命中) → NDCG = 0', () => {
    const score = computeNDCGAtK(
      ['d4', 'd5', 'd6'],
      {},
      ['d1', 'd2', 'd3'],
      3,
    );
    assert.equal(score, 0);
  });

  it('AC-14b 完美反序 (graded) 低于正序', () => {
    const ideal = computeNDCGAtK(
      ['d1', 'd2', 'd3'],
      { d1: 3, d2: 2, d3: 1 },
      ['d1', 'd2', 'd3'],
      3,
    );
    const reverse = computeNDCGAtK(
      ['d3', 'd2', 'd1'],
      { d1: 3, d2: 2, d3: 1 },
      ['d1', 'd2', 'd3'],
      3,
    );
    assert.ok(ideal > reverse, `ideal(${ideal}) 应 > reverse(${reverse})`);
    assert.ok(reverse < 0.75, `reverse 应 < 0.75, 实际 ${reverse}`);
  });

  it('AC-15 部分相关', () => {
    const score = computeNDCGAtK(['d1', 'd2'], {}, ['d1', 'd2'], 2);
    assert.ok(score > 0.9);
  });

  it('AC-16 空 relevant → 0', () => {
    assert.equal(computeNDCGAtK(['d1'], {}, [], 1), 0);
  });
});

describe('RetrievalEvaluator · 批量评估', () => {
  it('AC-17 评估多个 query 返回平均指标', () => {
    const evaluator = new RetrievalEvaluator();
    const report = evaluator.evaluate(SAMPLE_GOLDEN_DATASET);
    assert.equal(report.totalQueries, 3);
    assert.ok(report.recallAt10 > 0, `recall@10 应 > 0, 实际 ${report.recallAt10}`);
    assert.ok(report.mrr > 0);
  });

  it('AC-18 recall@10 == 1 (所有 relevant 都在前 10)', () => {
    const evaluator = new RetrievalEvaluator();
    const report = evaluator.evaluate(SAMPLE_GOLDEN_DATASET);
    assert.equal(report.recallAt10, 1);
  });

  it('AC-19 perQuery 详情', () => {
    const evaluator = new RetrievalEvaluator();
    const report = evaluator.evaluate(SAMPLE_GOLDEN_DATASET);
    assert.equal(report.perQuery.length, 3);
    for (const pq of report.perQuery) {
      assert.ok(pq.queryId);
      assert.ok(pq.mrr >= 0 && pq.mrr <= 1);
    }
  });

  it('AC-20 map 计算', () => {
    const evaluator = new RetrievalEvaluator();
    const report = evaluator.evaluate(SAMPLE_GOLDEN_DATASET);
    assert.ok(report.map >= 0 && report.map <= 1);
  });
});

describe('RetrievalEvaluator · 边界', () => {
  it('AC-21 空查询', () => {
    const evaluator = new RetrievalEvaluator();
    const report = evaluator.evaluate({ queries: [], results: [] });
    assert.equal(report.totalQueries, 0);
    assert.equal(report.mrr, 0);
  });

  it('AC-22 result 缺失对应 query 时跳过', () => {
    const evaluator = new RetrievalEvaluator();
    const report = evaluator.evaluate({
      queries: [{ queryId: 'q1', query: 'x', relevant: ['d1'] }],
      results: [],
    });
    assert.equal(report.perQuery.length, 0);
  });
});
