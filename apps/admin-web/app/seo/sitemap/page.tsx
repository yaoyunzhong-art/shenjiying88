'use client'

import { useState, useMemo } from 'react'
import { AdminPermissionGate } from '../../components/admin-permission-gate'

interface SitemapRow {
  id: string; path: string; changefreq: string; priority: number; lastmod: string
}
const MOCK_ROWS: SitemapRow[] = [
  { id: 'S1', path: '/', changefreq: 'daily', priority: 0.9, lastmod: '2026-07-19' },
  { id: 'S2', path: '/stores/shanghai-xuhui', changefreq: 'weekly', priority: 0.8, lastmod: '2026-07-18' },
  { id: 'S3', path: '/stores/beijing-chaoyang', changefreq: 'weekly', priority: 0.8, lastmod: '2026-07-18' },
  { id: 'S4', path: '/activities/summer-2026', changefreq: 'daily', priority: 0.7, lastmod: '2026-07-19' },
  { id: 'S5', path: '/deals/weekend-special', changefreq: 'daily', priority: 0.6, lastmod: '2026-07-19' },
  { id: 'S6', path: '/about', changefreq: 'monthly', priority: 0.5, lastmod: '2026-06-01' },
]

const FREQ_COLORS: Record<string, string> = {
  daily: 'bg-green-100 text-green-800',
  weekly: 'bg-blue-100 text-blue-800',
  monthly: 'bg-gray-100 text-gray-800',
}

const permissionGate = {
  requiredPermission: 'dashboard:read',
  title: 'Sitemap 管理访问受限',
  description:
    'Sitemap 管理页已接入管理员本地 session，只有具备 dashboard:read 的账号才能查看站点路径、更新频率与优先级配置。',
} as const

export default function SitemapPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rows] = useState(MOCK_ROWS)
  const [freqFilter, setFreqFilter] = useState<string>('ALL')

  if (loading) {
    return (
      <AdminPermissionGate {...permissionGate}>
        <div>加载中...</div>
      </AdminPermissionGate>
    )
  }
  if (error) {
    return (
      <AdminPermissionGate {...permissionGate}>
        <div>数据获取失败: {error}</div>
      </AdminPermissionGate>
    )
  }
  if (!rows || rows.length === 0) {
    return (
      <AdminPermissionGate {...permissionGate}>
        <div>暂无数据</div>
      </AdminPermissionGate>
    )
  }

  const filtered = useMemo(() => {
    if (freqFilter === 'ALL') return rows
    return rows.filter(r => r.changefreq === freqFilter)
  }, [rows, freqFilter])

  return (
    <AdminPermissionGate {...permissionGate}>
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Sitemap 管理</h1>
        <p className="text-sm text-gray-500 mb-4">配置页面更新频率与优先级 ({rows.length} 条目)</p>

        <div className="flex gap-2 mb-4 flex-wrap">
          {['ALL', 'daily', 'weekly', 'monthly'].map(f => (
            <button key={f} onClick={() => setFreqFilter(f)}
              className={`px-3 py-1 rounded text-sm ${freqFilter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {f === 'ALL' ? '全部' : f === 'daily' ? '每日' : f === 'weekly' ? '每周' : '每月'}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr><th className="text-left px-3 py-2">路径</th><th className="text-left px-3 py-2">更新频率</th><th className="text-left px-3 py-2">优先级</th><th className="text-left px-3 py-2">最后修改</th></tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-xs">{r.path}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${FREQ_COLORS[r.changefreq] || 'bg-gray-100'}`}>{r.changefreq}</span>
                  </td>
                  <td className="px-3 py-2">{r.priority.toFixed(1)}</td>
                  <td className="px-3 py-2 text-xs">{r.lastmod}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminPermissionGate>
  )
}
