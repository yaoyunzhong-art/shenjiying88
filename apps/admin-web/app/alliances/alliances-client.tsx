'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type {
  AlliancePartner,
  AlliancesSnapshotDelivery,
  BusinessType,
  PartnerFilter,
  PartnerGrade,
  PartnerStatus,
  SettlementStatus,
} from './alliances-data'

const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  RETAIL: '零售',
  'F&B': '餐饮',
  SERVICE: '服务',
  TECH: '科技',
  OTHER: '其他',
}

const STATUS_LABELS: Record<PartnerStatus, string> = {
  ACTIVE: '正常',
  INACTIVE: '已停用',
  SUSPENDED: '已冻结',
}

const STATUS_COLORS: Record<PartnerStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-500',
  SUSPENDED: 'bg-red-100 text-red-600',
}

const GRADE_LABELS: Record<PartnerGrade, string> = {
  S: '金牌',
  A: '优质',
  B: '普通',
  C: '待改进',
}

const GRADE_COLORS: Record<PartnerGrade, string> = {
  S: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
  A: 'bg-blue-100 text-blue-700 border border-blue-300',
  B: 'bg-gray-100 text-gray-600 border border-gray-300',
  C: 'bg-orange-100 text-orange-600 border border-orange-300',
}

const SETTLEMENT_LABELS: Record<SettlementStatus, string> = {
  pending: '待审批',
  approved: '已审批',
  rejected: '已驳回',
  completed: '已完成',
}

const SETTLEMENT_COLORS: Record<SettlementStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-600',
  completed: 'bg-green-100 text-green-700',
}

