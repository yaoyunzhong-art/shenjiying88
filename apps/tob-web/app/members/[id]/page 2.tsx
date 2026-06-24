/**
 * members/[id]/page.tsx — 会员详情页 (ToB 会员管理)
 *
 * 使用 DetailShell + Tabs 结构:
 * - 概览 Tab   → 会员基础信息, 等级, 积分, 消费记录
 * - 联系人 Tab → 关联联系人列表
 * - 操作记录 Tab → 状态变更历史
 */
'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useMemo, useState, useCallback } from 'react';
import {
  PageShell,
  DetailShell,
  StatusBadge,
  Modal,
  SubmitButton,
  FormField,
  FormSubmitFeedback,
  useFormSubmit,
  type DetailShellAction,
} from '@m5/ui';
import {
  MOCK_MEMBERS,
  MEMBER_TIER_MAP,
  MEMBER_STATUS_MAP,
  ALL_STORES,
  ALL_MARKETS,
  ALL_SALESPERSONS,
  type MemberItem,
  type MemberTier,
  type MemberStatus,
} from '../../members-data';

// ── 帮助函数 ──

function formatCurrency(amount: number): string {
  if (amount >= 10000) return `¥${(amount / 10000).toFixed(1)}万`;
  return `¥${amount.toLocaleString()}`;
}

const NEXT_STATUS: Partial<Record<MemberStatus, MemberStatus>> = {
  active: 'inactive',
  inactive: 'active',
  suspended: 'churned',
  churned: 'active',
};

const STATUS_ACTION_LABELS: Partial<Record<MemberStatus, string>> = {
  active: '静默标记',
  inactive: '重新激活',
  suspended: '标记流失',
  churned: '恢复激活',
};

// ── 状态流转二次确认文案 ──

function confirmMessage(member: MemberItem, next: MemberStatus): string {
  const from = MEMBER_STATUS_MAP[member.status].label;
  const to = MEMBER_STATUS_MAP[next].label;
  return `确定将会员 "${member.name}" 从 [${from}] 变更为 [${to}] 吗？`;
}

// ── 编辑表单数据类型 ──

type EditFormData = {
  name: string;
  phone: string;
  storeName: string;
  salesperson: string;
  tags: string;
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid rgba(148,163,184,0.25)',
  background: 'rgba(15,23,42,0.6)',
  color: '#e2e8f0',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  color: '#94a3b8',
  marginBottom: 6,
};

const fieldGroupStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 16,
  marginBottom: 16,
};

const fullWidthStyle: React.CSSProperties = {
  marginBottom: 16,
};

