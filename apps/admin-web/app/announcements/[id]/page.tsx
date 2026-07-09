/**
 * 公告详情页 — Announcement Detail Page (Next.js App Router Page)
 * 角色视角: 👔系统管理员 / 📢运营主管
 * 功能: 查看公告详情、编辑、删除、状态流转（发布/归档）
 */
'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  DetailActionBar,
  DetailClosureBar,
  InfoRow,
  StatusBadge,
  StatCard,
  SubmitButton,
  WorkspaceBreadcrumb,
  FormSubmitFeedback,
} from '@m5/ui';
import { useDetailActions } from '../../components/use-detail-actions';
import { buildStandardBreadcrumb, buildStandardClosureLinks } from '../../components/detail-workspace-registry';

// ---- 类型（与 list 页对齐） ----

type AnnouncementCategory = 'system' | 'promotion' | 'operation' | 'emergency' | 'policy';
type AnnouncementStatus = 'draft' | 'published' | 'archived';
type AnnouncementPriority = 'high' | 'normal' | 'low';

interface Announcement {
  id: string;
  title: string;
  category: AnnouncementCategory;
  status: AnnouncementStatus;
  priority: AnnouncementPriority;
  summary: string;
  content: string;
  author: string;
  publishedAt: string;
  readCount: number;
  createdAt: string;
  updatedAt: string;
}

// ---- 常量映射 ----

export const CATEGORY_LABELS: Record<AnnouncementCategory, string> = {
  system: '系统通知', promotion: '促销活动', operation: '运营管理', emergency: '紧急通知', policy: '制度政策',
};

export const STATUS_LABELS: Record<AnnouncementStatus, string> = {
  draft: '草稿', published: '已发布', archived: '已归档',
};

export const PRIORITY_LABELS: Record<AnnouncementPriority, string> = {
  high: '高', normal: '中', low: '低',
};

export const PRIORITY_COLORS: Record<AnnouncementPriority, string> = {
  high: '#ef4444', normal: '#f59e0b', low: '#6b7280',
};

export const STATUS_BADGE_VARIANT: Record<AnnouncementStatus, 'default' | 'success' | 'warning'> = {
  draft: 'default', published: 'success', archived: 'warning',
};

export const STATUS_FLOW_OPTIONS: { from: AnnouncementStatus; to: AnnouncementStatus; label: string }[] = [
  { from: 'draft', to: 'published', label: '发布' },
  { from: 'published', to: 'archived', label: '归档' },
];

// ---- Mock 数据 ----

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: 'a1', title: '2026年7月系统升级维护通知', category: 'system', status: 'published', priority: 'high', summary: '核心数据库将于7月12日凌晨2:00-5:00停机维护', content: '各位同事：\n\n根据IT运维计划，核心数据库将于2026年7月12日凌晨2:00-5:00进行停机维护升级。届时以下系统将暂停服务：\n· 门店POS收银系统\n· 会员积分查询与兑换\n· 在线商城的订单处理\n\n请相关部门提前做好准备工作。\n\n技术部\n2026-07-05', author: '技术部', publishedAt: '2026-07-05', readCount: 12580, createdAt: '2026-07-04', updatedAt: '2026-07-05' },
  { id: 'a2', title: '夏季狂欢购 · 全场满减活动', category: 'promotion', status: 'published', priority: 'normal', summary: '7月15日-7月31日全场满300减60', content: '活动详情：\n\n夏季狂欢购大促活动即将启动，请各门店提前准备：\n· 活动时间：2026年7月15日-7月31日\n· 满300减60，部分商品不参与\n· 活动物料已下发，请各门店于7月14日前布置完毕', author: '运营部', publishedAt: '2026-07-03', readCount: 8430, createdAt: '2026-07-01', updatedAt: '2026-07-03' },
  { id: 'a5', title: '季度库存盘点计划', category: 'operation', status: 'draft', priority: 'low', summary: '拟定7月下旬进行季度盘点，待确认', content: '盘点计划草案：\n\n拟定7月20日~7月25日进行季度库存盘点，具体安排待确认后另行通知。\n\n仓管部\n2026-07-06', author: '仓管部', publishedAt: '', readCount: 0, createdAt: '2026-07-06', updatedAt: '2026-07-06' },
  { id: 'a7', title: '端午假期值班安排', category: 'operation', status: 'archived', priority: 'normal', summary: '端午假期各门店值班表已发布', content: '端午假期值班安排：\n\n各门店请按已发布的值班表执行，如有调整请联系运营部。\n\n运营部\n2026-06-15', author: '运营部', publishedAt: '2026-06-15', readCount: 12540, createdAt: '2026-06-12', updatedAt: '2026-06-15' },
];

function findById(id: string): Announcement | undefined {
  return MOCK_ANNOUNCEMENTS.find((a) => a.id === id);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } catch {
    return dateStr;
  }
}

// ---- 页面组件 ----

