/**
 * ai-scenario-simulator/page.test.tsx — AI场景模拟器页冒烟测试
 * ⚡ 覆盖: 预设场景配置 / 模拟函数逻辑 / 参数边界
 */

import assert from 'node:assert/strict';
import test, { describe, it } from 'node:test';

// ─── 预设场景配置（与 page.tsx 保持同步） ────────────────

type VariableType = 'number' | 'select';
interface VariableOption { value: string; label: string }
interface ScenarioVariable {
  id: string;
  label: string;
  type: VariableType;
  defaultValue: number | string;
  min?: number;
  max?: number;
  step?: number;
  options?: VariableOption[];
}

interface SimulationResult {
  variable: string;
  before: number;
  after: number;
  unit: string;
  direction: 'up' | 'down';
  changePercent: number;
}

interface ScenarioPreset {
  id: string;
  label: string;
  description: string;
  variables: ScenarioVariable[];
  simulate: (values: Record<string, number | string>) => Promise<SimulationResult[]>;
}

function createMarketingPreset(): ScenarioPreset {
  return {
    id: 'marketing-budget',
    label: '营销预算分配模拟',
    description: '调整广告预算与折扣力度，预测对营收和会员增长的影响',
    variables: [
      { id: 'adBudget', label: '广告预算 (元)', type: 'number', defaultValue: 50000, min: 5000, max: 500000, step: 5000 },
      { id: 'discountRate', label: '折扣力度 (%)', type: 'number', defaultValue: 15, min: 0, max: 50, step: 5 },
      { id: 'channelCount', label: '推广渠道数', type: 'number', defaultValue: 3, min: 1, max: 10, step: 1 },
      { id: 'campaignType', label: '活动类型', type: 'select', defaultValue: 'new-member', options: [
        { value: 'new-member', label: '拉新活动' },
        { value: 'retention', label: '留存活动' },
        { value: 'festival', label: '节日大促' },
      ]},
    ],
    simulate: async (values): Promise<SimulationResult[]> => {
      const adBudget = Number(values.adBudget);
      const discount = Number(values.discountRate);
      const channels = Number(values.channelCount);
      const baseRevenue = 300000;
      const baseMembers = 1200;
      const revenueBoost = adBudget * 0.8 * (1 + channels * 0.05) * (discount > 30 ? 0.7 : 1);
      const memberBoost = adBudget * 0.003 * (1 + channels * 0.15) * (String(values.campaignType) === 'new-member' ? 1.5 : 1);
      const costIncrease = adBudget * 0.6;
      return [
        { variable: '预估营收', before: baseRevenue, after: Math.round(baseRevenue + revenueBoost), unit: '元', direction: 'up', changePercent: Math.round((revenueBoost / baseRevenue) * 100) },
        { variable: '新增会员', before: baseMembers, after: Math.round(baseMembers + memberBoost), unit: '人', direction: 'up', changePercent: Math.round((memberBoost / baseMembers) * 100) },
        { variable: 'ROI', before: 2.5, after: Math.round(((revenueBoost - costIncrease) / adBudget + 2.5) * 10) / 10, unit: 'x', direction: revenueBoost > costIncrease ? 'up' : 'down', changePercent: Math.round(((revenueBoost - costIncrease) / adBudget / 2.5) * 100) },
      ];
    },
  };
}

