'use client';

import React, { useState, useCallback } from 'react';
import { AIScenarioSimulator } from '@m5/ui';
import type { ScenarioVariable, SimulationResult } from '@m5/ui';

// ─── 预设场景配置 ─────────────────────────────────────

interface ScenarioPreset {
  id: string;
  label: string;
  description: string;
  variables: ScenarioVariable[];
  simulate: (values: Record<string, number | string>) => Promise<SimulationResult[]>;
}

const presets: ScenarioPreset[] = [
  {
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
  },
  {
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
  },
  {
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
  },
];

// ─── 页面组件 ───────────────────────────────────────────

export default function AiScenarioSimulatorPage() {
  const [activePreset, setActivePreset] = useState<string>(presets[0]!.id);
  const [showDescription, setShowDescription] = useState(true);

  const currentPreset = (presets.find((p) => p.id === activePreset) ?? presets[0]) as ScenarioPreset;

  const handleSimulate = useCallback(
    async (values: Record<string, number | string>): Promise<SimulationResult[]> => {
      return currentPreset.simulate(values);
    },
    [currentPreset],
  );

  return (
    <div style={{ padding: '24px', maxWidth: 1000 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>AI 场景模拟器</h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>
          调整参数预测门店运营决策效果，辅助数据驱动经营决策
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePreset(p.id)}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: activePreset === p.id ? '2px solid #2563eb' : '1px solid #d1d5db',
                background: activePreset === p.id ? '#eff6ff' : '#fff',
                color: activePreset === p.id ? '#2563eb' : '#374151',
                cursor: 'pointer',
                fontWeight: activePreset === p.id ? 600 : 400,
                fontSize: 14,
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        {showDescription && (
          <div
            style={{
              padding: '12px 16px',
              background: '#f9fafb',
              borderRadius: 8,
              fontSize: 14,
              color: '#6b7280',
              marginBottom: 16,
              border: '1px solid #e5e7eb',
            }}
          >
            {currentPreset.description}
            <button
              onClick={() => setShowDescription(false)}
              style={{ marginLeft: 12, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}
            >
              收起
            </button>
          </div>
        )}
      </div>

      <AIScenarioSimulator
        key={activePreset}
        scenarioName={currentPreset.label}
        variables={currentPreset.variables}
        onSimulate={handleSimulate}
        baselineDescription="基于近30天历史数据进行模拟预测，结果仅供参考。"
        loadingText="AI 正在模拟计算..."
        errorText="模拟失败，请检查参数后重试"
      />
    </div>
  );
}
