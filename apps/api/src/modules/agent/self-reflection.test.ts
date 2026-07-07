import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * self-reflection.test.ts - Phase-23 T88
 * 自我反思 (Reflection) + Memory 单元测试
 */
import assert from 'node:assert/strict';
import { ReflectionEngine, AgentMemory } from './self-reflection';
import { AgentRunResult } from './agent-core';

describe('ReflectionEngine · 评分', () => {
  let engine: ReflectionEngine;
  beforeEach(() => {
    engine = new ReflectionEngine();
  });

  it('AC-1 完美答案 → 高分', async () => {
    const result: AgentRunResult = {
      steps: [
        { step: 1, thought: 'calling tool', durationMs: 10 },
        { step: 2, thought: 'analyzing...', durationMs: 10 },
        { step: 3, thought: 'Final answer about nodejs', finalAnswer: 'Final answer about nodejs', durationMs: 10 },
      ],
      finalAnswer: 'Final answer about nodejs',
      success: true,
      totalUsage: { promptTokens: 100, completionTokens: 50 },
      totalDurationMs: 30,
    };
    const reflection = await engine.reflect(result, 'tell me about nodejs');
    assert.ok(reflection.score.overall >= 0.6, `score 应 >= 0.6, 实际 ${reflection.score.overall}`);
    assert.equal(reflection.needsRetry, false);
  });

  it('AC-2 错误答案 → 低分 + needsRetry', async () => {
    const result: AgentRunResult = {
      steps: [
        { step: 1, thought: 'I am unable to answer', finalAnswer: 'I am unable to answer', durationMs: 10 },
      ],
      finalAnswer: 'I am unable to answer',
      success: false,
      totalUsage: { promptTokens: 50, completionTokens: 20 },
      totalDurationMs: 10,
    };
    const reflection = await engine.reflect(result, 'some query');
    assert.ok(reflection.score.accuracy < 0.5);
    assert.equal(reflection.needsRetry, true);
  });

  it('AC-3 反思检测到 max steps 问题', async () => {
    const result: AgentRunResult = {
      steps: Array.from({ length: 10 }, (_, i) => ({
        step: i + 1,
        thought: 'thinking',
        durationMs: 5,
      })),
      finalAnswer: 'reached max',
      success: false,
      totalUsage: { promptTokens: 200, completionTokens: 100 },
      totalDurationMs: 50,
    };
    const reflection = await engine.reflect(result, 'test');
    assert.ok(reflection.issues.some((i) => i.includes('max steps')));
  });

  it('AC-4 相关性评分: 答案含 query 关键词', async () => {
    const result: AgentRunResult = {
      steps: [
        { step: 1, thought: 'final', finalAnswer: 'Nodejs is a JavaScript runtime', durationMs: 10 },
      ],
      finalAnswer: 'Nodejs is a JavaScript runtime',
      success: true,
      totalUsage: { promptTokens: 0, completionTokens: 0 },
      totalDurationMs: 10,
    };
    const reflection = await engine.reflect(result, 'nodejs runtime');
    assert.ok(reflection.score.relevance >= 0.5);
  });

  it('AC-5 自定义及格线', async () => {
    const strictEngine = new ReflectionEngine({ passThreshold: 0.9 });
    const result: AgentRunResult = {
      steps: [
        { step: 1, thought: 'final', finalAnswer: 'answer', durationMs: 10 },
      ],
      finalAnswer: 'answer',
      success: true,
      totalUsage: { promptTokens: 0, completionTokens: 0 },
      totalDurationMs: 10,
    };
    const reflection = await strictEngine.reflect(result, 'question');
    assert.ok(reflection.score.overall < 0.9);
    assert.equal(reflection.needsRetry, true);
  });
});

describe('ReflectionEngine · Step reflection', () => {
  it('AC-6 reflectStep 评估单步', async () => {
    const engine = new ReflectionEngine();
    const reflection = await engine.reflectStep(
      { step: 5, thought: 'final', finalAnswer: 'answer about test', durationMs: 10 },
      { query: 'test query', history: [] },
    );
    assert.equal(reflection.step, 5);
    assert.equal(reflection.answer, 'answer about test');
  });
});

describe('AgentMemory · 基本', () => {
  let memory: AgentMemory;
  beforeEach(() => {
    memory = new AgentMemory();
  });

  it('AC-7 set/get', () => {
    memory.set('k1', 'value1');
    assert.equal(memory.get('k1'), 'value1');
  });

  it('AC-8 不存在 key 返回 undefined', () => {
    assert.equal(memory.get('nonexistent'), undefined);
  });

  it('AC-9 delete', () => {
    memory.set('k1', 'v');
    assert.equal(memory.delete('k1'), true);
    assert.equal(memory.get('k1'), undefined);
  });

  it('AC-10 大小统计', () => {
    memory.set('a', 1);
    memory.set('b', 2);
    memory.set('c', 3);
    assert.equal(memory.size(), 3);
  });

  it('AC-11 LRU 更新 lastAccessedAt', () => {
    memory.set('a', 1);
    memory.set('b', 2);
    // 访问 a,让它成为最近
    memory.get('a');
    memory.get('b');
    // 内部状态验证: a 的 accessCount 应为 1
    const aEntries = memory.listByCategory('context');
    const aEntry = aEntries.find((e) => e.key === 'a');
    assert.equal(aEntry?.accessCount, 1);
  });
});

describe('AgentMemory · LRU 淘汰', () => {
  it('AC-12 超过 maxSize 淘汰最旧', () => {
    const memory = new AgentMemory({ maxSize: 2 });
    memory.set('a', 1);
    // Sleep 1ms to ensure distinct timestamps
    const start = Date.now();
    while (Date.now() - start < 5) {}
    memory.set('b', 2);
    const start2 = Date.now();
    while (Date.now() - start2 < 5) {}
    memory.set('c', 3);
    assert.equal(memory.size(), 2);
    assert.equal(memory.get('a'), undefined, 'a 应被淘汰');
    assert.ok(memory.get('b') !== undefined);
    assert.ok(memory.get('c') !== undefined);
  });
});

describe('AgentMemory · TTL 过期', () => {
  it('AC-13 过期 key 自动删除', async () => {
    const memory = new AgentMemory({ defaultTtlMs: 50 });
    memory.set('k1', 'v1');
    assert.equal(memory.get('k1'), 'v1');
    await new Promise((r) => setTimeout(r, 80));
    assert.equal(memory.get('k1'), undefined, '过期后 get 返回 undefined');
  });

  it('AC-14 cleanup 批量清理', async () => {
    const memory = new AgentMemory({ defaultTtlMs: 50 });
    memory.set('a', 1);
    memory.set('b', 2);
    await new Promise((r) => setTimeout(r, 80));
    const removed = memory.cleanup();
    assert.equal(removed, 2);
    assert.equal(memory.size(), 0);
  });

  it('AC-15 ttlMs=0 永不过期', async () => {
    const memory = new AgentMemory();
    memory.set('forever', 'value', 'fact', 0);
    await new Promise((r) => setTimeout(r, 100));
    assert.equal(memory.get('forever'), 'value');
  });
});

describe('AgentMemory · Category 过滤', () => {
  it('AC-16 按 category 列出', () => {
    const memory = new AgentMemory();
    memory.set('fact1', 'foo', 'fact');
    memory.set('fact2', 'bar', 'fact');
    memory.set('pref1', 'dark', 'preference');
    const facts = memory.listByCategory('fact');
    assert.equal(facts.length, 2);
    const prefs = memory.listByCategory('preference');
    assert.equal(prefs.length, 1);
  });
});
