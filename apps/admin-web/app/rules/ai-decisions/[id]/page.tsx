/**
 * AI 决策执行结果详情页 — AI Decision Execution Detail (Next.js App Router Page)
 * 角色视角: 👤运营管理员 / 规则配置师
 * 功能: 查看 AI 决策执行的完整详情，包含输入上下文、推理过程、执行结果、效果验证、异常回溯
 */
'use client';

import { useState, useCallback, use } from 'react';

import {
  DetailShell,
  StatusBadge,
  StatCard,
  WorkspaceBreadcrumb,
  type DetailShellAction,
} from '@m5/ui';
import { useDetailActions } from '../../../components/use-detail-actions';

// ---- 类型 ----

type AiDecisionStatus = 'executing' | 'success' | 'failure' | 'rejected' | 'timeout';
type DecisionCategory = 'pricing' | 'inventory' | 'promotion' | 'allocation' | 'recommendation';

interface AiDecisionDetail {
  id: string;
  ruleName: string;
  ruleId: string;
  status: AiDecisionStatus;
  category: DecisionCategory;
  confidence: number;
  executionMs: number;
  triggeredBy: string;
  triggeredAt: string;
  completedAt: string;
  inputContext: Record<string, unknown>;
  reasoning: string;
  decision: Record<string, unknown>;
  expectedOutcome: string;
  actualOutcome: string | null;
  deviationScore: number | null;
  anomalyFlags: string[];
  retryCount: number;
  version: string;
}

// ---- Mock Data ----

const mockDetail = (id: string): AiDecisionDetail => {
  const statuses: AiDecisionStatus[] = ['success', 'failure', 'rejected', 'timeout', 'executing'];
  const categories: DecisionCategory[] = ['pricing', 'inventory', 'promotion', 'allocation', 'recommendation'];
  const status = statuses[Math.abs(hashCode(id)) % statuses.length]!;
  const category = categories[Math.abs(hashCode(id)) % categories.length]!;
  const success = status === 'success';
  return {
    id,
    ruleName: `AI 决策规则 ${id.slice(-4)}`,
    ruleId: `rule-${id.slice(-4)}`,
    status,
    category,
    confidence: success ? 0.87 + Math.random() * 0.12 : 0.45 + Math.random() * 0.3,
    executionMs: Math.floor(250 + Math.random() * 3000),
    triggeredBy: 'system:cron',
    triggeredAt: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
    completedAt: new Date().toISOString(),
    inputContext: {
      storeId: 'store-sh-001',
      productSku: 'SKU-8823-ALPHA',
      currentPrice: 129.00,
      competitorPrice: 118.00,
      inventoryLevel: 342,
      salesVelocity: 'high',
      timeWindow: 'promo-period',
    },
    reasoning: `基于当前库存余量 342 件与销售速度"高"的判定，结合竞品定价 ¥118.00（低于我方 ¥129.00 约 8.5%），AI 建议将价格调整至 ¥115.00–¥122.00 区间以维持竞争力。\n\n约束考虑：\n1. 毛利率底线 25%（对应最低 ¥96.75）\n2. 促销期价格弹性系数 1.4\n3. 历史同品类转化率提升 12–18%\n\n综合推荐：¥118.00（匹配竞品价格，预期销量提升 15%）`,
    decision: {
      recommendedPrice: 118.00,
      originalPrice: 129.00,
      discountRate: 0.915,
      expectedSalesLift: 0.15,
      expectedRevenueImpact: { low: -3500, mid: 2200, high: 8900 },
      riskLevel: 'low',
      expirationHours: 72,
    },
    expectedOutcome: '预计销售额提升 15%，库存周转天数从 21 天降至 18 天',
    actualOutcome: success ? '实际销售额提升 13.2%，周转天数降至 18.5 天' : null,
    deviationScore: success ? 0.12 : 0.43,
    anomalyFlags: success ? [] : ['confidence_degradation', 'deviation_exceeded_threshold'],
    retryCount: success ? 0 : 2,
    version: 'ai-model-v2.3.1',
  };
};

