'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';

import {
  AIMemberChurnPredictionPanel,
  AnomalyDiagnosisReport,
  PredictionAnalysisPanel,
  PageShell,
  QuickStats,
  StatusBadge,
  type ChurnPrediction,
  type ChurnRiskLevel,
  type DiagnosisFinding,
  type PredictionPoint,
  type PredictionSummary,
} from '@m5/ui';
import { getDefaultApiBaseUrl } from '@m5/sdk';
import { buildStorefrontScopeHeaders, resolveStorefrontScope } from '../../lib/storefront-transactions';

// ============================================================
//  API 工具函数
// ============================================================

async function fetchChurnPredictions(memberId: string): Promise<ChurnPrediction[]> {
  try {
    const scope = resolveStorefrontScope();
    const res = await fetch(`${getDefaultApiBaseUrl()}/members/${memberId}/churn/predictions`, {
      headers: {
        'Content-Type': 'application/json',
        ...buildStorefrontScopeHeaders(scope),
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data as ChurnPrediction[] : [];
  } catch {
    return [];
  }
}

async function fetchChurnDiagnosis(memberId: string): Promise<DiagnosisFinding[]> {
  try {
    const scope = resolveStorefrontScope();
    const res = await fetch(`${getDefaultApiBaseUrl()}/members/${memberId}/churn/diagnosis`, {
      headers: {
        'Content-Type': 'application/json',
        ...buildStorefrontScopeHeaders(scope),
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data as DiagnosisFinding[] : [];
  } catch {
    return [];
  }
}

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
  const [predictions, setPredictions] = useState<ChurnPrediction[]>([]);
  const [findings, setFindings] = useState<DiagnosisFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [riskFilter, setRiskFilter] = useState<string>('ALL');

  // 从 localStorage 获取会员 ID 并加载数据
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const infoStr = localStorage.getItem('member_info');
        let memberId = '';
        if (infoStr) {
          const info = JSON.parse(infoStr);
          memberId = info.memberId || info.id || '';
        }
        if (memberId) {
          const [preds, diag] = await Promise.all([
            fetchChurnPredictions(memberId),
            fetchChurnDiagnosis(memberId),
          ]);
          setPredictions(preds);
          setFindings(diag);
        }
      } catch {
        // 静默失败，显示空态
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const stats = useMemo(() => {
    const highRisk = predictions.filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical').length;
    const avgProbability = predictions.length > 0
      ? Math.round(predictions.reduce((s, p) => s + p.churnProbability, 0) / predictions.length)
      : 0;
    const urgent = predictions.filter(p => p.churnProbability >= 60).length;
    return { highRisk, avgProbability, urgent, total: predictions.length, pendingFindings: findings.filter(f => !f.resolved).length };
  }, [predictions, findings]);

  /** 风险等级分布 */
  const riskDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    predictions.forEach(p => { map[p.riskLevel] = (map[p.riskLevel] || 0) + 1; });
    return Object.entries(map);
  }, [predictions]);

  const handleHandleFinding = useCallback((findingId: string) => {
    setFindings(prev => prev.map(f => f.id === findingId ? { ...f, resolved: true } : f));
  }, []);

  const handleDismissFinding = useCallback((findingId: string) => {
    setFindings(prev => prev.filter(f => f.id !== findingId));
  }, []);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    // 重新加载
    const loadData = async () => {
      try {
        const infoStr = localStorage.getItem('member_info');
        let memberId = '';
        if (infoStr) {
          const info = JSON.parse(infoStr);
          memberId = info.memberId || info.id || '';
        }
        if (memberId) {
          const [preds, diag] = await Promise.all([
            fetchChurnPredictions(memberId),
            fetchChurnDiagnosis(memberId),
          ]);
          setPredictions(preds);
          setFindings(diag);
        }
      } catch {
        // 静默
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  /** 筛选后的预测 */
  const filteredPredictions = useMemo(() => {
    if (riskFilter === 'ALL') return predictions;
    return predictions.filter(p => p.riskLevel === riskFilter);
  }, [predictions, riskFilter]);

  // 空态数据
  const emptyPredictionPoints: PredictionPoint[] = [];
  const emptyPredictionSummary: PredictionSummary = {
    bestPrediction: '暂无数据',
    overallTrend: 'stable',
    changePercent: 0,
    riskLevel: 'low',
    recommendation: '当前暂无流失预测数据',
  };

  if (loading) {
    return (
      <PageShell title="会员流失预测" subtitle="AI 驱动的会员流失分析与挽回决策">
        <div style={{ padding: 24, textAlign: 'center', color: '#6b7280' }}>
          <div style={{ padding: '40px 0' }}>加载中...</div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="会员流失预测" subtitle="AI 驱动的会员流失分析与挽回决策">
      <div style={{ padding: 24 }}>
        {/* 头部信息 */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>🔮 会员流失预测</h1>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
            {stats.total > 0
              ? `共 ${stats.total} 位会员进行分析 · ${stats.highRisk} 高风险 · 平均流失概率 ${stats.avgProbability}% · 需紧急挽回 ${stats.urgent} 人`
              : '当前暂无流失预测数据'}
          </p>
        </div>

        {predictions.length === 0 && findings.length === 0 ? (
          <div style={{
            padding: '60px 24px',
            textAlign: 'center',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            background: '#f9fafb',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>
              当前暂无流失预测数据
            </h3>
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
              系统将持续分析会员行为数据，当检测到流失风险时会在此处展示预测结果和挽回建议。
            </p>
          </div>
        ) : (
          <>
            {/* 概览指标 */}
            {stats.total > 0 && (
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
            )}

            {/* 风险分布卡片 */}
            {riskDistribution.length > 0 && (
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
            )}

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
                {predictions.length > 0 ? (
                  <>
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
                          {predictions.map(p => (
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
                        {predictions.filter(p => p.recommendedActions.length > 0).map(p => (
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
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280', fontSize: 14 }}>
                    暂无预测数据
                  </div>
                )}
              </div>
            )}

            {/* Tab: AI 流失预测 */}
            {activeTab === 'predictions' && (
              <div>
                {predictions.length > 0 ? (
                  <>
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
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280', fontSize: 14 }}>
                    暂无流失预测数据
                  </div>
                )}
              </div>
            )}

            {/* Tab: 异常诊断报告 */}
            {activeTab === 'diagnosis' && (
              findings.length > 0 ? (
                <AnomalyDiagnosisReport
                  title="会员流失根因诊断"
                  findings={findings}
                  loading={loading}
                  onHandleFinding={handleHandleFinding}
                  onDismissFinding={handleDismissFinding}
                  onRefresh={handleRefresh}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280', fontSize: 14 }}>
                  暂无诊断数据
                </div>
              )
            )}

            {/* Tab: 趋势分析 */}
            {activeTab === 'trend' && (
              <PredictionAnalysisPanel
                title="会员流失趋势预测"
                predictions={emptyPredictionPoints}
                summary={emptyPredictionSummary}
                loading={loading}
                unit="人"
              />
            )}
          </>
        )}

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
