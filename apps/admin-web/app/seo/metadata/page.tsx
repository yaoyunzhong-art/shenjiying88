'use client'

import { useState, useMemo } from 'react'

interface MetaRow {
  id: string; path: string; title: string; description: string; canonical: string; locale: string; keywords: string
}
const MOCK_ROWS: MetaRow[] = [
  { id: 'M1', path: '/stores/shanghai-xuhui', title: '上海徐汇旗舰店 | 品牌', description: '上海徐汇区最好的电玩城', canonical: 'https://domain.com/stores/shanghai-xuhui', locale: 'zh-CN', keywords: '上海电玩城,徐汇娱乐' },
  { id: 'M2', path: '/stores/beijing-chaoyang', title: '北京朝阳店 | 品牌', description: '北京朝阳区娱乐好去处', canonical: 'https://domain.com/stores/beijing-chaoyang', locale: 'zh-CN', keywords: '北京电玩城,朝阳' },
  { id: 'M3', path: '/activities/summer-2026', title: '2026暑期狂欢活动', description: '暑假特惠套餐', canonical: 'https://domain.com/activities/summer-2026', locale: 'zh-CN', keywords: '暑期活动,特惠' },
]

export default function SEOMetadataPage() {
  const [rows] = useState(MOCK_ROWS)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<'path' | 'title'>('path')

  const filtered = useMemo(() => {
    let items = [...rows]
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(r => r.path.toLowerCase().includes(q) || r.title.toLowerCase().includes(q))
    }
    items.sort((a, b) => a[sortKey].localeCompare(b[sortKey]))
    return items
  }, [rows, search, sortKey])

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

      <div className="overflow-x-auto border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr><th className="text-left px-3 py-2">路径</th><th className="text-left px-3 py-2">标题</th><th className="text-left px-3 py-2">描述</th><th className="text-left px-3 py-2">区域</th><th className="text-left px-3 py-2">关键词</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">无匹配数据</td></tr>
            ) : filtered.map(r => (
              <tr key={r.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 font-mono text-xs max-w-[200px] truncate">{r.path}</td>
                <td className="px-3 py-2 font-medium">{r.title}</td>
                <td className="px-3 py-2 max-w-[200px] truncate text-gray-600">{r.description}</td>
                <td className="px-3 py-2">{r.locale}</td>
                <td className="px-3 py-2 text-xs max-w-[150px] truncate">{r.keywords}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
