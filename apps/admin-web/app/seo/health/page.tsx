'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

interface AuditIssue {
  path: string; severity: 'high' | 'medium' | 'low'; suggestion: string
}

interface HealthReport {
  totalPages: number; pagesWithMetadata: number; pagesWithSitemap: number
  avgMetadataScore: number; coverageRate: number; issues: AuditIssue[]
}

const MOCK_REPORT: HealthReport = {
  totalPages: 10, pagesWithMetadata: 4, pagesWithSitemap: 4,
  avgMetadataScore: 34, coverageRate: 40,
  issues: [
    { path: '/', severity: 'high', suggestion: '缺少SEO元数据 (title/description)' },
    { path: '/stores/beijing', severity: 'high', suggestion: '缺少SEO元数据 (title/description)' },
    { path: '/activities/summer', severity: 'high', suggestion: '缺少SEO元数据 (title/description)' },
    { path: '/about', severity: 'medium', suggestion: '未在sitemap中注册' },
    { path: '/faq', severity: 'medium', suggestion: '未在sitemap中注册' },
    { path: '/contact', severity: 'medium', suggestion: '未在sitemap中注册' },
    { path: '/deals/weekend', severity: 'low', suggestion: '未在sitemap中注册' },
  ],
}

const SEV_ICONS: Record<string, string> = { high: '🔴', medium: '🟡', low: '🟢' }
const SEV_TEXT: Record<string, string> = { high: '紧急', medium: '中等', low: '轻微' }

export default function SEOHealthPage() {
  const [report, setReport] = useState<HealthReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => { setReport(MOCK_REPORT); setLoading(false) }, 200)
    return () => clearTimeout(timer)
  }, [])

  if (loading) return <div className="p-6 text-center text-gray-500"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />加载健康报告...</div>

  if (!report) return <div className="p-6 text-center text-red-500">无法加载健康报告</div>

  const barBg = report.coverageRate >= 80 ? 'bg-green-500' : report.coverageRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">SEO 健康报告</h1>

      {/* 概览卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">扫描页面</p>
          <p className="text-2xl font-bold">{report.totalPages}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">有元数据</p>
          <p className="text-2xl font-bold">{report.pagesWithMetadata}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">有Sitemap</p>
          <p className="text-2xl font-bold">{report.pagesWithSitemap}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">平均评分</p>
          <p className="text-2xl font-bold">{report.avgMetadataScore}/100</p>
        </div>
      </div>

      {/* 覆盖率进度条 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="font-bold mb-2">SEO 覆盖健康度</h2>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-200 rounded-full h-4">
            <div className={`h-4 rounded-full ${barBg} transition-all`} style={{ width: `${report.coverageRate}%` }} />
          </div>
          <span className="text-sm font-bold">{report.coverageRate}%</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">目标: ≥80% · 建议补充 {report.totalPages - report.pagesWithMetadata} 页元数据</p>
      </div>

      {/* 问题列表 */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="font-bold mb-3">发现的问题 ({report.issues.length})</h2>
        {report.issues.length === 0 ? (
          <p className="text-green-600 text-sm">✅ 没有发现SEO问题</p>
        ) : (
          <div className="space-y-2">
            {report.issues.map((issue, i) => (
              <div key={i} className="border rounded overflow-hidden">
                <button onClick={() => setExpanded(expanded === `${i}` ? null : `${i}`)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 text-sm">
                  <span>{SEV_ICONS[issue.severity]}</span>
                  <span className="text-xs text-gray-500 w-8">{SEV_TEXT[issue.severity]}</span>
                  <code className="flex-1 font-mono text-xs">{issue.path}</code>
                  <span>{expanded === `${i}` ? '▲' : '▼'}</span>
                </button>
                {expanded === `${i}` && (
                  <div className="px-3 pb-2 text-sm text-gray-600 bg-gray-50">
                    💡 {issue.suggestion}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 优化建议汇总 */}
      <div className="bg-blue-50 border border-blue-200 rounded p-4 mt-4">
        <h3 className="font-bold text-blue-800 mb-2">📋 建议行动</h3>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal ml-4">
          <li>为关键路径补充SEO元数据 (高优先级)</li>
          <li>将所有页面注册到Sitemap (中优先级)</li>
          <li>为目标页添加结构化数据 (低优先级)</li>
          <li>配置Open Graph社交分享卡片</li>
        </ol>
      </div>
    </div>
  )
}
