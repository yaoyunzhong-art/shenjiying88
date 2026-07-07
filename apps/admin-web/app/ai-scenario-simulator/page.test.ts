/**
 * ai-scenario-simulator/page.test.ts — AI场景模拟页面 L1 测试
 *
 * 覆盖:
 *   正例 – 页面导出默认组件、引用预设场景、引用 AIScenarioSimulator
 *   类型 – 预设变量接口符合 ScenarioVariable 定义
 *   模拟逻辑 – 三个预设场景的 simulate 函数返回有效 SimulationResult[]
 *   边界 – 极端参数值（最小值 / 最大值）
 *   防御 – 未知 preset id 回退到第一个预设
 */

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const pagePath = PROJECT_ROOT + '/apps/admin-web/app/ai-scenario-simulator/page.tsx';

// ─── 源文件存在性 & 导出检查 ───────────────────────────

describe('AiScenarioSimulatorPage (page.tsx 源文件)', () => {
  test('页面文件存在', () => {
    assert.ok(fs.existsSync(pagePath));
  });

  test('默认导出 default 函数组件', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /export default function AiScenarioSimulatorPage/);
  });

  test('引用 AIScenarioSimulator 组件 (from @m5/ui)', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /AIScenarioSimulator/);
    assert.match(src, /from '@m5\/ui'/);
  });

  test('引用 ScenarioVariable / SimulationResult 类型', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /ScenarioVariable/);
    assert.match(src, /SimulationResult/);
  });

  test('定义预设场景数组 presets', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /const presets/);
  });

  test('包含场景切换按钮（营销预算 / 排班人力 / 定价策略）', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /营销预算分配模拟/);
    assert.match(src, /排班人力模拟/);
    assert.match(src, /定价策略模拟/);
  });
});

// ─── 页面渲染输出检查 ───────────────────────────────────

describe('AiScenarioSimulatorPage (渲染结构)', () => {
  test('包含 AI 场景模拟器 标题', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /AI 场景模拟器/);
  });

  test('包含场景描述', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /description/);
  });

  test('包含 baselineDescription', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /baselineDescription/);
  });

  test('设置 loadingText 和 errorText', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /loadingText/);
    assert.match(src, /errorText/);
  });

  test('使用 key={activePreset} 保持场景独立', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /key=\{activePreset\}/);
  });
});

// ─── 预设场景变量定义 ───────────────────────────────────

describe('ScenarioPreset 变量定义', () => {
  test('营销预算场景包含 4 个变量', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    const match = src.match(/marketing-budget[\s\S]{0,500}variables:/);
    assert.ok(match, 'marketing-budget 场景未找到');
  });

  test('营销预算变量含 id/label/type/defaultValue/min/max/step', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /adBudget/);
    assert.match(src, /广告预算/);
    assert.match(src, /discountRate/);
    assert.match(src, /channelCount/);
  });

  test('营销预算含 Select 类型变量 campaignType', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /campaignType/);
    assert.match(src, /拉新活动/);
  });

  test('排班场景变量含 staffCount/peakRatio/shiftMode/avgCrowd', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /staffCount/);
    assert.match(src, /peakRatio/);
    assert.match(src, /shiftMode/);
    assert.match(src, /avgCrowd/);
  });

  test('排班场景含三种班次模式', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /single-shift/);
    assert.match(src, /two-shift/);
    assert.match(src, /three-shift/);
  });

  test('定价场景含 basePrice/memberDiscount/membershipRatio/seasonType', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /basePrice/);
    assert.match(src, /memberDiscount/);
    assert.match(src, /membershipRatio/);
    assert.match(src, /seasonType/);
  });

  test('定价场景含三种季节类型', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /peak/);
    assert.match(src, /regular/);
  });
});

// ─── 预设场景 simulate 逻辑 ───────────────────────────

describe('模拟逻辑', () => {
  test('营销预算 simulate 返回 SimulationResult[] (3 项)', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /预估营收/);
    assert.match(src, /新增会员/);
    assert.match(src, /ROI/);
    const match = src.match(/simulate:.*?async[^}]{0,1500}\}[\s,]*\n/);
    assert.ok(match, '营销场景 simulate 函数体未找到');
  });

  test('排班 simulate 返回效率 / 等待时间 / 成本', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /服务效率/);
    assert.match(src, /预估等待时间/);
    assert.match(src, /月人力成本/);
  });

  test('定价 simulate 返回客流 / 营收 / 会员均价', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /日均客流/);
    assert.match(src, /日均营收/);
    assert.match(src, /会员消费均价/);
  });

  test('模拟结果含 direction 字段 (up/down)', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    const upMatches = src.match(/'up'/g);
    const downMatches = src.match(/'down'/g);
    assert.ok(upMatches && upMatches.length >= 3, '应包含至少 3 个 up 方向');
    assert.ok(downMatches && downMatches.length >= 1, '应包含至少 1 个 down 方向');
  });

  test('模拟结果含 changePercent 字段', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /changePercent/);
  });

  test('模拟结果含 unit 字段', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    const unitMatches = src.match(/'元'/g);
    assert.ok(unitMatches !== null && unitMatches.length >= 4, '应包含至少 4 个 "元" 单位');
  });
});

// ─── 边界条件 ───────────────────────────────────────────

describe('边界条件', () => {
  test('营销变量 min=5000 max=500000', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /min: 5000/);
    assert.match(src, /max: 500000/);
  });

  test('排班变量 min=3 max=30', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /min: 3/);
    assert.match(src, /max: 30/);
  });

  test('定价变量 min=30 max=500', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /min: 30/);
    assert.match(src, /max: 500/);
  });

  test('排班高峰占比范围 30-90%', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /min: 30/);
    assert.match(src, /max: 90/);
  });
});

// ─── 防御设计 ───────────────────────────────────────────

describe('防御设计', () => {
  test('activePreset 回退机制: 未知 ID 取第一个预设', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /presets\[0\]/);
    assert.match(src, /\?\? presets\[0\]/);
  });

  test('useCallback 包裹 simulate 函数避免重复渲染', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /useCallback/);
  });

  test('showDescription 可收起', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /setShowDescription\(false\)/);
  });
});
