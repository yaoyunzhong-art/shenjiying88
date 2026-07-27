'use client'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type {
  BudgetComparisonRow,
  FeasibilityRequest,
  FeasibilitySnapshotDelivery,
  RenovationTier,
} from './feasibility-data'

function levelColor(level: 'high' | 'medium' | 'low'): string {
  return level === 'high'
    ? 'bg-green-100 text-green-800'
    : level === 'medium'
      ? 'bg-yellow-100 text-yellow-800'
      : 'bg-red-100 text-red-800'
}

function levelLabel(level: 'high' | 'medium' | 'low'): string {
  return level === 'high' ? '非常适合' : level === 'medium' ? '可考虑' : '不建议'
}

function BudgetComparisonTable({
  rows,
  baseBudget,
}: {
  rows: BudgetComparisonRow[]
  baseBudget: number
}) {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h2 className="font-bold mb-3">📊 预算对比分析</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border text-left">预算</th>
              {rows.map((row) => (
                <th key={row.budget} className={`p-2 border text-right ${row.budget === baseBudget ? 'bg-blue-50' : ''}`}>
                  {row.budget}万{row.budget === baseBudget ? ' ←当前' : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-2 border font-medium">可行性评分</td>
              {rows.map((row) => (
                <td key={row.budget} className={`p-2 border text-right font-mono ${row.budget === baseBudget ? 'bg-blue-50' : ''}`}>
                  {row.score}/100
                </td>
              ))}
            </tr>
            <tr className="border-b">
              <td className="p-2 border font-medium">预估月收入</td>
              {rows.map((row) => (
                <td key={row.budget} className={`p-2 border text-right font-mono ${row.budget === baseBudget ? 'bg-blue-50' : ''}`}>
                  ¥{(row.revenue / 10000).toFixed(1)}万
                </td>
              ))}
            </tr>
            <tr className="border-b">
              <td className="p-2 border font-medium">回收期</td>
              {rows.map((row) => (
                <td key={row.budget} className={`p-2 border text-right font-mono ${row.budget === baseBudget ? 'bg-blue-50' : ''}`}>
                  {row.payback >= 999 ? '∞' : `${row.payback}月`}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function FeasibilityClient({
  snapshot,
}: {
  snapshot: FeasibilitySnapshotDelivery
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [city, setCity] = useState(snapshot.request.city)
  const [district, setDistrict] = useState(snapshot.request.district)
  const [budget, setBudget] = useState(snapshot.request.budget)
  const [area, setArea] = useState(snapshot.request.area)
  const [tier, setTier] = useState<RenovationTier>(snapshot.request.tier)
  const [expandedEq, setExpandedEq] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setCity(snapshot.request.city)
    setDistrict(snapshot.request.district)
    setBudget(snapshot.request.budget)
    setArea(snapshot.request.area)
    setTier(snapshot.request.tier)
    setError(null)
  }, [snapshot.request])

  const districts = useMemo(() => (city ? snapshot.cityDistricts[city] ?? ['中心区'] : []), [city, snapshot.cityDistricts])

  const pushRequest = useCallback(
    (next: Partial<FeasibilityRequest>) => {
      const nextRequest: FeasibilityRequest = {
        city,
        district,
        budget,
        area,
        tier,
        tab: 'report',
        ...next,
      }

      if (!nextRequest.city || !nextRequest.district) {
        setError('请选择城市和区域')
        return
      }

      const params = new URLSearchParams()
      params.set('city', nextRequest.city)
      params.set('district', nextRequest.district)
      params.set('budget', String(nextRequest.budget))
      params.set('area', String(nextRequest.area))
      params.set('tier', nextRequest.tier)
      if (nextRequest.tab === 'finance') {
        params.set('tab', 'finance')
      }

      setError(null)
      router.replace(`${pathname}?${params.toString()}`)
      handleRefresh()
    },
    [area, budget, city, district, pathname, router, tier, handleRefresh]
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">📊 开业可行性报告</h1>
          <p className="text-sm text-gray-500">选址评估 · 设备建议 · 财务全景 · 预算对比</p>
        </div>
        <button
          type="button"
          onClick={() => handleRefresh()}
          disabled={isRefreshing}
          className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-60"
        >
          {isRefreshing ? '刷新中...' : '刷新'}
        </button>
      </div>

      {snapshot.error ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
          {snapshot.error}
        </div>
      ) : null}
      {error ? <p className="text-red-500 text-sm">{error}</p> : null}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <select
            value={city}
            onChange={(event) => {
              const nextCity = event.target.value
              const nextDistricts = snapshot.cityDistricts[nextCity] ?? ['中心区']
              setCity(nextCity)
              setDistrict(nextDistricts[0] ?? '')
            }}
            className="border rounded px-3 py-2 text-sm"
          >
            {Object.keys(snapshot.cityDistricts).map((cityName) => (
              <option key={cityName} value={cityName}>
                {cityName}
              </option>
            ))}
          </select>
          <select
            value={district}
            onChange={(event) => setDistrict(event.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            {districts.map((districtName) => (
              <option key={districtName} value={districtName}>
                {districtName}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 shrink-0">预算:</span>
            <input
              type="range"
              min={100}
              max={1000}
              step={50}
              value={budget}
              onChange={(event) => setBudget(Number(event.target.value))}
              className="flex-1"
            />
            <span className="text-sm font-bold w-16">{budget}万</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 shrink-0">面积:</span>
            <input
              type="number"
              min={50}
              max={5000}
              step={50}
              value={area}
              onChange={(event) => setArea(Number(event.target.value))}
              className="border rounded px-2 py-1 w-full text-sm"
            />
          </div>
          <select
            value={tier}
            onChange={(event) => setTier(event.target.value as RenovationTier)}
            className="border rounded px-2 py-2 text-sm"
          >
            <option value="economy">经济 (600元/㎡)</option>
            <option value="standard">标准 (1200元/㎡)</option>
            <option value="luxury">豪华 (3500元/㎡)</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <button
            type="button"
            onClick={() => pushRequest({ tab: 'report' })}
            disabled={isRefreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {isRefreshing ? '分析中...' : '生成报告'}
          </button>
          <button
            type="button"
            onClick={() => pushRequest({ tab: 'finance' })}
            disabled={isRefreshing}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
          >
            {isRefreshing ? '计算中...' : '计算财务全景'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4 gap-4">
          <h2 className="text-lg font-bold">
            {snapshot.report.city}
            {snapshot.report.district}
          </h2>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${levelColor(snapshot.report.scoreLevel)}`}>
              {levelLabel(snapshot.report.scoreLevel)}
            </span>
            <span className="text-3xl font-bold">
              {snapshot.report.score}
              <span className="text-base text-gray-400">/100</span>
            </span>
          </div>
        </div>
        <p className="text-gray-600 text-sm">{snapshot.report.summary}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">竞品数量</p>
          <p className="text-2xl font-bold">
            {snapshot.report.competitorCount}
            <span className="text-sm text-gray-400">家</span>
          </p>
          <div className="mt-1 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                snapshot.report.competitorDensity > 50
                  ? 'bg-red-500'
                  : snapshot.report.competitorDensity > 30
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(snapshot.report.competitorDensity, 100)}%` }}
            />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">人均消费</p>
          <p className="text-2xl font-bold">¥{snapshot.report.avgPrice}</p>
          <p className="text-xs text-gray-400 mt-1">
            建议区间 ¥{snapshot.report.suggestedPriceRange.min}~¥{snapshot.report.suggestedPriceRange.max}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">预估月收入</p>
          <p className="text-2xl font-bold">
            ¥{(snapshot.report.estimatedMonthlyRevenue / 10000).toFixed(1)}
            <span className="text-sm text-gray-400">万</span>
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">预估回收期</p>
          <p className="text-2xl font-bold">
            {snapshot.report.estimatedPaybackMonths}
            <span className="text-sm text-gray-400">个月</span>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="font-bold mb-3">🛠️ 建议设备配置</h2>
        <div className="space-y-2">
          {snapshot.report.suggestedEquipment.map((equipment) => (
            <div key={equipment.name} className="border rounded overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedEq(expandedEq === equipment.name ? null : equipment.name)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm">{equipment.name}</span>
                  <span className="text-xs text-gray-500">{equipment.count}台</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono">¥{(equipment.cost / 10000).toFixed(1)}万</span>
                  <span>{expandedEq === equipment.name ? '▲' : '▼'}</span>
                </div>
              </button>
              {expandedEq === equipment.name ? (
                <div className="px-3 pb-2 text-xs text-gray-600 bg-gray-50">{equipment.reason}</div>
              ) : null}
            </div>
          ))}
        </div>
        <div className="mt-3 text-right text-sm font-bold">
          总计: ¥
          {(snapshot.report.suggestedEquipment.reduce((sum, equipment) => sum + equipment.cost, 0) / 10000).toFixed(1)}
          万
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="font-bold mb-3">⚠️ 风险因素</h2>
        <div className="space-y-2">
          {snapshot.report.riskFactors.map((risk) => (
            <div key={risk.factor} className="flex items-start gap-2 text-sm p-2 rounded border">
              <span>{risk.level === 'high' ? '🔴' : risk.level === 'medium' ? '🟡' : '🟢'}</span>
              <div>
                <p className="font-medium">{risk.factor}</p>
                <p className="text-gray-500 text-xs">{risk.suggestion}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded p-4">
        <h3 className="font-bold text-blue-800 mb-1">📈 市场趋势</h3>
        <p className="text-sm text-blue-700">{snapshot.report.marketTrend}</p>
      </div>

      <BudgetComparisonTable rows={snapshot.budgetComparison} baseBudget={snapshot.request.budget} />

      <div className={`bg-white rounded-lg shadow p-6 ${snapshot.request.tab === 'finance' ? 'ring-2 ring-green-200' : ''}`}>
        <h2 className="text-lg font-bold mb-4">💰 财务全景表 (P-50 V2)</h2>

        <h3 className="font-bold text-gray-700 mb-2">📋 首期投入</h3>
        <table className="w-full text-sm mb-4 border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-2 border">项目</th>
              <th className="text-right p-2 border">金额(元)</th>
              <th className="text-right p-2 border">占比</th>
            </tr>
          </thead>
          <tbody>
            {[
              { label: '设备成本', value: snapshot.finance.initialInvestment.equipmentCost },
              { label: '装修成本', value: snapshot.finance.initialInvestment.renovationCost },
              { label: '系统软件', value: snapshot.finance.initialInvestment.softwareSystemCost },
              { label: '押金(3月)', value: snapshot.finance.initialInvestment.deposit },
            ].map((item) => (
              <tr key={item.label} className="border-b">
                <td className="p-2 border">{item.label}</td>
                <td className="text-right p-2 border font-mono">¥{item.value.toLocaleString()}</td>
                <td className="text-right p-2 border">{((item.value / snapshot.finance.initialInvestment.total) * 100).toFixed(1)}%</td>
              </tr>
            ))}
            <tr className="bg-green-50 font-bold">
              <td className="p-2 border">合计</td>
              <td className="text-right p-2 border font-mono">¥{snapshot.finance.initialInvestment.total.toLocaleString()}</td>
              <td className="text-right p-2 border">100%</td>
            </tr>
          </tbody>
        </table>

        <h3 className="font-bold text-gray-700 mb-2 mt-4">📋 月成本（元）</h3>
        <table className="w-full text-sm mb-4 border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-2 border">项目</th>
              <th className="text-right p-2 border">金额(元)</th>
            </tr>
          </thead>
          <tbody>
            {[
              { label: '租金', value: snapshot.finance.monthlyFixedCost.rent },
              { label: '人力', value: snapshot.finance.monthlyFixedCost.labor },
              { label: '设备维护', value: snapshot.finance.monthlyFixedCost.equipmentMaintenance },
              { label: '系统订阅', value: snapshot.finance.monthlyFixedCost.systemSubscription },
              { label: '小计(固定)', value: snapshot.finance.monthlyFixedCost.total },
              { label: '电费', value: snapshot.finance.monthlyVariableCost.electricity },
              { label: '耗材', value: snapshot.finance.monthlyVariableCost.consumables },
              { label: '营销推广', value: snapshot.finance.monthlyVariableCost.marketing },
              { label: '小计(变动)', value: snapshot.finance.monthlyVariableCost.total },
            ].map((item) => (
              <tr key={item.label} className={`border-b ${item.label.startsWith('小计') ? 'bg-gray-50 font-bold' : ''}`}>
                <td className="p-2 border">{item.label}</td>
                <td className="text-right p-2 border font-mono">¥{item.value.toLocaleString()}</td>
              </tr>
            ))}
            <tr className="bg-red-50 font-bold">
              <td className="p-2 border">月总成本</td>
              <td className="text-right p-2 border font-mono">¥{snapshot.finance.monthlyTotalCost.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <h3 className="font-bold text-gray-700 mb-2 mt-4">📋 营收预估</h3>
        <table className="w-full text-sm mb-4 border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-2 border">项目</th>
              <th className="text-right p-2 border">数值</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-2 border">预估客单价</td>
              <td className="text-right p-2 border font-mono">¥{snapshot.finance.revenueEstimate.avgTicketPrice}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 border">预估日客流</td>
              <td className="text-right p-2 border font-mono">{snapshot.finance.revenueEstimate.estimatedDailyTraffic}人</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 border">预估月营收</td>
              <td className="text-right p-2 border font-mono">¥{snapshot.finance.revenueEstimate.estimatedMonthlyRevenue.toLocaleString()}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 border">预估月利润</td>
              <td
                className={`text-right p-2 border font-mono ${
                  snapshot.finance.revenueEstimate.estimatedMonthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                ¥{snapshot.finance.revenueEstimate.estimatedMonthlyProfit.toLocaleString()}
              </td>
            </tr>
            <tr className="border-b">
              <td className="p-2 border">月折旧(设备3年)</td>
              <td className="text-right p-2 border font-mono">¥{snapshot.finance.monthlyDepreciation.toLocaleString()}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 border">月摊销(装修5年)</td>
              <td className="text-right p-2 border font-mono">¥{snapshot.finance.monthlyAmortization.toLocaleString()}</td>
            </tr>
            <tr className="bg-green-50 font-bold">
              <td className="p-2 border">简单回收期</td>
              <td className="text-right p-2 border font-mono">
                {snapshot.finance.paybackMonths >= 999 ? '∞' : `${snapshot.finance.paybackMonths}个月 (约${(snapshot.finance.paybackMonths / 12).toFixed(1)}年)`}
              </td>
            </tr>
            <tr className="bg-yellow-50">
              <td className="p-2 border">含折旧回收期</td>
              <td className="text-right p-2 border font-mono">
                {snapshot.finance.paybackWithDepreciation >= 999 ? '∞' : `${snapshot.finance.paybackWithDepreciation}个月 (约${(snapshot.finance.paybackWithDepreciation / 12).toFixed(1)}年)`}
              </td>
            </tr>
          </tbody>
        </table>

        <h3 className="font-bold text-gray-700 mb-2 mt-4">📊 同城平均值对比</h3>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-2 border">指标</th>
              <th className="text-right p-2 border">本项目</th>
              <th className="text-right p-2 border">同城平均</th>
              <th className="text-right p-2 border">差异</th>
            </tr>
          </thead>
          <tbody>
            {[
              {
                label: '首期投入',
                ours: snapshot.finance.initialInvestment.total,
                avg: snapshot.finance.cityAvgComparison.initialInvestment,
                higher: false,
              },
              {
                label: '月固定成本',
                ours: snapshot.finance.monthlyFixedCost.total,
                avg: snapshot.finance.cityAvgComparison.monthlyFixedCost,
                higher: false,
              },
              {
                label: '月营收',
                ours: snapshot.finance.revenueEstimate.estimatedMonthlyRevenue,
                avg: snapshot.finance.cityAvgComparison.monthlyRevenue,
                higher: true,
              },
              {
                label: '回收期(月)',
                ours: snapshot.finance.paybackMonths,
                avg: snapshot.finance.cityAvgComparison.paybackMonths,
                higher: false,
              },
            ].map((item) => {
              const diff = item.ours - item.avg
              const pct = item.avg > 0 ? ((diff / item.avg) * 100).toFixed(1) : '0.0'
              const isBetter = item.higher ? diff >= 0 : diff <= 0

              return (
                <tr key={item.label} className="border-b">
                  <td className="p-2 border">{item.label}</td>
                  <td className="text-right p-2 border font-mono">¥{item.ours.toLocaleString()}</td>
                  <td className="text-right p-2 border font-mono text-gray-500">¥{item.avg.toLocaleString()}</td>
                  <td className={`text-right p-2 border font-mono ${isBetter ? 'text-green-600' : 'text-red-600'}`}>
                    {diff > 0 ? '+' : ''}
                    {diff.toLocaleString()} ({pct}%)
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
