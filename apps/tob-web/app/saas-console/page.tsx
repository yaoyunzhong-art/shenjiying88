// SaaS 控制台 - 独立 SaaS 管理后台
'use client'

import { Heartbeat } from '../openapi-portal/components/Heartbeat'

export default function SaaSConsolePage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* 顶部导航 */}
      <header className="border-b border-white/10 px-6 py-4">
        <h1 className="text-xl font-bold">SaaS 管理控制台</h1>
      </header>
      
      {/* 套餐选择卡片 */}
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">选择套餐</h2>
        <div className="grid grid-cols-3 gap-4">
          {/* Starter */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h3 className="text-blue-400 font-bold">Starter</h3>
            <p className="text-3xl font-bold mt-2">¥299<span className="text-sm text-gray-400">/月</span></p>
            <ul className="mt-4 text-sm text-gray-300 space-y-1">
              <li>10万次 API</li>
              <li>5GB 存储</li>
              <li>5 用户</li>
              <li>10 设备</li>
            </ul>
            <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 py-2 rounded font-medium">选择套餐</button>
          </div>
          
          {/* Professional */}
          <div className="bg-white/5 rounded-lg p-4 border border-blue-500/50">
            <p className="text-xs text-blue-400 font-medium">推荐</p>
            <h3 className="text-purple-400 font-bold mt-1">Professional</h3>
            <p className="text-3xl font-bold mt-2">¥999<span className="text-sm text-gray-400">/月</span></p>
            <ul className="mt-4 text-sm text-gray-300 space-y-1">
              <li>100万次 API</li>
              <li>50GB 存储</li>
              <li>50 用户</li>
              <li>100 设备</li>
            </ul>
            <button className="mt-4 w-full bg-purple-600 hover:bg-purple-700 py-2 rounded font-medium">选择套餐</button>
          </div>
          
          {/* Enterprise */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h3 className="text-orange-400 font-bold">Enterprise</h3>
            <p className="text-3xl font-bold mt-2">¥2999<span className="text-sm text-gray-400">/月</span></p>
            <ul className="mt-4 text-sm text-gray-300 space-y-1">
              <li>无限 API</li>
              <li>500GB 存储</li>
              <li>无限 用户</li>
              <li>无限 设备</li>
            </ul>
            <button className="mt-4 w-full bg-orange-600 hover:bg-orange-700 py-2 rounded font-medium">选择套餐</button>
          </div>
        </div>
      </div>
      
      {/* 配额使用 */}
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">配额使用情况</h2>
        <div className="space-y-3">
          {/* API调用 */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>API 调用</span>
              <span className="text-gray-400">45,230 / 100,000</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '45%' }}></div>
            </div>
          </div>
          
          {/* 存储 */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>存储空间</span>
              <span className="text-gray-400">2.3 / 5 GB</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full">
              <div className="h-full bg-green-500 rounded-full" style={{ width: '46%' }}></div>
            </div>
          </div>
          
          {/* 用户 */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>用户数</span>
              <span className="text-gray-400">3 / 5</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full">
              <div className="h-full bg-purple-500 rounded-full" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 部署状态 */}
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">部署状态</h2>
        <div className="bg-white/5 rounded-lg p-4 border border-green-500/30">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            <span className="text-green-400 font-medium">运行中</span>
            <span className="text-gray-400 text-sm ml-2">单机部署 · Small · 上线于 2026-06-28</span>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-3 text-sm">
            <div><span className="text-gray-400">CPU:</span> 2核</div>
            <div><span className="text-gray-400">内存:</span> 4GB</div>
            <div><span className="text-gray-400">版本:</span> v2.0.0</div>
            <div><span className="text-gray-400">Region:</span> cn-east-1</div>
          </div>
        </div>
      </div>
      
      {/* 品牌定制入口 */}
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">品牌定制</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="font-medium">当前品牌</h3>
            <p className="text-gray-400 text-sm mt-1">神机营 SaaS</p>
            <button className="mt-3 text-blue-400 hover:text-blue-300 text-sm">自定义主题 →</button>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="font-medium">域名</h3>
            <p className="text-gray-400 text-sm mt-1">shop.shenjiying.com</p>
            <button className="mt-3 text-blue-400 hover:text-blue-300 text-sm">DNS 配置 →</button>
          </div>
        </div>
      </div>
      
      {/* 底部 HEARTBEAT */}
      <Heartbeat id="HEARTBEAT-69" />
    </div>
  )
}
