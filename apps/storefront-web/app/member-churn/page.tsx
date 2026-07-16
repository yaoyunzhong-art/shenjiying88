'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';

import {
  AIMemberChurnPredictionPanel,
  AnomalyDiagnosisReport,
  PredictionAnalysisPanel,
  PageShell,
  StatCard,
  QuickStats,
  StatusBadge,
  type ChurnPrediction,
  type ChurnRiskLevel,
  type DiagnosisFinding,
  type PredictionPoint,
  type PredictionSummary,
} from '@m5/ui';

// ============================================================
//  Mock 数据
// ============================================================

const MOCK_CHURN_PREDICTIONS: ChurnPrediction[] = [
  {
    memberId: 'm001',
    memberName: '张伟',
    memberTier: 'diamond',
    riskLevel: 'high',
    churnProbability: 72,
    predictedWindowDays: 15,
    signalFactors: [
      { code: 'freq', label: '访问频率下降', weight: 45, description: '近30天到店次数下降70%', direction: 'negative' },
      { code: 'aov', label: '客单价降低', weight: 30, description: '近7天平均客单价降低42%', direction: 'negative' },
      { code: 'rec', label: '推荐转化下降', weight: 15, description: '连续30天无推荐转化', direction: 'negative' },
      { code: 'complaint', label: '投诉记录', weight: 10, description: '近15天有2次服务投诉', direction: 'negative' },
    ],
    recommendedActions: [
      { code: 'send_coupon', label: '发放专属优惠券', channel: 'coupon', priority: 'high', expectedRecoveryRate: 65, description: '根据历史偏好发放8折优惠券' },
      { code: 'crm_followup', label: 'CRM 跟进回访', channel: 'phone', priority: 'medium', expectedRecoveryRate: 45, description: '客服电话了解近期情况并推送新品' },
    ],
    activityTrend: 'declining',
    daysSinceLastActivity: 21,
    predictedAt: '2026-07-06T06:00:00Z',
  },
  {
    memberId: 'm002',
    memberName: '李芳',
    memberTier: 'gold',
    riskLevel: 'critical',
    churnProbability: 88,
    predictedWindowDays: 7,
    signalFactors: [
      { code: 'freq', label: '访问频率下降', weight: 50, description: '近60天到店次数下降85%', direction: 'negative' },
      { code: 'aov', label: '客单价降低', weight: 25, description: '近30天平均客单价降低55%', direction: 'negative' },
      { code: 'balance', label: '余额归零', weight: 25, description: '储值卡余额已用完', direction: 'negative' },
    ],
    recommendedActions: [
      { code: 'recharge_incentive', label: '充值优惠推送', channel: 'wechat', priority: 'high', expectedRecoveryRate: 70, description: '推送充值满赠活动' },
      { code: 'birthday_gift', label: '生日礼遇提醒', channel: 'sms', priority: 'medium', expectedRecoveryRate: 50, description: '生日月专属礼品通知' },
    ],
    activityTrend: 'declining',
    daysSinceLastActivity: 45,
    predictedAt: '2026-07-06T06:00:00Z',
  },
  {
    memberId: 'm003',
    memberName: '王强',
    memberTier: 'silver',
    riskLevel: 'medium',
    churnProbability: 38,
    predictedWindowDays: 60,
    signalFactors: [
      { code: 'aov', label: '客单价波动', weight: 35, description: '近14天客单价波动超过40%', direction: 'negative' },
    ],
    recommendedActions: [
      { code: 'point_reminder', label: '积分到期提醒', channel: 'app_push', priority: 'low', expectedRecoveryRate: 30, description: '提醒积分即将到期可兑换礼品' },
    ],
    activityTrend: 'stable',
    daysSinceLastActivity: 7,
    predictedAt: '2026-07-06T06:00:00Z',
  },
  {
    memberId: 'm004',
    memberName: '赵敏',
    memberTier: 'platinum',
    riskLevel: 'low',
    churnProbability: 15,
    predictedWindowDays: 90,
    signalFactors: [],
    recommendedActions: [],
    activityTrend: 'stable',
    daysSinceLastActivity: 3,
    predictedAt: '2026-07-06T06:00:00Z',
  },
  {
    memberId: 'm005',
    memberName: '陈浩',
    memberTier: 'gold',
    riskLevel: 'high',
    churnProbability: 65,
    predictedWindowDays: 20,
    signalFactors: [
      { code: 'freq', label: '访问频率下降', weight: 40, description: '近15天到店次数下降50%', direction: 'negative' },
      { code: 'complaint', label: '服务评价差', weight: 30, description: '最近一次服务评分2分', direction: 'negative' },
    ],
    recommendedActions: [
      { code: 'service_apology', label: '服务致歉+补偿', channel: 'phone', priority: 'high', expectedRecoveryRate: 55, description: '致歉并赠送体验券' },
    ],
    activityTrend: 'declining',
    daysSinceLastActivity: 12,
    predictedAt: '2026-07-06T06:00:00Z',
  },
];

