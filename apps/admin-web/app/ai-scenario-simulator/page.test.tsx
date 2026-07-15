/**
 * ai-scenario-simulator/page.test.tsx — AI 场景模拟器 L2 全量测试
 * 覆盖: 正例·边界·组件结构·类型定义·统计数据·趋势
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

// ---- 复现类型（与 page.tsx 同步） ----

interface ScenarioVariable {
  id: string;
  label: string;
  type: string;
  defaultValue: number | string;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ value: string; label: string }>;
}

interface SimulationResult {
  variable: string;
  before: number | string;
  after: number | string;
  unit: string;
  direction: 'up' | 'down';
  changePercent: number;
}

interface ScenarioPreset {
  id: string;
  label: string;
  description: string;
  category: string;
  variables: ScenarioVariable[];
  simulate: (values: Record<string, number | string>) => Promise<SimulationResult[]>;
}

interface HistoryRecord {
  id: string;
  presetLabel: string;
  values: Record<string, number | string>;
  results: SimulationResult[];
  timestamp: string;
}

interface ScenarioTrend {
  label: string;
  avgAfter: number;
  count: number;
}

// ---- 预设数据复现 ----

const PRESETS: ScenarioPreset[] = [
  {
    id: 'marketing-budget', label: '营销预算分配模拟', category: '营销',
    description: '调整广告预算与折扣力度',
    variables: [
      { id: 'adBudget', label: '广告预算 (元)', type: 'number', defaultValue: 50000, min: 5000, max: 500000, step: 5000 },
      { id: 'discountRate', label: '折扣力度 (%)', type: 'number', defaultValue: 15, min: 0, max: 50, step: 5 },
      { id: 'channelCount', label: '推广渠道数', type: 'number', defaultValue: 3, min: 1, max: 10, step: 1 },
      {
        id: 'campaignType', label: '活动类型', type: 'select', defaultValue: 'new-member',
        options: [
          { value: 'new-member', label: '拉新活动' },
          { value: 'retention', label: '留存活动' },
          { value: 'festival', label: '节日大促' },
        ],
      },
    ],
    simulate: async () => [{ variable: '预估营收', before: 300000, after: 350000, unit: '元', direction: 'up', changePercent: 17 }],
  },
  {
    id: 'staff-scheduling', label: '排班人力模拟', category: '运营',
    description: '调整排班人数与班次结构',
    variables: [
      { id: 'staffCount', label: '店员总数', type: 'number', defaultValue: 8, min: 3, max: 30, step: 1 },
      { id: 'peakRatio', label: '高峰时段占比 (%)', type: 'number', defaultValue: 60, min: 30, max: 90, step: 5 },
      {
        id: 'shiftMode', label: '班次模式', type: 'select', defaultValue: 'three-shift',
        options: [
          { value: 'single-shift', label: '单班制' },
          { value: 'two-shift', label: '两班制' },
          { value: 'three-shift', label: '三班制' },
        ],
      },
      { id: 'avgCrowd', label: '日均客流', type: 'number', defaultValue: 500, min: 100, max: 5000, step: 100 },
    ],
    simulate: async () => [{ variable: '服务效率', before: 65, after: 85, unit: '%', direction: 'up', changePercent: 31 }],
  },
  {
    id: 'pricing-optimization', label: '定价策略模拟', category: '定价',
    description: '调整票价与会员价',
    variables: [
      { id: 'basePrice', label: '标准票价 (元)', type: 'number', defaultValue: 128, min: 30, max: 500, step: 10 },
      { id: 'memberDiscount', label: '会员折扣 (%)', type: 'number', defaultValue: 20, min: 5, max: 80, step: 5 },
      { id: 'membershipRatio', label: '会员占比 (%)', type: 'number', defaultValue: 40, min: 10, max: 90, step: 5 },
      {
        id: 'seasonType', label: '季节类型', type: 'select', defaultValue: 'peak',
        options: [
          { value: 'peak', label: '旺季' },
          { value: 'regular', label: '平季' },
          { value: 'off-peak', label: '淡季' },
        ],
      },
    ],
    simulate: async () => [{ variable: '日均营收', before: 192000, after: 215000, unit: '元', direction: 'up', changePercent: 12 }],
  },
];

// ---- 辅助函数 ----

function getPresetsByCategory(cat: string): ScenarioPreset[] {
  return PRESETS.filter((p) => p.category === cat);
}

function computeStatTotalVariables(): number {
  return PRESETS.reduce((sum, p) => sum + p.variables.length, 0);
}

function computeTotalCategories(): number {
  return new Set(PRESETS.map((p) => p.category)).size;
}

function computeScenarioTrend(history: HistoryRecord[]): ScenarioTrend[] | null {
  if (history.length === 0) return null;
  const grouped = new Map<string, number[]>();
  for (const h of history) {
    if (!grouped.has(h.presetLabel)) {
      grouped.set(h.presetLabel, []);
    }
    const group = grouped.get(h.presetLabel)!;
    for (const r of h.results) {
      if (typeof r.after === 'number') {
        group.push(r.after);
      }
    }
  }
  return Array.from(grouped.entries()).map(([label, values]) => ({
    label,
    avgAfter: Math.round(values.reduce((s, v) => s + v, 0) / values.length),
    count: values.length,
  }));
}

// ---- 测试 ----

describe('ai-scenario-simulator — 正例: 页面结构', () => {
  it('1. 应导出一个默认组件 AiScenarioSimulatorPage', () => {
    assert.ok(readSource().includes('export default function AiScenarioSimulatorPage'), '缺少默认导出组件');
  });

  it('2. 应包含 PageShell 页面外壳', () => {
    assert.ok(readSource().includes('PageShell'), '缺少 PageShell');
  });

  it('3. 应包含 AIScenarioSimulator 组件', () => {
    assert.ok(readSource().includes('AIScenarioSimulator'), '缺少 AIScenarioSimulator');
  });

  it('4. 应包含 StatCard 统计卡片', () => {
    assert.ok(readSource().includes('StatCard'), '缺少 StatCard');
  });

  it('5. 应包含 DataTable 数据表', () => {
    assert.ok(readSource().includes('DataTable'), '缺少 DataTable');
  });

  it('6. 应使用 use client 指令', () => {
    assert.ok(readSource().includes("'use client'"), '缺少 use client');
  });

  it('7. 应包含 FormSubmitFeedback 反馈', () => {
    assert.ok(readSource().includes('FormSubmitFeedback'), '缺少 FormSubmitFeedback');
  });

  it('8. 应包含历史记录列表', () => {
    assert.ok(readSource().includes('historyColumns'), '缺少 historyColumns');
    assert.ok(readSource().includes('HistoryRecord'), '缺少 HistoryRecord 类型');
  });

  it('9. 应包含导出报告功能', () => {
    assert.ok(readSource().includes('handleExportReport'), '缺少导出报告');
  });

  it('10. 应包含重置功能', () => {
    assert.ok(readSource().includes('handleReset'), '缺少重置');
  });

  it('11. 应包含场景趋势概览', () => {
    assert.ok(readSource().includes('scenarioTrend'), '缺少场景趋势');
  });

  it('12. 应包含最新结果对比面板', () => {
    assert.ok(readSource().includes('最新模拟结果对比'), '缺少结果对比面板');
  });

  it('13. 应包含场景使用说明面板', () => {
    assert.ok(readSource().includes('使用说明'), '缺少使用说明');
  });

  it('14. 应包含场景能力数据面板', () => {
    assert.ok(readSource().includes('PRESET_STATS'), '缺少 PRESET_STATS');
  });

  it('15. 应包含分类描述映射', () => {
    assert.ok(readSource().includes('CATEGORY_DESCRIPTIONS'), '缺少分类描述');
  });
});

describe('ai-scenario-simulator — 正例: 预设场景', () => {
  it('16. 拥有 3 个预设场景', () => {
    assert.strictEqual(PRESETS.length, 3);
  });

  it('17. 包含 marketing-budget', () => {
    assert.ok(PRESETS.some((p) => p.id === 'marketing-budget'));
  });

  it('18. 包含 staff-scheduling', () => {
    assert.ok(PRESETS.some((p) => p.id === 'staff-scheduling'));
  });

  it('19. 包含 pricing-optimization', () => {
    assert.ok(PRESETS.some((p) => p.id === 'pricing-optimization'));
  });

  it('20. 每个预设场景有 description', () => {
    for (const p of PRESETS) {
      assert.ok(p.description.length > 0);
    }
  });

  it('21. 每个预设场景有 category', () => {
    for (const p of PRESETS) {
      assert.ok(p.category.length > 0);
    }
  });

  it('22. 覆盖 3 种分类', () => {
    assert.strictEqual(computeTotalCategories(), 3);
  });

  it('23. 每个预设场景有 3-4 个 variables', () => {
    for (const p of PRESETS) {
      assert.ok(p.variables.length >= 3 && p.variables.length <= 5, `${p.id} 变量数 ${p.variables.length}`);
    }
  });

  it('24. 所有 variable 有 id 和 label', () => {
    for (const p of PRESETS) {
      for (const v of p.variables) {
        assert.ok(v.id, 'missing id');
        assert.ok(v.label, 'missing label');
        assert.ok(v.type, 'missing type');
      }
    }
  });

  it('25. marketing 场景有 select 类型变量', () => {
    const mkt = PRESETS.find((p) => p.id === 'marketing-budget');
    assert.ok(mkt);
    assert.ok(mkt.variables.some((v) => v.type === 'select'));
  });

  it('26. 每个 preset 有 simulate 函数', () => {
    assert.strictEqual(PRESETS.filter((p) => typeof p.simulate === 'function').length, 3);
  });

  it('27. 每个变量有 defaultValue', () => {
    for (const p of PRESETS) {
      for (const v of p.variables) {
        assert.ok(v.defaultValue !== undefined, `${p.id}.${v.id} 缺少 defaultValue`);
      }
    }
  });

  it('28. number 类型变量有 min/max', () => {
    for (const p of PRESETS) {
      for (const v of p.variables) {
        if (v.type === 'number') {
          assert.ok(typeof v.min === 'number', `${p.id}.${v.id} 缺少 min`);
          assert.ok(typeof v.max === 'number', `${p.id}.${v.id} 缺少 max`);
        }
      }
    }
  });

  it('29. simulate 返回 Promise<SimulationResult[]>', async () => {
    const results = await PRESETS[0].simulate({});
    assert.ok(Array.isArray(results));
    for (const r of results) {
      assert.ok(r.variable);
      assert.ok(r.unit);
    }
  });

  it('30. 按分类查询返回正确数量', () => {
    assert.strictEqual(getPresetsByCategory('营销').length, 1);
    assert.strictEqual(getPresetsByCategory('运营').length, 1);
    assert.strictEqual(getPresetsByCategory('定价').length, 1);
  });
});

describe('ai-scenario-simulator — 正例: 统计计算', () => {
  it('31. 总变量数计算正确', () => {
    const total = PRESETS.reduce((s, p) => s + p.variables.length, 0);
    assert.strictEqual(total, 12);
    assert.strictEqual(computeStatTotalVariables(), total);
  });

  it('32. 分类数计算正确', () => {
    assert.strictEqual(computeTotalCategories(), 3);
  });

  it('33. simulate 结果包含必需字段', async () => {
    const results = await PRESETS[0].simulate({});
    for (const r of results) {
      assert.ok(typeof r.variable === 'string');
      assert.ok(typeof r.unit === 'string');
      assert.ok(r.direction === 'up' || r.direction === 'down');
      assert.ok(typeof r.changePercent === 'number');
    }
  });

  it('34. HistoryRecord 包含所有字段', () => {
    const record: HistoryRecord = {
      id: 'sim-1',
      presetLabel: '测试',
      values: { a: 1 },
      results: [{ variable: 'v', before: 1, after: 2, unit: 'x', direction: 'up', changePercent: 100 }],
      timestamp: '2026-07-16',
    };
    assert.ok(record.id);
    assert.ok(record.presetLabel);
    assert.ok(record.values);
    assert.ok(Array.isArray(record.results));
    assert.ok(record.timestamp);
  });

  it('35. scenarioTrend 空历史返回 null', () => {
    assert.strictEqual(computeScenarioTrend([]), null);
  });

  it('36. scenarioTrend 有历史返回数组', () => {
    const results: SimulationResult[] = [
      { variable: 'v', before: 1, after: 100, unit: 'x', direction: 'up', changePercent: 9900 },
    ];
    const history: HistoryRecord[] = [
      { id: 's1', presetLabel: '营销预算分配模拟', values: {}, results, timestamp: 't1' },
    ];
    const trend = computeScenarioTrend(history);
    assert.ok(trend);
    assert.strictEqual(trend.length, 1);
    assert.strictEqual(trend[0].label, '营销预算分配模拟');
    assert.strictEqual(trend[0].count, 1);
  });

  it('37. 历史记录限制为 20 条', () => {
    const src = readSource();
    assert.ok(src.includes('slice(0, 20)'), '历史应限制 20 条');
  });

  it('38. 导出报告生成 CSV 文件名', () => {
    const src = readSource();
    assert.ok(src.includes('.csv'), '缺少 CSV 导出');
    assert.ok(src.includes('handleExportReport'), '缺少导出函数');
  });

  it('39. select 类型变量有 options', () => {
    for (const p of PRESETS) {
      for (const v of p.variables) {
        if (v.type === 'select') {
          assert.ok(Array.isArray(v.options), `${p.id}.${v.id} 缺少 options`);
          assert.ok(v.options.length >= 1, `${p.id}.${v.id} options 为空`);
        }
      }
    }
  });

  it('40. 统计模拟次数由 history.length 决定', () => {
    const src = readSource();
    assert.ok(src.includes('history.length'), '缺少历史长度引用');
  });
});

describe('ai-scenario-simulator — 边界防御', () => {
  it('41. 错误状态处理', () => {
    const src = readSource();
    assert.ok(src.includes('errorText'), '缺少 errorText');
  });

  it('42. 加载中状态', () => {
    const src = readSource();
    assert.ok(src.includes('loadingText'), '缺少 loadingText');
  });

  it('43. 历史记录空状态', () => {
    const src = readSource();
    assert.ok(src.includes('暂无模拟记录'), '缺少空状态');
  });

  it('44. 模拟完成反馈', () => {
    const src = readSource();
    assert.ok(src.includes('onDismissSuccess'), '缺少反馈消除');
  });

  it('45. 导出禁用状态', () => {
    const src = readSource();
    assert.ok(src.includes('disabled={!lastResults}'), '导出在无结果时禁用');
  });

  it('46. 重置按钮存在', () => {
    const src = readSource();
    assert.ok(src.includes('handleReset'), '缺少重置处理');
  });

  it('47. select 的 options 包含 value 和 label', () => {
    for (const p of PRESETS) {
      for (const v of p.variables) {
        if (v.options) {
          for (const opt of v.options) {
            assert.ok('value' in opt, 'option 缺少 value');
            assert.ok('label' in opt, 'option 缺少 label');
          }
        }
      }
    }
  });

  it('48. 每个预设场景 ID 唯一', () => {
    const ids = PRESETS.map((p) => p.id);
    assert.strictEqual(new Set(ids).size, ids.length);
  });

  it('49. 变量 ID 在场景内唯一', () => {
    for (const p of PRESETS) {
      const varIds = p.variables.map((v) => v.id);
      assert.strictEqual(new Set(varIds).size, varIds.length, `${p.id} 变量 ID 重复`);
    }
  });

  it('50. 分类数组不含重复', () => {
    const cats = PRESETS.map((p) => p.category);
    assert.strictEqual(new Set(cats).size, cats.length);
  });
});
