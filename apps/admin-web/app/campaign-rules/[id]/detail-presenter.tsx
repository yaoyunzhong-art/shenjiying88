'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Badge,
  BreadcrumbPageHeader,
  DetailActionBar,
  DetailClosureBar,
  LoadingSkeleton,
  PageShell,
  Result,
  StatusBadge,
  Typography,
  type DetailClosureLink,
} from '@m5/ui';
import type { CampaignDecisionRule } from '../../campaign-rules-view-model';
import { useDetailActions } from '../../components/use-detail-actions';

// ---- Helpers ----

const STATUS_LABEL: Record<string, string> = {
  passed: '已通过',
  failed: '未通过',
  pending: '待审批',
  warning: '警告',
  skipped: '已跳过',
  blocked: '已阻塞',
  error: '错误',
};

function statusVariant(status: string): 'success' | 'error' | 'pending' | 'warning' | 'default' {
  if (status === 'passed') return 'success';
  if (status === 'failed' || status === 'error') return 'error';
  if (status === 'warning') return 'warning';
  if (status === 'pending') return 'pending';
  return 'default';
}

function toggleEnabled(rule: CampaignDecisionRule): CampaignDecisionRule {
  return { ...rule, enabled: !rule.enabled };
}

// ---- DetailRow ----

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', gap: 16, padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
      <Typography variant="label" style={{ width: 120, flexShrink: 0, color: '#6b7280' }}>
        {label}
      </Typography>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

// ---- CampaignRuleDetailPresenter ----

interface CampaignRuleDetailPresenterProps {
  rule: CampaignDecisionRule | null;
  ruleId: string;
  deliveryMode: string;
}

export function CampaignRuleDetailPresenter({
  rule,
  ruleId,
  deliveryMode,
}: CampaignRuleDetailPresenterProps) {
  const router = useRouter();
  const [localRule, setLocalRule] = useState<CampaignDecisionRule | null>(rule);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const record = useMemo(
    () => (localRule ? { ...localRule, deliveryMode } : { ruleId, deliveryMode }),
    [localRule, ruleId, deliveryMode],
  );

  const { actions } = useDetailActions({
    workspace: 'campaign-rules',
    detailId: localRule?.id ?? ruleId,
    record,
    shareTitle: localRule ? `营销规则 · ${localRule.name}` : '营销规则详情',
    shareText: localRule
      ? `查看${localRule.name} — ${localRule.description}`
      : `查看营销规则 ${ruleId} 详情`,
  });

  const handleToggleEnabled = useCallback(async () => {
    if (!localRule) return;
    setSaving(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300));
      setLocalRule(toggleEnabled(localRule));
    } catch {
      setError('切换启用状态失败，请重试');
    } finally {
      setSaving(false);
    }
  }, [localRule]);

  const handleDelete = useCallback(async () => {
    if (!localRule) return;
    setSaving(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      router.push('/campaign-rules');
    } catch {
      setError('删除规则失败，请重试');
      setSaving(false);
    }
  }, [localRule, router]);

  // ---- Not found state ----
  if (!localRule) {
    return (
      <PageShell title="规则详情" subtitle="未找到该规则">
        <Result
          status="404"
          title="规则未找到"
          subTitle={`ID 为 "${ruleId}" 的规则不存在`}
          extra={
            <a
              href="/campaign-rules"
              style={{
                display: 'inline-block',
                padding: '8px 20px',
                background: '#3b82f6',
                color: '#fff',
                borderRadius: 6,
                textDecoration: 'none',
              }}
            >
              返回规则列表
            </a>
          }
        />
      </PageShell>
    );
  }

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: 32 }}>
      <PageShell
        title={localRule.name}
        subtitle={localRule.description}
      >
        <BreadcrumbPageHeader
          breadcrumbs={[
            { label: '营销决策规则', href: '/campaign-rules' },
            { label: localRule.name },
          ]}
          title={localRule.name}
        />

        {/* Error banner */}
        {error && (
          <div
            style={{
              padding: '12px 16px',
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: 8,
              color: '#991b1b',
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        {/* Detail info */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20 }}>
            <Typography variant="h3">基本信息</Typography>
            <Badge variant={localRule.enabled ? 'success' : 'default'}>
              {localRule.enabled ? '已启用' : '已停用'}
            </Badge>
            <StatusBadge
              label={STATUS_LABEL[localRule.status] ?? localRule.status}
              variant={statusVariant(localRule.status)}
            />
          </div>

          <DetailRow label="规则 ID">
            <Typography
              variant="label"
              style={{ fontFamily: 'monospace', background: '#f9fafb', padding: '2px 6px', borderRadius: 4 }}
            >
              {localRule.id}
            </Typography>
          </DetailRow>
          <DetailRow label="优先级">
            <Typography>P{localRule.priority}</Typography>
          </DetailRow>
          <DetailRow label="状态">
            <StatusBadge
              label={STATUS_LABEL[localRule.status] ?? localRule.status}
              variant={statusVariant(localRule.status)}
            />
          </DetailRow>
          <DetailRow label="触发条件">
            <Typography
              variant="caption"
              style={{
                wordBreak: 'break-all',
                background: '#f9fafb',
                padding: '4px 8px',
                borderRadius: 4,
                fontFamily: 'monospace',
              }}
            >
              {localRule.condition}
            </Typography>
          </DetailRow>
          <DetailRow label="执行动作">
            <Typography
              variant="caption"
              style={{
                wordBreak: 'break-all',
                background: '#f9fafb',
                padding: '4px 8px',
                borderRadius: 4,
                fontFamily: 'monospace',
              }}
            >
              {localRule.action}
            </Typography>
          </DetailRow>
          <DetailRow label="命中次数">
            <Typography>{localRule.hitCount.toLocaleString()} 次</Typography>
          </DetailRow>
          <DetailRow label="创建时间">
            <Typography>{new Date(localRule.createdAt).toLocaleString('zh-CN')}</Typography>
          </DetailRow>
          <DetailRow label="更新时间">
            <Typography>{new Date(localRule.updatedAt).toLocaleString('zh-CN')}</Typography>
          </DetailRow>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <button
            disabled={saving}
            onClick={handleToggleEnabled}
            style={{
              padding: '10px 24px',
              background: localRule.enabled ? '#f59e0b' : '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? '处理中...' : localRule.enabled ? '停用规则' : '启用规则'}
          </button>
          <button
            disabled={saving}
            onClick={handleDelete}
            style={{
              padding: '10px 24px',
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              opacity: saving ? 0.6 : 1,
            }}
          >
            删除规则
          </button>
        </div>

        {/* Detail action bar */}
        <DetailActionBar actions={actions} heading="详情操作" caption="复制 / 导出 / 分享" />
        <DetailClosureBar
          links={[
            {
              key: 'workspace',
              title: '规则列表',
              subtitle: `返回营销决策规则列表`,
              href: '/campaign-rules',
            },
          ]}
        />
      </PageShell>
    </main>
  );
}
