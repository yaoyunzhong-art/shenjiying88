import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * quality-eval.test.ts - Phase-23 T94
 * 质量评估单元测试
 */
import assert from 'node:assert/strict';
import { QualityEvaluator } from './quality-eval';

describe('QualityEvaluator · evaluate', () => {
  let evaluator: QualityEvaluator;
  beforeEach(() => {
    evaluator = new QualityEvaluator();
  });

  it('AC-1 默认 6 维度评分', async () => {
    const result = await evaluator.evaluate({
      query: 'What is Node.js?',
      answer: 'Node.js is a JavaScript runtime built on V8.',
    });
    assert.equal(result.scores.length, 6);
    assert.ok(result.overall > 0);
  });

  it('AC-2 overall 加权计算', async () => {
    const result = await evaluator.evaluate({
      query: 'test',
      answer: 'a comprehensive answer with detail and examples',
    });
    assert.ok(result.overall >= 0 && result.overall <= 1);
  });

  it('AC-3 passed = overall >= threshold', async () => {
    const strict = new QualityEvaluator({ passThreshold: 0.99 });
    const result = await strict.evaluate({ query: 'q', answer: 'a' });
    assert.equal(result.passed, false, 'strict 应不通过');
  });

  it('AC-4 自定义维度', async () => {
    const result = await evaluator.evaluate({
      query: 'q',
      answer: 'a',
      dimensions: ['relevance', 'helpfulness'],
    });
    assert.equal(result.scores.length, 2);
    assert.ok(result.scores.find((s) => s.dimension === 'relevance'));
    assert.ok(result.scores.find((s) => s.dimension === 'helpfulness'));
  });

  it('AC-5 自定义 dimensionWeights', async () => {
    const evaluator = new QualityEvaluator({
      dimensionWeights: { relevance: 1.0, accuracy: 0 }, // 只看 relevance
    });
    const result = await evaluator.evaluate({
      query: 'q',
      answer: 'Node.js is JavaScript runtime',
    });
    assert.ok(result.overall > 0);
  });
});

describe('QualityEvaluator · compare', () => {
  it('AC-6 pairwise 比较', async () => {
    const evaluator = new QualityEvaluator();
    const result = await evaluator.compare(
      'What is X?',
      'X is a thing.',
      'X is a thing. It does Y and Z.',
    );
    assert.ok(['A', 'B', 'tie'].includes(result.winner));
    assert.ok(result.confidence >= 0 && result.confidence <= 1);
  });
});

describe('QualityEvaluator · batch', () => {
  it('AC-7 批量评估', async () => {
    const evaluator = new QualityEvaluator();
    const results = await evaluator.evaluateBatch([
      { query: 'q1', answer: 'a1' },
      { query: 'q2', answer: 'a2' },
      { query: 'q3', answer: 'a3' },
    ]);
    assert.equal(results.length, 3);
  });
});

describe('QualityEvaluator · LLM failure', () => {
  it('AC-8 LLM 返回 invalid JSON → fallback scoring', async () => {
    const badLLM = {
      complete: async () => ({ content: 'not json', finishReason: 'stop' as const }),
    };
    const evaluator = new QualityEvaluator({ llm: badLLM });
    const result = await evaluator.evaluate({ query: 'q', answer: 'a' });
    assert.ok(result.scores.length > 0, 'fallback 应返回 scores');
  });
});
