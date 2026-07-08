/**
 * 会员等级详情 — Member Tier Detail Page (Next.js App Router Page)
 * 角色视角: 👤运营管理员 / 📊会员管理
 * 功能: 查看等级详情、编辑、删除、状态流转
 */
'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  DetailShell,

  StatusBadge,
  InfoRow,
  FormSubmitFeedback,
  SubmitButton,
  CopyToClipboard,
  WorkspaceBreadcrumb,
  StatCard,
  useToast,
  Dialog,
  type DetailShellAction,
} from '@m5/ui';

// ─── 类型 ────────────────────────────────────────────

export interface TierDetailData {
  id: string;
  name: string;
  key: string;
  level: number;
  minPoints: number;
  maxPoints: number;
  discountRate: number;
  color: string;
  icon: string;
  benefits: string;
  annualFee: number;
  renewalCondition: string;
  upgradeCondition: string;
  downgradeCondition: string;
  status: 'active' | 'inactive' | 'hidden';
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

// ─── 模拟数据 ────────────────────────────────────────

const TIER_DETAILS: Record<string, TierDetailData> = {
  diamond: {
    id: 'diamond',
    name: '钻石会员',
    key: 'diamond',
    level: 1,
    minPoints: 5000,
    maxPoints: 99999,
    discountRate: 80,
    color: '#3b82f6',
    icon: '💎',
    benefits: '全场商品8折优惠,消费享双倍积分,生日当月赠送礼包,专属客服通道,订单优先发货',
    annualFee: 999,
    renewalCondition: '年度消费满 50000 元自动续费',
    upgradeCondition: '累计积分达到 5000 或年度消费满 30000 元',
    downgradeCondition: '连续 12 个月消费不足 5000 元',
    status: 'active',
    memberCount: 128,
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2026-06-20T14:30:00Z',
  },
  gold: {
    id: 'gold',
    name: '黄金会员',
    key: 'gold',
    level: 2,
    minPoints: 2000,
    maxPoints: 4999,
    discountRate: 90,
    color: '#f59e0b',
    icon: '⭐',
    benefits: '全场商品9折优惠,消费享1.5倍积分,生日礼包',
    annualFee: 199,
    renewalCondition: '年度消费满 10000 元自动续费',
    upgradeCondition: '累计积分达到 2000 或年度消费满 8000 元',
    downgradeCondition: '连续 6 个月消费不足 2000 元',
    status: 'active',
    memberCount: 450,
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2026-07-01T09:15:00Z',
  },
  silver: {
    id: 'silver',
    name: '白银会员',
    key: 'silver',
    level: 3,
    minPoints: 500,
    maxPoints: 1999,
    discountRate: 95,
    color: '#9ca3af',
    icon: '🥈',
    benefits: '全场商品95折优惠,消费享1.2倍积分',
    annualFee: 99,
    renewalCondition: '年度消费满 3000 元自动续费',
    upgradeCondition: '累计积分达到 500 或首次消费满 2000 元',
    downgradeCondition: '连续 3 个月无消费',
    status: 'active',
    memberCount: 620,
    createdAt: '2024-06-01T08:00:00Z',
    updatedAt: '2026-05-15T11:00:00Z',
  },
  bronze: {
    id: 'bronze',
    name: '青铜会员',
    key: 'bronze',
    level: 4,
    minPoints: 0,
    maxPoints: 499,
    discountRate: 100,
    color: '#d97706',
    icon: '🏆',
    benefits: '注册即享,积分累积',
    annualFee: 0,
    renewalCondition: '永久有效',
    upgradeCondition: '任意一笔消费或累计积分达 500',
    downgradeCondition: '不适用（基础等级）',
    status: 'active',
    memberCount: 890,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2026-06-30T16:00:00Z',
  },
};

// ─── 状态标签映射 ──────────────────────────────────

const STATUS_MAP: Record<string, { label: string; variant: 'success' | 'warning' | 'default' }> = {
  active: { label: '启用', variant: 'success' },
  inactive: { label: '停用', variant: 'warning' },
  hidden: { label: '仅内部可见', variant: 'default' },
};

const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'inactive' },
  { label: '仅内部可见', value: 'hidden' },
];

// ─── 辅助函数 ────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── 页面组件 ───────────────────────────────────────

