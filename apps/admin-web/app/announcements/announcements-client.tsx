'use client'
import { useSnapshotRefresh } from '../components/use-snapshot-refresh'

import { useMemo, useState } from 'react'
import {
  FormField,
  FormSubmitFeedback,
  PageShell,
  StatusBadge,
  SubmitButton,
  WorkspaceBreadcrumb,
} from '@m5/ui'
import {
  CATEGORY_OPTIONS,
  CATEGORY_TABS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  STATUS_BADGE_VARIANT,
  STATUS_LABELS,
  addAnnouncement,
  archiveAnnouncement,
  computeAnnouncementStats,
  createEmptyAnnouncementForm,
  deleteAnnouncement,
  filterAnnouncements,
  formatAnnouncementDate,
  publishAnnouncement,
  type Announcement,
  type AnnouncementCategory,
  type AnnouncementFormData,
  type AnnouncementFormErrors,
  type AnnouncementPriority,
  type AnnouncementStatus,
  type AnnouncementsSnapshotDelivery,
} from './announcements-data'

type SubmitState = 'idle' | 'submitting' | 'success'

import { useRouter } from 'next/navigation'

export default function AnnouncementsClient({
  snapshot,
}: {
  snapshot: AnnouncementsSnapshotDelivery
}) {
  const router = useRouter()
  const { isRefreshing, handleRefresh } = useSnapshotRefresh()
  const [announcements, setAnnouncements] = useState<Announcement[]>(snapshot.announcements)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [activeTab, setActiveTab] = useState('')
  const [sortBy, setSortBy] = useState<'createdAt' | 'publishedAt' | 'title'>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null)
  const [form, setForm] = useState<AnnouncementFormData>(createEmptyAnnouncementForm())
  const [formErrors, setFormErrors] = useState<AnnouncementFormErrors>({})

  const filtered = useMemo(() => {
    const items = filterAnnouncements(announcements, search, categoryFilter, statusFilter)
    return [...items].sort((a, b) => {
      const modifier = sortDir === 'asc' ? 1 : -1
      const aValue = a[sortBy] || ''
      const bValue = b[sortBy] || ''
      return String(aValue).localeCompare(String(bValue)) * modifier
    })
  }, [announcements, search, categoryFilter, statusFilter, sortBy, sortDir])

  const stats = useMemo(() => computeAnnouncementStats(announcements), [announcements])

  function resetForm() {
    setForm(createEmptyAnnouncementForm())
    setEditingId(null)
    setShowForm(false)
    setFormErrors({})
  }

  async function handleSubmit() {
    const { validateAnnouncementForm } = await import('./announcements-data')
    const errors = validateAnnouncementForm(form)
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSubmitState('submitting')
    await new Promise((resolve) => setTimeout(resolve, 200))

    if (editingId) {
      setAnnouncements((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? {
                ...item,
                title: form.title.trim(),
                category: form.category,
                status: form.status,
                priority: form.priority,
                summary: form.summary.trim(),
                content: form.content.trim(),
                updatedAt: new Date().toISOString().slice(0, 10),
              }
            : item
        )
      )
      setFeedbackMessage(`公告「${form.title}」已更新`)
    } else {
      setAnnouncements((prev) => addAnnouncement(prev, form))
      setFeedbackMessage(`公告「${form.title}」已创建`)
    }

    setSubmitState('success')
    resetForm()
  }

  function startEdit(item: Announcement) {
    setForm({
      title: item.title,
      category: item.category,
      priority: item.priority,
      status: item.status,
      summary: item.summary,
      content: item.content,
    })
    setEditingId(item.id)
    setShowForm(true)
    setFormErrors({})
  }

  function handleArchive(id: string) {
    const target = announcements.find((item) => item.id === id)
    setAnnouncements((prev) => archiveAnnouncement(prev, id))
    setFeedbackMessage(`公告「${target?.title ?? id}」已归档`)
    setSubmitState('success')
  }

  function handlePublish(id: string) {
    const target = announcements.find((item) => item.id === id)
    setAnnouncements((prev) => publishAnnouncement(prev, id))
    setFeedbackMessage(`公告「${target?.title ?? id}」已发布`)
    setSubmitState('success')
  }

  function handleDelete(id: string) {
    setAnnouncements((prev) => deleteAnnouncement(prev, id))
    setShowConfirmDelete(null)
    setFeedbackMessage('公告已删除')
    setSubmitState('success')
  }

  return (
    <main style={{ maxWidth: 1120, margin: '0 auto', padding: 32 }}>
      <PageShell title="公告管理" subtitle="查看快照公告、执行本地编排演练，并对草稿/归档状态做可信化展示。">
        <WorkspaceBreadcrumb workspaceLabel="系统管理" workspaceHref="/" detailLabel="公告管理" />

        {submitState === 'success' && (
          <FormSubmitFeedback success={feedbackMessage} onDismissSuccess={() => setSubmitState('idle')} />
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 16, marginBottom: 20 }}>
          <StatCard label="公告总数" value={stats.total} background="#f0f5ff" color="#1677ff" />
          <StatCard label="已发布" value={stats.published} background="#f6ffed" color="#52c41a" />
          <StatCard label="草稿" value={stats.draft} background="#fff7e6" color="#fa8c16" />
          <StatCard label="紧急" value={stats.highPriority} background="#fff1f0" color="#f5222d" />
          <StatCard label="总阅读" value={stats.totalReads.toLocaleString()} background="#f9f0ff" color="#722ed1" />
        </div>

        <div
          role="tablist"
          aria-label="公告分类筛选"
          style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '2px solid #f0f0f0', paddingBottom: 2 }}
        >
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => {
                setActiveTab(tab.key)
                setCategoryFilter(tab.key)
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
              }}
            >
              {tab.label}
              {tab.key ? (
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
                  {announcements.filter((item) => item.category === tab.key).length}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormField label="">
            <input
              type="text"
              placeholder="搜索公告标题或摘要..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d9d9d9', width: 220 }}
            />
          </FormField>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d9d9d9' }}
          >
            <option value="">全部分类</option>
            {CATEGORY_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d9d9d9' }}
          >
            <option value="">全部状态</option>
            <option value="draft">草稿</option>
            <option value="published">已发布</option>
            <option value="archived">已归档</option>
          </select>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as 'createdAt' | 'publishedAt' | 'title')}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d9d9d9' }}
          >
            <option value="createdAt">创建时间</option>
            <option value="publishedAt">发布时间</option>
            <option value="title">标题</option>
          </select>
          <button
            type="button"
            onClick={() => setSortDir((value) => (value === 'asc' ? 'desc' : 'asc'))}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d9d9d9', background: '#fff', cursor: 'pointer' }}
          >
            {sortDir === 'desc' ? '↓ 降序' : '↑ 升序'}
          </button>
          <button
            type="button"
            onClick={() => {
              resetForm()
              handleRefresh()
            }}
            disabled={isRefreshing}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d9d9d9', background: '#fff', cursor: 'pointer' }}
          >
            {isRefreshing ? '刷新中...' : '刷新'}
          </button>
          <div style={{ flex: 1 }} />
          <SubmitButton
            label={showForm ? '收起表单' : '+ 发布公告'}
            variant={showForm ? 'secondary' : 'primary'}
            onClick={() => {
              if (!showForm) {
                setForm(createEmptyAnnouncementForm())
                setEditingId(null)
                setShowForm(true)
                setFormErrors({})
                return
              }
              resetForm()
            }}
          />
        </div>

        {showForm && (
          <div style={{ background: '#fafafa', border: '1px solid #e8e8e8', borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>{editingId ? '编辑公告' : '发布公告'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <FormField label="公告标题" error={formErrors.title} required>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="例：2026年7月系统升级维护通知"
                    style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d9d9d9', width: '100%' }}
                  />
                </FormField>
              </div>
              <FormField label="公告类型" error={formErrors.category} required>
                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, category: event.target.value as AnnouncementCategory }))
                  }
                  style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d9d9d9', width: '100%' }}
                >
                  {CATEGORY_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="优先级" error={formErrors.priority} required>
                <select
                  value={form.priority}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, priority: event.target.value as AnnouncementPriority }))
                  }
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
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, status: event.target.value as AnnouncementStatus }))
                  }
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
                    onChange={(event) => setForm((prev) => ({ ...prev, summary: event.target.value }))}
                    placeholder="一句话概括公告内容..."
                    style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d9d9d9', width: '100%' }}
                  />
                </FormField>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <FormField label="公告内容" error={formErrors.content} required>
                  <textarea
                    value={form.content}
                    onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
                    placeholder="请输入公告详细内容..."
                    rows={5}
                    style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d9d9d9', width: '100%', resize: 'vertical' }}
                  />
                </FormField>
              </div>
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <SubmitButton
                label={editingId ? '保存修改' : '创建公告'}
                variant="primary"
                onClick={handleSubmit}
                loading={submitState === 'submitting'}
              />
              <SubmitButton label="取消" variant="secondary" onClick={resetForm} />
            </div>
          </div>
        )}

        <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                <th style={tableHeadStyle}>公告标题</th>
                <th style={tableHeadStyle}>类型</th>
                <th style={{ ...tableHeadStyle, textAlign: 'center' }}>优先级</th>
                <th style={{ ...tableHeadStyle, textAlign: 'center' }}>状态</th>
                <th style={tableHeadStyle}>作者</th>
                <th style={{ ...tableHeadStyle, textAlign: 'center' }}>阅读</th>
                <th style={{ ...tableHeadStyle, textAlign: 'center' }}>发布时间</th>
                <th style={{ ...tableHeadStyle, textAlign: 'right' }}>操作</th>
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
                    <td style={tableCellStyle}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{item.summary}</div>
                    </td>
                    <td style={tableCellStyle}>{CATEGORY_OPTIONS.find((option) => option.value === item.category)?.label ?? item.category}</td>
                    <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#fff',
                          backgroundColor: PRIORITY_COLORS[item.priority],
                        }}
                      >
                        {PRIORITY_LABELS[item.priority]}
                      </span>
                    </td>
                    <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                      <StatusBadge variant={STATUS_BADGE_VARIANT[item.status]} label={STATUS_LABELS[item.status]} />
                    </td>
                    <td style={tableCellStyle}>{item.author}</td>
                    <td style={{ ...tableCellStyle, textAlign: 'center' }}>{item.readCount.toLocaleString()}</td>
                    <td style={{ ...tableCellStyle, textAlign: 'center' }}>{formatAnnouncementDate(item.publishedAt)}</td>
                    <td style={{ ...tableCellStyle, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button type="button" onClick={() => startEdit(item)} style={secondaryButtonStyle}>
                          编辑
                        </button>
                        {item.status === 'published' ? (
                          <button type="button" onClick={() => handleArchive(item.id)} style={secondaryButtonStyle}>
                            归档
                          </button>
                        ) : null}
                        {item.status === 'draft' ? (
                          <button
                            type="button"
                            onClick={() => handlePublish(item.id)}
                            style={{ ...secondaryButtonStyle, borderColor: '#52c41a', background: '#f6ffed', color: '#52c41a' }}
                          >
                            发布
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setShowConfirmDelete(item.id)}
                          style={{ ...secondaryButtonStyle, borderColor: '#ff4d4f', color: '#ff4d4f' }}
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

        {showConfirmDelete ? (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setShowConfirmDelete(null)}
          >
            <div
              style={{ background: '#fff', borderRadius: 8, padding: 24, minWidth: 360, boxShadow: '0 6px 16px rgba(0,0,0,0.15)' }}
              onClick={(event) => event.stopPropagation()}
            >
              <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>确认删除</h3>
              <p style={{ color: '#666', margin: '0 0 16px', fontSize: 14 }}>删除后不可恢复，确定要删除此公告吗？</p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <SubmitButton label="取消" variant="secondary" onClick={() => setShowConfirmDelete(null)} />
                <SubmitButton label="确认删除" variant="danger" onClick={() => handleDelete(showConfirmDelete)} />
              </div>
            </div>
          </div>
        ) : null}
      </PageShell>
    </main>
  )
}

function StatCard({
  label,
  value,
  background,
  color,
}: {
  label: string
  value: number | string
  background: string
  color: string
}) {
  return (
    <div style={{ background, borderRadius: 8, padding: 16 }}>
      <div style={{ fontSize: 12, color: '#666' }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
    </div>
  )
}

const tableHeadStyle = {
  padding: '12px 16px',
  textAlign: 'left',
  fontSize: 13,
  fontWeight: 600,
  color: '#666',
} as const

const tableCellStyle = {
  padding: '12px 16px',
  fontSize: 14,
} as const

const secondaryButtonStyle = {
  padding: '4px 10px',
  fontSize: 12,
  borderRadius: 4,
  border: '1px solid #d9d9d9',
  background: '#fff',
  cursor: 'pointer',
} as const
