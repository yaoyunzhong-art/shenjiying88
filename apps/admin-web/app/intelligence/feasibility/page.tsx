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

interface FinancePanorama {
  budget: number; area: number
  initialInvestment: { equipmentCost: number; renovationCost: number; softwareSystemCost: number; deposit: number; total: number }
  monthlyFixedCost: { rent: number; labor: number; equipmentMaintenance: number; systemSubscription: number; total: number }
  monthlyVariableCost: { electricity: number; consumables: number; marketing: number; total: number }
  monthlyTotalCost: number
  revenueEstimate: { avgTicketPrice: number; estimatedDailyTraffic: number; estimatedMonthlyRevenue: number; estimatedMonthlyProfit: number }
  monthlyDepreciation: number; monthlyAmortization: number
  paybackMonths: number; paybackWithDepreciation: number
  cityAvgComparison: { initialInvestment: number; monthlyFixedCost: number; monthlyRevenue: number; paybackMonths: number }
}

export default function FeasibilityPage() {
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [budget, setBudget] = useState(300)
  const [area, setArea] = useState(400)
  const [tier, setTier] = useState<'luxury' | 'standard' | 'economy'>('standard')
  const [report, setReport] = useState<FeasibilityReport | null>(null)
  const [finance, setFinance] = useState<FinancePanorama | null>(null)
  const [loading, setLoading] = useState(false)
  const [financeLoading, setFinanceLoading] = useState(false)
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

  const handleFinancePanorama = async () => {
    if (!city || !district) { setError('请选择城市和区域'); return }
    setFinanceLoading(true)
    try {
      const res = await fetch('/api/intelligence/finance-panorama', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budget, area, tier, city, district }),
      })
      const data = res.ok ? await res.json() : await simulateFinance(city, district, budget, area, tier)
      setFinance(data)
    } catch { setFinance(await simulateFinance(city, district, budget, area, tier)) }
    setFinanceLoading(false)
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
          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
            <h3 className="font-bold text-blue-800 mb-1">📈 市场趋势</h3>
            <p className="text-sm text-blue-700">{report.marketTrend}</p>
          </div>

          <BudgetComparison city={city} district={district} baseBudget={budget} tier={tier} />

          {/* 财务全景表 */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-bold mb-4">💰 财务全景表 (P-50 V2)</h2>

            {/* 参数输入 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 bg-gray-50 p-3 rounded">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">面积:</span>
                <input type="number" min={50} max={5000} step={50} value={area}
                  onChange={e => setArea(Number(e.target.value))}
                  className="border rounded px-2 py-1 w-24 text-sm" />
                <span className="text-xs text-gray-400">㎡</span>
              </div>
              <div>
                <select value={tier} onChange={e => setTier(e.target.value as any)}
                  className="border rounded px-2 py-1 text-sm w-full">
                  <option value="economy">经济 (600元/㎡)</option>
                  <option value="standard">标准 (1200元/㎡)</option>
                  <option value="luxury">豪华 (3500元/㎡)</option>
                </select>
              </div>
              <button onClick={handleFinancePanorama} disabled={!city || !district || financeLoading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm">
                {financeLoading ? '计算中...' : '计算财务全景'}
              </button>
            </div>

            {finance && (
              <>
                {/* 首期投入 */}
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
                      { label: '设备成本', value: finance.initialInvestment.equipmentCost },
                      { label: '装修成本', value: finance.initialInvestment.renovationCost },
                      { label: '系统软件', value: finance.initialInvestment.softwareSystemCost },
                      { label: '押金(3月)', value: finance.initialInvestment.deposit },
                    ].map(item => (
                      <tr key={item.label} className="border-b">
                        <td className="p-2 border">{item.label}</td>
                        <td className="text-right p-2 border font-mono">¥{item.value.toLocaleString()}</td>
                        <td className="text-right p-2 border">{(item.value / finance.initialInvestment.total * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                    <tr className="bg-green-50 font-bold">
                      <td className="p-2 border">合计</td>
                      <td className="text-right p-2 border font-mono">¥{finance.initialInvestment.total.toLocaleString()}</td>
                      <td className="text-right p-2 border">100%</td>
                    </tr>
                  </tbody>
                </table>

                {/* 月成本 */}
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
                      { label: '租金', value: finance.monthlyFixedCost.rent, fixed: true },
                      { label: '人力', value: finance.monthlyFixedCost.labor, fixed: true },
                      { label: '设备维护', value: finance.monthlyFixedCost.equipmentMaintenance, fixed: true },
                      { label: '系统订阅', value: finance.monthlyFixedCost.systemSubscription, fixed: true },
                      { label: '小计(固定)', value: finance.monthlyFixedCost.total, fixed: true },
                      { label: '电费', value: finance.monthlyVariableCost.electricity, fixed: false },
                      { label: '耗材', value: finance.monthlyVariableCost.consumables, fixed: false },
                      { label: '营销推广', value: finance.monthlyVariableCost.marketing, fixed: false },
                      { label: '小计(变动)', value: finance.monthlyVariableCost.total, fixed: false },
                    ].map((item, idx) => (
                      <tr key={idx} className={`border-b ${item.label.startsWith('小计') ? 'bg-gray-50 font-bold' : ''}`}>
                        <td className="p-2 border">{item.label}</td>
                        <td className="text-right p-2 border font-mono">¥{item.value.toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className="bg-red-50 font-bold">
                      <td className="p-2 border">月总成本</td>
                      <td className="text-right p-2 border font-mono">¥{finance.monthlyTotalCost.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>

                {/* 营收与回收 */}
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
                      <td className="text-right p-2 border font-mono">¥{finance.revenueEstimate.avgTicketPrice}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 border">预估日客流</td>
                      <td className="text-right p-2 border font-mono">{finance.revenueEstimate.estimatedDailyTraffic}人</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 border">预估月营收</td>
                      <td className="text-right p-2 border font-mono">¥{finance.revenueEstimate.estimatedMonthlyRevenue.toLocaleString()}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 border">预估月利润</td>
                      <td className={`text-right p-2 border font-mono ${finance.revenueEstimate.estimatedMonthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ¥{finance.revenueEstimate.estimatedMonthlyProfit.toLocaleString()}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 border">月折旧(设备3年)</td>
                      <td className="text-right p-2 border font-mono">¥{finance.monthlyDepreciation.toLocaleString()}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 border">月摊销(装修5年)</td>
                      <td className="text-right p-2 border font-mono">¥{finance.monthlyAmortization.toLocaleString()}</td>
                    </tr>
                    <tr className="bg-green-50 font-bold">
                      <td className="p-2 border">简单回收期</td>
                      <td className="text-right p-2 border font-mono">
                        {finance.paybackMonths >= 999 ? '∞' : `${finance.paybackMonths}个月 (约${(finance.paybackMonths / 12).toFixed(1)}年)`}
                      </td>
                    </tr>
                    <tr className="bg-yellow-50">
                      <td className="p-2 border">含折旧回收期</td>
                      <td className="text-right p-2 border font-mono">
                        {finance.paybackWithDepreciation >= 999 ? '∞' : `${finance.paybackWithDepreciation}个月 (约${(finance.paybackWithDepreciation / 12).toFixed(1)}年)`}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* 同城对比 */}
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
                      { label: '首期投入', ours: finance.initialInvestment.total, avg: finance.cityAvgComparison.initialInvestment, higher: false },
                      { label: '月固定成本', ours: finance.monthlyFixedCost.total, avg: finance.cityAvgComparison.monthlyFixedCost, higher: false },
                      { label: '月营收', ours: finance.revenueEstimate.estimatedMonthlyRevenue, avg: finance.cityAvgComparison.monthlyRevenue, higher: true },
                      { label: '回收期(月)', ours: finance.paybackMonths, avg: finance.cityAvgComparison.paybackMonths, higher: true },
                    ].map(item => {
                      const diff = item.ours - item.avg
                      const pct = item.avg > 0 ? ((diff / item.avg) * 100).toFixed(1) : '0.0'
                      const isBetter = item.higher ? diff >= 0 : diff <= 0
                      return (
                        <tr key={item.label} className="border-b">
                          <td className="p-2 border">{item.label}</td>
                          <td className="text-right p-2 border font-mono">¥{item.ours.toLocaleString()}</td>
                          <td className="text-right p-2 border font-mono text-gray-500">¥{item.avg.toLocaleString()}</td>
                          <td className={`text-right p-2 border font-mono ${isBetter ? 'text-green-600' : 'text-red-600'}`}>
                            {diff > 0 ? '+' : ''}{diff.toLocaleString()} ({pct}%)
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </>
            )}
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

// 模拟财务全景
async function simulateFinance(city: string, district: string, budget: number, area: number, tier: string): Promise<FinancePanorama> {
  const densities: Record<string, { price: number }> = {
    '上海': { price: 135 }, '北京': { price: 125 },
    '广州': { price: 88 }, '深圳': { price: 105 },
    '成都': { price: 78 }, '杭州': { price: 92 },
    '南京': { price: 75 }, default: { price: 60 },
  }
  const d = densities[city] ?? densities.default!
  const tierPrices: Record<string, number> = { economy: 600, standard: 1200, luxury: 3500 }
  const tierPrice = tierPrices[tier] ?? 1200
  const cityRents: Record<string, { rent: number; salary: number }> = {
    '上海': { rent: 280, salary: 12000 }, '北京': { rent: 250, salary: 12000 },
    '深圳': { rent: 220, salary: 11000 }, '广州': { rent: 200, salary: 10000 },
    '成都': { rent: 150, salary: 8000 }, default: { rent: 100, salary: 6000 },
  }
  const cd = cityRents[city] ?? cityRents.default!

  const renovationCost = tierPrice * area
  const equipmentCost = Math.round(budget * 10000 * 0.45)
  const softwareSystemCost = Math.round(Math.min(Math.max(80000 + area * 60, 80000), 200000))
  const monthlyRent = Math.round(cd.rent * area)
  const deposit = monthlyRent * 3

  const staffCount = area <= 200 ? 6 : area <= 500 ? 8 : area <= 800 ? 10 : 12
  const labor = staffCount * cd.salary
  const equipmentMaintenance = Math.round(equipmentCost * 0.1 / 12)
  const systemSubscription = Math.round(Math.min(Math.max(3000 + area * 3, 3000), 8000))

  const avgTicketPrice = d.price
  const estimatedDailyTraffic = Math.round(area / 2.5 * 1.2)
  const estimatedMonthlyRevenue = Math.round(avgTicketPrice * estimatedDailyTraffic * 30)

  const electricity = Math.round(area * 20)
  const consumables = Math.round(estimatedMonthlyRevenue * 0.025)
  const marketing = Math.round(estimatedMonthlyRevenue * 0.05)

  const monthlyFixedTotal = monthlyRent + labor + equipmentMaintenance + systemSubscription
  const monthlyVariableTotal = electricity + consumables + marketing
  const monthlyTotalCost = monthlyFixedTotal + monthlyVariableTotal
  const estimatedMonthlyProfit = estimatedMonthlyRevenue - monthlyTotalCost
  const monthlyDepreciation = Math.round(equipmentCost / 36)
  const monthlyAmortization = Math.round(renovationCost / 60)

  const initialTotal = equipmentCost + renovationCost + softwareSystemCost + deposit
  const paybackMonths = estimatedMonthlyProfit > 0 ? Math.ceil(initialTotal / estimatedMonthlyProfit) : 999
  const monthlyDeduct = estimatedMonthlyProfit - monthlyDepreciation - monthlyAmortization
  const paybackWithDepreciation = monthlyDeduct > 0 ? Math.ceil(initialTotal / monthlyDeduct) : 999

  return {
    budget, area,
    initialInvestment: { equipmentCost, renovationCost, softwareSystemCost, deposit, total: initialTotal },
    monthlyFixedCost: { rent: monthlyRent, labor, equipmentMaintenance, systemSubscription, total: monthlyFixedTotal },
    monthlyVariableCost: { electricity, consumables, marketing, total: monthlyVariableTotal },
    monthlyTotalCost,
    revenueEstimate: { avgTicketPrice, estimatedDailyTraffic, estimatedMonthlyRevenue, estimatedMonthlyProfit },
    monthlyDepreciation, monthlyAmortization,
    paybackMonths, paybackWithDepreciation,
    cityAvgComparison: {
      initialInvestment: Math.round(initialTotal * 0.9),
      monthlyFixedCost: Math.round(monthlyFixedTotal * 0.95),
      monthlyRevenue: Math.round(estimatedMonthlyRevenue * 1.1),
      paybackMonths: Math.max(1, Math.round(paybackMonths * 1.15)),
    },
  }
}

/**
 * 预算对比 — 同时计算3个预算档次的分析
 */
function BudgetComparison({ city, district, baseBudget, tier }: {
  city: string; district: string; baseBudget: number; tier: string
}) {
  const [comparison, setComparison] = useState<{ budget: number; score: number; payback: number; revenue: number }[]>([])
  const [loading, setLoading] = useState(false)

  const runComparison = async () => {
    setLoading(true)
    const budgets = [
      Math.max(100, baseBudget - 100),
      baseBudget,
      Math.min(2000, baseBudget + 200),
    ]
    const results = await Promise.all(budgets.map(async b => {
      const rep = await simulateReport(city, district, b)
      const fin = await simulateFinance(city, district, b, 400, tier)
      return { budget: b, score: rep.score, payback: fin.paybackMonths, revenue: fin.revenueEstimate.estimatedMonthlyRevenue }
    }))
    setComparison(results)
    setLoading(false)
  }

  if (!city) return null

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h2 className="font-bold mb-3">📊 预算对比分析</h2>
      <button onClick={runComparison} disabled={loading}
        className="px-4 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 disabled:opacity-50 mb-3">
        {loading ? '计算中...' : '🔍 对比三档预算'}
      </button>
      {comparison.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border text-left">预算</th>
                {comparison.map(c => (
                  <th key={c.budget} className={`p-2 border text-right ${c.budget === baseBudget ? 'bg-blue-50' : ''}`}>
                    {c.budget}万{c.budget === baseBudget ? ' ←当前' : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2 border font-medium">可行性评分</td>
                {comparison.map(c => (
                  <td key={c.budget} className={`p-2 border text-right font-mono ${c.budget === baseBudget ? 'bg-blue-50' : ''}`}>
                    {c.score}/100
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="p-2 border font-medium">预估月收入</td>
                {comparison.map(c => (
                  <td key={c.budget} className={`p-2 border text-right font-mono ${c.budget === baseBudget ? 'bg-blue-50' : ''}`}>
                    ¥{(c.revenue / 10000).toFixed(1)}万
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="p-2 border font-medium">回收期</td>
                {comparison.map(c => (
                  <td key={c.budget} className={`p-2 border text-right font-mono ${c.budget === baseBudget ? 'bg-blue-50' : ''}`}>
                    {c.payback >= 999 ? '∞' : `${c.payback}月`}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
