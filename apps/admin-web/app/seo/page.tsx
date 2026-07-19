'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

// ─── Types ──────────────────────────────────────

interface SeoStat {
  totalMetadata: number
  totalSitemaps: number
  totalGeos: number
  lastUpdated: string
  pagesOptimized: number
  pagesPending: number
}

const DEFAULT_STATS: SeoStat = {
  totalMetadata: 0,
  totalSitemaps: 0,
  totalGeos: 0,
  lastUpdated: '2026-07-18T00:00:00Z',
  pagesOptimized: 12,
  pagesPending: 8,
}

// ─── Component ──────────────────────────────────────

export default function SEOPage() {
  const [stats] = useState<SeoStat>(DEFAULT_STATS)
  const [loading, setLoading] = useState(false)
  const [error] = useState<string | null>(null)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">SEO / GEO 地理营销</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">SEO 元数据</p>
          <p className="text-2xl font-bold">{stats.totalMetadata}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Sitemap 条目</p>
          <p className="text-2xl font-bold">{stats.totalSitemaps}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">GEO 地域标签</p>
          <p className="text-2xl font-bold">{stats.totalGeos}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">页面优化</p>
          <p className="text-2xl font-bold">{stats.pagesOptimized}/{stats.pagesOptimized + stats.pagesPending}</p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-gray-500">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
          加载中...
        </div>
      )}

      {/* Module Links */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/seo/metadata" className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <h3 className="font-bold mb-2">SEO 元数据管理</h3>
            <p className="text-sm text-gray-500">管理页面 title/description/keywords/canonical</p>
          </a>
          <a href="/seo/sitemap" className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <h3 className="font-bold mb-2">Sitemap 管理</h3>
            <p className="text-sm text-gray-500">配置页面更新频率与优先级</p>
          </a>
          <a href="/seo/geo-locations" className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <h3 className="font-bold mb-2">GEO 地域标签</h3>
            <p className="text-sm text-gray-500">城市 / 商圈 / 地标地理营销数据</p>
          </a>
        </div>
      )}
    </div>
  )
}