// ── 页面组件 ──

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // 查找会员
  const member = useMemo<MemberItem | undefined>(
    () => MOCK_MEMBERS.find((m) => m.id === id),
    [id],
  );

  // 编辑弹窗状态
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditFormData>({ name: '', phone: '', storeName: '', salesperson: '', tags: '' });

  // 状态变更确认弹窗
  const [transitionConfirm, setTransitionConfirm] = useState<{ visible: boolean; nextStatus: MemberStatus | null }>({
    visible: false,
    nextStatus: null,
  });

  // 表单反馈
  const { status: submitStatus, setStatus: setSubmitStatus, feedback, setFeedback, pending } = useFormSubmit();

  // 进入编辑模式
  const startEdit = useCallback(() => {
    if (!member) return;
    setEditForm({
      name: member.name,
      phone: member.phone,
      storeName: member.storeName,
      salesperson: member.salesperson,
      tags: member.tags.join(', '),
    });
    setEditing(true);
  }, [member]);

  // 提交编辑
  const handleEditSubmit = useCallback(() => {
    setEdting(false);
    setSubmitStatus('success');
    setFeedback({ type: 'success', message: '会员信息已更新' });
  }, [setSubmitStatus, setFeedback]);

  // 发起状态变更
  const requestTransition = useCallback(
    (next: MemberStatus) => {
      setTransitionConfirm({ visible: true, nextStatus: next });
    },
    [],
  );

  // 确认状态变更
  const confirmTransition = useCallback(() => {
    setTransitionConfirm({ visible: false, nextStatus: null });
    setSubmitStatus('success');
    setFeedback({ type: 'success', message: '状态已变更' });
  }, [setSubmitStatus, setFeedback]);

  // 取消状态变更
  const cancelTransition = useCallback(() => {
    setTransitionConfirm({ visible: false, nextStatus: null });
  }, []);

  // 未找到会员
  if (!member) {
    return (
      <PageShell>
        <DetailShell
          title="会员不存在"
          actions={[
            { key: 'back', label: '返回会员列表', href: '/members', variant: 'secondary' },
          ]}
        >
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: 48 }}>
            未找到 ID 为 &quot;{id}&quot; 的会员
          </p>
        </DetailShell>
      </PageShell>
    );
  }

  const currentTierMeta = MEMBER_TIER_MAP[member.tier];
  const nextStatus = NEXT_STATUS[member.status];
  const actions: DetailShellAction[] = [
    { key: 'back', label: '返回', href: '/members', variant: 'secondary' },
    { key: 'edit', label: '编辑', variant: 'secondary', onClick: startEdit },
  ];
  if (nextStatus) {
    actions.push({
      key: 'transition',
      label: STATUS_ACTION_LABELS[member.status] ?? '变更状态',
      variant: 'primary',
      onClick: () => requestTransition(nextStatus),
    });
  }

  // ── 概览 Tab 内容 ──
  const overviewContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 会员基础信息卡片 */}
      <div style={cardStyle}>
        <h3 style={sectionTitleStyle}>基础信息</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <InfoField label="会员编码" value={member.code} />
          <InfoField label="姓名" value={member.name} />
          <InfoField label="手机号" value={member.phone} />
          <InfoField label="归属市场" value={member.marketCode} />
          <InfoField label="所属门店" value={member.storeName} />
          <InfoField label="专属导购" value={member.salesperson} />
        </div>
      </div>

      {/* 等级与积分卡片 */}
      <div style={cardStyle}>
        <h3 style={sectionTitleStyle}>等级与积分</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <InfoField
            label="会员等级"
            value={<StatusBadge variant={currentTierMeta.variant}>{currentTierMeta.label}</StatusBadge>}
          />
          <InfoField label="当前积分" value={<span style={{ fontWeight: 600, fontSize: 20, color: '#fbbf24' }}>{member.points.toLocaleString()}</span>} />
          <InfoField label="累计消费" value={<span style={{ fontWeight: 600, fontSize: 20, color: '#4ade80' }}>{formatCurrency(member.totalSpent)}</span>} />
        </div>
      </div>

      {/* 标签与状态卡片 */}
      <div style={cardStyle}>
        <h3 style={sectionTitleStyle}>标签与状态</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {member.tags.map((tag) => (
            <span key={tag} style={tagStyle}>{tag}</span>
          ))}
          {member.tags.length === 0 && <span style={{ color: '#64748b', fontSize: 14 }}>暂无标签</span>}
        </div>
        <InfoField
          label="当前状态"
          value={
            <StatusBadge variant={MEMBER_STATUS_MAP[member.status].variant}>
              {MEMBER_STATUS_MAP[member.status].label}
            </StatusBadge>
          }
        />
      </div>

      {/* 时间线卡片 */}
      <div style={cardStyle}>
        <h3 style={sectionTitleStyle}>时间信息</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <InfoField label="创建时间" value={member.createdAt} />
          <InfoField label="最后到店" value={member.lastVisit} />
        </div>
      </div>
    </div>
  );

  // ── 联系人 Tab ──
  const contactContent = (
    <div style={cardStyle}>
      <h3 style={sectionTitleStyle}>关联联系人</h3>
      <p style={{ color: '#94a3b8', fontSize: 14 }}>暂无联系人数据（系统预留）</p>
    </div>
  );

  // ── 操作记录 Tab ──
  const historyContent = (
    <div style={cardStyle}>
      <h3 style={sectionTitleStyle}>操作记录</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <HistoryRecord time={member.createdAt} action="创建会员" actor={member.salesperson} detail={`会员 ${member.name} 创建，初始等级 ${currentTierMeta.label}`} />
        <HistoryRecord time={member.lastVisit} action="最后到店" actor="" detail={`门店: ${member.storeName}`} />
      </div>
    </div>
  );

  // ── Tab 配置 ──
  const tabs = [
    { key: 'overview', label: '概览', content: overviewContent },
    { key: 'contacts', label: '联系人', content: contactContent },
    { key: 'history', label: '操作记录', content: historyContent },
  ];

  return (
    <PageShell>
      <DetailShell
        title={member.name}
        subtitle={`会员编码: ${member.code}`}
        status={
          <StatusBadge variant={MEMBER_STATUS_MAP[member.status].variant}>
            {MEMBER_STATUS_MAP[member.status].label}
          </StatusBadge>
        }
        actions={actions}
        tabs={tabs}
      />

      {/* 编辑弹窗 */}
      <Modal open={editing} onClose={() => setEditing(false)} title="编辑会员信息">
        <div>
          <div style={fieldGroupStyle}>
            <div>
              <label style={labelStyle}>姓名</label>
              <input
                style={inputStyle}
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <label style={labelStyle}>手机号</label>
              <input
                style={inputStyle}
                value={editForm.phone}
                onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>
          <div style={fieldGroupStyle}>
            <div>
              <label style={labelStyle}>所属门店</label>
              <select
                style={inputStyle}
                value={editForm.storeName}
                onChange={(e) => setEditForm((prev) => ({ ...prev, storeName: e.target.value }))}
              >
                {ALL_STORES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>专属导购</label>
              <select
                style={inputStyle}
                value={editForm.salesperson}
                onChange={(e) => setEditForm((prev) => ({ ...prev, salesperson: e.target.value }))}
              >
                {ALL_SALESPERSONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={fullWidthStyle}>
            <label style={labelStyle}>标签（逗号分隔）</label>
            <input
              style={inputStyle}
              value={editForm.tags}
              onChange={(e) => setEditForm((prev) => ({ ...prev, tags: e.target.value }))}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
            <SubmitButton variant="secondary" onClick={() => setEditing(false)}>
              取消
            </SubmitButton>
            <SubmitButton onClick={handleEditSubmit} pending={pending}>
              保存
            </SubmitButton>
          </div>
        </div>
      </Modal>

      {/* 状态变更确认弹窗 */}
      <Modal
        open={transitionConfirm.visible}
        onClose={cancelTransition}
        title="变更状态"
      >
        {transitionConfirm.nextStatus && (
          <div>
            <p style={{ color: '#e2e8f0', marginBottom: 16 }}>
              {confirmMessage(member, transitionConfirm.nextStatus)}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <SubmitButton variant="secondary" onClick={cancelTransition}>
                取消
              </SubmitButton>
              <SubmitButton onClick={confirmTransition} pending={pending}>
                确认变更
              </SubmitButton>
            </div>
          </div>
        )}
      </Modal>

      {/* 操作反馈 */}
      {feedback && (
        <FormSubmitFeedback data={{ feedback }} timeout={3000} onTimeout={() => setSubmitStatus('idle')} />
      )}
    </PageShell>
  );
}

// ── 内联小组件 ──

const cardStyle: React.CSSProperties = {
  background: 'rgba(30,41,59,0.6)',
  borderRadius: 12,
  padding: 20,
  border: '1px solid rgba(148,163,184,0.12)',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: '#e2e8f0',
  marginBottom: 16,
  marginTop: 0,
};

const tagStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '4px 12px',
  borderRadius: 6,
  background: 'rgba(99,102,241,0.15)',
  color: '#a5b4fc',
  fontSize: 13,
};

function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, color: '#e2e8f0' }}>{value}</div>
    </div>
  );
}

function HistoryRecord({ time, action, actor, detail }: { time: string; action: string; actor: string; detail: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
      <div style={{ minWidth: 140, fontSize: 13, color: '#64748b' }}>{time}</div>
      <div style={{ minWidth: 80, fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>{action}</div>
      {actor && <div style={{ minWidth: 80, fontSize: 13, color: '#94a3b8' }}>{actor}</div>}
      <div style={{ fontSize: 13, color: '#94a3b8' }}>{detail}</div>
    </div>
  );
}
