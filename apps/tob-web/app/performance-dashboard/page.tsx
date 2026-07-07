// 性能监控仪表盘
'use client'

import { Heartbeat } from '../openapi-portal/components/Heartbeat'

export default function PerformanceDashboardPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* 顶部导航 */}
      <header className="border-b border-white/10 px-6 py-4">
        <h1 className="text-xl font-bold">性能监控中心</h1>
      </header>

      {/* 关键指标卡片 */}
      <div className="p-6">
        <div className="grid grid-cols-4 gap-4">
          {/* API 响应时间 */}
          <div className="bg-white/5 rounded-lg p-4 border border-green-500/30">
            <p className="text-gray-400 text-sm">API 平均响应</p>
            <p className="text-3xl font-bold mt-1 text-green-400">42ms</p>
            <p className="text-xs text-gray-500 mt-1">P99: 156ms</p>
          </div>

          {/* QPS */}
          <div className="bg-white/5 rounded-lg p-4 border border-blue-500/30">
            <p className="text-gray-400 text-sm">当前 QPS</p>
            <p className="text-3xl font-bold mt-1 text-blue-400">2,847</p>
            <p className="text-xs text-gray-500 mt-1">目标: 5,000</p>
          </div>

          {/* 错误率 */}
          <div className="bg-white/5 rounded-lg p-4 border border-red-500/30">
            <p className="text-gray-400 text-sm">错误率</p>
            <p className="text-3xl font-bold mt-1 text-red-400">0.12%</p>
            <p className="text-xs text-gray-500 mt-1">阈值: 1%</p>
          </div>

          {/* CPU 利用率 */}
          <div className="bg-white/5 rounded-lg p-4 border border-yellow-500/30">
            <p className="text-gray-400 text-sm">CPU 利用率</p>
            <p className="text-3xl font-bold mt-1 text-yellow-400">58%</p>
            <p className="text-xs text-gray-500 mt-1">HPA 阈值: 70%</p>
          </div>
        </div>
      </div>

      {/* 响应时间趋势图（模拟） */}
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">响应时间趋势（24h）</h2>
        <div className="bg-white/5 rounded-lg p-4">
          {/* 简化柱状图表示 */}
          <div className="flex items-end gap-1 h-32">
            {Array.from({ length: 24 }, (_, i) => {
              const height = 20 + Math.random() * 80
              return (
                <div key={i} className="flex-1 bg-blue-500/60 rounded-t" style={{ height: `${height}%` }}></div>
              )
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>24:00</span>
          </div>
        </div>
      </div>

      {/* 缓存命中率 */}
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">缓存命中率</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-gray-400 text-sm">L1 (进程内)</p>
            <p className="text-2xl font-bold mt-1">98.2%</p>
            <div className="h-2 bg-white/10 rounded-full mt-2">
              <div className="h-full bg-green-500 rounded-full" style={{ width: '98.2%' }}></div>
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-gray-400 text-sm">L2 (Redis)</p>
            <p className="text-2xl font-bold mt-1">85.6%</p>
            <div className="h-2 bg-white/10 rounded-full mt-2">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '85.6%' }}></div>
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-gray-400 text-sm">L3 (持久化)</p>
            <p className="text-2xl font-bold mt-1">99.9%</p>
            <div className="h-2 bg-white/10 rounded-full mt-2">
              <div className="h-full bg-purple-500 rounded-full" style={{ width: '99.9%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* 数据库状态 */}
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">数据库连接池</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-gray-400 text-xs">总连接</p>
            <p className="text-xl font-bold">50/100</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-gray-400 text-xs">活跃</p>
            <p className="text-xl font-bold text-green-400">32</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-gray-400 text-xs">空闲</p>
            <p className="text-xl font-bold text-blue-400">18</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-gray-400 text-xs">等待</p>
            <p className="text-xl font-bold text-yellow-400">0</p>
          </div>
        </div>
      </div>

      {/* K8s Pod 状态 */}
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Kubernetes 副本状态</h2>
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">API Deployment</p>
              <p className="text-sm text-gray-400">3 replicas · 1 unavailable</p>
            </div>
            <div className="flex gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
            <div><span className="text-gray-400">CPU:</span> 62%</div>
            <div><span className="text-gray-400">Memory:</span> 48%</div>
            <div><span className="text-gray-400">Ready:</span> 2/3</div>
            <div><span className="text-gray-400">Age:</span> 14d</div>
          </div>
        </div>
      </div>

      {/* 底部 HEARTBEAT */}
      <Heartbeat id="HEARTBEAT-70" />
    </div>
  )
}
