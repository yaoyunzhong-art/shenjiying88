'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  DetailShell,
  InfoRow,
  ConfirmDialog,
  StatusBadge,
  Alert,
  useToast,
  useAlert,
  FormSubmitFeedback,
  FormField,
  SubmitButton,
  type DetailShellAction,
} from '@m5/ui';

// ---- 类型 ----

type MembershipTier = 'diamond' | 'gold' | 'silver' | 'bronze' | 'basic';
type MemberStatus = 'active' | 'inactive' | 'frozen';

interface Member {
  id: string;
  name: string;
  phone: string;
  email: string;
  tier: MembershipTier;
  points: number;
  storeName: string;
  totalVisits: number;
  lastVisit: string;
  status: MemberStatus;
  joinedAt: string;
  birthday: string;
  address: string;
  tags: string[];
  notes: string;
}

const TIER_LABELS: Record<MembershipTier, string> = {
  diamond: '钻石会员',
  gold: '黄金会员',
  silver: '银卡会员',
  bronze: '铜卡会员',
  basic: '普通会员',
};

const TIER_VARIANTS: Record<MembershipTier, 'danger' | 'warning' | 'default' | 'pending' | 'neutral'> = {
  diamond: 'danger',
  gold: 'warning',
  silver: 'default',
  bronze: 'pending',
  basic: 'neutral',
};

const STATUS_LABELS: Record<MemberStatus, string> = {
  active: '活跃',
  inactive: '非活跃',
  frozen: '冻结',
};

const STATUS_VARIANTS: Record<MemberStatus, 'success' | 'danger' | 'warning'> = {
  active: 'success',
  inactive: 'danger',
  frozen: 'warning',
};

// ---- Mock 数据 ----

const MOCK_MEMBERS: Record<string, Member> = {
  m1: {
    id: 'm1', name: '张伟', phone: '138****1234', email: 'zhangwei@example.com',
    tier: 'diamond', points: 28500, storeName: 'Demo Store 旗舰店',
    totalVisits: 156, lastVisit: '2026-06-22', status: 'active',
    joinedAt: '2025-01-15', birthday: '1990-05-20',
    address: '上海市浦东新区张江高科技园区',
    tags: ['高净值', '老顾客', '爱推荐'],
    notes: '每次到店消费金额较高，偏好高端产品线。',
  },
  m2: {
    id: 'm2', name: '李娜', phone: '139****5678', email: 'lina@example.com',
    tier: 'gold', points: 12400, storeName: 'Demo Store 旗舰店',
    totalVisits: 89, lastVisit: '2026-06-20', status: 'active',
    joinedAt: '2025-03-22', birthday: '1988-11-03',
    address: '北京市朝阳区三里屯',
    tags: ['活跃', '社媒达人'],
    notes: '喜欢分享购物体验到社交媒体。',
  },
  m5: {
    id: 'm5', name: '孙丽', phone: '135****7890', email: 'sunli@example.com',
    tier: 'bronze', points: 2100, storeName: 'Demo Store 社区店',
    totalVisits: 18, lastVisit: '2026-05-30', status: 'inactive',
    joinedAt: '2025-09-01', birthday: '1995-07-15',
    address: '广州市天河区珠江新城',
    tags: ['新客', '价格敏感'],
    notes: '近一个月未到店，建议发送优惠券激活。',
  },
};

// ---- 编辑表单 ----

interface EditFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

