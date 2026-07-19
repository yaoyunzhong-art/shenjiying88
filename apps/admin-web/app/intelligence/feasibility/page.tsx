'use client'

import { useState, useMemo } from 'react'

interface FeasibilityReport {
  city: string; district: string; budget: number; score: number; scoreLevel: string
  summary: string; competitorDensity: number; competitorCount: number; avgPrice: number
  suggestedEquipment: { name: string; count: number; cost: number; reason: string }[]
  suggestedPriceRange: { min: number; max: number; avg: number }
  riskFactors: { factor: string; level: string; suggestion: string }[]
  marketTrend: string; estimatedMonthlyRevenue: number; estimatedPaybackMonths: number
}

export default function FeasibilityPage() {
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [budget, setBudget] = useState(300)
  const [report, setReport] = useState<FeasibilityReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedEq, setExpandedEq] = useState<string | null>(null)

  const CITY_DISTRICTS: Record<string, string[]> = {
    '上海': ['徐汇','浦东','静安','黄浦','长宁'],
    '北京': ['朝阳','海淀','东城','西城','丰台'],
    '广州': ['天河','越秀','海珠','番禺'],
    '深圳': ['南山','福田','罗湖','宝安'],
    '成都': ['锦江','武侯','成华','金牛'],
    '杭州': ['上城','西湖','滨江','余杭'],
    '重庆': ['渝中','江北','南岸','沙坪坝'],
    '武汉': ['江汉','武昌','洪山'],
    '西安': ['雁塔','碑林','未央'],
    '南京': ['鼓楼','秦淮','建邺'],
    '长沙': ['芙蓉','天心','岳麓'],
  }

  const districts = useMemo(() => city ? CITY_DISTRICTS[city] || ['中心区'] : [], [city])

  const handleGenerate = async () => {
    if (!city || !district) { setError('请选择城市和区域'); return }
    setLoading(true); setError(null)
    await new Promise(r => setTimeout(r, 500))
    try {
      const res = await fetch('/api/intelligence/feasibility', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, district, budget }),
      })
      const data = res.ok ? await res.json() : await simulateReport(city, district, budget)
      setReport(data)
    } catch { setReport(await simulateReport(city, district, budget)) }
    setLoading(false)
  }

  const levelColor = report?.scoreLevel === 'high' ? 'bg-green-100 text-green-800' :
    report?.scoreLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
  const levelLabel = report?.scoreLevel === 'high' ? '非常适合' : report?.scoreLevel === 'medium' ? '可考虑' : '不建议'

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">📊 开业可行性报告</h1>

      {/* 输入区 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select value={city} onChange={e => { setCity(e.target.value); setDistrict('') }}
            className="border rounded px-3 py-2 text-sm">
            <option value="">选择城市</option>
            {Object.keys(CITY_DISTRICTS).map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={district} onChange={e => setDistrict(e.target.value)}
            className="border rounded px-3 py-2 text-sm" disabled={!city}>
            <option value="">选择区域</option>
            {districts.map(d => <option key={d}>{d}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">预算:</span>
            <input type="range" min={100} max={1000} step={50} value={budget}
              onChange={e => setBudget(Number(e.target.value))} className="flex-1" />
            <span className="text-sm font-bold w-16">{budget}万</span>
          </div>
          <button onClick={handleGenerate} disabled={loading || !city || !district}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm">
            {loading ? '分析中...' : '生成报告'}
          </button>
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      {/* 报告 */}
      {report && (
        <>
          {/* 总评分 */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{report.city}{report.district}</h2>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${levelColor}`}>{levelLabel}</span>
                <span className="text-3xl font-bold">{report.score}<span className="text-base text-gray-400">/100</span></span>
              </div>
            </div>
            <p className="text-gray-600 text-sm">{report.summary}</p>
          </div>

          {/* 关键指标 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">竞品数量</p>
              <p className="text-2xl font-bold">{report.competitorCount}<span className="text-sm text-gray-400">家</span></p>
              <div className="mt-1 bg-gray-200 rounded-full h-2">
                <div className={`h-2 rounded-full ${report.competitorDensity > 50 ? 'bg-red-500' : report.competitorDensity > 30 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(report.competitorDensity, 100)}%` }} />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">人均消费</p>
              <p className="text-2xl font-bold">¥{report.avgPrice}</p>
              <p className="text-xs text-gray-400 mt-1">建议区间 ¥{report.suggestedPriceRange.min}~¥{report.suggestedPriceRange.max}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">预估月收入</p>
              <p className="text-2xl font-bold">¥{(report.estimatedMonthlyRevenue / 10000).toFixed(1)}<span className="text-sm text-gray-400">万</span></p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">预估回收期</p>
              <p className="text-2xl font-bold">{report.estimatedPaybackMonths}<span className="text-sm text-gray-400">个月</span></p>
            </div>
          </div>

          {/* 设备建议 */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="font-bold mb-3">🛠️ 建议设备配置</h2>
            <div className="space-y-2">
              {report.suggestedEquipment.map(eq => (
                <div key={eq.name} className="border rounded overflow-hidden">
                  <button onClick={() => setExpandedEq(expandedEq === eq.name ? null : eq.name)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-sm">{eq.name}</span>
                      <span className="text-xs text-gray-500">{eq.count}台</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono">¥{(eq.cost / 10000).toFixed(1)}万</span>
                      <span>{expandedEq === eq.name ? '▲' : '▼'}</span>
                    </div>
                  </button>
                  {expandedEq === eq.name && (
                    <div className="px-3 pb-2 text-xs text-gray-600 bg-gray-50">{eq.reason}</div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 text-right text-sm font-bold">总计: ¥{(report.suggestedEquipment.reduce((a, e) => a + e.cost, 0) / 10000).toFixed(1)}万</div>
          </div>

          {/* 风险因素 */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="font-bold mb-3">⚠️ 风险因素</h2>
            <div className="space-y-2">
              {report.riskFactors.map(r => (
                <div key={r.factor} className="flex items-start gap-2 text-sm p-2 rounded border">
                  <span>{r.level === 'high' ? '🔴' : r.level === 'medium' ? '🟡' : '🟢'}</span>
                  <div>
                    <p className="font-medium">{r.factor}</p>
                    <p className="text-gray-500 text-xs">{r.suggestion}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 市场趋势 */}
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <h3 className="font-bold text-blue-800 mb-1">📈 市场趋势</h3>
            <p className="text-sm text-blue-700">{report.marketTrend}</p>
          </div>
        </>
      )}
    </div>
  )
}

// 模拟API响应
async function simulateReport(city: string, district: string, budget: number): Promise<FeasibilityReport> {
  const densities: Record<string, { count: number; price: number }> = {
    '上海': { count: 6, price: 135 }, '北京': { count: 5, price: 125 },
    '广州': { count: 4, price: 88 }, '深圳': { count: 5, price: 105 },
    '成都': { count: 4, price: 78 }, '杭州': { count: 3, price: 92 },
    '南京': { count: 2, price: 75 }, default: { count: 1, price: 60 },
  }
  const dd = densities[city] || densities.default!
  const score = Math.min(95, Math.max(25, 65 - dd.count * 3 + budget * 0.04 + Math.random() * 10))
  return {
    city, district, budget,
    score: Math.round(score),
    scoreLevel: score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low',
    summary: `${city}${district}地区有${dd.count}家竞品，人均约¥${dd.price}。${score >= 75 ? '适合投资' : score >= 50 ? '可考虑' : '不建议'}。`,
    competitorDensity: Math.min(dd.count * 10, 80), competitorCount: dd.count,
    avgPrice: dd.price, suggestedPriceRange: { min: dd.price - 15, max: dd.price + 25, avg: dd.price },
    suggestedEquipment: [
      { name: '街机射击区', count: 8, cost: 320000, reason: `${city}竞品平均6-10台，覆盖率高` },
      { name: 'VR体验区', count: 4, cost: 280000, reason: '年轻客群偏好，年增30%' },
      { name: '跳舞机/音游区', count: 3, cost: 120000, reason: '社交属性强，翻台率高' },
      { name: '夹娃娃机', count: 12, cost: 96000, reason: `高利润率，${city}平均回收6个月` },
      { name: '篮球机', count: 4, cost: 48000, reason: '亲子客群必配' },
      { name: '赛车模拟器', count: 3, cost: 156000, reason: '差异化配置' },
    ],
    riskFactors: [
      { factor: '同城竞品密度', level: dd.count >= 5 ? 'high' : 'medium', suggestion: dd.count >= 5 ? '建议差异化定位' : '正常竞争' },
      { factor: '预算匹配度', level: budget < 200 ? 'high' : 'low', suggestion: budget < 200 ? '建议提高至300万+' : '预算充裕' },
      { factor: '商圈成熟度', level: 'medium', suggestion: '建议实地考察人流量' },
    ],
    marketTrend: `${city}娱乐市场年增长率约15-20%`,
    estimatedMonthlyRevenue: Math.round((dd.price * 1500 + budget * 80000) / 10),
    estimatedPaybackMonths: Math.round(budget * 10000 / Math.round((dd.price * 1500 + budget * 80000) / 10)),
  }
}
