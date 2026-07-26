'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  FormField,
  FormSubmitFeedback,
  PageShell,
  StatusBadge,
  SubmitButton,
  WorkspaceBreadcrumb,
} from '@m5/ui'
import {
  TAG_CATEGORIES,
  TAG_COLORS,
  TAG_SOURCES,
  computeTagStats,
  createEmptyTagForm,
  getCategoryLabel,
  getColorHex,
  getSourceLabel,
  validateTagForm,
  type CustomerTagsSnapshotDelivery,
  type Tag,
  type TagFormData,
  type TagFormErrors,
} from './customer-tags-data'

type SubmitState = 'idle' | 'success'

function TagBadge({ color, name }: { color: string; name: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 10px',
        borderRadius: 12,
        fontSize: 13,
        fontWeight: 500,
        color: '#fff',
        backgroundColor: getColorHex(color),
      }}
    >
      {name}
    </span>
  )
}

export default function CustomerTagsClient({
  snapshot,
}: {
  snapshot: CustomerTagsSnapshotDelivery
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [tags, setTags] = useState<Tag[]>(snapshot.tags)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null)
  const [form, setForm] = useState<TagFormData>(createEmptyTagForm())
  const [formErrors, setFormErrors] = useState<TagFormErrors>({})

  useEffect(() => {
    setTags(snapshot.tags)
  }, [snapshot.tags])

  const filteredTags = useMemo(() => {
    return tags.filter((tag) => {
      if (search && !tag.name.toLowerCase().includes(search.toLowerCase()) && !tag.description.toLowerCase().includes(search.toLowerCase())) return false
      if (categoryFilter && tag.category !== categoryFilter) return false
      return true
    })
  }, [categoryFilter, search, tags])

  const stats = useMemo(() => computeTagStats(tags), [tags])

  const resetForm = useCallback(() => {
    setForm(createEmptyTagForm())
    setEditingId(null)
    setShowForm(false)
    setFormErrors({})
  }, [])

  const handleSubmit = useCallback(() => {
    const errors = validateTagForm(form)
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return

    if (editingId) {
      setTags((prev) => prev.map((tag) => (tag.id === editingId ? { ...tag, ...form, memberCount: tag.memberCount } : tag)))
      setFeedbackMessage(`标签「${form.name}」已更新`)
    } else {
      setTags((prev) => [
        {
          id: `t${Date.now()}`,
          name: form.name,
          category: form.category,
          color: form.color,
          source: form.source,
          memberCount: 0,
          description: form.description,
          enabled: form.enabled,
          createdAt: new Date().toISOString().slice(0, 10),
        },
        ...prev,
      ])
      setFeedbackMessage(`标签「${form.name}」已创建`)
    }

    setSubmitState('success')
    resetForm()
  }, [editingId, form, resetForm])

  const startEdit = useCallback((tag: Tag) => {
    setForm({
      name: tag.name,
      category: tag.category,
      color: tag.color,
      source: tag.source,
      description: tag.description,
      enabled: tag.enabled,
    })
    setEditingId(tag.id)
    setShowForm(true)
    setFormErrors({})
  }, [])

  const handleDelete = useCallback((id: string) => {
    setTags((prev) => prev.filter((tag) => tag.id !== id))
    setShowConfirmDelete(null)
    setFeedbackMessage('标签已删除')
    setSubmitState('success')
  }, [])

  const toggleEnabled = useCallback((id: string) => {
    setTags((prev) => prev.map((tag) => (tag.id === id ? { ...tag, enabled: !tag.enabled } : tag)))
  }, [])

  return (
    <PageShell title="客户画像标签管理">
      <WorkspaceBreadcrumb workspaceLabel="客户管理" workspaceHref="/" detailLabel="标签管理" />

      {submitState === 'success' && (
        <FormSubmitFeedback success={feedbackMessage} onDismissSuccess={() => setSubmitState('idle')} />
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormField label="">
          <input
            type="text"
            placeholder="搜索标签名称或描述…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d9d9d9', width: 240 }}
          />
        </FormField>
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d9d9d9' }}
        >
          <option value="">全部分类</option>
          {TAG_CATEGORIES.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => startRefresh(() => router.refresh())}
          style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #d9d9d9', background: '#fff', cursor: 'pointer' }}
        >
          {isRefreshing ? '刷新中...' : '刷新'}
        </button>
        <div style={{ flex: 1 }} />
        <SubmitButton
          label={showForm ? '收起表单' : '+ 新建标签'}
          variant={showForm ? 'secondary' : 'primary'}
          onClick={() => {
            if (!showForm) {
              setForm(createEmptyTagForm())
              setShowForm(true)
              setEditingId(null)
              setFormErrors({})
            } else {
              resetForm()
            }
          }}
        />
      </div>

      {showForm && (
        <div style={{ background: '#fafafa', border: '1px solid #e8e8e8', borderRadius: 8, padding: 20, marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>{editingId ? '编辑标签' : '新建标签'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FormField label="标签名称" error={formErrors.name} required>
              <input
                type="text"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="例：高净值会员"
                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d9d9d9', width: '100%' }}
              />
            </FormField>
            <FormField label="标签分类" error={formErrors.category} required>
              <select
                value={form.category}
                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d9d9d9', width: '100%' }}
              >
                {TAG_CATEGORIES.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </FormField>
            <FormField label="标签颜色" error={formErrors.color} required>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {TAG_COLORS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, color: item.value }))}
                    style={{ width: 32, height: 32, borderRadius: '50%', border: form.color === item.value ? '3px solid #333' : '2px solid transparent', backgroundColor: item.hex, cursor: 'pointer' }}
                    title={item.label}
                  />
                ))}
              </div>
            </FormField>
            <FormField label="标签来源" error={formErrors.source} required>
              <select
                value={form.source}
                onChange={(event) => setForm((prev) => ({ ...prev, source: event.target.value }))}
                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d9d9d9', width: '100%' }}
              >
                {TAG_SOURCES.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </FormField>
            <div style={{ gridColumn: '1 / -1' }}>
              <FormField label="标签描述">
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="简要描述标签的业务含义…"
                  rows={2}
                  style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d9d9d9', width: '100%', resize: 'vertical' }}
                />
              </FormField>
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(event) => setForm((prev) => ({ ...prev, enabled: event.target.checked }))}
                />
                启用标签
              </label>
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <SubmitButton label={editingId ? '保存修改' : '创建标签'} variant="primary" onClick={handleSubmit} />
            <SubmitButton label="取消" variant="secondary" onClick={resetForm} />
          </div>
        </div>
      )}

      <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#666' }}>标签名称</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#666' }}>分类</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#666' }}>来源</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#666' }}>命中人数</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#666' }}>状态</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#666' }}>创建时间</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#666' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredTags.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#999' }}>
                  {search || categoryFilter ? '没有匹配的标签' : '暂无标签，点击上方按钮新建'}
                </td>
              </tr>
            ) : (
              filteredTags.map((tag) => (
                <tr key={tag.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <TagBadge color={tag.color} name={tag.name} />
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{tag.description}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14 }}>{getCategoryLabel(tag.category)}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14 }}>{getSourceLabel(tag.source)}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, textAlign: 'right', fontWeight: 600 }}>{tag.memberCount.toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <StatusBadge variant={tag.enabled ? 'success' : 'default'} label={tag.enabled ? '启用' : '停用'} />
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, textAlign: 'center' }}>{tag.createdAt}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button onClick={() => toggleEnabled(tag.id)} style={{ padding: '4px 10px', fontSize: 12, borderRadius: 4, border: '1px solid #d9d9d9', background: '#fff', cursor: 'pointer' }}>
                        {tag.enabled ? '停用' : '启用'}
                      </button>
                      <button onClick={() => startEdit(tag)} style={{ padding: '4px 10px', fontSize: 12, borderRadius: 4, border: '1px solid #d9d9d9', background: '#fff', cursor: 'pointer' }}>
                        编辑
                      </button>
                      <button onClick={() => setShowConfirmDelete(tag.id)} style={{ padding: '4px 10px', fontSize: 12, borderRadius: 4, border: '1px solid #ff4d4f', background: '#fff', color: '#ff4d4f', cursor: 'pointer' }}>
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

      {showConfirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowConfirmDelete(null)}>
          <div style={{ background: '#fff', borderRadius: 8, padding: 24, minWidth: 360, boxShadow: '0 6px 16px rgba(0,0,0,0.15)' }} onClick={(event) => event.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>确认删除</h3>
            <p style={{ color: '#666', margin: '0 0 16px', fontSize: 14 }}>删除后该标签将从所有已打标的会员中移除，此操作不可撤销。</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <SubmitButton label="取消" variant="secondary" onClick={() => setShowConfirmDelete(null)} />
              <SubmitButton label="确认删除" variant="danger" onClick={() => handleDelete(showConfirmDelete)} />
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, marginTop: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 160, background: '#f9f0ff', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, color: '#666' }}>标签总数</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#722ed1' }}>{stats.total}</div>
        </div>
        <div style={{ flex: 1, minWidth: 160, background: '#e6f7ff', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, color: '#666' }}>已启用</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#1677ff' }}>{stats.enabled}</div>
        </div>
        <div style={{ flex: 1, minWidth: 160, background: '#fff7e6', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, color: '#666' }}>AI预测标签</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#fa8c16' }}>{stats.aiPrediction}</div>
        </div>
        <div style={{ flex: 1, minWidth: 160, background: '#f6ffed', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, color: '#666' }}>总覆盖率</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#52c41a' }}>{stats.totalCoverage.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, padding: 14, background: '#f5f5f5', borderRadius: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#333' }}>分类分布</div>
          {Array.from(new Set(tags.map((tag) => tag.category))).map((category) => {
            const count = tags.filter((tag) => tag.category === category).length
            const pct = tags.length > 0 ? Math.round((count / tags.length) * 100) : 0
            return (
              <div key={category} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
                  <span>{getCategoryLabel(category)}</span>
                  <span style={{ fontWeight: 600 }}>{count} ({pct}%)</span>
                </div>
                <div style={{ height: 6, background: '#e8e8e8', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: '#1677ff', borderRadius: 3 }} />
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ flex: 1, minWidth: 200, padding: 14, background: '#f5f5f5', borderRadius: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#333' }}>来源分析</div>
          {Array.from(new Set(tags.map((tag) => tag.source))).map((source) => {
            const count = tags.filter((tag) => tag.source === source).length
            const pct = tags.length > 0 ? Math.round((count / tags.length) * 100) : 0
            return (
              <div key={source} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
                  <span>{getSourceLabel(source)}</span>
                  <span style={{ fontWeight: 600 }}>{count} ({pct}%)</span>
                </div>
                <div style={{ height: 6, background: '#e8e8e8', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: '#52c41a', borderRadius: 3 }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </PageShell>
  )
}
