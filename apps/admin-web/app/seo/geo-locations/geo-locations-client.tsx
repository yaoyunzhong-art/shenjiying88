'use client'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

import { useCallback, useMemo, useState, useTransition } from 'react'

import type { GeoLocationsSnapshotDelivery } from './geo-locations-data'

export default function GeoLocationsClient({
  snapshot,
}: {
  snapshot: GeoLocationsSnapshotDelivery
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState<string>('ALL')

  const cities = useMemo(
    () => [...new Set(snapshot.rows.map((row) => row.city))].sort((left, right) => left.localeCompare(right)),
    [snapshot.rows]
  )

  const filtered = useMemo(() => {
    let items = [...snapshot.rows]
    if (cityFilter !== 'ALL') {
      items = items.filter((row) => row.city === cityFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(
        (row) =>
          row.city.toLowerCase().includes(q) ||
          row.district.toLowerCase().includes(q) ||
          row.landmark.toLowerCase().includes(q)
      )
    }
    return items
  }, [cityFilter, search, snapshot.rows])

  const refreshSnapshot = useCallback(() => { handleRefresh() }, [handleRefresh])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">GEO 地域标签</h1>
          <p className="mt-1 text-sm text-slate-500">
            tenant {snapshot.tenantId} / 覆盖 {snapshot.cityCount} 个城市，{snapshot.totalRows} 条地域快照 /
            generatedAt {snapshot.generatedAt}
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
          <div className="text-xs text-slate-500">覆盖城市</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{snapshot.cityCount}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">核心圈层</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {snapshot.rows.filter((row) => row.coverageTier === 'core').length}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">拓展圈层</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {snapshot.rows.filter((row) => row.coverageTier === 'growth').length}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center gap-2">
          <input
            placeholder="搜索城市/商圈/地标..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="min-w-[240px] flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={cityFilter}
            onChange={(event) => setCityFilter(event.target.value)}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="ALL">全部城市</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2 text-left">城市</th>
              <th className="px-3 py-2 text-left">区域</th>
              <th className="px-3 py-2 text-left">地标</th>
              <th className="px-3 py-2 text-left">纬度</th>
              <th className="px-3 py-2 text-left">经度</th>
              <th className="px-3 py-2 text-left">半径(km)</th>
              <th className="px-3 py-2 text-left">圈层</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-t border-slate-200 hover:bg-slate-50">
                <td className="px-3 py-2 font-medium text-slate-900">{row.city}</td>
                <td className="px-3 py-2">{row.district}</td>
                <td className="px-3 py-2">{row.landmark}</td>
                <td className="px-3 py-2 font-mono text-xs">{row.lat.toFixed(4)}</td>
                <td className="px-3 py-2 font-mono text-xs">{row.lng.toFixed(4)}</td>
                <td className="px-3 py-2">{row.radiusKm}</td>
                <td className="px-3 py-2">{row.coverageTier === 'core' ? '核心' : '拓展'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
