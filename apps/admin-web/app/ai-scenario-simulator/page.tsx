'use client';

/**
 * AI 场景模拟器 — AI Scenario Simulator Page
 * 功能: 调整参数预测门店运营决策效果，辅助数据驱动经营决策
 * 角色: 🤖 运营决策者
 *
 * 页面结构:
 * - 场景预设选择 (Marketing/Staff/Pricing)
 * - 场景描述面板
 * - AI 场景模拟输入 (variables)
 * - 模拟结果展示 (对比卡片)
 * - 历史模拟记录列表
 * - 导出报告 + 重置
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Button,
  DataTable,
  FormSubmitFeedback,
  PageShell,
  StatCard,
  StatusBadge,
  type DataTableColumn,
} from '@m5/ui';
import { AIScenarioSimulator } from '@m5/ui';
import type { ScenarioVariable, SimulationResult } from '@m5/ui';

// ==================== 类型定义 ====================

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

// ==================== 预设场景配置 ====================

const presets: ScenarioPreset[] = [
  {
    id: 'marketing-budget',
    label: '营销预算分配模拟',
    description: '调整广告预算与折扣力度，预测对营收和会员增长的影响',
    category: '营销',
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
    category: '运营',
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
    category: '定价',
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

// ==================== 主页面组件 ====================

export default function AiScenarioSimulatorPage() {
  const [activePreset, setActivePreset] = useState<string>(presets[0]!.id);
  const [showDescription, setShowDescription] = useState(true);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [lastResults, setLastResults] = useState<SimulationResult[] | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const currentPreset = (presets.find((p) => p.id === activePreset) ?? presets[0]) as ScenarioPreset;

  // 场景分组
  const categories = useMemo(() => {
    const map = new Map<string, ScenarioPreset[]>();
    presets.forEach((p) => {
      const list = map.get(p.category) ?? [];
      list.push(p);
      map.set(p.category, list);
    });
    return Array.from(map.entries());
  }, []);

  const handleSimulate = useCallback(
    async (values: Record<string, number | string>): Promise<SimulationResult[]> => {
      const results = await currentPreset.simulate(values);
      const record: HistoryRecord = {
        id: `sim-${Date.now()}`,
        presetLabel: currentPreset.label,
        values,
        results,
        timestamp: new Date().toLocaleString('zh-CN'),
      };
      setHistory((prev) => [record, ...prev].slice(0, 20));
      setLastResults(results);
      return results;
    },
    [currentPreset],
  );

  const handleExportReport = useCallback(() => {
    if (!lastResults) return;
    const lines = ['变量,模拟前,模拟后,单位,变化率'];
    for (const r of lastResults) {
      lines.push(`${r.variable},${r.before},${r.after},${r.unit},${r.changePercent}%`);
    }
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulation-${activePreset}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [lastResults, activePreset]);

  const handleReset = useCallback(() => {
    setLastResults(null);
    setFeedback({ type: 'success', message: '已重置' });
  }, []);

  // 历史记录列定义
  const historyColumns: DataTableColumn<HistoryRecord>[] = useMemo(
    () => [
      { key: 'timestamp', title: '时间', dataKey: 'timestamp', width: 160 },
      { key: 'presetLabel', title: '场景', dataKey: 'presetLabel', sortable: true },
      {
        key: 'resultCount',
        title: '结果数',
        width: 80,
        render: (item) => <span>{item.results.length} 项</span>,
      },
      {
        key: 'topResult',
        title: '主要结果',
        render: (item) => {
          const top = item.results[0];
          return top ? (
            <span style={{ fontSize: 13 }}>
              {top.variable}: {top.after.toLocaleString()} {top.unit}
              <span style={{ color: top.direction === 'up' ? '#22c55e' : '#ef4444', marginLeft: 4 }}>
                {top.direction === 'up' ? '↑' : '↓'}{Math.abs(top.changePercent)}%
              </span>
            </span>
          ) : null;
        },
      },
    ],
    [],
  );

  return (
    <PageShell
      title="AI 场景模拟器"
      subtitle="调整参数预测门店运营决策效果"
    >
      {/* 页面头部 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {categories.map(([cat, items]) => (
            <React.Fragment key={cat}>
              {items.map((p) => (
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
            </React.Fragment>
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

      {/* 反馈 */}
      {feedback && (
        <FormSubmitFeedback
          success={feedback.type === 'success' ? feedback.message : undefined}
          onDismissSuccess={() => setFeedback(null)}
        />
      )}

      {/* 模拟器输入 + 结果 */}
      <AIScenarioSimulator
        key={activePreset + (lastResults ? '-rerun' : '')}
        scenarioName={currentPreset.label}
        variables={currentPreset.variables}
        onSimulate={handleSimulate}
        baselineDescription="基于近30天历史数据进行模拟预测，结果仅供参考。"
        loadingText="AI 正在模拟计算..."
        errorText="模拟失败，请检查参数后重试"
      />

      {/* 操作栏 */}
      <div style={{ display: 'flex', gap: 8, marginTop: 16, marginBottom: 24 }}>
        <Button variant="outline" onClick={handleExportReport} disabled={!lastResults}>
          📥 导出报告
        </Button>
        <Button variant="outline" onClick={handleReset}>
          🔄 重置
        </Button>
      </div>

      {/* 统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        <StatCard title="可用场景" value={presets.length.toString()} secondary="预设场景" />
        <StatCard title="模拟次数" value={history.length.toString()} secondary="本次会话" />
        <StatCard
          title="当前场景"
          value={currentPreset.label}
          secondary={`分类: ${currentPreset.category}`}
        />
      </div>

      {/* 历史记录 */}
      <div style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>📋 历史模拟记录</h3>
        {history.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#999', border: '1px solid #f0f0f0', borderRadius: 8 }}>
            暂无模拟记录，请先运行一次模拟
          </div>
        ) : (
          <DataTable
            columns={historyColumns}
            items={history}
            rowKey={(item) => item.id}
            compact
            striped
            emptyText="暂无记录"
          />
        )}
      </div>
    </PageShell>
  );
}
