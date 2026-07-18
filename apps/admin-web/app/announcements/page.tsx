/**
 * 公告管理页 — Announcements Management Page (Next.js App Router Page)
 * 角色视角: 👔系统管理员 / 📢运营主管
 * 功能: 查看、发布、编辑、归档、删除公告，支持搜索/筛选/排序/分页
 */
'use client';

import React, { useState, useCallback, useMemo } from 'react';

import {
  FormField,
  FormSubmitFeedback,
  PageShell,
  SubmitButton,
  StatusBadge,
  WorkspaceBreadcrumb,
} from '@m5/ui';

// ---- 类型导出 ----

export type AnnouncementCategory = 'system' | 'promotion' | 'operation' | 'emergency' | 'policy';
export type AnnouncementStatus = 'draft' | 'published' | 'archived';
export type AnnouncementPriority = 'high' | 'normal' | 'low';

export interface Announcement {
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

export interface FormData {
  title: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  summary: string;
  content: string;
}

export interface FormErrors {
  title?: string;
  category?: string;
  priority?: string;
  summary?: string;
  content?: string;
}

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

// ---- 常量 ----

export const CATEGORY_LABELS: Record<AnnouncementCategory, string> = {
  system: '系统通知',
  promotion: '促销活动',
  operation: '运营管理',
  emergency: '紧急通知',
  policy: '制度政策',
};

export const CATEGORY_OPTIONS: { value: AnnouncementCategory; label: string }[] = [
  { value: 'system', label: '系统通知' },
  { value: 'promotion', label: '促销活动' },
  { value: 'operation', label: '运营管理' },
  { value: 'emergency', label: '紧急通知' },
  { value: 'policy', label: '制度政策' },
];

export const CATEGORY_TABS = [
  { key: '', label: '全部' },
  { key: 'system', label: '系统通知' },
  { key: 'operation', label: '维护公告' },
  { key: 'policy', label: '版本更新' },
  { key: 'promotion', label: '活动通知' },
] as const;

export const STATUS_LABELS: Record<AnnouncementStatus, string> = {
  draft: '草稿',
  published: '已发布',
  archived: '已归档',
};

export const PRIORITY_LABELS: Record<AnnouncementPriority, string> = {
  high: '高',
  normal: '中',
  low: '低',
};

export const PRIORITY_COLORS: Record<AnnouncementPriority, string> = {
  high: '#ef4444',
  normal: '#f59e0b',
  low: '#6b7280',
};

export const STATUS_BADGE_VARIANT: Record<AnnouncementStatus, 'default' | 'success' | 'warning'> = {
  draft: 'default',
  published: 'success',
  archived: 'warning',
};

// ---- Mock 数据 ----

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: 'a1', title: '2026年7月系统升级维护通知', category: 'system', status: 'published', priority: 'high', summary: '核心数据库将于7月12日凌晨2:00-5:00停机维护', content: '', author: '技术部', publishedAt: '2026-07-05', readCount: 12580, createdAt: '2026-07-04', updatedAt: '2026-07-05' },
  { id: 'a2', title: '夏季狂欢购 · 全场满减活动', category: 'promotion', status: 'published', priority: 'normal', summary: '7月15日-7月31日全场满300减60', content: '', author: '运营部', publishedAt: '2026-07-03', readCount: 8430, createdAt: '2026-07-01', updatedAt: '2026-07-03' },
  { id: 'a3', title: '新员工入职培训安排', category: 'operation', status: 'published', priority: 'normal', summary: '7月18日举办新员工入职培训，请各部门安排', content: '', author: '人事部', publishedAt: '2026-07-02', readCount: 3210, createdAt: '2026-06-30', updatedAt: '2026-07-02' },
  { id: 'a4', title: '消防应急演练通知', category: 'emergency', status: 'published', priority: 'high', summary: '7月10日上午10:00全员消防演练', content: '', author: '安全部', publishedAt: '2026-07-01', readCount: 9870, createdAt: '2026-06-29', updatedAt: '2026-07-01' },
  { id: 'a5', title: '季度库存盘点计划', category: 'operation', status: 'draft', priority: 'low', summary: '拟定7月下旬进行季度盘点，待确认', content: '', author: '仓管部', publishedAt: '', readCount: 0, createdAt: '2026-07-06', updatedAt: '2026-07-06' },
  { id: 'a6', title: '会员积分制度调整方案', category: 'policy', status: 'draft', priority: 'normal', summary: '拟调整会员积分累积规则，增加有效期限制', content: '', author: '市场部', publishedAt: '', readCount: 0, createdAt: '2026-07-05', updatedAt: '2026-07-05' },
  { id: 'a7', title: '端午假期值班安排', category: 'operation', status: 'archived', priority: 'normal', summary: '端午假期各门店值班表已发布', content: '', author: '运营部', publishedAt: '2026-06-15', readCount: 12540, createdAt: '2026-06-12', updatedAt: '2026-06-15' },
  { id: 'a8', title: 'POS收银系统紧急修复', category: 'system', status: 'archived', priority: 'high', summary: '部分门店POS异常已修复', content: '', author: '技术部', publishedAt: '2026-06-08', readCount: 18920, createdAt: '2026-06-08', updatedAt: '2026-06-08' },
  { id: 'a9', title: '数据库服务器例行维护通知', category: 'operation', status: 'published', priority: 'normal', summary: '7月20日凌晨1:00-3:00数据库例行维护', content: '', author: '技术部', publishedAt: '2026-07-18', readCount: 4560, createdAt: '2026-07-17', updatedAt: '2026-07-18' },
  { id: 'a10', title: 'v3.8.0 版本更新日志', category: 'policy', status: 'published', priority: 'normal', summary: '新增数据报表模块，优化权限管理', content: '', author: '产品部', publishedAt: '2026-07-15', readCount: 7890, createdAt: '2026-07-14', updatedAt: '2026-07-15' },
  { id: 'a11', title: '年中版本功能更新预告', category: 'policy', status: 'draft', priority: 'low', summary: '三季度功能更新计划草稿', content: '', author: '产品部', publishedAt: '', readCount: 0, createdAt: '2026-07-10', updatedAt: '2026-07-10' },
];