function hashCode(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function statusVariant(status: AiDecisionStatus) {
  switch (status) {
    case 'success': return 'success' as const;
    case 'failure': return 'danger' as const;
    case 'rejected':
    case 'timeout': return 'warning' as const;
    case 'executing': return 'info' as const;
  }
}

// ---- Component ----

export default function AiDecisionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [detail, setDetail] = useState<AiDecisionDetail>(() => mockDetail(id));
  const [isRetrying, setIsRetrying] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    setFeedback(null);
    await new Promise(r => setTimeout(r, 1500));
    setDetail(prev => ({
      ...prev,
      status: 'executing',
      retryCount: prev.retryCount + 1,
      completedAt: '',
      anomalyFlags: [],
      deviationScore: null,
      actualOutcome: null,
    }));
    setFeedback({ ok: true, message: '决策已重新提交执行' });
    setIsRetrying(false);
  }, []);

  const handleRevert = useCallback(async () => {
    setFeedback(null);
    await new Promise(r => setTimeout(r, 800));
    setDetail(prev => ({
      ...prev,
      status: 'rejected',
      deviationScore: null,
      actualOutcome: null,
      anomalyFlags: [...(prev.anomalyFlags || []), 'manually_reverted'],
    }));
    setFeedback({ ok: true, message: '决策已回退，系统恢复至执行前状态' });
  }, []);

  const actions: DetailShellAction[] = [
    {
      key: 'retry',
      label: '重试执行',
      onClick: handleRetry,
      disabled: detail.status !== 'failure' && detail.status !== 'timeout' && detail.status !== 'rejected',
      loading: isRetrying,
    },
    {
      key: 'revert',
      label: '回退操作',
      onClick: handleRevert,
      disabled: !(detail.status === 'success' && detail.deviationScore !== null && detail.deviationScore > 0.15),
      variant: 'danger',
    },
  ];

  return (
    <main style={{ maxWidth: 1120, margin: '0 auto', padding: '24px 32px' }}>
      <WorkspaceBreadcrumb
        workspaceLabel="策略规则"
        workspaceHref="/rules"
        detailLabel={`AI 决策 #${id.slice(0, 8)}`}
      />

      <DetailShell
        title={`AI 决策执行详情`}
        subtitle={detail.ruleName}
        actions={actions}
      >
        {/* ---- 概要统计 ---- */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <StatusBadge label={detail.status === 'success' ? '成功' : detail.status === 'failure' ? '失败' : detail.status === 'rejected' ? '已驳回' : detail.status === 'timeout' ? '超时' : '执行中'} variant={statusVariant(detail.status)} />
          <span style={{ fontSize: 14, color: '#6b7280' }}>决策 ID: {detail.id}</span>
          <span style={{ fontSize: 14, color: '#6b7280' }}>AI 模型: {detail.version}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <StatCard label="决策类别" value={detail.category === 'pricing' ? '定价策略' : detail.category === 'inventory' ? '库存调配' : detail.category === 'promotion' ? '促销活动' : detail.category === 'allocation' ? '资源分配' : '商品推荐'} />
          <StatCard label="置信度" value={`${(detail.confidence * 100).toFixed(0)}%`} />
          <StatCard label="执行耗时" value={`${detail.executionMs}ms`} />
          <StatCard label="重试次数" value={String(detail.retryCount)} />
        </div>

        {/* ---- 输入上下文 ---- */}
        <section style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>输入上下文</h3>
          <pre style={{
            background: '#1e293b',
            color: '#e2e8f0',
            padding: 16,
            borderRadius: 8,
            fontSize: 13,
            overflow: 'auto',
            maxHeight: 200,
          }}>
            {JSON.stringify(detail.inputContext, null, 2)}
          </pre>
        </section>

        {/* ---- 推理过程 ---- */}
        <section style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>推理过程</h3>
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: 16,
            whiteSpace: 'pre-wrap',
            lineHeight: 1.7,
            fontSize: 14,
            color: '#334155',
          }}>
            {detail.reasoning}
          </div>
        </section>

        {/* ---- 决策结果 ---- */}
        <section style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>决策结果</h3>
          <pre style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534',
            padding: 16,
            borderRadius: 8,
            fontSize: 13,
            overflow: 'auto',
            maxHeight: 300,
          }}>
            {JSON.stringify(detail.decision, null, 2)}
          </pre>
        </section>

        {/* ---- 预期与实际对比 ---- */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div style={{ padding: 16, background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd' }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#0369a1' }}>预期效果</h4>
            <p style={{ fontSize: 14, color: '#0c4a6e' }}>{detail.expectedOutcome}</p>
          </div>
          <div style={{ padding: 16, background: detail.actualOutcome ? '#f0fdf4' : '#f9fafb', borderRadius: 8, border: `1px solid ${detail.actualOutcome ? '#bbf7d0' : '#e5e7eb'}` }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: detail.actualOutcome ? '#166534' : '#6b7280' }}>实际效果</h4>
            <p style={{ fontSize: 14, color: detail.actualOutcome ? '#166534' : '#9ca3af' }}>
              {detail.actualOutcome || '待执行完成'}
            </p>
          </div>
        </div>

        {/* ---- 效果偏差 ---- */}
        {detail.deviationScore !== null && (
          <section style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>效果偏差分析</h3>
            <StatCard
              label="偏差分数"
              value={detail.deviationScore.toFixed(3)}
              trend={{ value: `${(detail.deviationScore * 100).toFixed(1)}%`, positive: detail.deviationScore < 0.2 }}
              variant={detail.deviationScore > 0.2 ? 'warning' : 'success'}
            />
            {detail.anomalyFlags.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <h4 style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>异常标记</h4>
                <ul style={{ paddingLeft: 20 }}>
                  {detail.anomalyFlags.map(flag => (
                    <li key={flag} style={{ fontSize: 14, color: '#dc2626', marginBottom: 4 }}>
                      {flag === 'confidence_degradation' ? '置信度下降超过阈值' : flag === 'deviation_exceeded_threshold' ? '偏差超出容忍范围' : flag === 'manually_reverted' ? '人工回退' : flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* ---- 执行轨迹 ---- */}
        <section style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>执行轨迹</h3>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
            {[
              { time: detail.triggeredAt, action: '决策触发', by: detail.triggeredBy, desc: '规则调度器触发 AI 决策' },
              { time: detail.completedAt || '-', action: '模型推理', by: detail.version, desc: `置信度 ${(detail.confidence * 100).toFixed(0)}%` },
              ...(detail.anomalyFlags.length > 0 ? detail.anomalyFlags.map(flag => ({
                time: detail.completedAt,
                action: '异常标记',
                by: '系统监控',
                desc: flag === 'confidence_degradation' ? '置信度下降异常' : '偏差超过阈值',
              })) : []),
              ...(detail.status === 'success' ? [{
                time: detail.completedAt,
                action: '结果写入',
                by: '持久化服务',
                desc: '决策结果已写入规则执行日志',
              }] : []),
            ].map((entry, i) => (
              <div key={i} style={{
                display: 'flex',
                gap: 16,
                padding: '10px 16px',
                borderBottom: '1px solid #f3f4f6',
                background: i % 2 === 0 ? '#fafafa' : '#fff',
                fontSize: 14,
              }}>
                <span style={{ color: '#6b7280', minWidth: 160, fontSize: 12 }}>{new Date(entry.time).toLocaleString('zh-CN')}</span>
                <span style={{ fontWeight: 500, minWidth: 80 }}>{entry.action}</span>
                <span style={{ color: '#6b7280', minWidth: 120, fontSize: 12 }}>{entry.by}</span>
                <span style={{ color: '#374151' }}>{entry.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ---- 反馈信息 ---- */}
        {feedback && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 8,
            background: feedback.ok ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${feedback.ok ? '#bbf7d0' : '#fecaca'}`,
            color: feedback.ok ? '#166534' : '#991b1b',
            fontSize: 14,
            marginBottom: 24,
          }}>
            <span>{feedback.message}</span>
            <button
              onClick={() => setFeedback(null)}
              style={{ marginLeft: 16, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              关闭
            </button>
          </div>
        )}
      </DetailShell>
    </main>
  );
}
