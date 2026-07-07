'use client';

import React, { useMemo, useState } from 'react';

import {
  AIDecisionPanel,
  RuleRecommendationPanel,
  SalesForecastPanel,
  SmartTrendChart,
  AISummaryCard,
  type DecisionRuleResult,
  type DecisionPanelConfig,
  type RuleRecommendation,
  type ForecastDataPoint,
  type TrendDataPoint,
} from '@m5/ui';

// ============================================================
//  Mock AI 决策数据
// ============================================================

/* 规则执行结果 — 使用 DecisionRuleResult */
const MOCK_RULES: DecisionRuleResult[] = [
  {
    ruleId: 'r1',
    ruleName: '会员折扣合规校验',
    detail: '检查折扣是否超过会员等级允许的上限',
    triggered: false,
    confidence: 0.95,
    suggestion: '所有折扣均在合规范围内',
    executedAt: new Date(Date.now() - 60000).toISOString(),
  },
  {
    ruleId: 'r2',
    ruleName: '库存流动性检测',
    detail: '检查近7天未动销商品',
    triggered: true,
    confidence: 0.78,
    suggestion: '15款商品超过7天未销售，建议评估打折清仓',
    executedAt: new Date(Date.now() - 45000).toISOString(),
  },
  {
    ruleId: 'r3',
    ruleName: '促销重叠检测',
    detail: '检测同一商品是否被多个促销活动覆盖',
    triggered: true,
    confidence: 0.88,
    suggestion: '「精品咖啡豆」同时被满减和限时折扣覆盖，建议合并',
    executedAt: new Date(Date.now() - 30000).toISOString(),
  },
  {
    ruleId: 'r4',
    ruleName: '会员流失预警',
    detail: '基于近90天消费频次预测流失风险',
    triggered: true,
    confidence: 0.82,
    suggestion: '8位钻石会员近30天无消费记录，建议主动触达',
    executedAt: new Date(Date.now() - 20000).toISOString(),
  },
  {
    ruleId: 'r5',
    ruleName: '支付渠道对账',
    detail: '检查各支付渠道交易记录一致性',
    triggered: false,
    confidence: 0.99,
    suggestion: '微信/支付宝/现金对账一致',
    executedAt: new Date(Date.now() - 15000).toISOString(),
  },
  {
    ruleId: 'r6',
    ruleName: '设备负载检测',
    detail: '检查POS终端CPU/内存是否过载',
    triggered: true,
    confidence: 0.91,
    suggestion: 'POS-01 CPU使用率92%，建议重启或检查进程',
    executedAt: new Date(Date.now() - 10000).toISOString(),
  },
];

const MOCK_DECISION_CONFIG: DecisionPanelConfig = {
  autoRefreshMs: 15000,
  maxEvents: 10,
};