// ---- 导出纯函数（供测试用） ----

export function filterAnnouncements(
  items: Announcement[],
  search: string,
  category: string,
  status: string,
): Announcement[] {
  return items.filter((item) => {
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (!item.title.toLowerCase().includes(q) && !item.summary.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (category && item.category !== category) return false;
    if (status && item.status !== status) return false;
    return true;
  });
}

export function computeStats(items: Announcement[]) {
  return {
    total: items.length,
    published: items.filter((i) => i.status === 'published').length,
    draft: items.filter((i) => i.status === 'draft').length,
    archived: items.filter((i) => i.status === 'archived').length,
    highPriority: items.filter((i) => i.priority === 'high').length,
    totalReads: items.reduce((s, i) => s + i.readCount, 0),
  };
}

export function createEmptyForm(): FormData {
  return {
    title: '',
    category: 'operation',
    priority: 'normal',
    status: 'draft',
    summary: '',
    content: '',
  };
}

export function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.title.trim()) errors.title = '公告标题不能为空';
  else if (data.title.trim().length > 100) errors.title = '公告标题最多100个字符';
  if (!data.category) errors.category = '请选择公告类型';
  if (!data.priority) errors.priority = '请选择优先级';
  if (!data.summary.trim()) errors.summary = '公告摘要不能为空';
  else if (data.summary.trim().length > 200) errors.summary = '公告摘要最多200个字符';
  if (!data.content.trim()) errors.content = '公告内容不能为空';
  return errors;
}

export function getCategoryLabel(value: string): string {
  return CATEGORY_LABELS[value as AnnouncementCategory] || value;
}

export function getStatusLabel(value: string): string {
  return STATUS_LABELS[value as AnnouncementStatus] || value;
}

export function getPriorityLabel(value: string): string {
  return PRIORITY_LABELS[value as AnnouncementPriority] || value;
}

