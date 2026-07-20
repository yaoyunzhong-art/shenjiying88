'use client'

import { useCallback, useEffect, useState, useMemo } from 'react'

// ─── 类型定义 ──────────────────────────────────────

/** 联盟伙伴等级 */
export type PartnerGrade = 'S' | 'A' | 'B' | 'C'

/** 联盟伙伴状态 */
export type PartnerStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

/** 联盟伙伴业务类型 */
export type BusinessType = 'RETAIL' | 'F&B' | 'SERVICE' | 'TECH' | 'OTHER'

/** 分账状态 */
export type SettlementStatus = 'pending' | 'approved' | 'rejected' | 'completed'

/** 联盟伙伴 */
export interface AlliancePartner {
  id: string
  name: string
  businessType: BusinessType
  contact: string
  address: string
  status: PartnerStatus
  currentGrade: PartnerGrade | null
  healthScore: number | null
  /** 分润比例（0-1） */
  revenueShare: number
  settlementStatus: SettlementStatus
  totalRevenue: number
  totalOrders: number
  registeredAt: string
  updatedAt: string
}

/** 伙伴筛选条件 */
export interface PartnerFilter {
  search: string
  status: PartnerStatus | 'ALL'
  grade: PartnerGrade | 'ALL'
  businessType: BusinessType | 'ALL'
}

// ── 常量 ──

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

/** 健康度颜色 */
function healthColor(score: number | null): string {
  if (score === null) return 'text-gray-400'
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-blue-600'
  if (score >= 40) return 'text-yellow-600'
  return 'text-red-600'
}

/** 健康度背景色条 */
function healthBarColor(score: number | null): string {
  if (score === null) return 'bg-gray-200'
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-blue-500'
  if (score >= 40) return 'bg-yellow-500'
  return 'bg-red-500'
}

// ── 默认样本数据 ──

const defaultPartners: AlliancePartner[] = [
  {
    id: 'p-1', name: '喜茶', businessType: 'F&B', contact: '李经理 138****5678',
    address: '深圳市南山区科技园', status: 'ACTIVE', currentGrade: 'S', healthScore: 92,
    revenueShare: 0.08, settlementStatus: 'completed', totalRevenue: 58000000, totalOrders: 18230,
    registeredAt: '2025-03-15T00:00:00Z', updatedAt: '2026-07-20T10:00:00Z',
  },
  {
    id: 'p-2', name: '泡泡玛特', businessType: 'RETAIL', contact: '王总监 139****9012',
    address: '北京市朝阳区望京', status: 'ACTIVE', currentGrade: 'A', healthScore: 85,
    revenueShare: 0.12, settlementStatus: 'approved', totalRevenue: 25000000, totalOrders: 8920,
    registeredAt: '2025-06-01T00:00:00Z', updatedAt: '2026-07-19T14:00:00Z',
  },
  {
    id: 'p-3', name: '星巴克', businessType: 'F&B', contact: '陈主管 136****3456',
    address: '上海市静安区', status: 'ACTIVE', currentGrade: 'A', healthScore: 78,
    revenueShare: 0.10, settlementStatus: 'completed', totalRevenue: 42000000, totalOrders: 15200,
    registeredAt: '2025-01-10T00:00:00Z', updatedAt: '2026-07-18T09:00:00Z',
  },
  {
    id: 'p-4', name: '支付宝', businessType: 'TECH', contact: '赵经理 137****7890',
    address: '杭州市西湖区', status: 'ACTIVE', currentGrade: 'S', healthScore: 95,
    revenueShare: 0.05, settlementStatus: 'completed', totalRevenue: 120000000, totalOrders: 42100,
    registeredAt: '2025-04-20T00:00:00Z', updatedAt: '2026-07-20T08:00:00Z',
  },
  {
    id: 'p-5', name: '美团', businessType: 'TECH', contact: '刘经理 135****1234',
    address: '北京市海淀区', status: 'INACTIVE', currentGrade: 'B', healthScore: 62,
    revenueShare: 0.06, settlementStatus: 'rejected', totalRevenue: 15000000, totalOrders: 5120,
    registeredAt: '2025-02-01T00:00:00Z', updatedAt: '2026-06-30T10:00:00Z',
  },
  {
    id: 'p-6', name: '肯德基', businessType: 'F&B', contact: '孙经理 158****2233',
    address: '广州市天河区', status: 'ACTIVE', currentGrade: 'B', healthScore: 70,
    revenueShare: 0.15, settlementStatus: 'pending', totalRevenue: 18500000, totalOrders: 7230,
    registeredAt: '2025-07-01T00:00:00Z', updatedAt: '2026-07-17T11:00:00Z',
  },
  {
    id: 'p-7', name: '蔚来汽车', businessType: 'SERVICE', contact: '周经理 159****4455',
    address: '上海市嘉定区', status: 'SUSPENDED', currentGrade: 'C', healthScore: 35,
    revenueShare: 0.20, settlementStatus: 'rejected', totalRevenue: 3200000, totalOrders: 890,
    registeredAt: '2025-09-10T00:00:00Z', updatedAt: '2026-07-10T16:00:00Z',
  },
  {
    id: 'p-8', name: '屈臣氏', businessType: 'RETAIL', contact: '吴主管 136****7788',
    address: '成都市锦江区', status: 'ACTIVE', currentGrade: 'A', healthScore: 82,
    revenueShare: 0.07, settlementStatus: 'completed', totalRevenue: 31000000, totalOrders: 11200,
    registeredAt: '2025-05-15T00:00:00Z', updatedAt: '2026-07-16T13:00:00Z',
  },
]

