'use client'

import Link from 'next/link'

export default function IntelligencePage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">🤖 运营参谋</h1>
      <p className="text-gray-500 mb-6">基于侦察兵全国竞品数据库的AI运营决策系统</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/intelligence/feasibility" className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow border-l-4 border-blue-500">
          <h2 className="font-bold text-lg mb-2">📊 开业可行性报告</h2>
          <p className="text-gray-500 text-sm mb-3">基于竞品数据+商圈分析+设备配置建议，评估新店可行性</p>
          <span className="text-blue-600 text-sm font-medium">→ 开始评估</span>
        </Link>
        <Link href="/intelligence/operations" className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow border-l-4 border-green-500">
          <h2 className="font-bold text-lg mb-2">💡 运营参谋 (AI选择题)</h2>
          <p className="text-gray-500 text-sm mb-3">定价策略·活动方案·设备更新·促销应对，AI给选项你做选择</p>
          <span className="text-green-600 text-sm font-medium">→ AI参谋</span>
        </Link>
        <Link href="/intelligence/monitor" className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow border-l-4 border-red-500">
          <h2 className="font-bold text-lg mb-2">👀 竞争监控</h2>
          <p className="text-gray-500 text-sm mb-3">实时监控竞品价格调整·新活动·新优惠·评分变化</p>
          <span className="text-red-600 text-sm font-medium">→ 查看监控</span>
        </Link>
      </div>
    </div>
  )
}
