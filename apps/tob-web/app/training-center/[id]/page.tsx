/**
 * training-center/[id]/page.tsx — 培训详情页 (ToB 培训中心)
 *
 * 使用 DetailShell + InfoSection / InfoRow 结构展示培训课程信息
 * 支持编辑 + 状态流转 + 删除
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
  MOCK_TODAY_SESSIONS,
} from '../training-center-data';

// ── 类型定义 ──

type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
type SessionType = 'skill' | 'safety' | 'sales' | 'service' | 'leadership';

interface SessionItem {
  id: string;
  title: string;
  coach: string;
  type: SessionType;
  date: string;
  time: string;
  enrolled: number;
  capacity: number;
  status: SessionStatus;
}

const SESSION_TYPE_MAP: Record<SessionType, { label: string; variant: 'info' | 'warning' | 'success' | 'error' | 'default' }> = {
  skill: { label: '技能', variant: 'info' },
  safety: { label: '安全', variant: 'warning' },
  sales: { label: '销售', variant: 'success' },
  service: { label: '服务', variant: 'default' },
  leadership: { label: '管理', variant: 'error' },
};

const SESSION_STATUS_MAP: Record<SessionStatus, { label: string; variant: 'warning' | 'info' | 'success' | 'error' }> = {
  scheduled: { label: '待开始', variant: 'warning' },
  in_progress: { label: '进行中', variant: 'info' },
  completed: { label: '已完成', variant: 'success' },
  cancelled: { label: '已取消', variant: 'error' },
};

// ── 工具函数 ──

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const NEXT_STATUS: Partial<Record<SessionStatus, SessionStatus>> = {
  scheduled: 'in_progress',
  in_progress: 'completed',
  completed: 'scheduled',
  cancelled: 'scheduled',
};

const STATUS_ACTION_LABELS: Partial<Record<SessionStatus, string>> = {
  scheduled: '开始上课',
  in_progress: '完成课程',
  completed: '重新排期',
  cancelled: '重新排期',
};

function confirmMessage(session: SessionItem, next: SessionStatus): string {
  const from = SESSION_STATUS_MAP[session.status].label;
  const to = SESSION_STATUS_MAP[next].label;
  return `确定将培训 "${session.title}" 从 [${from}] 变更为 [${to}] 吗？`;
}

// ── 编辑表单数据类型 ──

type EditFormData = {
  title: string;
  coach: string;
  type: SessionType;
  date: string;
  time: string;
  capacity: number;
};

// ── 内联样式 ──

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

const secondaryBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 8,
  border: '1px solid rgba(148,163,184,0.2)',
  background: 'transparent',
  color: '#94a3b8',
  cursor: 'pointer',
  fontSize: 13,
};

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        marginBottom: 16,
        borderRadius: 12,
        border: '1px solid rgba(148,163,184,0.12)',
        background: 'rgba(15,23,42,0.4)',
        padding: 20,
      }}
    >
      <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </section>
  );
}

function InfoRow({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', minHeight: 28 }}>
      <span style={{ fontSize: 13, color: '#64748b' }}>{label}</span>
      {children ?? <span style={{ fontSize: 14, color: '#e2e8f0', fontWeight: 500 }}>{value}</span>}
    </div>
  );
}

function StatBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '10px 8px', borderRadius: 8, background: 'rgba(15,23,42,0.3)' }}>
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

// ── 编辑弹窗 ──

function EditSessionModal({
  open,
  onClose,
  onSaved,
  session,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (data: EditFormData) => void;
  session: SessionItem;
}) {
  const [form, setForm] = useState<EditFormData>({
    title: session.title,
    coach: session.coach,
    type: session.type,
    date: session.date,
    time: session.time,
    capacity: session.capacity,
  });

  const { submitting, error, success, submit, clearError } = useFormSubmit({
    onSubmit: async () => {
      if (!form.title.trim()) throw new Error('课程名称不能为空');
      if (!form.coach.trim()) throw new Error('教练不能为空');
      if (form.capacity < 1) throw new Error('容量至少为 1');
      onSaved(form);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit();
  };

  return (
    <Modal open={open} onClose={onClose} title="编辑培训课程">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FormField label="课程名称" error={!form.title.trim() ? '名称不能为空' : undefined}>
          <input
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="课程名称"
            style={inputStyle}
          />
        </FormField>
        <FormField label="教练" error={!form.coach.trim() ? '教练不能为空' : undefined}>
          <input
            value={form.coach}
            onChange={(e) => setForm((prev) => ({ ...prev, coach: e.target.value }))}
            placeholder="教练姓名"
            style={inputStyle}
          />
        </FormField>
        <FormField label="课程类型">
          <select
            style={inputStyle}
            value={form.type}
            onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as SessionType }))}
          >
            <option value="skill">技能培训</option>
            <option value="safety">安全培训</option>
            <option value="sales">销售培训</option>
            <option value="service">服务培训</option>
            <option value="leadership">管理培训</option>
          </select>
        </FormField>
        <FormField label="日期">
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
            style={inputStyle}
          />
        </FormField>
        <FormField label="时间">
          <input
            value={form.time}
            onChange={(e) => setForm((prev) => ({ ...prev, time: e.target.value }))}
            placeholder="如: 09:00-10:30"
            style={inputStyle}
          />
        </FormField>
        <FormField label="容量" error={form.capacity < 1 ? '容量至少为 1' : undefined}>
          <input
            type="number"
            min={1}
            value={form.capacity}
            onChange={(e) => setForm((prev) => ({ ...prev, capacity: parseInt(e.target.value, 10) || 1 }))}
            style={inputStyle}
          />
        </FormField>
        <FormSubmitFeedback submitting={submitting} error={error} success={success} onDismissError={clearError} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={secondaryBtnStyle}>取消</button>
          <SubmitButton loading={submitting} type="submit">保存</SubmitButton>
        </div>
      </form>
    </Modal>
  );
}

// ── 状态流转确认弹窗 ──

function TransitionModal({
  open,
  onClose,
  onConfirm,
  session,
  nextStatus,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  session: SessionItem;
  nextStatus: SessionStatus;
}) {
  const { submitting, submit } = useFormSubmit({
    onSubmit: async () => {
      onConfirm();
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="变更状态">
      <div style={{ color: '#cbd5e1', marginBottom: 16 }}>
        {confirmMessage(session, nextStatus)}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={secondaryBtnStyle}>取消</button>
          <SubmitButton loading={submitting} type="submit">确认变更</SubmitButton>
        </div>
      </form>
    </Modal>
  );
}

// ── 主页面 ──

export default function TrainingSessionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [session, setSession] = useState<SessionItem | undefined>(() =>
    MOCK_TODAY_SESSIONS.find((s) => s.id === params.id) as SessionItem | undefined,
  );
  const [editOpen, setEditOpen] = useState(false);
  const [transitionOpen, setTransitionOpen] = useState(false);

  // 状态流转
  const transitionStatus = useCallback(() => {
    if (!session) return;
    const next = NEXT_STATUS[session.status];
    if (!next) return;
    setSession((prev) =>
      prev ? { ...prev, status: next } : prev,
    );
    setTransitionOpen(false);
  }, [session]);

  // 保存编辑
  const handleSaved = useCallback((data: EditFormData) => {
    setSession((prev) =>
      prev
        ? {
            ...prev,
            title: data.title,
            coach: data.coach,
            type: data.type,
            date: data.date,
            time: data.time,
            capacity: data.capacity,
          }
        : prev,
    );
    setEditOpen(false);
  }, []);

  const detailActions: DetailShellAction[] = useMemo(
    () => [
      {
        key: 'edit',
        label: '编辑',
        onClick: () => setEditOpen(true),
        variant: 'primary',
      },
      {
        key: 'transition',
        label: session ? STATUS_ACTION_LABELS[session.status] ?? '状态流转' : '状态流转',
        onClick: () => setTransitionOpen(true),
        variant: 'secondary',
      },
      {
        key: 'back',
        label: '返回培训中心',
        onClick: () => router.push('/training-center'),
        variant: 'secondary',
      },
    ],
    [session],
  );

  if (!session) {
    return (
      <PageShell title="培训详情" description="">
        <div style={{ textAlign: 'center', padding: 64, color: '#64748b', fontSize: 14 }}>
          未找到培训课程 (ID: {params.id})
        </div>
      </PageShell>
    );
  }

  const typeMeta = SESSION_TYPE_MAP[session.type];
  const s = SESSION_STATUS_MAP[session.status];
  const nextStatus = NEXT_STATUS[session.status];
  const occupancyRate = Math.round((session.enrolled / session.capacity) * 100);

  return (
    <PageShell
      title={session.title}
      description={`${session.date} ${session.time} · ${typeMeta.label} · ${session.coach}`}
    >
      <DetailShell
        title={session.title}
        subtitle={`${session.date} ${session.time} · ${typeMeta.label} · ${session.coach}`}
        actions={detailActions}
      >
        {/* 指标卡片 */}
        <div
          style={{
            display: 'grid',
            gap: 10,
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            marginBottom: 20,
          }}
        >
          <StatBadge label="课程类型" value={typeMeta.label} color={typeMeta.variant === 'info' ? '#3b82f6' : '#f59e0b'} />
          <StatBadge label="报名人数" value={`${session.enrolled}/${session.capacity}`} color="#4ade80" />
          <StatBadge label="满座率" value={`${occupancyRate}%`} color={occupancyRate >= 80 ? '#4ade80' : '#fbbf24'} />
          <StatBadge label="状态" value={s.label} color={s.variant === 'success' ? '#4ade80' : s.variant === 'error' ? '#f87171' : '#60a5fa'} />
        </div>

        {/* 课程概览 */}
        <InfoSection title="课程概览">
          <InfoRow label="课程名称" value={session.title} />
          <InfoRow label="教练" value={session.coach} />
          <InfoRow label="类型">
            <StatusBadge label={typeMeta.label} variant={typeMeta.variant} size="sm" dot={false} />
          </InfoRow>
          <InfoRow label="状态">
            <StatusBadge label={s.label} variant={s.variant} size="sm" dot />
          </InfoRow>
        </InfoSection>

        {/* 时间安排 */}
        <InfoSection title="时间安排">
          <InfoRow label="日期" value={session.date} />
          <InfoRow label="时间" value={session.time} />
        </InfoSection>

        {/* 报名信息 */}
        <InfoSection title="报名信息">
          <InfoRow label="已报名" value={`${session.enrolled} 人`} />
          <InfoRow label="容量" value={`${session.capacity} 人`} />
          <InfoRow label="满座率" value={`${occupancyRate}%`} />
          <InfoRow label="剩余名额" value={`${session.capacity - session.enrolled} 个`} />
        </InfoSection>
      </DetailShell>

      {/* 编辑弹窗 */}
      {session && (
        <EditSessionModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={handleSaved}
          session={session}
        />
      )}

      {/* 状态流转弹窗 */}
      {session && nextStatus && (
        <TransitionModal
          open={transitionOpen}
          onClose={() => setTransitionOpen(false)}
          onConfirm={transitionStatus}
          session={session}
          nextStatus={nextStatus}
        />
      )}
    </PageShell>
  );
}