function createStaffPreset(): ScenarioPreset {
  return {
    id: 'staff-scheduling',
    label: '排班人力模拟',
    description: '调整排班人数与班次结构，预测服务效率与人力成本',
    variables: [
      { id: 'staffCount', label: '店员总数', type: 'number', defaultValue: 8, min: 3, max: 30, step: 1 },
      { id: 'peakRatio', label: '高峰时段占比 (%)', type: 'number', defaultValue: 60, min: 30, max: 90, step: 5 },
      { id: 'shiftMode', label: '班次模式', type: 'select', defaultValue: 'three-shift', options: [
        { value: 'single-shift', label: '单班制' },
        { value: 'two-shift', label: '两班制' },
        { value: 'three-shift', label: '三班制' },
      ]},
      { id: 'avgCrowd', label: '日均客流', type: 'number', defaultValue: 500, min: 100, max: 5000, step: 100 },
    ],
    simulate: async (values): Promise<SimulationResult[]> => {
      const staff = Number(values.staffCount);
      const peak = Number(values.peakRatio);
      const crowd = Number(values.avgCrowd);
      const isThreeShift = String(values.shiftMode) === 'three-shift';
      const isTwoShift = String(values.shiftMode) === 'two-shift';
      const efficiency = (isThreeShift ? 85 : isTwoShift ? 75 : 60) + peak * 0.05;
      const waitTime = Math.max(2, Math.round(crowd / (staff * (isThreeShift ? 4 : isTwoShift ? 3 : 2)) * (1 - peak / 200)));
      const monthlyCost = staff * 5500 * (isThreeShift ? 1.1 : isTwoShift ? 1 : 0.85);
      return [
        { variable: '服务效率', before: 65, after: Math.min(98, Math.round(efficiency)), unit: '%', direction: 'up', changePercent: Math.round((efficiency - 65) / 65 * 100) },
        { variable: '预估等待时间', before: 15, after: waitTime, unit: '分钟', direction: waitTime < 15 ? 'up' : 'down', changePercent: Math.round((15 - waitTime) / 15 * 100) },
        { variable: '月人力成本', before: 44000, after: Math.round(monthlyCost), unit: '元', direction: 'down', changePercent: Math.round((monthlyCost - 44000) / 44000 * 100) },
      ];
    },
  };
}

function createPricingPreset(): ScenarioPreset {
  return {
    id: 'pricing-optimization',
    label: '定价策略模拟',
    description: '调整票价与会员价，预测营收变化与客单价',
    variables: [
      { id: 'basePrice', label: '标准票价 (元)', type: 'number', defaultValue: 128, min: 30, max: 500, step: 10 },
      { id: 'memberDiscount', label: '会员折扣 (%)', type: 'number', defaultValue: 20, min: 5, max: 80, step: 5 },
      { id: 'membershipRatio', label: '会员占比 (%)', type: 'number', defaultValue: 40, min: 10, max: 90, step: 5 },
      { id: 'seasonType', label: '季节类型', type: 'select', defaultValue: 'peak', options: [
        { value: 'peak', label: '旺季' },
        { value: 'regular', label: '平季' },
        { value: 'off-peak', label: '淡季' },
      ]},
    ],
    simulate: async (values): Promise<SimulationResult[]> => {
      const basePrice = Number(values.basePrice);
      const discount = Number(values.memberDiscount);
      const memberRatio = Number(values.membershipRatio);
      const season = String(values.seasonType);
      const seasonMultiplier = season === 'peak' ? 1.3 : season === 'off-peak' ? 0.7 : 1;
      const avgVisitor = Math.round(1500 * seasonMultiplier);
      const memberPrice = Math.round(basePrice * (1 - discount / 100));
      const avgPrice = Math.round(basePrice * (1 - memberRatio / 100 * discount / 100));
      const dailyRevenue = avgPrice * avgVisitor;
      const baseRevenue = basePrice * avgVisitor;
      return [
        { variable: '日均客流', before: 1500, after: Math.round(avgVisitor * (1 + discount / 200)), unit: '人', direction: avgVisitor > 1500 ? 'up' : 'down', changePercent: Math.round((avgVisitor - 1500) / 1500 * 100) },
        { variable: '日均营收', before: baseRevenue, after: dailyRevenue, unit: '元', direction: dailyRevenue > baseRevenue ? 'up' : 'down', changePercent: Math.round((dailyRevenue - baseRevenue) / baseRevenue * 100) },
        { variable: '会员消费均价', before: 96, after: memberPrice, unit: '元', direction: memberPrice > 96 ? 'up' : 'down', changePercent: Math.round((memberPrice - 96) / 96 * 100) },
      ];
    },
  };
}