const MOCK_FINDINGS: DiagnosisFinding[] = [
  { id: 'f1', title: '钻石会员活跃度骤降', severity: 'critical', category: '活跃度', description: '钻石会员张伟近30天到店次数下降70%，客单价降低42%', rootCause: '竞争对手门店开业+近期有2次服务投诉处理不力', impact: '预计损失年度贡献约¥18,000', recommendation: '立即安排专属客服回访，推送新品体验券', timestamp: '2026-07-06T05:30:00Z', owner: '客服部', resolved: false },
  { id: 'f2', title: '黄金会员储值余额为零', severity: 'high', category: '消费力', description: '黄金会员李芳近60天未到店，储值卡余额已用完', rootCause: '未及时推送续充提醒+近期周边新开同类门店', impact: '预计损失年度贡献约¥12,000', recommendation: '推送充值满赠活动，同时安排生日礼遇提醒', timestamp: '2026-07-06T05:20:00Z', owner: '市场部', resolved: false },
  { id: 'f3', title: '银卡会员客单价波动异常', severity: 'medium', category: '消费行为', description: '银卡会员王强近14天客单价波动超过40%', rootCause: '购买品类从高毛利服务转向低价商品', impact: '预计损失年度贡献约¥3,000', recommendation: '推送积分到期提醒，引导高毛利服务消费', timestamp: '2026-07-06T05:10:00Z', owner: '运营部', resolved: false },
  { id: 'f4', title: '黄金会员服务评价骤降', severity: 'high', category: '服务体验', description: '黄金会员陈浩最近一次服务评分仅2分', rootCause: '前台服务态度不佳', impact: '预计损失年度贡献约¥8,000', recommendation: '致歉安抚并赠送体验券', timestamp: '2026-07-06T05:00:00Z', owner: '客服部', resolved: false },
];

const MOCK_PREDICTION_POINTS: PredictionPoint[] = [
  { label: '1月', predictedValue: 12, actualValue: 10, trend: 'down' },
  { label: '2月', predictedValue: 15, actualValue: 14, trend: 'stable' },
  { label: '3月', predictedValue: 18, actualValue: 20, trend: 'up' },
  { label: '4月', predictedValue: 22, actualValue: 19, trend: 'down' },
  { label: '5月', predictedValue: 25, actualValue: 24, trend: 'stable' },
  { label: '6月', predictedValue: 30, actualValue: 33, trend: 'up' },
  { label: '7月', predictedValue: 36, trend: 'up' },
  { label: '8月', predictedValue: 42, trend: 'up' },
];

const MOCK_PREDICTION_SUMMARY: PredictionSummary = {
  bestPrediction: '7月流失率预测36人',
  overallTrend: 'up',
  changePercent: 15,
  riskLevel: 'high',
  recommendation: '建议重点关注钻石与黄金会员挽回，本月流失风险预计增加15%',
};

// ============================================================
//  子组件：风险等级徽章
// ============================================================