export function getPriorityColor(value: string): string {
  return PRIORITY_COLORS[value as AnnouncementPriority] || '#6b7280';
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

export function addAnnouncement(items: Announcement[], form: FormData): Announcement[] {
  const now = new Date().toISOString().slice(0, 10);
  const newItem: Announcement = {
    id: `a${Date.now()}`,
    title: form.title.trim(),
    category: form.category,
    status: form.status,
    priority: form.priority,
    summary: form.summary.trim(),
    content: form.content.trim(),
    author: '当前用户',
    publishedAt: form.status === 'published' ? now : '',
    readCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  return [newItem, ...items];
}

export function archiveAnnouncement(items: Announcement[], id: string): Announcement[] {
  return items.map((item) =>
    item.id === id && item.status === 'published'
      ? { ...item, status: 'archived' as const, updatedAt: new Date().toISOString().slice(0, 10) }
      : item,
  );
}

export function deleteAnnouncement(items: Announcement[], id: string): Announcement[] {
  return items.filter((item) => item.id !== id);
}

// ---- 主页面组件 ----

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState('');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>(createEmptyForm());
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // ---- 过滤 ----

  const filtered = useMemo(() => {
    let items = filterAnnouncements(announcements, search, categoryFilter, statusFilter);
    items.sort((a, b) => {
      const mod = sortDir === 'asc' ? 1 : -1;
      const aVal = a[sortBy as keyof Announcement]?.toString() || '';
      const bVal = b[sortBy as keyof Announcement]?.toString() || '';
      return aVal.localeCompare(bVal) * mod;
    });
    return items;
  }, [announcements, search, categoryFilter, statusFilter, sortBy, sortDir]);

  const stats = useMemo(() => computeStats(announcements), [announcements]);

  // ---- 提交 ----

  const handleSubmit = useCallback(async () => {
    const errors = validateForm(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitState('submitting');
    await new Promise((r) => setTimeout(r, 600));

    if (editingId) {
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === editingId
            ? { ...a, title: form.title.trim(), category: form.category, priority: form.priority, status: form.status, summary: form.summary.trim(), content: form.content.trim(), updatedAt: new Date().toISOString().slice(0, 10) }
            : a,
        ),
      );
      setFeedbackMessage(`公告「${form.title}」已更新`);
    } else {
      const newItem = addAnnouncement(announcements, form);
      setAnnouncements(newItem);
      setFeedbackMessage(`公告「${form.title}」已创建`);
    }

    setSubmitState('success');
    resetForm();
  }, [form, editingId, announcements]);

  // ---- 操作 ----

  const handleArchive = useCallback((id: string) => {
    setAnnouncements((prev) => archiveAnnouncement(prev, id));
    const item = announcements.find((a) => a.id === id);
    setFeedbackMessage(`公告「${item?.title}」已归档`);
    setSubmitState('success');
  }, [announcements]);

  const handleDelete = useCallback((id: string) => {
    setAnnouncements((prev) => deleteAnnouncement(prev, id));
    setShowConfirmDelete(null);
    setFeedbackMessage('公告已删除');
    setSubmitState('success');
  }, []);

  const startEdit = useCallback((item: Announcement) => {
    setForm({ title: item.title, category: item.category, priority: item.priority, status: item.status, summary: item.summary, content: item.content });
    setEditingId(item.id);
    setShowForm(true);
    setFormErrors({});
  }, []);

  const resetForm = useCallback(() => {
    setForm(createEmptyForm());
    setEditingId(null);
    setShowForm(false);
    setFormErrors({});
  }, []);

  // ---- 渲染 ----

  return (
    <PageShell title="公告管理">
      <WorkspaceBreadcrumb workspaceLabel="系统管理" workspaceHref="/" detailLabel="公告管理" />

      {/* 反馈 */}
      {submitState === 'success' && (
        <FormSubmitFeedback success={feedbackMessage} onDismissSuccess={() => setSubmitState('idle')} />
      )}

      {/* 统计卡片 */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 130, background: '#f0f5ff', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, color: '#666' }}>公告总数</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#1677ff' }}>{stats.total}</div>
        </div>
        <div style={{ flex: 1, minWidth: 130, background: '#f6ffed', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, color: '#666' }}>已发布</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#52c41a' }}>{stats.published}</div>
        </div>
        <div style={{ flex: 1, minWidth: 130, background: '#fff7e6', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, color: '#666' }}>草稿</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#fa8c16' }}>{stats.draft}</div>
        </div>
        <div style={{ flex: 1, minWidth: 130, background: '#fff1f0', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, color: '#666' }}>紧急</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#f5222d' }}>{stats.highPriority}</div>
        </div>
        <div style={{ flex: 1, minWidth: 130, background: '#f9f0ff', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, color: '#666' }}>总阅读</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#722ed1' }}>{stats.totalReads.toLocaleString()}</div>
        </div>
      </div>

      {/* 分类标签栏 */}
      <div
        role="tablist"
        aria-label="公告分类筛选"
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 16,
          borderBottom: '2px solid #f0f0f0',
          paddingBottom: 2,
        }}
      >
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            data-tab-key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setCategoryFilter(tab.key);
            }}
            style={{
              padding: '8px 18px',
              fontSize: 14,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: activeTab === tab.key ? '#1677ff' : '#666',
              fontWeight: activeTab === tab.key ? 600 : 400,
              borderBottom: activeTab === tab.key ? '2px solid #1677ff' : '2px solid transparent',
              marginBottom: -2,
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
            {tab.key && (() => {
              const count = announcements.filter((a) => a.category === tab.key).length;
              return count > 0 ? (
                <span
                  style={{
                    marginLeft: 6,
                    fontSize: 11,
                    padding: '1px 6px',
                    borderRadius: 8,
                    background: activeTab === tab.key ? '#e6f4ff' : '#f5f5f5',
                    color: activeTab === tab.key ? '#1677ff' : '#999',
                  }}
                >
                  {count}
                </span>
              ) : null;
            })()}
          </button>
        ))}
      </div>

      {/* 工具栏 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormField label="">
          <input
            type="text"
            placeholder="搜索公告标题或摘要…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d9d9d9', width: 220 }}
          />
        </FormField>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d9d9d9' }}
        >
          <option value="">全部分类</option>
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d9d9d9' }}
        >
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="published">已发布</option>
          <option value="archived">已归档</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d9d9d9' }}
        >
          <option value="createdAt">创建时间</option>
          <option value="publishedAt">发布时间</option>
          <option value="title">标题</option>
        </select>
        <button
          onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d9d9d9', background: '#fff', cursor: 'pointer' }}
        >
          {sortDir === 'desc' ? '↓ 降序' : '↑ 升序'}
        </button>
        <div style={{ flex: 1 }} />
        <SubmitButton
          label={showForm ? '收起表单' : '+ 发布公告'}
          variant={showForm ? 'secondary' : 'primary'}
          onClick={() => { if (!showForm) { resetForm(); setShowForm(true); } else resetForm(); }}
        />
      </div>

      {/* 表单 */}
      {showForm && (
        <div style={{ background: '#fafafa', border: '1px solid #e8e8e8', borderRadius: 8, padding: 20, marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>
            {editingId ? '编辑公告' : '发布公告'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <FormField label="公告标题" error={formErrors.title} required>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="例：2026年7月系统升级维护通知"
                  style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d9d9d9', width: '100%' }}
                />
              </FormField>
            </div>
            <FormField label="公告类型" error={formErrors.category} required>
              <select
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as AnnouncementCategory }))}
                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d9d9d9', width: '100%' }}
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </FormField>
            <FormField label="优先级" error={formErrors.priority} required>
              <select
                value={form.priority}
                onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as AnnouncementPriority }))}
                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d9d9d9', width: '100%' }}
              >
                <option value="high">高</option>
                <option value="normal">中</option>
                <option value="low">低</option>
              </select>
            </FormField>
            <FormField label="状态">
              <select
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as AnnouncementStatus }))}
                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d9d9d9', width: '100%' }}
              >
                <option value="draft">草稿</option>
                <option value="published">立即发布</option>
              </select>
            </FormField>
            <div style={{ gridColumn: '1 / -1' }}>
              <FormField label="公告摘要" error={formErrors.summary} required>
                <input
                  type="text"
                  value={form.summary}
                  onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))}
                  placeholder="一句话概括公告内容…"
                  style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d9d9d9', width: '100%' }}
                />
              </FormField>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <FormField label="公告内容" error={formErrors.content} required>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                  placeholder="请输入公告详细内容…"
                  rows={5}
                  style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d9d9d9', width: '100%', resize: 'vertical' }}
                />
              </FormField>
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <SubmitButton label={editingId ? '保存修改' : '创建公告'} variant="primary" onClick={handleSubmit} loading={submitState === 'submitting'} />
            <SubmitButton label="取消" variant="secondary" onClick={resetForm} />
          </div>
        </div>
      )}

      {/* 列表 */}
      <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#666' }}>公告标题</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#666' }}>类型</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#666' }}>优先级</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#666' }}>状态</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#666' }}>作者</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#666' }}>阅读</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#666' }}>发布时间</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#666' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#999' }}>
                  {search || activeTab || categoryFilter || statusFilter ? '没有匹配的公告' : '暂无公告，点击上方按钮发布'}
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{item.summary}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14 }}>{getCategoryLabel(item.category)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#fff',
                        backgroundColor: getPriorityColor(item.priority),
                      }}
                    >
                      {getPriorityLabel(item.priority)}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <StatusBadge variant={STATUS_BADGE_VARIANT[item.status]} label={getStatusLabel(item.status)} />
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14 }}>{item.author}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, textAlign: 'center' }}>{item.readCount.toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, textAlign: 'center' }}>{formatDate(item.publishedAt)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => startEdit(item)}
                        style={{ padding: '4px 10px', fontSize: 12, borderRadius: 4, border: '1px solid #d9d9d9', background: '#fff', cursor: 'pointer' }}
                      >
                        编辑
                      </button>
                      {item.status === 'published' && (
                        <button
                          onClick={() => handleArchive(item.id)}
                          style={{ padding: '4px 10px', fontSize: 12, borderRadius: 4, border: '1px solid #d9d9d9', background: '#fff', cursor: 'pointer' }}
                        >
                          归档
                        </button>
                      )}
                      {item.status === 'draft' && (
                        <button
                          onClick={() => {
                            const updated = setAnnouncements((prev) =>
                              prev.map((a) =>
                                a.id === item.id ? { ...a, status: 'published' as const, publishedAt: new Date().toISOString().slice(0, 10) } : a,
                              ),
                            );
                            setFeedbackMessage(`公告「${item.title}」已发布`);
                            setSubmitState('success');
                          }}
                          style={{ padding: '4px 10px', fontSize: 12, borderRadius: 4, border: '1px solid #52c41a', background: '#f6ffed', color: '#52c41a', cursor: 'pointer' }}
                        >
                          发布
                        </button>
                      )}
                      <button
                        onClick={() => setShowConfirmDelete(item.id)}
                        style={{ padding: '4px 10px', fontSize: 12, borderRadius: 4, border: '1px solid #ff4d4f', background: '#fff', color: '#ff4d4f', cursor: 'pointer' }}
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 删除确认弹窗 */}
      {showConfirmDelete && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
          onClick={() => setShowConfirmDelete(null)}
        >
          <div
            style={{
              background: '#fff', borderRadius: 8, padding: 24, minWidth: 360,
              boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>确认删除</h3>
            <p style={{ color: '#666', margin: '0 0 16px', fontSize: 14 }}>
              删除后不可恢复，确定要删除此公告吗？
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <SubmitButton label="取消" variant="secondary" onClick={() => setShowConfirmDelete(null)} />
              <SubmitButton label="确认删除" variant="danger" onClick={() => handleDelete(showConfirmDelete)} />
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
