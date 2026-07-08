/**
 * runtime-governance-panel.test.ts — Storefront Runtime Governance Panel L1 结构测试
 *
 * 覆盖:
 * - 文件存在 & 默认导出
 * - 导入结构校验
 * - Props 类型定义
 * - 组件函数签名
 * - Style/Message 常量
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'runtime-governance-panel.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

describe('RuntimeGovernancePanel — 正例', () => {
  it('文件存在', () => {
    const src = readSource();
    assert.ok(src.length > 0, '文件内容为空');
  });

  it('标记 use client', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client 指令');
  });

  it('导出 RuntimeGovernancePanel 函数组件', () => {
    const src = readSource();
    assert.ok(src.includes('export function RuntimeGovernancePanel'), '缺少导出函数');
    assert.ok(src.includes(': StorefrontRuntimeGovernancePanelProps'), '缺少 Props 类型标注');
  });

  it('从 @m5/sdk 导入必要方法', () => {
    const src = readSource();
    assert.ok(src.includes("createRuntimeGovernancePanelBindings"), '缺少 bindings 导入');
    assert.ok(src.includes("createRuntimeGovernancePanelClient"), '缺少 client 导入');
  });

  it('从 @m5/ui 导入模板组件', () => {
    const src = readSource();
    assert.ok(src.includes("RuntimeGovernancePanelTemplate"), '缺少模板导入');
    assert.ok(src.includes("joinRuntimeScopeSummary"), '缺少 scope summary 导入');
  });

  it('从 @m5/types 导入运行时推断类型', () => {
    const src = readSource();
    assert.ok(src.includes("RuntimeGovernanceReceipt"), '缺少 Receipt 类型导入');
  });

  it('从上级 runtime-governance 导入 storefront 业务方法', () => {
    const src = readSource();
    assert.ok(src.includes("buildStorefrontRuntimeReplayRequest"), '缺少 replay 方法');
    assert.ok(src.includes("buildStorefrontRuntimeSubmitRequest"), '缺少 submit 方法');
    assert.ok(src.includes("canReplayStorefrontRuntimeReceipt"), '缺少 canReplay 方法');
    assert.ok(src.includes("storefrontRuntimeActionPresets"), '缺少 action presets');
    assert.ok(src.includes("summarizeStorefrontRuntimeReceipt"), '缺少 summarize 方法');
  });
});

describe('RuntimeGovernancePanel — Props 类型定义', () => {
  it('Props 接口包含 marketCode', () => {
    const src = readSource();
    assert.ok(src.includes('marketCode: string'), '缺少 marketCode');
  });

  it('Props 接口包含 tenantCode', () => {
    const src = readSource();
    assert.ok(src.includes('tenantCode: string'), '缺少 tenantCode');
  });

  it('Props 接口包含 brandCode', () => {
    const src = readSource();
    assert.ok(src.includes('brandCode: string'), '缺少 brandCode');
  });

  it('Props 接口包含 storeCode', () => {
    const src = readSource();
    assert.ok(src.includes('storeCode: string'), '缺少 storeCode');
  });
});

describe('RuntimeGovernancePanel — Error Messages', () => {
  it('包含 submit 错误消息', () => {
    const src = readSource();
    assert.ok(src.includes('submitErrorMessage'), '缺少 submit 错误消息');
    assert.ok(src.includes('Storefront runtime submit'), '缺少 submit 错误提示文案');
  });

  it('包含 query 错误消息', () => {
    const src = readSource();
    assert.ok(src.includes('queryErrorMessage'), '缺少 query 错误消息');
    assert.ok(src.includes('runtime query 失败'), '缺少 query 错误提示文案');
  });

  it('包含 replay 错误消息', () => {
    const src = readSource();
    assert.ok(src.includes('replayErrorMessage'), '缺少 replay 错误消息');
    assert.ok(src.includes('runtime replay 失败'), '缺少 replay 错误提示文案');
  });
});

describe('RuntimeGovernancePanel — 函数逻辑', () => {
  it('useMemo 创建 runtimeBindings', () => {
    const src = readSource();
    assert.ok(src.includes('const runtimeBindings = useMemo'), '缺少 runtimeBindings');
  });

  it('runtimeBindings 包含 buildSubmitRequest', () => {
    const src = readSource();
    assert.ok(src.includes('buildSubmitRequest'), '缺少 buildSubmitRequest');
  });

  it('runtimeBindings 包含 buildReplayRequest', () => {
    const src = readSource();
    assert.ok(src.includes('buildReplayRequest'), '缺少 buildReplayRequest');
  });

  it('模板组件 defaultAction = booking-submit', () => {
    const src = readSource();
    assert.ok(src.includes("defaultAction=\"booking-submit\""), '缺少 booking-submit 默认动作');
  });

  it('包含 initialMessage 初始提示', () => {
    const src = readSource();
    assert.ok(src.includes('initialMessage'), '缺少 initialMessage');
    assert.ok(src.includes('Storefront runtime submit'), '缺少 runtime submit 提示');
  });

  it('包含 getReceiptScopeLabel 回退方法', () => {
    const src = readSource();
    assert.ok(src.includes('getReceiptScopeLabel'), '缺少 getReceiptScopeLabel');
  });
});