const RISK_LABEL: Record<ChurnRiskLevel, string> = { low: '低风险', medium: '中风险', high: '高风险', critical: '极高风险' };
const RISK_VARIANT: Record<ChurnRiskLevel, string> = { low: 'success', medium: 'info', high: 'warning', critical: 'danger' };

// ============================================================
//  子组件：流失趋势小图
// ============================================================

function TrendMiniBar({ probability }: { probability: number }) {
  const barColor = probability >= 80 ? '#ef4444' : probability >= 50 ? '#f59e0b' : '#22c55e';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: 'rgba(148,163,184,0.15)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${probability}%`, height: '100%', background: barColor, borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: barColor, minWidth: 30, textAlign: 'right' }}>{probability}%</span>
    </div>
  );
}

// ============================================================
//  Page Component — 会员流失预测工作台
// ============================================================

const TAB_KEYS = ['predictions', 'diagnosis', 'trend', 'overview'] as const;
type TabKey = (typeof TAB_KEYS)[number];
const TAB_LABELS: Record<TabKey, string> = {
  predictions: 'AI 流失预测',
  diagnosis: '异常诊断报告',
  trend: '趋势分析',
  overview: '概览仪表盘',
};

export default function MemberChurnPage() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [findings, setFindings] = useState<DiagnosisFinding[]>(MOCK_FINDINGS);
  const [loading, setLoading] = useState(false);
  const [riskFilter, setRiskFilter] = useState<string>('ALL');

  const stats = useMemo(() => {
    const highRisk = MOCK_CHURN_PREDICTIONS.filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical').length;
    const avgProbability = Math.round(MOCK_CHURN_PREDICTIONS.reduce((s, p) => s + p.churnProbability, 0) / MOCK_CHURN_PREDICTIONS.length);
    const urgent = MOCK_CHURN_PREDICTIONS.filter(p => p.churnProbability >= 60).length;
    return { highRisk, avgProbability, urgent, total: MOCK_CHURN_PREDICTIONS.length, pendingFindings: findings.filter(f => !f.resolved).length };
  }, [findings]);

  /** 风险等级分布 */
  const riskDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    MOCK_CHURN_PREDICTIONS.forEach(p => { map[p.riskLevel] = (map[p.riskLevel] || 0) + 1; });
    return Object.entries(map);
  }, []);

  const handleHandleFinding = useCallback((findingId: string) => {
    setFindings(prev => prev.map(f => f.id === findingId ? { ...f, resolved: true } : f));
  }, []);

  const handleDismissFinding = useCallback((findingId: string) => {
    setFindings(prev => prev.filter(f => f.id !== findingId));
  }, []);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  }, []);

  /** 筛选后的预测 */
  const filteredPredictions = useMemo(() => {
    if (riskFilter === 'ALL') return MOCK_CHURN_PREDICTIONS;
    return MOCK_CHURN_PREDICTIONS.filter(p => p.riskLevel === riskFilter);
  }, [riskFilter]);

  return (
    <PageShell title="会员流失预测" subtitle="AI 驱动的会员流失分析与挽回决策">
      <div style={{ padding: 24 }}>
        {/* 头部信息 */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>🔮 会员流失预测</h1>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
            共 {stats.total} 位会员进行分析 · {stats.highRisk} 高风险 · 平均流失概率 {stats.avgProbability}% · 需紧急挽回 {stats.urgent} 人
          </p>
        </div>

        {/* 概览指标 */}
        <div style={{ marginBottom: 24 }}>
          <QuickStats
            items={[
              { label: '高风险会员', value: stats.highRisk.toString() },
              { label: '平均流失概率', value: `${stats.avgProbability}%` },
              { label: '需紧急挽回', value: stats.urgent.toString() },
              { label: '待处理诊断', value: stats.pendingFindings.toString() },
            ]}
            columns={4}
          />
        </div>

        {/* 风险分布卡片 */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          {riskDistribution.map(([level, count]) => (
            <div key={level} style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.12)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <StatusBadge variant={RISK_VARIANT[level as ChurnRiskLevel] as 'success' | 'info' | 'warning' | 'danger'} label={RISK_LABEL[level as ChurnRiskLevel]} />
              <span style={{ color: '#374151', fontWeight: 600 }}>{count} 人</span>
            </div>
          ))}
          <div style={{ marginLeft: 'auto', fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
            预计挽回: {stats.total - stats.highRisk}/{stats.total}
          </div>
        </div>

        {/* Tab 切换 */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '2px solid #e5e7eb' }}>
          {TAB_KEYS.map(key => (
            <button key={key} onClick={() => setActiveTab(key)} style={{
              padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14,
              fontWeight: activeTab === key ? 700 : 400, color: activeTab === key ? '#2563eb' : '#6b7280',
              borderBottom: activeTab === key ? '2px solid #2563eb' : '2px solid transparent', marginBottom: -2,
            }}>
              {TAB_LABELS[key]}
            </button>
          ))}
        </div>

        {/* Tab: 概览仪表盘 */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>📋 会员流失风险概览</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, background: '#fff', borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>会员</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>等级</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>风险等级</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>流失概率</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>时间窗口</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>活跃趋势</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_CHURN_PREDICTIONS.map(p => (
                    <tr key={p.memberId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>{p.memberName}</td>
                      <td style={{ padding: '10px 14px', color: '#6b7280' }}>{p.memberTier}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <StatusBadge variant={RISK_VARIANT[p.riskLevel] as 'success' | 'info' | 'warning' | 'danger'} label={RISK_LABEL[p.riskLevel]} />
                      </td>
                      <td style={{ padding: '10px 14px', minWidth: 140 }}>
                        <TrendMiniBar probability={p.churnProbability} />
                      </td>
                      <td style={{ padding: '10px 14px', color: '#6b7280' }}>{p.predictedWindowDays} 天</td>
                      <td style={{ padding: '10px 14px', color: p.activityTrend === 'declining' ? '#dc2626' : '#059669' }}>
                        {p.activityTrend === 'declining' ? '↓ 下降' : '→ 稳定'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>📊 挽回行动概览</h3>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {MOCK_CHURN_PREDICTIONS.filter(p => p.recommendedActions.length > 0).map(p => (
                  <div key={p.memberId} style={{ flex: '1 1 250px', padding: 14, background: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb' }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{p.memberName}</div>
                    {p.recommendedActions.map(a => (
                      <div key={a.code} style={{ fontSize: 12, color: '#6b7280', padding: '3px 0', display: 'flex', gap: 4 }}>
                        <span>{a.channel === 'coupon' ? '🎫' : a.channel === 'phone' ? '📞' : a.channel === 'wechat' ? '💬' : '📱'}</span>
                        <span>{a.label}</span>
                        <span style={{ color: '#059669' }}>(挽回率 {a.expectedRecoveryRate}%)</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: AI 流失预测 */}
        {activeTab === 'predictions' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 14, color: '#6b7280' }}>共 {filteredPredictions.length} 条预测</span>
              <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 12, minWidth: 100 }}>
                <option value="ALL">全部风险等级</option>
                <option value="critical">极高风险</option>
                <option value="high">高风险</option>
                <option value="medium">中风险</option>
                <option value="low">低风险</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {filteredPredictions.map(prediction => (
                <AIMemberChurnPredictionPanel key={prediction.memberId} prediction={prediction} />
              ))}
            </div>
          </div>
        )}

        {/* Tab: 异常诊断报告 */}
        {activeTab === 'diagnosis' && (
          <AnomalyDiagnosisReport
            title="会员流失根因诊断"
            findings={findings}
            loading={loading}
            onHandleFinding={handleHandleFinding}
            onDismissFinding={handleDismissFinding}
            onRefresh={handleRefresh}
          />
        )}

        {/* Tab: 趋势分析 */}
        {activeTab === 'trend' && (
          <PredictionAnalysisPanel
            title="会员流失趋势预测"
            predictions={MOCK_PREDICTION_POINTS}
            summary={MOCK_PREDICTION_SUMMARY}
            loading={loading}
            unit="人"
          />
        )}

        {/* 挽回历史记录 */}
        <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#fefce8', border: '1px solid #fde68a' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: '#92400e' }}>📈 挽回历史记录</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { member: '张伟', date: '2026-07-14', action: '发放8折优惠券', cost: 200, result: '已到店消费' as const },
              { member: '李芳', date: '2026-07-13', action: '充值满赠推送', cost: 0, result: '已转化' as const },
              { member: '王强', date: '2026-07-12', action: '积分到期提醒', cost: 0, result: '未响应' as const },
              { member: '陈浩', date: '2026-07-11', action: '致歉+体验券', cost: 150, result: '已到店消费' as const },
              { member: '刘洋', date: '2026-07-10', action: '专属活动邀请', cost: 500, result: '已转化' as const },
            ].map((h, i) => {
              const color = h.result === '已到店消费' ? '#059669' : h.result === '已转化' ? '#2563eb' : '#dc2626';
              const bg = h.result === '已到店消费' ? '#f0fdf4' : h.result === '已转化' ? '#eff6ff' : '#fef2f2';
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                    <span style={{ fontWeight: 600, minWidth: 50 }}>{h.member}</span>
                    <span style={{ color: '#6b7280', fontSize: 12 }}>{h.date}</span>
                    <span style={{ color: '#374151' }}>{h.action}</span>
                    {h.cost > 0 && <span style={{ color: '#9ca3af', fontSize: 11 }}>¥{h.cost}</span>}
                  </div>
                  <span style={{ padding: '2px 8px', borderRadius: 6, background: bg, color, fontSize: 11, fontWeight: 600 }}>{h.result}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 挽回行动监控面板 */}
        <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#16a34a' }}>📋 挽回行动监控</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            {(() => {
              const allActions = MOCK_CHURN_PREDICTIONS.flatMap(p => p.recommendedActions.map(a => ({
                member: p.memberName,
                ...a,
                gender: p.memberTier === 'diamond' ? '💎' : p.memberTier === 'gold' ? '🥇' : '🥈',
              })));
              const successRate = allActions.reduce((s, a) => s + a.expectedRecoveryRate, 0) / allActions.length;
              return (
                <>
                  <div style={{ padding: 10, background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>总挽回行动</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#16a34a' }}>{allActions.length}</div>
                  </div>
                  <div style={{ padding: 10, background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>平均挽回率</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#2563eb' }}>{Math.round(successRate)}%</div>
                  </div>
                  <div style={{ padding: 10, background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>渠道分布</div>
                    <div style={{ fontSize: 14, color: '#374151' }}>
                      {['coupon', 'phone', 'wechat', 'sms', 'app_push'].map(ch => {
                        const cnt = allActions.filter(a => a.channel === ch).length;
                        return cnt > 0 ? <span key={ch} style={{ margin: '0 4px' }}>{ch === 'coupon' ? '🎫' : ch === 'phone' ? '📞' : ch === 'wechat' ? '💬' : ch === 'sms' ? '📱' : '🔔'}{cnt}</span> : null;
                      })}
                    </div>
                  </div>
                  <div style={{ padding: 10, background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>行动列表</div>
                    <div style={{ fontSize: 12, color: '#374151' }}>
                      {allActions.slice(0, 4).map((a, i) => (
                        <div key={i} style={{ padding: '2px 0', display: 'flex', gap: 4 }}>
                          <span>{a.gender}</span>
                          <span>{a.member}</span>
                          <span style={{ color: '#059669' }}>{a.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* 脚注 */}
        <div style={{ marginTop: 20, padding: '12px 18px', background: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12, color: '#6b7280', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <span>🤖 AI 预测基于历史数据模型</span>
          <span>📊 诊断报告每 24 小时自动更新</span>
          <span>⏱ 上次分析: {new Date().toLocaleString('zh-CN')}</span>
        </div>
      </div>
    </PageShell>
  );
}