// ── API 工具 ──

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.message || 'API error')
  return json.data as T
}

// ── 主组件 ──

export default function AlliancesPage() {
  const [partners, setPartners] = useState<AlliancePartner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<PartnerFilter>({
    search: '',
    status: 'ALL',
    grade: 'ALL',
    businessType: 'ALL',
  })

  const loadPartners = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch<{ partners: AlliancePartner[] }>('/api/brand/alliances/partners')
      setPartners(data.partners)
    } catch {
      // Fallback to sample data
      setPartners(defaultPartners)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadPartners() }, [loadPartners])

  // ── 筛选逻辑 ──

  const filtered = useMemo(() => {
    return partners.filter(p => {
      // 搜索
      if (filter.search) {
        const q = filter.search.toLowerCase()
        if (!p.name.toLowerCase().includes(q) &&
            !p.contact.toLowerCase().includes(q)) {
          return false
        }
      }
      // 状态筛选
      if (filter.status !== 'ALL' && p.status !== filter.status) return false
      // 等级筛选
      if (filter.grade !== 'ALL' && p.currentGrade !== filter.grade) return false
      // 业务类型筛选
      if (filter.businessType !== 'ALL' && p.businessType !== filter.businessType) return false
      return true
    })
  }, [partners, filter])

  // ── 概览统计 ──

  const stats = useMemo(() => {
    const active = partners.filter(p => p.status === 'ACTIVE').length
    const totalRevenue = partners.reduce((s, p) => s + p.totalRevenue, 0)
    const totalOrders = partners.reduce((s, p) => s + p.totalOrders, 0)
    const avgHealth = partners.length > 0
      ? Math.round(partners.reduce((s, p) => s + (p.healthScore ?? 0), 0) / partners.length)
      : 0
    const gradeDist = partners.reduce<Record<string, number>>((acc, p) => {
      const g = p.currentGrade ?? 'N/A'
      acc[g] = (acc[g] ?? 0) + 1
      return acc
    }, {})
    return { active, totalRevenue, totalOrders, avgHealth, gradeDist, total: partners.length }
  }, [partners])

  // ── 各筛选维度的选项 ──

  const gradeFilterOptions = useMemo(() => {
    const grades = new Set(partners.map(p => p.currentGrade).filter(Boolean) as PartnerGrade[])
    return ['ALL', ...Array.from(grades).sort()] as (PartnerGrade | 'ALL')[]
  }, [partners])

  const bizTypeFilterOptions = useMemo(() => {
    const types = new Set(partners.map(p => p.businessType))
    return ['ALL', ...Array.from(types)] as (BusinessType | 'ALL')[]
  }, [partners])

  // ── 加载态 ──

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        <span className="ml-3 text-gray-600">加载联盟伙伴...</span>
      </div>
    )
  }

  // ── 错误态 ──

  const hasError = error !== null

  // ── 空态检查 ──

  if (!loading && partners.length === 0 && !hasError) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">联盟伙伴管理</h1>
            <p className="text-sm text-gray-500 mt-1">异业联盟合作伙伴全生命周期管理</p>
          </div>
          <button onClick={loadPartners} className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">刷新</button>
        </div>
        <div className="bg-white border rounded-lg p-12 text-center">
          <div className="text-gray-300 mb-3">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-lg text-gray-500 mb-1">暂无联盟伙伴</p>
          <p className="text-sm text-gray-400">尚未注册任何联盟合作伙伴</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">联盟伙伴管理</h1>
          <p className="text-sm text-gray-500 mt-1">异业联盟合作伙伴 · S/A/B/C 分级管理 · 健康度监控</p>
        </div>
        <button onClick={loadPartners} className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">
          刷新
        </button>
      </div>

      {/* 错误提示 */}
      {hasError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-800 text-sm">{error}</p>
        </div>
      )}

      {/* ---------- 概览 ---------- */}
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
          <p className={`text-2xl font-bold mt-1 ${healthColor(stats.avgHealth)}`}>
            {stats.avgHealth}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">分</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">等级分布</p>
          <div className="mt-1 space-y-0.5">
            {(['S', 'A', 'B', 'C'] as PartnerGrade[]).map(g => (
              <div key={g} className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 w-4">{g}</span>
                <div className="flex-1 bg-gray-100 rounded h-1.5">
                  <div className={`h-1.5 rounded ${g === 'S' ? 'bg-yellow-400' : g === 'A' ? 'bg-blue-400' : g === 'B' ? 'bg-gray-400' : 'bg-orange-400'}`}
                    style={{ width: `${stats.total > 0 ? ((stats.gradeDist[g] ?? 0) / stats.total) * 100 : 0}%` }} />
                </div>
                <span className="text-xs text-gray-400 w-4 text-right">{stats.gradeDist[g] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- 搜索/筛选 ---------- */}
      <div className="bg-white border rounded-lg p-4 space-y-3">
        {/* 搜索框 */}
        <div>
          <input
            type="text"
            placeholder="搜索伙伴名称或联系方式..."
            value={filter.search}
            onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-400"
          />
        </div>
        {/* 筛选行 */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">状态:</span>
            <select
              value={filter.status}
              onChange={e => setFilter(f => ({ ...f, status: e.target.value as PartnerStatus | 'ALL' }))}
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
              onChange={e => setFilter(f => ({ ...f, grade: e.target.value as PartnerGrade | 'ALL' }))}
              className="px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-400"
            >
              <option value="ALL">全部</option>
              {gradeFilterOptions.filter(o => o !== 'ALL').map(g => (
                <option key={g} value={g}>{GRADE_LABELS[g as PartnerGrade]} ({g})</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">行业:</span>
            <select
              value={filter.businessType}
              onChange={e => setFilter(f => ({ ...f, businessType: e.target.value as BusinessType | 'ALL' }))}
              className="px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-400"
            >
              <option value="ALL">全部</option>
              {bizTypeFilterOptions.filter(o => o !== 'ALL').map(t => (
                <option key={t} value={t}>{BUSINESS_TYPE_LABELS[t as BusinessType]} ({t})</option>
              ))}
            </select>
          </div>
          {filter.search && (
            <button
              onClick={() => setFilter(f => ({ ...f, search: '' }))}
              className="text-xs text-blue-600 hover:underline"
            >
              清除搜索
            </button>
          )}
          <span className="text-xs text-gray-400 ml-auto">
            共 {filtered.length} 条结果
          </span>
        </div>
      </div>

      {/* ---------- 列表 ---------- */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white border rounded-lg p-12 text-center">
            <div className="text-gray-300 mb-3">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-lg text-gray-500 mb-1">无匹配结果</p>
            <p className="text-sm text-gray-400">当前筛选条件下没有符合条件的伙伴</p>
            <button
              onClick={() => setFilter({ search: '', status: 'ALL', grade: 'ALL', businessType: 'ALL' })}
              className="mt-3 text-sm text-blue-600 hover:underline"
            >
              清除所有筛选
            </button>
          </div>
        ) : (
          filtered.map(p => (
            <div key={p.id} className="bg-white border rounded-lg p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                {/* 左: 基本信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-medium text-gray-900 truncate max-w-[200px]">{p.name}</h3>
                    {/* 等级标签 */}
                    <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-bold ${
                      p.currentGrade ? GRADE_COLORS[p.currentGrade] : 'bg-gray-50 text-gray-400 border border-gray-200'
                    }`}>
                      {p.currentGrade ? GRADE_LABELS[p.currentGrade] : '未评定'}
                    </span>
                    {/* 状态标签 */}
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[p.status]}`}>
                      {STATUS_LABELS[p.status]}
                    </span>
                    {/* 行业 */}
                    <span className="text-xs text-gray-400 bg-gray-50 rounded px-1.5">{BUSINESS_TYPE_LABELS[p.businessType]}</span>
                  </div>
                  {/* 联系信息 */}
                  <p className="text-sm text-gray-500 mt-1">{p.contact}</p>
                  {/* 关键指标 */}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 flex-wrap">
                    <span>订单: {p.totalOrders.toLocaleString()}</span>
                    <span className="text-green-500 font-medium">
                      营收: {fmtShort(p.totalRevenue)}
                    </span>
                    {/* 分润比例 */}
                    <span className="text-blue-500">
                      分润: {(p.revenueShare * 100).toFixed(1)}%
                    </span>
                    {/* 结算状态 */}
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs ${
                      SETTLEMENT_COLORS[p.settlementStatus]
                    }`}>
                      结算:{' '}
                      {SETTLEMENT_LABELS[p.settlementStatus]}
                    </span>
                  </div>
                  {/* 健康度进度条 */}
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">健康度</span>
                      <span className={`text-xs font-medium ${healthColor(p.healthScore)}`}>
                        {p.healthScore !== null ? `${p.healthScore}分` : '未评估'}
                      </span>
                    </div>
                    {p.healthScore !== null && (
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                        <div
                          className={`h-1.5 rounded-full transition-all ${healthBarColor(p.healthScore)}`}
                          style={{ width: `${Math.min(p.healthScore, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                {/* 右: 注册信息 */}
                <div className="text-right ml-4 min-w-[120px] shrink-0">
                  <p className="text-xs text-gray-400">
                    注册: {p.registeredAt.slice(0, 10)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    更新: {p.updatedAt.slice(0, 10)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