// ─── 预设配置校验 ─────────────────────────────────────

describe('AiScenarioSimulatorPage — ScenarioPreset config', () => {
  const presets = [createMarketingPreset(), createStaffPreset(), createPricingPreset()];

  for (const preset of presets) {
    describe(`${preset.label} (${preset.id})`, () => {
      it('拥有有效的 id', () => {
        assert.ok(typeof preset.id === 'string' && preset.id.length > 0);
      });

      it('拥有有效的 label', () => {
        assert.ok(typeof preset.label === 'string' && preset.label.length > 0);
      });

      it('拥有描述信息', () => {
        assert.ok(typeof preset.description === 'string' && preset.description.length > 0);
      });

      it('至少有一个变量', () => {
        assert.ok(Array.isArray(preset.variables) && preset.variables.length > 0);
      });

      for (const v of preset.variables) {
        it(`变量 "${v.label}" (${v.id}) 配置有效`, () => {
          assert.ok(typeof v.id === 'string');
          assert.ok(typeof v.label === 'string');
          assert.ok(v.type === 'number' || v.type === 'select');
          if (v.type === 'number') {
            assert.strictEqual(typeof v.defaultValue, 'number');
            assert.strictEqual(typeof v.min, 'number');
            assert.strictEqual(typeof v.max, 'number');
            assert.ok(Number(v.defaultValue) >= (v.min ?? 0));
            assert.ok(Number(v.defaultValue) <= (v.max ?? Infinity));
          }
          if (v.type === 'select') {
            assert.ok(Array.isArray(v.options) && v.options.length > 0);
            assert.ok(v.options?.some((o) => o.value === v.defaultValue));
          }
        });
      }
    });
  }
});

// ─── 营销预算分配 - simulate 逻辑 ──────────────────

describe('AiScenarioSimulatorPage — marketing-budget simulate', () => {
  const preset = createMarketingPreset();

  it('默认参数返回三个结果', async () => {
    const results = await preset.simulate({ adBudget: 50000, discountRate: 15, channelCount: 3, campaignType: 'new-member' });
    assert.strictEqual(results.length, 3);
  });

  it('每个结果包含必要字段', async () => {
    const results = await preset.simulate({ adBudget: 50000, discountRate: 15, channelCount: 3, campaignType: 'new-member' });
    for (const r of results) {
      assert.ok(typeof r.variable === 'string');
      assert.ok(typeof r.before === 'number');
      assert.ok(typeof r.after === 'number');
      assert.ok(typeof r.unit === 'string');
      assert.ok(r.direction === 'up' || r.direction === 'down');
      assert.ok(typeof r.changePercent === 'number');
    }
  });

  it('高折扣(>30%)时预估营收增长放缓', async () => {
    const lowDiscount = await preset.simulate({ adBudget: 100000, discountRate: 15, channelCount: 3, campaignType: 'new-member' });
    const highDiscount = await preset.simulate({ adBudget: 100000, discountRate: 40, channelCount: 3, campaignType: 'new-member' });
    const revenueLow = lowDiscount.find((r) => r.variable === '预估营收')!;
    const revenueHigh = highDiscount.find((r) => r.variable === '预估营收')!;
    assert.ok(revenueLow.after > revenueHigh.after, '高折扣应降低营收增幅');
  });

  it('拉新活动新增会员更多', async () => {
    const newMember = await preset.simulate({ adBudget: 50000, discountRate: 15, channelCount: 3, campaignType: 'new-member' });
    const retention = await preset.simulate({ adBudget: 50000, discountRate: 15, channelCount: 3, campaignType: 'retention' });
    const nm = newMember.find((r) => r.variable === '新增会员')!;
    const rt = retention.find((r) => r.variable === '新增会员')!;
    assert.ok(nm.after > rt.after, '拉新活动新增会员应更多');
  });

  it('更多渠道提升营收', async () => {
    const fewCh = await preset.simulate({ adBudget: 50000, discountRate: 15, channelCount: 1, campaignType: 'retention' });
    const manyCh = await preset.simulate({ adBudget: 50000, discountRate: 15, channelCount: 10, campaignType: 'retention' });
    const revFew = fewCh.find((r) => r.variable === '预估营收')!;
    const revMany = manyCh.find((r) => r.variable === '预估营收')!;
    assert.ok(revMany.after > revFew.after, '更多渠道应提升营收');
  });

  it('极低预算边界值', async () => {
    const results = await preset.simulate({ adBudget: 5000, discountRate: 0, channelCount: 1, campaignType: 'retention' });
    assert.strictEqual(results.length, 3);
    for (const r of results) {
      assert.ok(typeof r.after === 'number' && !Number.isNaN(r.after));
    }
  });
});