function fmtCents(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`
}

function fmtShort(cents: number): string {
  const wan = cents / 10000
  if (wan >= 100) return `¥${(wan / 100).toFixed(1)}亿`
  if (wan >= 1) return `¥${wan.toFixed(1)}万`
  return fmtCents(cents)
}

function healthColor(score: number | null): string {
  if (score === null) return 'text-gray-400'
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-blue-600'
  if (score >= 40) return 'text-yellow-600'
  return 'text-red-600'
}

function healthBarColor(score: number | null): string {
  if (score === null) return 'bg-gray-200'
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-blue-500'
  if (score >= 40) return 'bg-yellow-500'
  return 'bg-red-500'
}

export default function AlliancesClient({
  snapshot,
}: {
  snapshot: AlliancesSnapshotDelivery
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [filter, setFilter] = useState<PartnerFilter>({
    search: '',
    status: 'ALL',
    grade: 'ALL',
    businessType: 'ALL',
  })
  const partners = snapshot.partners

  const filtered = useMemo(() => {
    return partners.filter((partner) => {
      if (filter.search) {
        const query = filter.search.toLowerCase()
        if (
          !partner.name.toLowerCase().includes(query) &&
          !partner.contact.toLowerCase().includes(query)
        ) {
          return false
        }
      }
      if (filter.status !== 'ALL' && partner.status !== filter.status) return false
      if (filter.grade !== 'ALL' && partner.currentGrade !== filter.grade) return false
      if (filter.businessType !== 'ALL' && partner.businessType !== filter.businessType) return false
      return true
    })
  }, [partners, filter])

  const stats = useMemo(() => {
    const active = partners.filter((partner) => partner.status === 'ACTIVE').length
    const totalRevenue = partners.reduce((sum, partner) => sum + partner.totalRevenue, 0)
    const totalOrders = partners.reduce((sum, partner) => sum + partner.totalOrders, 0)
    const avgHealth =
      partners.length > 0
        ? Math.round(
            partners.reduce((sum, partner) => sum + (partner.healthScore ?? 0), 0) / partners.length
          )
        : 0
    const gradeDist = partners.reduce<Record<string, number>>((acc, partner) => {
      const grade = partner.currentGrade ?? 'N/A'
      acc[grade] = (acc[grade] ?? 0) + 1
      return acc
    }, {})
    return { active, totalRevenue, totalOrders, avgHealth, gradeDist, total: partners.length }
  }, [partners])

  const gradeFilterOptions = useMemo(() => {
    const grades = new Set(partners.map((partner) => partner.currentGrade).filter(Boolean) as PartnerGrade[])
    return ['ALL', ...Array.from(grades).sort()] as (PartnerGrade | 'ALL')[]
  }, [partners])

  const bizTypeFilterOptions = useMemo(() => {
    const types = new Set(partners.map((partner) => partner.businessType))
    return ['ALL', ...Array.from(types)] as (BusinessType | 'ALL')[]
  }, [partners])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">联盟伙伴管理</h1>
          <p className="text-sm text-gray-500 mt-1">异业联盟合作伙伴 · S/A/B/C 分级管理 · 健康度监控</p>
        </div>
        <button
          type="button"
          onClick={() => startRefresh(() => router.refresh())}
          disabled={isRefreshing}
          className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRefreshing ? '刷新中...' : '刷新'}
        </button>
      </div>

      {snapshot.error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-800 text-sm">{snapshot.error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">伙伴总数</p>
          <p className="text-2xl font-bold mt-1">{stats.total}</p>
          <p className="text-xs text-green-600 mt-0.5">活跃 {stats.active}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">总营收</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{fmtShort(stats.totalRevenue)}</p>
          <p className="text-xs text-gray-400 mt-0.5">累计交易</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">总订单</p>
          <p className="text-2xl font-bold mt-1">{stats.totalOrders.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-0.5">笔</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">平均健康度</p>
          <p className={`text-2xl font-bold mt-1 ${healthColor(stats.avgHealth)}`}>{stats.avgHealth}</p>
          <p className="text-xs text-gray-400 mt-0.5">分</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">等级分布</p>
          <div className="mt-1 space-y-0.5">
            {(['S', 'A', 'B', 'C'] as PartnerGrade[]).map((grade) => (
              <div key={grade} className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 w-4">{grade}</span>
                <div className="flex-1 bg-gray-100 rounded h-1.5">
                  <div
                    className={`h-1.5 rounded ${
                      grade === 'S'
                        ? 'bg-yellow-400'
                        : grade === 'A'
                          ? 'bg-blue-400'
                          : grade === 'B'
                            ? 'bg-gray-400'
                            : 'bg-orange-400'
                    }`}
                    style={{
                      width: `${stats.total > 0 ? ((stats.gradeDist[grade] ?? 0) / stats.total) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-4 text-right">{stats.gradeDist[grade] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-4 space-y-3">
        <div>
          <input
            type="text"
            placeholder="搜索伙伴名称或联系方式..."
            value={filter.search}
            onChange={(event) => setFilter((current) => ({ ...current, search: event.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-400"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">状态:</span>
            <select
              value={filter.status}
              onChange={(event) =>
                setFilter((current) => ({
                  ...current,
                  status: event.target.value as PartnerStatus | 'ALL',
                }))
              }
              className="px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-400"
            >
              <option value="ALL">全部</option>
              <option value="ACTIVE">正常</option>
              <option value="INACTIVE">已停用</option>
              <option value="SUSPENDED">已冻结</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">等级:</span>
            <select
              value={filter.grade}
              onChange={(event) =>
                setFilter((current) => ({
                  ...current,
                  grade: event.target.value as PartnerGrade | 'ALL',
                }))
              }
              className="px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-400"
            >
              <option value="ALL">全部</option>
              {gradeFilterOptions.filter((option) => option !== 'ALL').map((grade) => (
                <option key={grade} value={grade}>
                  {GRADE_LABELS[grade as PartnerGrade]} ({grade})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">行业:</span>
            <select
              value={filter.businessType}
              onChange={(event) =>
                setFilter((current) => ({
                  ...current,
                  businessType: event.target.value as BusinessType | 'ALL',
                }))
              }
              className="px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-400"
            >
              <option value="ALL">全部</option>
              {bizTypeFilterOptions.filter((option) => option !== 'ALL').map((type) => (
                <option key={type} value={type}>
                  {BUSINESS_TYPE_LABELS[type as BusinessType]} ({type})
                </option>
              ))}
            </select>
          </div>
          {filter.search && (
            <button
              type="button"
              onClick={() => setFilter((current) => ({ ...current, search: '' }))}
              className="text-xs text-blue-600 hover:underline"
            >
              清除搜索
            </button>
          )}
          <span className="text-xs text-gray-400 ml-auto">共 {filtered.length} 条结果</span>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white border rounded-lg p-12 text-center">
            <div className="text-gray-300 mb-3">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <p className="text-lg text-gray-500 mb-1">无匹配结果</p>
            <p className="text-sm text-gray-400">当前筛选条件下没有符合条件的伙伴</p>
            <button
              type="button"
              onClick={() =>
                setFilter({ search: '', status: 'ALL', grade: 'ALL', businessType: 'ALL' })
              }
              className="mt-3 text-sm text-blue-600 hover:underline"
            >
              清除所有筛选
            </button>
          </div>
        ) : (
          filtered.map((partner: AlliancePartner) => (
            <div
              key={partner.id}
              className="bg-white border rounded-lg p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-medium text-gray-900 truncate max-w-[200px]">
                      {partner.name}
                    </h3>
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-xs font-bold ${
                        partner.currentGrade
                          ? GRADE_COLORS[partner.currentGrade]
                          : 'bg-gray-50 text-gray-400 border border-gray-200'
                      }`}
                    >
                      {partner.currentGrade ? GRADE_LABELS[partner.currentGrade] : '未评定'}
                    </span>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[partner.status]}`}
                    >
                      {STATUS_LABELS[partner.status]}
                    </span>
                    <span className="text-xs text-gray-400 bg-gray-50 rounded px-1.5">
                      {BUSINESS_TYPE_LABELS[partner.businessType]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{partner.contact}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 flex-wrap">
                    <span>订单: {partner.totalOrders.toLocaleString()}</span>
                    <span className="text-green-500 font-medium">营收: {fmtShort(partner.totalRevenue)}</span>
                    <span className="text-blue-500">分润: {(partner.revenueShare * 100).toFixed(1)}%</span>
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs ${SETTLEMENT_COLORS[partner.settlementStatus]}`}
                    >
                      结算: {SETTLEMENT_LABELS[partner.settlementStatus]}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">健康度</span>
                      <span className={`text-xs font-medium ${healthColor(partner.healthScore)}`}>
                        {partner.healthScore !== null ? `${partner.healthScore}分` : '未评估'}
                      </span>
                    </div>
                    {partner.healthScore !== null && (
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                        <div
                          className={`h-1.5 rounded-full transition-all ${healthBarColor(partner.healthScore)}`}
                          style={{ width: `${Math.min(partner.healthScore, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right ml-4 min-w-[120px] shrink-0">
                  <p className="text-xs text-gray-400">注册: {partner.registeredAt.slice(0, 10)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">更新: {partner.updatedAt.slice(0, 10)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
