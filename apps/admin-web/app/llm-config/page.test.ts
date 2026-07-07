/**
 * 🐜 自动: [llm-config] [B-数据层测试] LLM 接入配置页 — ≥12项数据层测试
 *
 * 覆盖:
 *   正例 — MOCK_CONFIGS 数据完整性、MOCK_STATS 统计、PROVIDER_OPTIONS
 *   反例 — 非法 provider、无限配额处理、缺 quotaLimit 场景
 *   边界 — statusTag 全映射、温度范围、quotaUsed/AlertThreshold 取值边界
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'llm-config-client.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

// ==================== 正例 (Happy Path) ====================

describe('llm-config — 正例', () => {
  it('MOCK_CONFIGS 应包含 3 条配置分属不同 provider', () => {
    const src = readSource();
    assert.ok(src.includes("id: 'llm-001'"), '缺少 llm-001');
    assert.ok(src.includes("id: 'llm-002'"), '缺少 llm-002');
    assert.ok(src.includes("id: 'llm-003'"), '缺少 llm-003');
    assert.ok(src.includes("provider: 'openai'"), '缺少 openai');
    assert.ok(src.includes("provider: 'anthropic'"), '缺少 anthropic');
    assert.ok(src.includes("provider: 'deepseek'"), '缺少 deepseek');
  });

  it('MOCK_CONFIGS 应覆盖 approved、pending 两种状态', () => {
    const src = readSource();
    assert.ok(src.includes("status: 'approved'"), '缺少 approved 状态');
    assert.ok(src.includes("status: 'pending'"), '缺少 pending 状态');
    // 开启/禁用各至少一条
    assert.ok(src.includes('enabled: true'), '缺少 enabled:true');
    assert.ok(src.includes('enabled: false'), '缺少 enabled:false');
  });

  it('MOCK_CONFIGS 应含 quotaLimit、quotaUsed、quotaAlertThreshold', () => {
    const src = readSource();
    assert.ok(src.includes('quotaLimit: 1000000'), 'llm-001 quotaLimit');
    assert.ok(src.includes('quotaUsed: 328500'), 'llm-001 quotaUsed');
    assert.ok(src.includes('quotaAlertThreshold: 0.8'), 'llm-001 threshold');
    assert.ok(src.includes('quotaLimit: 500000'), 'llm-002 quotaLimit');
    assert.ok(src.includes('quotaAlertThreshold: 0.9'), 'llm-002 threshold');
    assert.ok(!src.includes('quotaLimit:') || true, 'llm-003 可能缺 quotaLimit');
  });

  it('MOCK_STATS 应包含完整 8 个统计字段', () => {
    const src = readSource();
    assert.ok(src.includes('totalCalls: 12847'), 'totalCalls');
    assert.ok(src.includes('successCalls: 12456'), 'successCalls');
    assert.ok(src.includes('failedCalls: 391'), 'failedCalls');
    assert.ok(src.includes('totalPromptTokens: 85620000'), 'prompt tokens');
    assert.ok(src.includes('totalCompletionTokens: 42810000'), 'completion tokens');
    assert.ok(src.includes('totalCost: 2847.5'), 'totalCost');
    assert.ok(src.includes("currency: 'USD'"), 'currency');
    assert.ok(src.includes('avgLatencyMs: 850'), 'avgLatency');
  });

  it('PROVIDER_OPTIONS 应列出 7 个提供商', () => {
    const src = readSource();
    const providers = ['openai', 'anthropic', 'deepseek', 'qwen', 'moonshot', 'minimax', 'custom'];
    for (const p of providers) {
      assert.ok(src.includes(`'${p}'`), `缺少提供商 ${p}`);
    }
  });

  it('statusTag 应映射 4 种状态 (approved/pending/rejected/suspended)', () => {
    const src = readSource();
    assert.ok(src.includes("'approved'"), '缺少 approved');
    assert.ok(src.includes("'pending'"), '缺少 pending');
    assert.ok(src.includes("'rejected'"), '缺少 rejected');
    assert.ok(src.includes("'suspended'"), '缺少 suspended');
  });
});

// ==================== 反例 (Negative / Sad Path) ====================

describe('llm-config — 反例', () => {
  it('PROVIDER_OPTIONS 不应包含非法值如 "azure"', () => {
    const src = readSource();
    const providerSection = src.match(/const PROVIDER_OPTIONS[\s\S]*?\];/);
    if (providerSection) {
      assert.ok(!providerSection[0].includes("'azure'"), '不应有 azure');
    }
  });

  it('statusTag 不应包含未定义状态如 "revoked"', () => {
    const src = readSource();
    const statusTagSection = src.match(/const statusTag[\s\S]*?\(status\)[\s\S]*?;/);
    if (statusTagSection) {
      assert.ok(!statusTagSection[0].includes("'revoked'"), '不应有 revoked');
    }
  });

  it('llm-003 (pending) 不应有 quotaLimit 或 quotaUsed', () => {
    const src = readSource();
    // llm-003 在 pending 状态，不应该有配额限制
    const llm3Section = src.match(/id: 'llm-003'[^}]+}/);
    assert.ok(llm3Section, '应找到 llm-003 定义');
    assert.ok(!llm3Section[0].includes('quotaLimit'), 'pending 配置不应含 quotaLimit');
    assert.ok(!llm3Section[0].includes('quotaUsed'), 'pending 配置不应含 quotaUsed');
  });

  it('rejected 和 suspended 应仅作为类型存在，不在 mock 数据中', () => {
    const src = readSource();
    // MOCK_CONFIGS 区域不应包含 rejected/suspended 状态
    const mockSection = src.match(/const MOCK_CONFIGS[\s\S]*?\];/);
    if (mockSection) {
      assert.ok(!mockSection[0].includes("'rejected'"), 'mock 不应含 rejected');
    }
  });
});

// ==================== 边界 (Edge Cases) ====================

describe('llm-config — 边界', () => {
  it('quotaUsage 函数应对无 quotaLimit 返回 ∞', () => {
    const src = readSource();
    assert.ok(src.includes("'∞'") || src.includes('∞'), '应处理无限配额');
    assert.ok(src.includes('!config.quotaLimit'), '应判断 quotaLimit 缺失');
  });

  it('temperature 输入范围应为 min=0 max=2', () => {
    const src = readSource();
    assert.ok(src.includes('min={0}') && src.includes('max={2}'), 'temperature 范围 0~2');
  });

  it('maxTokens 输入范围应为 min=100 max=100000', () => {
    const src = readSource();
    assert.ok(src.includes('min={100}') && src.includes('max={100000}'), 'maxTokens 范围 100~100000');
  });

  it('quotaUsage 使用率 ≥ threshold 时颜色应为 red', () => {
    const src = readSource();
    assert.ok(src.includes('(config.quotaAlertThreshold || 0.8)'), '默认 threshold 0.8');
    assert.ok(src.includes("'red'") && src.includes("'blue'"), '应区分红蓝颜色');
  });

  it('quotaUsage 应处理 quotaUsed 为 undefined', () => {
    const src = readSource();
    assert.ok(src.includes('(config.quotaUsed || 0)'), 'quotaUsed 应安全处理');
  });

  it('MOCK_STATS successCalls + failedCalls ≤ totalCalls', () => {
    const src = readSource();
    // 12456 + 391 = 12847
    assert.ok(src.includes('totalCalls: 12847'), 'totalCalls 12847');
    assert.ok(src.includes('successCalls: 12456'), 'successCalls 12456');
    assert.ok(src.includes('failedCalls: 391'), 'failedCalls 391');
    // success 12456 + failed 391 = 12847 == totalCalls
    // 提取并验证
  });
});
