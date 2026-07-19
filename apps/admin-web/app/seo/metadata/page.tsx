'use client'

import { useCallback, useState, useMemo } from 'react'

interface MetaRow {
  id: string; path: string; title: string; description: string; canonical: string; locale: string; keywords: string
}
const MOCK_ROWS: MetaRow[] = [
  { id: 'M1', path: '/stores/shanghai-xuhui', title: '上海徐汇旗舰店 | 品牌', description: '上海徐汇区最好的电玩城', canonical: 'https://domain.com/stores/shanghai-xuhui', locale: 'zh-CN', keywords: '上海电玩城,徐汇娱乐' },
  { id: 'M2', path: '/stores/beijing-chaoyang', title: '北京朝阳店 | 品牌', description: '北京朝阳区娱乐好去处', canonical: 'https://domain.com/stores/beijing-chaoyang', locale: 'zh-CN', keywords: '北京电玩城,朝阳' },
  { id: 'M3', path: '/activities/summer-2026', title: '2026暑期狂欢活动', description: '暑假特惠套餐', canonical: 'https://domain.com/activities/summer-2026', locale: 'zh-CN', keywords: '暑期活动,特惠' },
]

export default function SEOMetadataPage() {
  const [rows, setRows] = useState(MOCK_ROWS)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<'path' | 'title'>('path')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<MetaRow>>({})
  const [editError, setEditError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() => {
    let items = [...rows]
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(r => r.path.toLowerCase().includes(q) || r.title.toLowerCase().includes(q))
    }
    items.sort((a, b) => a[sortKey].localeCompare(b[sortKey]))
    return items
  }, [rows, search, sortKey])

  const openEdit = useCallback((row: MetaRow) => {
    setEditingId(row.id)
    setEditForm({ ...row })
    setEditError(null)
  }, [])

  const saveEdit = useCallback(async () => {
    if (!editForm.title?.trim()) { setEditError('标题不能为空'); return }
    if (!editForm.description?.trim()) { setEditError('描述不能为空'); return }
    setSaving(true)
    await new Promise(r => setTimeout(r, 150))
    setRows(prev => prev.map(r => r.id === editingId ? { ...r, ...editForm } as MetaRow : r))
    setEditingId(null)
    setSaving(false)
    setEditForm({})
  }, [editForm, editingId])

  const cancelEdit = useCallback(() => {
    setEditingId(null)
    setEditForm({})
    setEditError(null)
  }, [])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">SEO 元数据管理</h1>
      <p className="text-sm text-gray-500 mb-4">管理所有页面的 title/description/keywords/canonical 元数据</p>

      <div className="flex gap-2 mb-4">
        <input placeholder="搜索路径或标题..." value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 border rounded px-3 py-1.5 text-sm" />
        <select value={sortKey} onChange={e => setSortKey(e.target.value as any)} className="border rounded px-2 py-1.5 text-sm">
          <option value="path">按路径</option>
          <option value="title">按标题</option>
        </select>
      </div>

      {/* ── 编辑弹窗 ── */}
      {editingId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={cancelEdit}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold mb-4">编辑元数据</h2>
            {editError && <div className="bg-red-50 text-red-700 px-3 py-2 rounded text-sm mb-3">{editError}</div>}
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">路径</label>
                <input className="w-full border rounded px-3 py-1.5 text-sm bg-gray-50" value={editForm.path || ''} disabled />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">标题 *</label>
                <input className="w-full border rounded px-3 py-1.5 text-sm" value={editForm.title || ''}
                  onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">描述 *</label>
                <textarea className="w-full border rounded px-3 py-1.5 text-sm" rows={3}
                  value={editForm.description || ''}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">关键词 (逗号分隔)</label>
                <input className="w-full border rounded px-3 py-1.5 text-sm" value={editForm.keywords || ''}
                  onChange={e => setEditForm(f => ({ ...f, keywords: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Canonical URL</label>
                <input className="w-full border rounded px-3 py-1.5 text-sm" value={editForm.canonical || ''}
                  onChange={e => setEditForm(f => ({ ...f, canonical: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={cancelEdit} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">取消</button>
              <button onClick={saveEdit} disabled={saving}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="overflow-x-auto border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr><th className="text-left px-3 py-2">路径</th><th className="text-left px-3 py-2">标题</th><th className="text-left px-3 py-2">描述</th><th className="text-left px-3 py-2">区域</th><th className="text-left px-3 py-2">操作</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">无匹配数据</td></tr>
            ) : filtered.map(r => (
              <tr key={r.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 font-mono text-xs max-w-[180px] truncate">{r.path}</td>
                <td className="px-3 py-2 font-medium max-w-[200px] truncate">{r.title}</td>
                <td className="px-3 py-2 max-w-[200px] truncate text-gray-600">{r.description}</td>
                <td className="px-3 py-2">{r.locale}</td>
                <td className="px-3 py-2">
                  <button onClick={() => openEdit(r)} className="text-blue-600 hover:underline text-xs">编辑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
