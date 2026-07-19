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
  healthScore?: number
}

// ─── Component ──────────────────────────────────────

export default function SEOPage() {
  const [stats, setStats] = useState<SeoStat | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 从 api /seo/stats 获取 (PRD环境)
    // 当前mock
    const timer = setTimeout(() => {
      setStats({
        totalMetadata: 3,
        totalSitemaps: 6,
        totalGeos: 5,
        lastUpdated: new Date().toISOString(),
        pagesOptimized: 12,
        pagesPending: 8,
        healthScore: 72,
      })
      setLoading(false)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const healthColor = useMemo(() => {
    if (!stats?.healthScore) return 'bg-gray-100'
    if (stats.healthScore >= 80) return 'bg-green-100 text-green-800'
    if (stats.healthScore >= 60) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }, [stats])

  const healthLabel = useMemo(() => {
    if (!stats?.healthScore) return '—'
    if (stats.healthScore >= 80) return '优良'
    if (stats.healthScore >= 60) return '一般'
    return '需优化'
  }, [stats])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">SEO / GEO 地理营销</h1>
        {stats?.healthScore !== undefined && (
          <span className={`px-3 py-0.5 rounded-full text-xs font-medium ${healthColor}`}>
            健康度 {stats.healthScore}分 · {healthLabel}
          </span>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          ⚠️ {error} <button onClick={() => setError(null)} className="ml-2 underline">关闭</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">SEO 元数据</p>
          <p className="text-2xl font-bold">{loading ? '...' : stats?.totalMetadata ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Sitemap 条目</p>
          <p className="text-2xl font-bold">{loading ? '...' : stats?.totalSitemaps ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">GEO 地域标签</p>
          <p className="text-2xl font-bold">{loading ? '...' : stats?.totalGeos ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">页面优化</p>
          <p className="text-2xl font-bold">{loading ? '...' : `${stats?.pagesOptimized}/${(stats?.pagesOptimized ?? 0) + (stats?.pagesPending ?? 0)}`}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">最后更新</p>
          <p className="text-xs font-mono font-bold">{loading ? '...' : new Date(stats?.lastUpdated ?? '').toLocaleString('zh-CN')}</p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-gray-500">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
          加载SEO数据...
        </div>
      )}

      {/* Module Links + 健康卡 */}
      {!loading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <a href="/seo/health" className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow border-l-4 border-red-500"><h3 className="font-bold mb-2">SEO 健康报告</h3><p className="text-sm text-gray-500">扫描+评分+问题列表</p></a><a href="/seo/metadata" className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow border-l-4 border-blue-500">
              <h3 className="font-bold mb-2">SEO 元数据管理</h3>
              <p className="text-sm text-gray-500">管理页面 title/description/keywords/canonical · {stats?.totalMetadata} 条</p>
            </a>
            <a href="/seo/sitemap" className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow border-l-4 border-green-500">
              <h3 className="font-bold mb-2">Sitemap 管理</h3>
              <p className="text-sm text-gray-500">配置页面更新频率与优先级 · {stats?.totalSitemaps} 条目</p>
            </a>
            <a href="/seo/geo-locations" className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow border-l-4 border-purple-500">
              <h3 className="font-bold mb-2">GEO 地域标签</h3>
              <p className="text-sm text-gray-500">城市 / 商圈 / 地标 · {stats?.totalGeos} 条地域数据</p>
            </a>
          </div>

          {/* 健康建议 */}
          {stats?.healthScore !== undefined && stats.healthScore < 80 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <h3 className="font-bold text-yellow-800 mb-2">💡 SEO 优化建议</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• 增加结构化数据(JSON-LD)到门店页，提升本地搜索权重</li>
                <li>• 补充缺失的meta description，控制在50-160字</li>
                <li>• 为所有门店页配置Open Graph社交分享卡片</li>
                <li>• 检查GEO地域标签覆盖，优先补充S级城市</li>
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}