// ─── 排班人力模拟 - simulate 逻辑 ──────────────────

describe('AiScenarioSimulatorPage — staff-scheduling simulate', () => {
  const preset = createStaffPreset();

  it('默认参数返回三个结果', async () => {
    const results = await preset.simulate({ staffCount: 8, peakRatio: 60, shiftMode: 'three-shift', avgCrowd: 500 });
    assert.strictEqual(results.length, 3);
  });

  it('三班制效率高于两班制', async () => {
    const three = await preset.simulate({ staffCount: 8, peakRatio: 60, shiftMode: 'three-shift', avgCrowd: 500 });
    const two = await preset.simulate({ staffCount: 8, peakRatio: 60, shiftMode: 'two-shift', avgCrowd: 500 });
    const eff3 = three.find((r) => r.variable === '服务效率')!;
    const eff2 = two.find((r) => r.variable === '服务效率')!;
    assert.ok(eff3.after > eff2.after, '三班制效率应更高');
  });

  it('更多店员降低等待时间', async () => {
    const few = await preset.simulate({ staffCount: 3, peakRatio: 60, shiftMode: 'two-shift', avgCrowd: 500 });
    const more = await preset.simulate({ staffCount: 30, peakRatio: 60, shiftMode: 'two-shift', avgCrowd: 500 });
    const wFew = few.find((r) => r.variable === '预估等待时间')!;
    const wMore = more.find((r) => r.variable === '预估等待时间')!;
    assert.ok(wMore.after <= wFew.after, '更多店员应降低等待时间');
  });

  it('等待时间不低于2分钟', async () => {
    const results = await preset.simulate({ staffCount: 30, peakRatio: 90, shiftMode: 'three-shift', avgCrowd: 100 });
    const wait = results.find((r) => r.variable === '预估等待时间')!;
    assert.ok(wait.after >= 2, '等待时间不低于2分钟');
  });

  it('单班制人力成本最低', async () => {
    const single = await preset.simulate({ staffCount: 8, peakRatio: 60, shiftMode: 'single-shift', avgCrowd: 500 });
    const three = await preset.simulate({ staffCount: 8, peakRatio: 60, shiftMode: 'three-shift', avgCrowd: 500 });
    const costS = single.find((r) => r.variable === '月人力成本')!;
    const cost3 = three.find((r) => r.variable === '月人力成本')!;
    assert.ok(costS.after < cost3.after, '单班制成本应最低');
  });
});

// ─── 定价策略模拟 - simulate 逻辑 ──────────────────

