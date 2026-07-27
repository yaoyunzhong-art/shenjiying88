'use client'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

import { useCallback, useMemo, useState, useTransition } from 'react'

import type { MetadataRow, MetadataSnapshotDelivery } from './metadata-data'

export default function MetadataClient({
  snapshot,
}: {
  snapshot: MetadataSnapshotDelivery
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [rows, setRows] = useState(snapshot.rows)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<'path' | 'title'>('path')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<MetadataRow>>({})
  const [editError, setEditError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() => {
    let items = [...rows]
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(
        (row) => row.path.toLowerCase().includes(q) || row.title.toLowerCase().includes(q)
      )
    }
    items.sort((left, right) => left[sortKey].localeCompare(right[sortKey]))
    return items
  }, [rows, search, sortKey])

  const openEdit = useCallback((row: MetadataRow) => {
    setEditingId(row.id)
    setEditForm({ ...row })
    setEditError(null)
  }, [])

  const closeEdit = useCallback(() => {
    setEditingId(null)
    setEditForm({})
    setEditError(null)
  }, [])

  const saveEdit = useCallback(async () => {
    if (!editForm.title?.trim()) {
      setEditError('标题不能为空')
      return
    }
    if (!editForm.description?.trim()) {
      setEditError('描述不能为空')
      return
    }
    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 150))
    setRows((previous) =>
      previous.map((row) => (row.id === editingId ? ({ ...row, ...editForm } as MetadataRow) : row))
    )
    setSaving(false)
    closeEdit()
  }, [closeEdit, editForm, editingId])

  const refreshSnapshot = useCallback(() => {
    handleRefresh()
  }, [router, startRefresh])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">SEO 元数据管理</h1>
          <p className="mt-1 text-sm text-slate-500">
            tenant {snapshot.tenantId} / 共 {snapshot.totalRows} 条元数据快照 / generatedAt{' '}
            {snapshot.generatedAt}
          </p>
        </div>
        <button
          type="button"
          onClick={refreshSnapshot}
          disabled={isRefreshing}
          className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRefreshing ? '刷新中...' : '刷新快照'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">元数据条目</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{rows.length}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">当前排序</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {sortKey === 'path' ? '按路径' : '按标题'}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">当前搜索</div>
          <div className="mt-2 text-sm font-medium text-slate-900">
            {search.trim() ? search : '未设置筛选条件'}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap gap-2">
          <input
            placeholder="搜索路径或标题..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="min-w-[240px] flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value as 'path' | 'title')}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="path">按路径</option>
            <option value="title">按标题</option>
          </select>
        </div>
      </div>

      {editingId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={closeEdit}>
          <div
            className="mx-4 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-slate-900">编辑元数据</h2>
            {editError ? (
              <div className="mt-4 rounded bg-rose-50 px-3 py-2 text-sm text-rose-700">{editError}</div>
            ) : null}
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm text-slate-600">路径</label>
                <input
                  disabled
                  value={editForm.path || ''}
                  className="w-full rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-600">标题 *</label>
                <input
                  value={editForm.title || ''}
                  onChange={(event) => setEditForm((form) => ({ ...form, title: event.target.value }))}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-600">描述 *</label>
                <textarea
                  rows={3}
                  value={editForm.description || ''}
                  onChange={(event) =>
                    setEditForm((form) => ({ ...form, description: event.target.value }))
                  }
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-600">关键词</label>
                <input
                  value={editForm.keywords || ''}
                  onChange={(event) => setEditForm((form) => ({ ...form, keywords: event.target.value }))}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-600">Canonical URL</label>
                <input
                  value={editForm.canonical || ''}
                  onChange={(event) =>
                    setEditForm((form) => ({ ...form, canonical: event.target.value }))
                  }
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeEdit}
                className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={saving}
                className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2 text-left">路径</th>
              <th className="px-3 py-2 text-left">标题</th>
              <th className="px-3 py-2 text-left">描述</th>
              <th className="px-3 py-2 text-left">区域</th>
              <th className="px-3 py-2 text-left">负责人</th>
              <th className="px-3 py-2 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  无匹配数据
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="border-t border-slate-200 hover:bg-slate-50">
                  <td className="max-w-[220px] truncate px-3 py-2 font-mono text-xs">{row.path}</td>
                  <td className="max-w-[220px] truncate px-3 py-2 font-medium text-slate-900">
                    {row.title}
                  </td>
                  <td className="max-w-[260px] truncate px-3 py-2 text-slate-600">{row.description}</td>
                  <td className="px-3 py-2">{row.locale}</td>
                  <td className="px-3 py-2">{row.owner}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      编辑
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
