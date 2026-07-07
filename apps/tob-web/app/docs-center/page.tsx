// 文档中心页面
'use client'

import { Heartbeat } from '../openapi-portal/components/Heartbeat'

export default function DocsCenterPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* 顶部导航 */}
      <header className="border-b border-white/10 px-6 py-4">
        <h1 className="text-xl font-bold">神机营文档中心</h1>
      </header>
      
      {/* 文档分类 */}
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">文档分类</h2>
        <div className="grid grid-cols-3 gap-4">
          {/* API 文档 */}
          <div className="bg-white/5 rounded-lg p-4 border border-blue-500/30 hover:bg-white/10 cursor-pointer">
            <div className="text-2xl mb-2">📚</div>
            <h3 className="font-bold">API 文档</h3>
            <p className="text-sm text-gray-400 mt-1">OpenAPI 3.0 / Swagger / Redoc</p>
            <p className="text-xs text-gray-500 mt-2">125 个接口</p>
          </div>
          
          {/* 运营手册 */}
          <div className="bg-white/5 rounded-lg p-4 border border-green-500/30 hover:bg-white/10 cursor-pointer">
            <div className="text-2xl mb-2">📖</div>
            <h3 className="font-bold">运营手册</h3>
            <p className="text-sm text-gray-400 mt-1">店长 / 导购 / 收银 / 客服</p>
            <p className="text-xs text-gray-500 mt-2">4 个角色 · 25 个章节</p>
          </div>
          
          {/* 培训课程 */}
          <div className="bg-white/5 rounded-lg p-4 border border-purple-500/30 hover:bg-white/10 cursor-pointer">
            <div className="text-2xl mb-2">🎓</div>
            <h3 className="font-bold">培训课程</h3>
            <p className="text-sm text-gray-400 mt-1">视频 / 考试 / 证书</p>
            <p className="text-xs text-gray-500 mt-2">30 个课程</p>
          </div>
          
          {/* 运维手册 */}
          <div className="bg-white/5 rounded-lg p-4 border border-orange-500/30 hover:bg-white/10 cursor-pointer">
            <div className="text-2xl mb-2">🔧</div>
            <h3 className="font-bold">运维手册</h3>
            <p className="text-sm text-gray-400 mt-1">部署 / 扩容 / 故障 / 灾备</p>
            <p className="text-xs text-gray-500 mt-2">12 个 Runbook</p>
          </div>
          
          {/* 开发指南 */}
          <div className="bg-white/5 rounded-lg p-4 border border-yellow-500/30 hover:bg-white/10 cursor-pointer">
            <div className="text-2xl mb-2">💻</div>
            <h3 className="font-bold">开发指南</h3>
            <p className="text-sm text-gray-400 mt-1">快速开始 / 架构 / SDK</p>
            <p className="text-xs text-gray-500 mt-2">多语言 SDK</p>
          </div>
          
          {/* 合规文档 */}
          <div className="bg-white/5 rounded-lg p-4 border border-red-500/30 hover:bg-white/10 cursor-pointer">
            <div className="text-2xl mb-2">🛡️</div>
            <h3 className="font-bold">合规文档</h3>
            <p className="text-sm text-gray-400 mt-1">GDPR / 安全 / 审计</p>
            <p className="text-xs text-gray-500 mt-2">完整合规体系</p>
          </div>
        </div>
      </div>
      
      {/* 最新文档 */}
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">最新更新</h2>
        <div className="space-y-2">
          <div className="bg-white/5 rounded p-3 flex justify-between items-center">
            <div>
              <p className="font-medium">v2.0 API 变更说明</p>
              <p className="text-xs text-gray-500">2026-07-03 · API 文档</p>
            </div>
            <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">NEW</span>
          </div>
          <div className="bg-white/5 rounded p-3">
            <p className="font-medium">店长运营手册 v1.2</p>
            <p className="text-xs text-gray-500">2026-07-02 · 运营手册</p>
          </div>
          <div className="bg-white/5 rounded p-3">
            <p className="font-medium">K8s 部署 Runbook v1.1</p>
            <p className="text-xs text-gray-500">2026-07-01 · 运维手册</p>
          </div>
        </div>
      </div>
      
      {/* 快速链接 */}
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">快速链接</h2>
        <div className="flex gap-3">
          <a href="/docs/api" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm">OpenAPI JSON</a>
          <a href="/docs/redoc" className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm">Redoc 文档</a>
          <a href="/docs/postman" className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded text-sm">Postman Collection</a>
          <a href="/training" className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-sm">培训系统</a>
        </div>
      </div>
      
      {/* 底部 HEARTBEAT */}
      <Heartbeat id="HEARTBEAT-71" />
    </div>
  )
}