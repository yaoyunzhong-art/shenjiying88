'use client';

import React, { useMemo, useState } from 'react';

import {
  AIMemberChurnPredictionPanel,
  AnomalyDiagnosisReport,
  PredictionAnalysisPanel,
  PageShell,
  Tabs,
  StatCard,
  QuickStats,
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
];

const MOCK_FINDINGS: DiagnosisFinding[] = [
  {
    id: 'f1',
    title: '钻石会员活跃度骤降',
    severity: 'critical',
    category: '活跃度',
    description: '钻石会员张伟近30天到店次数下降70%，客单价降低42%',
    rootCause: '竞争对手门店开业+近期有2次服务投诉处理不力',
    impact: '预计损失年度贡献约¥18,000',
    recommendation: '立即安排专属客服回访，推送新品体验券',
    timestamp: '2026-07-06T05:30:00Z',
    owner: '客服部',
    resolved: false,
  },
  {
    id: 'f2',
    title: '黄金会员储值余额为零',
    severity: 'high',
    category: '消费力',
    description: '黄金会员李芳近60天未到店，储值卡余额已用完',
    rootCause: '未及时推送续充提醒+近期周边新开同类门店',
    impact: '预计损失年度贡献约¥12,000',
    recommendation: '推送充值满赠活动，同时安排生日礼遇提醒',
    timestamp: '2026-07-06T05:20:00Z',
    owner: '市场部',
    resolved: false,
  },
  {
    id: 'f3',
    title: '银卡会员客单价波动异常',
    severity: 'medium',
    category: '消费行为',
    description: '银卡会员王强近14天客单价波动超过40%',
    rootCause: '购买品类从高毛利服务转向低价商品',
    impact: '预计损失年度贡献约¥3,000',
    recommendation: '推送积分到期提醒，引导高毛利服务消费',
    timestamp: '2026-07-06T05:10:00Z',
    owner: '运营部',
    resolved: false,
  },
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
//  Page Component  — 会员流失预测工作台
// ============================================================

const TAB_KEYS = ['predictions', 'diagnosis', 'trend'] as const;
type TabKey = (typeof TAB_KEYS)[number];
const TAB_LABELS: Record<TabKey, string> = {
  predictions: 'AI 流失预测',
  diagnosis: '异常诊断报告',
  trend: '趋势分析',
};

export default function MemberChurnPage() {
  const [activeTab, setActiveTab] = useState<string>('predictions');
  const [findings, setFindings] = useState<DiagnosisFinding[]>(MOCK_FINDINGS);
  const [loading, setLoading] = useState(false);

  const stats = useMemo(() => {
    const highRisk = MOCK_CHURN_PREDICTIONS.filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical');
    const avgProbability = Math.round(
      MOCK_CHURN_PREDICTIONS.reduce((s, p) => s + p.churnProbability, 0) / MOCK_CHURN_PREDICTIONS.length
    );
    return [
      { label: '高风险会员', value: highRisk.length, trend: 2 },
      { label: '平均流失概率', value: `${avgProbability}%`, trend: 5 },
      { label: '需紧急挽回', value: MOCK_CHURN_PREDICTIONS.filter(p => p.predictedWindowDays <= 15).length, trend: 1 },
      { label: '待处理诊断', value: findings.filter(f => !f.resolved).length, trend: -3 },
    ];
  }, [findings]);

  const handleHandleFinding = (findingId: string) => {
    setFindings(prev => prev.map(f => f.id === findingId ? { ...f, resolved: true } : f));
  };

  const handleDismissFinding = (findingId: string) => {
    setFindings(prev => prev.filter(f => f.id !== findingId));
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  };

  return (
    <PageShell title="会员流失预测" subtitle="AI 驱动的会员流失分析与挽回决策">
      <div style={{ marginBottom: 24 }}>
        <QuickStats items={stats} columns={4} />
      </div>

      <div style={{ marginBottom: 24 }}>
        <Tabs
          items={TAB_KEYS.map(key => ({ key, label: TAB_LABELS[key] }))}
          activeKey={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Tab: AI 流失预测 */}
      {activeTab === 'predictions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {MOCK_CHURN_PREDICTIONS.map(prediction => (
            <AIMemberChurnPredictionPanel
              key={prediction.memberId}
              prediction={prediction}
            />
          ))}
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
    </PageShell>
  );
}
