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
 * - 场景趋势统计面板
 * - 最新结果对比面板
 * - 场景使用说明面板
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

interface ScenarioTrend {
  label: string;
  avgAfter: number;
  count: number;
}

// ==================== 场景描述数据（按分类索引） ====================

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  '营销': '优化广告预算与营销策略，最大化 ROI',
  '运营': '平衡人力配置与服务质量，控制运营成本',
  '定价': '制定科学的定价策略，提升营收与客单价',
};

// ==================== 样式常量 ====================

const CARD_WHITE: React.CSSProperties = {
  background: '#f9fafb', borderRadius: 8, padding: 16, marginBottom: 20,
  border: '1px solid #e5e7eb',
};

const RESULT_CARD_UP: React.CSSProperties = {
  padding: 14, borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0',
};

const RESULT_CARD_DOWN: React.CSSProperties = {
  padding: 14, borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca',
};

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

// ==================== 预设结果汇总统计 ====================

interface PresetStats {
  totalVariables: number;
  totalCategories: number;
  avgSimTime: number;
}

const PRESET_STATS: PresetStats = {
  totalVariables: presets.reduce((sum, p) => sum + p.variables.length, 0),
  totalCategories: new Set(presets.map((p) => p.category)).size,
  avgSimTime: 1.2,
};

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
      setFeedback({ type: 'success', message: `模拟完成 (${results.length} 项结果)` });
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
    setFeedback({ type: 'success', message: '报告已导出' });
  }, [lastResults, activePreset]);

  const handleReset = useCallback(() => {
    setLastResults(null);
    setFeedback({ type: 'success', message: '已重置' });
  }, []);

  // 历史记录列定义
  const historyColumns: DataTableColumn<HistoryRecord>[] = useMemo(
    () => [
      { key: 'timestamp', title: '时间', render: (item) => <span>{item.timestamp}</span>, width: '160px' },
      { key: 'presetLabel', title: '场景', render: (item) => <span>{item.presetLabel}</span>, sortable: true },
      {
        key: 'resultCount',
        title: '结果数',
        width: '80px',
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

  // 场景趋势统计
  const scenarioTrend: ScenarioTrend[] | null = useMemo(() => {
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
  }, [history]);

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
        <StatCard label="可用场景" value={presets.length.toString()} helper="预设场景" />
        <StatCard label="模拟次数" value={history.length.toString()} helper="本次会话" />
        <StatCard
          label="当前场景"
          value={currentPreset.label}
          helper={`分类: ${currentPreset.category}`}
        />
      </div>

      {/* 场景能力面板 */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: 10, marginBottom: 20,
      }}>
        <div style={{ padding: 12, borderRadius: 8, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>总变量数</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{PRESET_STATS.totalVariables}</div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>可调参数</div>
        </div>
        <div style={{ padding: 12, borderRadius: 8, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>覆盖场景</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{PRESET_STATS.totalCategories}</div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>决策领域</div>
        </div>
        <div style={{ padding: 12, borderRadius: 8, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>模拟延迟</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{PRESET_STATS.avgSimTime}s</div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>平均耗时</div>
        </div>
        <div style={{ padding: 12, borderRadius: 8, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>本次会话</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{history.length}</div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>模拟次数</div>
        </div>
      </div>

      {/* 分类描述 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {Array.from(new Set(presets.map((p) => p.category))).map((cat) => (
          <div
            key={cat}
            style={{
              padding: '10px 14px', borderRadius: 8, fontSize: 13,
              background: currentPreset.category === cat ? '#eff6ff' : '#f9fafb',
              border: currentPreset.category === cat ? '1px solid #93c5fd' : '1px solid #e5e7eb',
              flex: 1, minWidth: 140,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 2 }}>{cat}</div>
            <div style={{ color: '#6b7280', fontSize: 12 }}>{CATEGORY_DESCRIPTIONS[cat] ?? ''}</div>
          </div>
        ))}
      </div>

      {/* 最新结果对比面板 */}
      {lastResults && (
        <div style={CARD_WHITE}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
            📊 最新模拟结果对比
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {lastResults.map((r) => (
              <div key={r.variable} style={r.direction === 'up' ? RESULT_CARD_UP : RESULT_CARD_DOWN}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{r.variable}</div>
                <div style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>
                  <span style={{ color: '#9ca3af' }}>之前:</span> {typeof r.before === 'number' ? r.before.toLocaleString() : r.before} {r.unit}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
                  {typeof r.after === 'number' ? r.after.toLocaleString() : r.after} {r.unit}
                  <span style={{
                    marginLeft: 8, fontSize: 13, fontWeight: 500,
                    color: r.direction === 'up' ? '#16a34a' : '#dc2626',
                  }}>
                    {r.direction === 'up' ? '↑' : '↓'}{Math.abs(r.changePercent)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 场景趋势统计 */}
      {scenarioTrend && scenarioTrend.length > 0 && (
        <div style={CARD_WHITE}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
            📈 场景趋势概览
          </h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {scenarioTrend.map((t) => (
              <div
                key={t.label}
                style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '10px 14px', background: '#fff',
                  borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13,
                }}
              >
                <span style={{ fontWeight: 500 }}>{t.label}</span>
                <span style={{ color: '#6b7280' }}>
                  {t.count} 项结果 · 平均 {t.avgAfter.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 场景使用说明 */}
      {showDescription && (
        <div style={{
          background: '#f0f7ff', borderRadius: 8, padding: 16, marginBottom: 20,
          border: '1px solid #bfdbfe',
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: '#1e40af' }}>
            💡 {currentPreset.label} - 使用说明
          </h3>
          <div style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.6, marginBottom: 8 }}>
            {currentPreset.description}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            <span style={{ fontWeight: 500 }}>变量数:</span> {currentPreset.variables.length} 个 ·
            <span style={{ fontWeight: 500, marginLeft: 8 }}>分类:</span> {currentPreset.category}
          </div>
          <button
            onClick={() => setShowDescription(false)}
            style={{
              marginTop: 8, color: '#2563eb', background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 12, textDecoration: 'underline', padding: 0,
            }}
          >
            收起说明
          </button>
        </div>
      )}

      {/* 历史记录 */}
      <div style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>📋 历史模拟记录</h3>
        {history.length === 0 ? (
          <div style={{
            padding: 32, textAlign: 'center', color: '#9ca3af',
            border: '1px dashed #d1d5db', borderRadius: 8, background: '#f9fafb',
          }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🧪</div>
            <div style={{ fontSize: 14, marginBottom: 6 }}>暂无模拟记录</div>
            <div style={{ fontSize: 12, color: '#a0aec0' }}>调整参数并点击「模拟」按钮开始</div>
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
