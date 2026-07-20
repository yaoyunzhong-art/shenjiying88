'use client'

import { useState, useMemo } from 'react'

interface GeoRow {
  id: string; city: string; district: string; landmark: string; lat: number; lng: number; radiusKm: number
}
const MOCK_ROWS: GeoRow[] = [
  { id: 'G1', city: '上海', district: '徐汇', landmark: '徐家汇', lat: 31.19, lng: 121.44, radiusKm: 3 },
  { id: 'G2', city: '上海', district: '浦东', landmark: '陆家嘴', lat: 31.24, lng: 121.51, radiusKm: 3 },
  { id: 'G3', city: '北京', district: '朝阳', landmark: '三里屯', lat: 39.93, lng: 116.45, radiusKm: 2 },
  { id: 'G4', city: '深圳', district: '南山', landmark: '海岸城', lat: 22.52, lng: 113.94, radiusKm: 2 },
  { id: 'G5', city: '成都', district: '锦江', landmark: '春熙路', lat: 30.66, lng: 104.08, radiusKm: 2 },
]

export default function GeoLocationsPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rows] = useState(MOCK_ROWS)
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState<string>('ALL')

  if (loading) return <div>加载中...</div>
  if (error) return <div>数据获取失败: {error}</div>
  if (!rows || rows.length === 0) return <div>暂无数据</div>

  const cities = useMemo(() => [...new Set(rows.map(r => r.city))].sort(), [rows])

  const filtered = useMemo(() => {
    let items = [...rows]
    if (cityFilter !== 'ALL') items = items.filter(r => r.city === cityFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(r =>
        r.landmark.toLowerCase().includes(q) || r.district.toLowerCase().includes(q) || r.city.toLowerCase().includes(q))
    }
    return items
  }, [rows, search, cityFilter])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">GEO 地域标签</h1>
      <p className="text-sm text-gray-500 mb-4">城市 / 商圈 / 地标地理营销数据 ({rows.length} 条)</p>

      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <input placeholder="搜索城市/商圈/地标..." value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] border rounded px-3 py-1.5 text-sm" />
        <select value={cityFilter} onChange={e => setCityFilter(e.target.value)}
          className="border rounded px-2 py-1.5 text-sm">
          <option value="ALL">全部城市</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr><th>城市</th><th>区域</th><th>地标</th><th>纬度</th><th>经度</th><th>半径(km)</th></tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 font-medium">{r.city}</td>
                <td className="px-3 py-2">{r.district}</td>
                <td className="px-3 py-2">{r.landmark}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.lat.toFixed(4)}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.lng.toFixed(4)}</td>
                <td className="px-3 py-2">{r.radiusKm}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