/* 规则建议 */
const MOCK_RECOMMENDATIONS: RuleRecommendation[] = [
  {
    id: 'rec1',
    title: '合并重叠促销活动',
    description: '「精品咖啡豆」同时被2个活动覆盖，建议合并为统一满减活动',
    category: 'governance',
    confidence: 'high',
    impact: '提升转化率约12%，减少顾客困惑',
    estimatedBenefit: '预计提升销售额 8-15%',
    adopted: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'rec2',
    title: '主动触达钻石会员',
    description: '8位钻石会员已30天未到店，建议发送专属优惠券挽回',
    category: 'member_retention',
    confidence: 'high',
    impact: '预计挽回60%流失会员',
    estimatedBenefit: '挽回年消费约 ¥36,000',
    adopted: false,
    createdAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: 'rec3',
    title: '重启POS-01终端',
    description: 'POS-01 CPU负载92%，长时间未重启可能导致交易卡顿',
    category: 'performance',
    confidence: 'medium',
    impact: '立即降低CPU至正常水平(30-50%)',
    estimatedBenefit: '减少交易超时风险',
    adopted: true,
    resultingRuleId: 'auto-trigger-001',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'rec4',
    title: '15款慢动销商品清仓',
    description: '建议对7天以上未销售商品设置8折清仓标签',
    category: 'cost',
    confidence: 'medium',
    impact: '释放库存资金',
    estimatedBenefit: '预计回笼资金 ¥12,000',
    adopted: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'rec5',
    title: '冷库传感器校准',
    description: '湿度传感器读数偏差较大，建议校准或更换',
    category: 'security',
    confidence: 'low',
    impact: '避免食品存储风险',
    estimatedBenefit: '降低损耗风险',
    adopted: false,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

/* 销售预测 */
const MOCK_SALES_FORECAST: ForecastDataPoint[] = [
  { label: '06-20', actual: 2800, predicted: 2900, optimistic: 3200, pessimistic: 2600 },
  { label: '06-21', actual: 3100, predicted: 3050, optimistic: 3400, pessimistic: 2700 },
  { label: '06-22', actual: 2900, predicted: 2950, optimistic: 3300, pessimistic: 2600 },
  { label: '06-23', actual: 3300, predicted: 3200, optimistic: 3600, pessimistic: 2900 },
  { label: '06-24', predicted: 3350, optimistic: 3700, pessimistic: 3000 },
  { label: '06-25', predicted: 3400, optimistic: 3800, pessimistic: 3100 },
  { label: '06-26', predicted: 3250, optimistic: 3650, pessimistic: 2900 },
];

/* 趋势数据 */
const MOCK_TREND: TrendDataPoint[] = [
  { label: '周一', value: 2800 },
  { label: '周二', value: 2650 },
  { label: '周三', value: 2900 },
  { label: '周四', value: 3100 },
  { label: '周五', value: 3300 },
  { label: '周六', value: 3500 },
  { label: '周日', value: 3200 },
];

// ============================================================
//  Styles
// ============================================================

const styles = {
  container: {
    maxWidth: 1280,
    margin: '0 auto',
    padding: '32px 24px',
  },
  header: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: 700,
    color: '#f1f5f9',
    margin: 0,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 600,
    color: '#cbd5e1',
    marginBottom: 16,
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  grid_2: {
    display: 'grid' as const,
    gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
    gap: 24,
    marginBottom: 32,
  },
  grid_3: {
    display: 'grid' as const,
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 24,
    marginBottom: 32,
  },
  card: {
    borderRadius: 16,
    background: 'rgba(15,23,42,0.3)',
    border: '1px solid rgba(148,163,184,0.1)',
    padding: 20,
    overflow: 'hidden' as const,
  },
  summaryGrid: {
    display: 'grid' as const,
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 12,
    marginBottom: 24,
  },
  summaryItem: {
    borderRadius: 12,
    padding: '14px 16px',
    background: 'rgba(15,23,42,0.35)',
    border: '1px solid rgba(148,163,184,0.08)',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: 700,
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
  },
};

// ============================================================
//  AI 决策建议页面
// ============================================================

export default function AIDecisionsPage() {
  const [lastUpdated] = useState(() => new Date().toLocaleTimeString('zh-CN', { hour12: false }));
  const [alerts, setAlerts] = useState<{ id: string; message: string; type: 'success' | 'info' | 'warning' }[]>([]);

  /* 计算摘要统计 */
  const summary = useMemo(() => {
    const highConf = MOCK_RECOMMENDATIONS.filter(r => r.confidence === 'high').length;
    const adopted = MOCK_RECOMMENDATIONS.filter(r => r.adopted).length;
    const triggered = MOCK_RULES.filter(r => r.triggered).length;
    const highConfRules = MOCK_RULES.filter(r => r.confidence > 0.5 && r.triggered).length;
    return { highConf, adopted, triggered, highConfRules, total: MOCK_RECOMMENDATIONS.length };
  }, []);

  const handleAcknowledge = (_id: string) => {
    // Mock handler
  };

  const handleAdopt = (id: string) => {
    setAlerts(prev => [
      ...prev,
      { id: `alert-${Date.now()}`, message: `已采纳建议: ${id}`, type: 'success' },
    ]);
  };

  const handleDismiss = (id: string) => {
    setAlerts(prev => [
      ...prev,
      { id: `alert-${Date.now()}`, message: `已忽略建议: ${id}`, type: 'info' },
    ]);
  };

  return (
    <div style={styles.container}>
      {/* ---- 页面标题 ---- */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🤖 AI 决策建议</h1>
          <p style={styles.subtitle}>
            基于门店运营数据的智能决策引擎 · 最后更新 {lastUpdated}
          </p>
        </div>
      </div>

      {/* ---- 运营摘要 ---- */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryItem}>
          <div style={styles.summaryLabel}>高置信建议</div>
          <div style={{ ...styles.summaryValue, color: '#4ade80' }}>{summary.highConf}</div>
        </div>
        <div style={styles.summaryItem}>
          <div style={styles.summaryLabel}>已采纳</div>
          <div style={{ ...styles.summaryValue, color: '#60a5fa' }}>{summary.adopted}</div>
        </div>
        <div style={styles.summaryItem}>
          <div style={styles.summaryLabel}>已触发规则</div>
          <div style={{ ...styles.summaryValue, color: '#ef4444' }}>{summary.triggered}</div>
        </div>
        <div style={styles.summaryItem}>
          <div style={styles.summaryLabel}>需关注</div>
          <div style={{ ...styles.summaryValue, color: '#facc15' }}>{summary.highConfRules}</div>
        </div>
        <div style={styles.summaryItem}>
          <div style={styles.summaryLabel}>总建议数</div>
          <div style={{ ...styles.summaryValue, color: '#a78bfa' }}>{summary.total}</div>
        </div>
      </div>

      {/* ---- AI 摘要卡片 ---- */}
      <div style={{ marginBottom: 32 }}>
        <AISummaryCard
          title="今日运营建议摘要"
          summary="AI引擎完成6条规则扫描，发现3条需要处理的问题。高价值会员流失风险为当前最高优先级事项，建议优先处理。"
          updatedAt={new Date().toISOString()}
        />
      </div>

      {/* ---- 第一行：规则执行结果 + 销售预测 ---- */}
      <div style={styles.sectionLabel}>
        <span>📋</span> 规则执行 & 销售预测
      </div>
      <div style={styles.grid_2}>
        {/* 规则执行面板 */}
        <div style={styles.card}>
          <AIDecisionPanel
            variant="pc"
            config={MOCK_DECISION_CONFIG}
          />
        </div>

        {/* 销售预测 */}
        <div style={styles.card}>
          <SalesForecastPanel
            dataPoints={MOCK_SALES_FORECAST}
            title="未来3天销售预测"
            trend="up"
            accuracy="high"
            confidence={85}
          />
        </div>
      </div>

      {/* ---- 第二行：建议面板 + 趋势图 ---- */}
      <div style={styles.sectionLabel}>
        <span>💡</span> 智能建议 & 趋势
      </div>
      <div style={styles.grid_2}>
        {/* 规则建议 */}
        <div style={styles.card}>
          <RuleRecommendationPanel
            recommendations={MOCK_RECOMMENDATIONS}
            onAdopt={handleAdopt}
            onDismiss={handleDismiss}
          />
        </div>

        {/* 周趋势 */}
        <div style={styles.card}>
          <SmartTrendChart
            data={MOCK_TREND}
            height={280}
            showValues
            title="📊 本周营业趋势"
          />
        </div>
      </div>

      {/* ---- 通知反馈 ---- */}
      {alerts.length > 0 && (
        <div
          style={{
            position: 'fixed' as const,
            bottom: 24,
            right: 24,
            display: 'flex',
            flexDirection: 'column' as const,
            gap: 8,
            zIndex: 9999,
          }}
        >
          {alerts.map(a => (
            <div
              key={a.id}
              style={{
                padding: '10px 18px',
                borderRadius: 10,
                background:
                  a.type === 'success' ? 'rgba(34,197,94,0.15)' :
                  a.type === 'warning' ? 'rgba(250,204,21,0.15)' : 'rgba(96,165,250,0.15)',
                border: `1px solid ${
                  a.type === 'success' ? 'rgba(34,197,94,0.4)' :
                  a.type === 'warning' ? 'rgba(250,204,21,0.4)' : 'rgba(96,165,250,0.4)'
                }`,
                color: '#e2e8f0',
                fontSize: 13,
                backdropFilter: 'blur(8px)',
              }}
            >
              {a.message}
            </div>
          ))}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 40, fontSize: 12, color: '#475569' }}>
        AI 决策建议每15分钟基于最新数据生成
      </div>
    </div>
  );
}