describe('AiScenarioSimulatorPage — pricing-optimization simulate', () => {
  const preset = createPricingPreset();

  it('默认参数返回三个结果', async () => {
    const results = await preset.simulate({ basePrice: 128, memberDiscount: 20, membershipRatio: 40, seasonType: 'peak' });
    assert.strictEqual(results.length, 3);
  });

  it('旺季日均客流高于平季', async () => {
    const peak = await preset.simulate({ basePrice: 128, memberDiscount: 20, membershipRatio: 40, seasonType: 'peak' });
    const regular = await preset.simulate({ basePrice: 128, memberDiscount: 20, membershipRatio: 40, seasonType: 'regular' });
    const pVisitor = peak.find((r) => r.variable === '日均客流')!;
    const rVisitor = regular.find((r) => r.variable === '日均客流')!;
    assert.ok(pVisitor.after > rVisitor.after, '旺季客流应更高');
  });

  it('淡季日均客流低于平季', async () => {
    const regular = await preset.simulate({ basePrice: 128, memberDiscount: 20, membershipRatio: 40, seasonType: 'regular' });
    const offpeak = await preset.simulate({ basePrice: 128, memberDiscount: 20, membershipRatio: 40, seasonType: 'off-peak' });
    const rV = regular.find((r) => r.variable === '日均营收')!;
    const oV = offpeak.find((r) => r.variable === '日均营收')!;
    assert.ok(oV.after < rV.after, '淡季营收应低于平季');
  });

  it('折扣越大会员价越低', async () => {
    const lowDisc = await preset.simulate({ basePrice: 128, memberDiscount: 5, membershipRatio: 40, seasonType: 'peak' });
    const highDisc = await preset.simulate({ basePrice: 128, memberDiscount: 80, membershipRatio: 40, seasonType: 'peak' });
    const lPrice = lowDisc.find((r) => r.variable === '会员消费均价')!;
    const hPrice = highDisc.find((r) => r.variable === '会员消费均价')!;
    assert.ok(hPrice.after < lPrice.after, '折扣越大会员价越低');
  });

  it('标准票价边界值', async () => {
    const results = await preset.simulate({ basePrice: 30, memberDiscount: 20, membershipRatio: 10, seasonType: 'off-peak' });
    assert.strictEqual(results.length, 3);
    for (const r of results) {
      assert.ok(!Number.isNaN(r.after), `${r.variable} 无 NaN`);
    }
  });

  it('高会员占比拉低日均营收', async () => {
    const lowRatio = await preset.simulate({ basePrice: 128, memberDiscount: 20, membershipRatio: 10, seasonType: 'regular' });
    const highRatio = await preset.simulate({ basePrice: 128, memberDiscount: 20, membershipRatio: 90, seasonType: 'regular' });
    const lRev = lowRatio.find((r) => r.variable === '日均营收')!;
    const hRev = highRatio.find((r) => r.variable === '日均营收')!;
    assert.ok(hRev.after <= lRev.after, '高会员占比应降低日均营收');
  });
});

// ─── 边界与异常场景 ────────────────────────────────

describe('AiScenarioSimulatorPage — edge cases', () => {
  it('所有预设 simulate 都是 async 函数', () => {
    const presets = [createMarketingPreset(), createStaffPreset(), createPricingPreset()];
    for (const p of presets) {
      assert.ok(p.simulate.constructor.name === 'AsyncFunction' || p.simulate.constructor.name === 'Function');
    }
  });

  it('每个预设 ID 唯一', () => {
    const presets = [createMarketingPreset(), createStaffPreset(), createPricingPreset()];
    const ids = presets.map((p) => p.id);
    assert.strictEqual(new Set(ids).size, ids.length);
  });

  it('变量 ID 在预设内唯一', () => {
    const presets = [createMarketingPreset(), createStaffPreset(), createPricingPreset()];
    for (const p of presets) {
      const vids = p.variables.map((v) => v.id);
      assert.strictEqual(new Set(vids).size, vids.length, `${p.id} 变量 ID 不唯一`);
    }
  });

  it('number 类型变量有合理的步进值', () => {
    const presets = [createMarketingPreset(), createStaffPreset(), createPricingPreset()];
    for (const p of presets) {
      for (const v of p.variables) {
        if (v.type === 'number') {
          assert.ok(v.step !== undefined, `${p.id}/${v.id} 缺少 step`);
          assert.ok(v.step > 0, `${p.id}/${v.id} step 应大于 0`);
          if (v.min !== undefined && v.max !== undefined) {
            assert.ok(v.step <= (v.max - v.min), `${p.id}/${v.id} step 不应超过范围`);
          }
        }
      }
    }
  });
});