function EditMemberForm({
  member,
  onCancel,
  onSaved,
}: {
  member: Member;
  onCancel: () => void;
  onSaved: (data: EditFormData) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data: EditFormData = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value.trim(),
      phone: (form.elements.namedItem('phone') as HTMLInputElement).value.trim(),
      email: (form.elements.namedItem('email') as HTMLInputElement).value.trim(),
      address: (form.elements.namedItem('address') as HTMLInputElement).value.trim(),
      notes: (form.elements.namedItem('notes') as HTMLTextAreaElement).value.trim(),
    };
    if (!data.name) {
      setError('请输入会员姓名');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      // 模拟保存延迟
      await new Promise((r) => setTimeout(r, 600));
      onSaved(data);
    } catch {
      setError('保存失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      data-testid="member-edit-form"
      style={{
        background: 'rgba(15, 23, 42, 0.4)',
        borderRadius: 12,
        padding: 20,
        border: '1px solid rgba(148, 163, 184, 0.16)',
      }}
    >
      <div style={{ marginBottom: 16, fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>
        编辑会员信息
      </div>

      <FormField label="姓名" htmlFor="edit-name" required>
        <input
          id="edit-name"
          name="name"
          type="text"
          defaultValue={member.name}
          data-testid="edit-name"
          style={inputStyle}
        />
      </FormField>

      <FormField label="手机号" htmlFor="edit-phone" required>
        <input
          id="edit-phone"
          name="phone"
          type="text"
          defaultValue={member.phone}
          data-testid="edit-phone"
          style={inputStyle}
        />
      </FormField>

      <FormField label="邮箱" htmlFor="edit-email">
        <input
          id="edit-email"
          name="email"
          type="email"
          defaultValue={member.email}
          data-testid="edit-email"
          style={inputStyle}
        />
      </FormField>

      <FormField label="地址" htmlFor="edit-address">
        <input
          id="edit-address"
          name="address"
          type="text"
          defaultValue={member.address}
          data-testid="edit-address"
          style={inputStyle}
        />
      </FormField>

      <FormField label="备注" htmlFor="edit-notes">
        <textarea
          id="edit-notes"
          name="notes"
          defaultValue={member.notes}
          data-testid="edit-notes"
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </FormField>

      {error && <FormSubmitFeedback error={error} />}

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <SubmitButton type="submit" loading={submitting} data-testid="save-btn">
          保存
        </SubmitButton>
        <button
          type="button"
          onClick={onCancel}
          data-testid="cancel-btn"
          style={{
            ...buttonBaseStyle,
            color: '#94a3b8',
            background: 'transparent',
            border: '1px solid rgba(148,163,184,0.25)',
          }}
        >
          取消
        </button>
      </div>
    </form>
  );
}

// ---- 样式常量 ----

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  borderRadius: 8,
  color: '#e2e8f0',
  fontSize: 14,
  boxSizing: 'border-box' as const,
};

const buttonBaseStyle: React.CSSProperties = {
  padding: '8px 18px',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  border: 'none',
};

const infoGroupStyle: React.CSSProperties = {
  padding: 16,
  borderRadius: 10,
  background: 'rgba(15, 23, 42, 0.25)',
  border: '1px solid rgba(148, 163, 184, 0.1)',
};

// ---- 页面 ----

export default function MemberDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { alert, dismiss: clearAlert } = useAlert();

  const [member, setMember] = useState<Member | null>(
    () => MOCK_MEMBERS[params.id] ?? null,
  );
  const [editing, setEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // ---- 状态流转 ----

  const TRANSITIONS: Record<MemberStatus, Array<{ label: string; to: MemberStatus; variant: DetailShellAction['variant'] }>> = {
    active: [
      { label: '冻结', to: 'frozen', variant: 'secondary' },
      { label: '标记非活跃', to: 'inactive', variant: 'danger' },
    ],
    inactive: [
      { label: '激活', to: 'active', variant: 'primary' },
      { label: '冻结', to: 'frozen', variant: 'secondary' },
    ],
    frozen: [
      { label: '解冻', to: 'active', variant: 'primary' },
    ],
  };

  const handleTransition = (to: MemberStatus) => {
    if (!member) return;
    setMember({ ...member, status: to });
    toast.success(`已${STATUS_LABELS[to]}`, { durationMs: 2000 });
  };

  // ---- 删除 ----

  const handleDelete = async () => {
    await new Promise((r) => setTimeout(r, 500));
    setMember(null);
    setDeleteDialogOpen(false);
    toast.success('已删除', { durationMs: 2000 });
    setTimeout(() => router.push('/members'), 1200);
  };

  // ---- 编辑保存 ----

  const handleEditSaved = (data: EditFormData) => {
    if (!member) return;
    setMember({ ...member, ...data });
    setEditing(false);
    toast.success('保存成功', { durationMs: 2000 });
  };

  // ---- 操作按钮 ----

  const detailActions: DetailShellAction[] = editing
    ? []
    : member
      ? [
          {
            key: 'edit',
            label: '编辑',
            variant: 'primary',
            onClick: () => setEditing(true),
          },
          ...TRANSITIONS[member.status].map((t) => ({
            key: `transition-${t.to}`,
            label: t.label,
            variant: t.variant,
            onClick: () => handleTransition(t.to),
          })),
          {
            key: 'delete',
            label: '删除',
            variant: 'danger',
            onClick: () => setDeleteDialogOpen(true),
          },
        ]
      : [];

  // ---- 信息区域 (hooks 必须在 early return 之前) ----

  const infoSections = useMemo(() => {
    if (!member) return [];
    return [
      {
        title: '基本信息',
        content: (
          <div style={infoGroupStyle}>
            <InfoRow label="会员姓名" value={member.name} />
            <InfoRow label="手机号" value={member.phone} />
            <InfoRow label="邮箱" value={member.email} />
            <InfoRow label="生日" value={member.birthday} />
            <InfoRow label="地址" value={member.address} />
            <InfoRow label="加入日期" value={member.joinedAt} />
          </div>
        ),
      },
      {
        title: '会员等级 & 积分',
        content: (
          <div style={infoGroupStyle}>
            <InfoRow
              label="会员等级"
              value={
                <StatusBadge
                  label={TIER_LABELS[member.tier]}
                  variant={TIER_VARIANTS[member.tier]}
                  size="sm"
                />
              }
            />
            <InfoRow
              label="积分"
              value={member.points.toLocaleString()}
            />
            <InfoRow
              label="状态"
              value={
                <StatusBadge
                  label={STATUS_LABELS[member.status]}
                  variant={STATUS_VARIANTS[member.status]}
                  size="sm"
                />
              }
            />
          </div>
        ),
      },
      {
        title: '到店记录',
        content: (
          <div style={infoGroupStyle}>
            <InfoRow label="所属门店" value={member.storeName} />
            <InfoRow label="到店次数" value={String(member.totalVisits)} />
            <InfoRow label="最近到店" value={member.lastVisit} />
          </div>
        ),
      },
      {
        title: '标签 & 备注',
        content: (
          <div style={infoGroupStyle}>
            <InfoRow
              label="标签"
              value={
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {member.tags.map((tag) => (
                    <span
                      key={tag}
                      data-testid={`tag-${tag}`}
                      style={{
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: 'rgba(99, 102, 241, 0.15)',
                        color: '#a78bfa',
                        fontSize: 12,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              }
            />
            <InfoRow
              label="备注"
              value={member.notes}
            />
          </div>
        ),
      },
    ];
  }, [member]);

  // ---- 404 - 所有 hooks 之后 ----

  if (!member) {
    return (
      <DetailShell
        title="会员详情"
        backLabel="返回列表"
        backHref="/members"
        loading={false}
      >
        <div style={{ textAlign: 'center', padding: 64, color: '#64748b', fontSize: 14 }}>
          会员不存在或已被删除
        </div>
      </DetailShell>
    );
  }

  return (
    <>
      {/* Alert 提示 */}
      {alert && (
        <Alert
          variant={alert.variant}
          dismissible
          onDismiss={clearAlert}
        >
          {alert.message}
        </Alert>
      )}

      <DetailShell
        title={`${member.name} - 会员详情`}
        subtitle={`${member.tier === 'diamond' ? '💎 ' : ''}${TIER_LABELS[member.tier]} · ${member.storeName}`}
        backLabel="返回列表"
        backHref="/members"
        actions={detailActions}
        sections={infoSections}
        breadcrumbs={[
          { label: '首页', href: '/' },
          { label: '会员管理', href: '/members' },
          { label: member.name },
        ]}
      >
        {/* 编辑模式 */}
        {editing && (
          <div style={{ marginTop: 20 }} data-testid="edit-section">
            <EditMemberForm
              member={member}
              onCancel={() => setEditing(false)}
              onSaved={handleEditSaved}
            />
          </div>
        )}

        {/* 删除确认 */}
        <ConfirmDialog
          open={deleteDialogOpen}
          title="确认删除"
          message={`确定要删除会员「${member.name}」吗？此操作不可撤销。`}
          confirmLabel="确认删除"
          cancelLabel="取消"
          onConfirm={handleDelete}
          onCancel={() => setDeleteDialogOpen(false)}
          variant="danger"
        />
      </DetailShell>
    </>
  );
}