export default function AnnouncementDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  // 如果 id 是数组，取第一个
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id ?? '';

  const [announcement, setAnnouncement] = useState<Announcement | undefined>(findById(id));
  const [submitState, setSubmitState] = useState<'idle' | 'success' | 'error'>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);

  // 编辑字段
  const [editForm, setEditForm] = useState({ title: '', summary: '', content: '' });
  const [editErrors, setEditErrors] = useState<{ title?: string; summary?: string }>({});

  // 初始化编辑表单
  useEffect(() => {
    if (announcement) {
      setEditForm({ title: announcement.title, summary: announcement.summary, content: announcement.content });
    }
  }, [announcement?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // 详情操作
  const { actions } = useDetailActions({
    workspace: 'announcements',
    detailId: id,
    record: announcement,
    shareTitle: `公告：${announcement?.title ?? ''}`,
    shareText: `${announcement?.summary ?? ''}`,
  });

  // 状态流转
  const availableTransitions = useMemo(() => {
    if (!announcement) return [];
    return STATUS_FLOW_OPTIONS.filter((opt) => opt.from === announcement.status);
  }, [announcement]);

  const handleStatusTransition = useCallback((targetStatus: AnnouncementStatus) => {
    if (!announcement) return;
    const now = new Date().toISOString().slice(0, 10);
    const updated: Announcement = {
      ...announcement,
      status: targetStatus,
      publishedAt: targetStatus === 'published' ? now : announcement.publishedAt,
      updatedAt: now,
    };
    // 更新 mock 数据
    const idx = MOCK_ANNOUNCEMENTS.findIndex((a) => a.id === announcement.id);
    if (idx !== -1) MOCK_ANNOUNCEMENTS[idx] = updated;
    setAnnouncement(updated);
    setFeedbackMessage(`公告「${announcement.title}」已${STATUS_LABELS[targetStatus]}`);
    setSubmitState('success');
  }, [announcement]);

  // 删除
  const handleDelete = useCallback(() => {
    if (!announcement) return;
    const idx = MOCK_ANNOUNCEMENTS.findIndex((a) => a.id === announcement.id);
    if (idx !== -1) MOCK_ANNOUNCEMENTS.splice(idx, 1);
    setFeedbackMessage('公告已删除');
    setSubmitState('success');
    setTimeout(() => router.push('/announcements'), 800);
  }, [announcement, router]);

  // 编辑提交
  const handleEditSubmit = useCallback(() => {
    if (!announcement) return;
    const errors: { title?: string; summary?: string } = {};
    if (!editForm.title.trim()) errors.title = '公告标题不能为空';
    else if (editForm.title.trim().length > 100) errors.title = '标题最多100个字符';
    if (!editForm.summary.trim()) errors.summary = '摘要不能为空';
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const now = new Date().toISOString().slice(0, 10);
    const updated: Announcement = {
      ...announcement,
      title: editForm.title.trim(),
      summary: editForm.summary.trim(),
      content: editForm.content.trim(),
      updatedAt: now,
    };
    const idx = MOCK_ANNOUNCEMENTS.findIndex((a) => a.id === announcement.id);
    if (idx !== -1) MOCK_ANNOUNCEMENTS[idx] = updated;
    setAnnouncement(updated);
    setEditing(false);
    setFeedbackMessage(`公告「${updated.title}」已更新`);
    setSubmitState('success');
  }, [announcement, editForm]);

  // 未找到
  if (!announcement) {
    return (
      <main style={{ maxWidth: 860, margin: '0 auto', padding: 32 }}>
        <WorkspaceBreadcrumb
          {...buildStandardBreadcrumb({ workspace: 'announcements', detailLabel: '公告详情' })}
        />
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <h2>公告不存在</h2>
          <p>ID 为 {id} 的公告未找到，可能已被删除或 ID 错误。</p>
          <SubmitButton label="返回公告列表" variant="primary" onClick={() => router.push('/announcements')} />
        </div>
      </main>
    );
  }

  // ---- 渲染 ----

  const closureLinks = [...buildStandardClosureLinks({ workspace: 'announcements', detailId: id })];

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: 32 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'announcements', detailLabel: announcement.title })}
      />

      {/* 反馈 */}
      {submitState === 'success' && (
        <FormSubmitFeedback
          success={feedbackMessage}
          onDismissSuccess={() => setSubmitState('idle')}
        />
      )}

      {/* 状态流转栏 */}
      <div
        style={{
          display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20,
          padding: '14px 18px', borderRadius: 12,
          background: 'rgba(15, 23, 42, 0.35)',
          border: '1px solid rgba(148, 163, 184, 0.18)',
        }}
      >
        <StatusBadge
          variant={STATUS_BADGE_VARIANT[announcement.status]}
          label={STATUS_LABELS[announcement.status]}
          size="md"
          dot
        />
        <span style={{ color: '#94a3b8', fontSize: 13, marginLeft: 8 }}>
          当前状态 · 最后更新：{formatDate(announcement.updatedAt)}
        </span>
        <div style={{ flex: 1 }} />
        {availableTransitions.map((trans) => (
          <button
            key={trans.to}
            onClick={() => handleStatusTransition(trans.to)}
            style={{
              padding: '6px 16px', borderRadius: 8, border: '1px solid #52c41a',
              background: '#f6ffed', color: '#52c41a', cursor: 'pointer', fontWeight: 600, fontSize: 13,
            }}
          >
            {trans.label}
          </button>
        ))}
        <button
          onClick={() => setShowConfirmDelete(true)}
          style={{
            padding: '6px 16px', borderRadius: 8, border: '1px solid #ff4d4f',
            background: '#fff', color: '#ff4d4f', cursor: 'pointer', fontWeight: 600, fontSize: 13,
          }}
        >
          删除
        </button>
      </div>

      {/* 编辑/查看模式切换 */}
      {editing ? (
        /* ---- 编辑模式 ---- */
        <div
          style={{
            borderRadius: 16, padding: 24,
            background: 'rgba(15, 23, 42, 0.38)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            marginBottom: 20,
          }}
        >
          <h3 style={{ margin: '0 0 16px', fontSize: 18, color: '#f8fafc' }}>编辑公告</h3>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>公告标题 *</label>
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 8, border: editErrors.title ? '1px solid #ef4444' : '1px solid rgba(148,163,184,0.3)',
                background: '#0f172a', color: '#f8fafc', fontSize: 14,
              }}
            />
            {editErrors.title && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{editErrors.title}</div>}
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>公告摘要 *</label>
            <input
              type="text"
              value={editForm.summary}
              onChange={(e) => setEditForm((p) => ({ ...p, summary: e.target.value }))}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 8, border: editErrors.summary ? '1px solid #ef4444' : '1px solid rgba(148,163,184,0.3)',
                background: '#0f172a', color: '#f8fafc', fontSize: 14,
              }}
            />
            {editErrors.summary && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{editErrors.summary}</div>}
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>公告内容</label>
            <textarea
              value={editForm.content}
              onChange={(e) => setEditForm((p) => ({ ...p, content: e.target.value }))}
              rows={8}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(148,163,184,0.3)',
                background: '#0f172a', color: '#f8fafc', fontSize: 14, resize: 'vertical', fontFamily: 'monospace',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <SubmitButton label="保存修改" variant="primary" onClick={handleEditSubmit} />
            <SubmitButton label="取消" variant="secondary" onClick={() => { setEditing(false); setEditErrors({}); }} />
          </div>
        </div>
      ) : (
        /* ---- 查看模式 ---- */
        <div
          style={{
            borderRadius: 16, padding: 24,
            background: 'rgba(15, 23, 42, 0.38)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            marginBottom: 20,
          }}
        >
          {/* 标题 */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#f8fafc' }}>
                {announcement.title}
              </h2>
              <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: 14 }}>
                {announcement.summary}
              </p>
            </div>
            <button
              onClick={() => setEditing(true)}
              style={{
                padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(148,163,184,0.3)',
                background: 'rgba(15,23,42,0.5)', color: '#93c5fd', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              编辑
            </button>
          </div>

          {/* 元信息 */}
          <div
            style={{
              display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20,
              paddingBottom: 16, borderBottom: '1px solid rgba(148,163,184,0.12)',
            }}
          >
            <InfoRow label="类型" value={CATEGORY_LABELS[announcement.category]} />
            <InfoRow
              label="优先级"
              value={
                <span style={{ color: PRIORITY_COLORS[announcement.priority], fontWeight: 600 }}>
                  {PRIORITY_LABELS[announcement.priority]}
                </span>
              }
            />
            <InfoRow label="作者" value={announcement.author} />
            <InfoRow label="阅读量" value={announcement.readCount.toLocaleString()} />
            <InfoRow label="发布时间" value={formatDate(announcement.publishedAt)} />
            <InfoRow label="创建时间" value={formatDate(announcement.createdAt)} />
            <InfoRow label="最后更新" value={formatDate(announcement.updatedAt)} />
          </div>

          {/* 内容 */}
          <div
            style={{
              whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: 15, color: '#e2e8f0',
              padding: 16, borderRadius: 10,
              background: 'rgba(0,0,0,0.15)',
            }}
          >
            {announcement.content}
          </div>
        </div>
      )}

      {/* 删除确认 */}
      {showConfirmDelete && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
          onClick={() => setShowConfirmDelete(false)}
        >
          <div
            style={{
              borderRadius: 16, padding: 28, minWidth: 380,
              background: '#1e293b', border: '1px solid rgba(148,163,184,0.18)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 8px', color: '#f8fafc', fontSize: 18 }}>确认删除公告</h3>
            <p style={{ color: '#94a3b8', margin: '0 0 20px', fontSize: 14 }}>
              删除「{announcement.title}」后不可恢复，确定删除吗？
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <SubmitButton label="取消" variant="secondary" onClick={() => setShowConfirmDelete(false)} />
              <SubmitButton label="确认删除" variant="danger" onClick={handleDelete} />
            </div>
          </div>
        </div>
      )}

      {/* 详情操作栏 */}
      <DetailActionBar
        actions={actions}
        heading="详情操作"
        caption="复制 / 导出 / 分享公告详情"
      />

      <DetailClosureBar links={closureLinks} />
    </main>
  );
}
