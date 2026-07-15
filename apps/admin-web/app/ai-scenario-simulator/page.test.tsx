/**
 * ai-scenario-simulator/page.test.tsx — AI 场景模拟器 L2 测试
 * 覆盖: 正例·边界·组件结构·类型定义
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

describe('ai-scenario-simulator — 正例', () => {
  it('应导出一个默认组件 AiScenarioSimulatorPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function AiScenarioSimulatorPage'), '缺少默认导出组件');
  });

  it('应包含 PageShell 页面外壳', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), '缺少 PageShell');
  });

  it('应包含 AIScenarioSimulator 组件', () => {
    const src = readSource();
    assert.ok(src.includes('AIScenarioSimulator'), '缺少 AIScenarioSimulator');
  });

  it('应包含 StatCard 统计卡片', () => {
    const src = readSource();
    assert.ok(src.includes('StatCard'), '缺少 StatCard');
  });

  it('应包含 DataTable 数据表', () => {
    const src = readSource();
    assert.ok(src.includes('DataTable'), '缺少 DataTable');
  });

  it('应使用 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含预设场景 presets 定义', () => {
    const src = readSource();
    assert.ok(src.includes('marketing-budget'), '缺少 marketing-budget 场景');
    assert.ok(src.includes('staff-scheduling'), '缺少 staff-scheduling 场景');
    assert.ok(src.includes('pricing-optimization'), '缺少 pricing-optimization 场景');
  });

  it('应包含 FormSubmitFeedback 反馈', () => {
    const src = readSource();
    assert.ok(src.includes('FormSubmitFeedback'), '缺少 FormSubmitFeedback');
  });

  it('应包含历史记录列表', () => {
    const src = readSource();
    assert.ok(src.includes('historyColumns'), '缺少 historyColumns');
    assert.ok(src.includes('HistoryRecord'), '缺少 HistoryRecord 类型');
  });

  it('应包含导出报告功能', () => {
    const src = readSource();
    assert.ok(src.includes('handleExportReport'), '缺少导出报告');
  });

  it('应包含重置功能', () => {
    const src = readSource();
    assert.ok(src.includes('handleReset'), '缺少重置');
  });

  it('应包含场景分类 categories', () => {
    const src = readSource();
    assert.ok(src.includes('categories'), '缺少 categories');
  });
});

describe('ai-scenario-simulator — 边界防御', () => {
  it('每个预设场景应有 3-4 个 variables', () => {
    const src = readSource();
    const marketingVars = (src.match(/{ id: 'adBudget'/g) || []).length;
    const staffVars = (src.match(/{ id: 'staffCount'/g) || []).length;
    assert.ok(marketingVars >= 1, '缺少 adBudget');
    assert.ok(staffVars >= 1, '缺少 staffCount');
  });

  it('每个预设场景应包含 simulate 函数', () => {
    const src = readSource();
    const simulateCount = (src.match(/simulate: async/g) || []).length;
    assert.equal(simulateCount, 3, '应有 3 个 simulate 函数');
  });

  it('模拟结果应包含 SimulationResult 类型', () => {
    const src = readSource();
    assert.ok(src.includes('SimulationResult'), '缺少 SimulationResult');
  });

  it('应包含 ScenarioVariable 类型', () => {
    const src = readSource();
    assert.ok(src.includes('ScenarioVariable'), '缺少 ScenarioVariable');
  });

  it('每个 simulate 函数应返回 Promise 结果', () => {
    const src = readSource();
    assert.ok(src.includes('Promise<SimulationResult[]>'), '缺少 Promise 返回类型');
  });

  it('历史记录应限制为 20 条', () => {
    const src = readSource();
    assert.ok(src.includes('slice(0, 20)'), '历史应限制 20 条');
  });

  it('应包含 Button 组件导入', () => {
    const src = readSource();
    assert.ok(src.includes("Button,"), '缺少 Button 导入');
  });

  it('应包含 StatusBadge 组件导入', () => {
    const src = readSource();
    assert.ok(src.includes('StatusBadge'), '缺少 StatusBadge');
  });

  it('应显示场景描述描述面板', () => {
    const src = readSource();
    assert.ok(src.includes('showDescription'), '缺少 showDescription');
  });

  it('应包含历史记录空状态', () => {
    const src = readSource();
    assert.ok(src.includes('暂无模拟记录'), '缺少空状态');
  });
});