export default function MemberTierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const tierId = params.id as string;

  // 状态
  const [tier, setTier] = useState<TierDetailData | null>(() => TIER_DETAILS[tierId] ?? null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);

  // 编辑表单状态
  const [editForm, setEditForm] = useState<Partial<TierDetailData>>({});

  // ── 操作栏 ────────────────────────────────────────

  const actions: DetailShellAction[] = useMemo(() => [
    {
      key: 'edit',
      label: isEditing ? '取消编辑' : '编辑',
      variant: 'secondary',
      onClick: () => {
        if (isEditing) {
          setIsEditing(false);
          setSubmitResult(null);
        } else {
          setEditForm({
            name: tier?.name,
            discountRate: tier?.discountRate,
            minPoints: tier?.minPoints,
            maxPoints: tier?.maxPoints,
            annualFee: tier?.annualFee,
            renewalCondition: tier?.renewalCondition,
            upgradeCondition: tier?.upgradeCondition,
            downgradeCondition: tier?.downgradeCondition,
            benefits: tier?.benefits,
          });
          setIsEditing(true);
        }
      },
    },
    {
      key: 'status-toggle',
      label: '启用 / 停用',
      variant: 'primary',
      onClick: () => setStatusDialogOpen(true),
    },
    {
      key: 'delete',
      label: '删除等级',
      variant: 'danger',
      disabled: (tier?.memberCount ?? 0) > 0,
      onClick: () => setDeleteDialogOpen(true),
    },
  ], [isEditing, tier]);

  // ── 处理状态流转 ──────────────────────────────────

  const handleStatusChange = async (newStatus: string) => {
    if (!tier) return;
    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      setTier((prev) => prev ? { ...prev, status: newStatus as TierDetailData['status'] } : prev);
      toast.success(`等级状态已变更为「${STATUS_OPTIONS.find((o) => o.value === newStatus)?.label}」`);
      setSubmitResult({ success: true, message: '状态更新成功' });
    } catch {
      toast.error('状态更新失败，请重试');
      setSubmitResult({ success: false, message: '状态更新失败' });
    } finally {
      setIsSubmitting(false);
      setStatusDialogOpen(false);
      setTargetStatus(null);
    }
  };

  // ── 处理编辑保存 ──────────────────────────────────

  const handleSave = async () => {
    if (!tier) return;
    setIsSubmitting(true);
    setSubmitResult(null);
    try {
      await new Promise((r) => setTimeout(r, 600));
      setTier((prev) => prev ? { ...prev, ...editForm } : prev);
      toast.success('等级信息已更新');
      setSubmitResult({ success: true, message: '编辑保存成功' });
      setIsEditing(false);
    } catch {
      toast.error('保存失败，请重试');
      setSubmitResult({ success: false, message: '保存失败' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── 处理删除 ──────────────────────────────────────

  const handleDelete = async () => {
    if (!tier) return;
    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      toast.success(`等级「${tier.name}」已删除`);
      setDeleteDialogOpen(false);
      router.push('/members/tiers');
    } catch {
      toast.error('删除失败，请重试');
      setSubmitResult({ success: false, message: '删除失败' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── 页面未找到 ────────────────────────────────────

  if (!tier) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
        <h2 style={{ color: '#ef4444' }}>等级不存在</h2>
        <p>未找到 ID 为「{tierId}」的会员等级</p>
        <button
          onClick={() => router.push('/members/tiers')}
          style={{
            marginTop: 16,
            padding: '8px 20px',
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          返回等级列表
        </button>
      </div>
    );
  }

  // ── 渲染 ──────────────────────────────────────────

  return (
    <div style={{ padding: 24, background: '#0f172a', minHeight: '100vh' }}>
      <WorkspaceBreadcrumb
        workspaceLabel="会员管理"
        workspaceHref="/members"
        extraSegments={[{ label: '等级列表', href: '/members/tiers' }]}
        detailLabel={tier.name}
      />

      <DetailShell
        title={tier.name}
        subtitle={tier.key}
        actions={actions}
      >
        {/* ── 编辑模式 ── */}
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>等级名称</label>
                <input
                  value={editForm.name ?? ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>折扣率 (%)</label>
                <input
                  type="number"
                  value={editForm.discountRate ?? ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, discountRate: Number(e.target.value) }))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>最低积分</label>
                <input
                  type="number"
                  value={editForm.minPoints ?? ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, minPoints: Number(e.target.value) }))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>最高积分</label>
                <input
                  type="number"
                  value={editForm.maxPoints ?? ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, maxPoints: Number(e.target.value) }))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>年费 (元)</label>
                <input
                  type="number"
                  value={editForm.annualFee ?? ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, annualFee: Number(e.target.value) }))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>等级权益</label>
                <textarea
                  value={editForm.benefits ?? ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, benefits: e.target.value }))}
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <SubmitButton onClick={handleSave} loading={isSubmitting}>
                保存编辑
              </SubmitButton>
            </div>
            {submitResult && (
              <FormSubmitFeedback
                success={submitResult.success ? submitResult.message : undefined}
                error={submitResult.success ? undefined : submitResult.message}
              />
            )}
          </div>
        ) : (
          /* ── 展示模式 ── */
          <div>
            {/* 概览卡片 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 12,
                marginBottom: 20,
              }}
            >
              <StatCard label="会员人数" value={tier.memberCount.toLocaleString()} />
              <StatCard label="等级序号" value={`#${tier.level}`} />
              <StatCard label="折扣率" value={`${tier.discountRate}%`} />
              <StatCard label="年费" value={tier.annualFee === 0 ? '免费' : `¥${tier.annualFee}`} />
            </div>

            {/* 信息行 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                background: 'rgba(30, 41, 59, 0.6)',
                borderRadius: 12,
                padding: 16,
              }}
            >
              <InfoRow label="等级标识" value={<><code style={{ color: '#93c5fd' }}>{tier.key}</code><CopyToClipboard text={tier.key} /></>} />
              <InfoRow label="等级颜色" value={<span style={{ color: tier.color }}>■ {tier.color}</span>} />
              <InfoRow label="积分区间" value={`${tier.minPoints.toLocaleString()} ~ ${tier.maxPoints.toLocaleString()}`} />
              <InfoRow label="创建时间" value={formatDate(tier.createdAt)} />
              <InfoRow label="更新时间" value={formatDate(tier.updatedAt)} />
              <InfoRow label="等级权益" value={tier.benefits} />
              <InfoRow label="续费条件" value={tier.renewalCondition} />
              <InfoRow label="升级条件" value={tier.upgradeCondition} />
              <InfoRow label="降级条件" value={tier.downgradeCondition} />
            </div>
          </div>
        )}
      </DetailShell>

      {/* ── 状态流转弹窗 ── */}
      {statusDialogOpen && (
        <Dialog
          open
          onClose={() => setStatusDialogOpen(false)}
          title="变更等级状态"
        >
          <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12 }}>
            当前状态：<StatusBadge variant={STATUS_MAP[tier.status]?.variant ?? 'default'} label={STATUS_MAP[tier.status]?.label ?? tier.status} />
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {STATUS_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: targetStatus === opt.value ? 'rgba(59,130,246,0.15)' : 'transparent',
                  border: `1px solid ${targetStatus === opt.value ? '#3b82f6' : 'rgba(148,163,184,0.2)'}`,
                  color: '#e2e8f0',
                }}
              >
                <input
                  type="radio"
                  name="tier-status"
                  value={opt.value}
                  checked={targetStatus === opt.value}
                  onChange={() => setTargetStatus(opt.value)}
                  style={{ accentColor: '#3b82f6' }}
                />
                {opt.label}
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button
              onClick={() => setStatusDialogOpen(false)}
              style={{
                padding: '6px 16px',
                background: 'rgba(148,163,184,0.1)',
                color: '#94a3b8',
                border: '1px solid rgba(148,163,184,0.2)',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              取消
            </button>
            <SubmitButton
              onClick={() => targetStatus && handleStatusChange(targetStatus)}
              loading={isSubmitting}
              disabled={!targetStatus || targetStatus === tier.status}
            >
              确认变更
            </SubmitButton>
          </div>
        </Dialog>
      )}

      {/* ── 删除确认弹窗 ── */}
      {deleteDialogOpen && (
        <Dialog
          open
          onClose={() => setDeleteDialogOpen(false)}
          title="确认删除等级"
        >
          <p style={{ color: '#f87171', fontSize: 13, marginBottom: 8 }}>
            确定要删除等级「{tier.name}」吗？此操作不可撤销。
          </p>
          {tier.memberCount > 0 && (
            <p style={{ color: '#fbbf24', fontSize: 12 }}>
              注意：当前有 {tier.memberCount} 名会员属于该等级，建议先调整会员等级后再删除。
            </p>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button
              onClick={() => setDeleteDialogOpen(false)}
              style={{
                padding: '6px 16px',
                background: 'rgba(148,163,184,0.1)',
                color: '#94a3b8',
                border: '1px solid rgba(148,163,184,0.2)',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              取消
            </button>
            <SubmitButton
              onClick={handleDelete}
              loading={isSubmitting}
              disabled={tier.memberCount > 0}
              variant="danger"
            >
              确认删除
            </SubmitButton>
          </div>
        </Dialog>
      )}
    </div>
  );
}

// ─── 样式 ─────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid rgba(148,163,184,0.2)',
  background: 'rgba(30,41,59,0.8)',
  color: '#e2e8f0',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
};
