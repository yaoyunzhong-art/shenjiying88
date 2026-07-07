'use client'

import { Heartbeat } from '../openapi-portal/components/Heartbeat'

export default function V2LaunchPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* 顶部导航 */}
      <header className="border-b border-white/10 px-6 py-4">
        <h1 className="text-xl font-bold">神机营 v2.0 正式发布</h1>
      </header>
      
      {/* Hero */}
      <div className="p-12 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-4xl font-bold mb-4">v2.0.0-v12-complete</h2>
        <p className="text-gray-400 text-lg">90 天 · 18 个 Sprint · 全模块上线</p>
        <div className="mt-6">
          <span className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-medium">
            所有系统已就绪
          </span>
        </div>
      </div>
      
      {/* 功能亮点 */}
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">v2.0 核心功能</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-2xl mb-2">🧠</p>
            <h4 className="font-medium">AI 营销参谋</h4>
            <p className="text-xs text-gray-400 mt-1">ROI预测/智能文案/A/B测试</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-2xl mb-2">🌏</p>
            <h4 className="font-medium">国际化 9 语言</h4>
            <p className="text-xs text-gray-400 mt-1">多币种/PayPal/Stripe/PayPay</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-2xl mb-2">📱</p>
            <h4 className="font-medium">IoT + Edge</h4>
            <p className="text-xs text-gray-400 mt-1">离线收银/设备适配/边缘AI</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-2xl mb-2">🔒</p>
            <h4 className="font-medium">GDPR + 安全</h4>
            <p className="text-xs text-gray-400 mt-1">审计追踪/WAF/RBAC/渗透测试</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-2xl mb-2">📊</p>
            <h4 className="font-medium">性能压测</h4>
            <p className="text-xs text-gray-400 mt-1">k6/DB优化/Redis/K8s HPA</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-2xl mb-2">🏢</p>
            <h4 className="font-medium">独立 SaaS</h4>
            <p className="text-xs text-gray-400 mt-1">品牌定制/设备适配/Helm部署</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-2xl mb-2">📚</p>
            <h4 className="font-medium">文档中心</h4>
            <p className="text-xs text-gray-400 mt-1">API/运营手册/培训/运维</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-2xl mb-2">🛡️</p>
            <h4 className="font-medium">合规体系</h4>
            <p className="text-xs text-gray-400 mt-1">GDPR/数据删除/DSR/审计</p>
          </div>
        </div>
      </div>
      
      {/* Sprint 统计 */}
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">开发统计</h3>
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">18</p>
            <p className="text-xs text-gray-400">Sprint</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">130</p>
            <p className="text-xs text-gray-400">Tasks</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">1800+</p>
            <p className="text-xs text-gray-400">Tests</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">8</p>
            <p className="text-xs text-gray-400">后台页面</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">19</p>
            <p className="text-xs text-gray-400">HEARTBEAT</p>
          </div>
        </div>
      </div>
      
      {/* 上线检查 */}
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">上线检查清单</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            'API Gateway 压测通过 (5000 VU)',
            'GDPR 合规评审通过',
            'WAF 安全扫描无高危',
            'DB 索引优化完成',
            'Redis 多级缓存配置完成',
            'K8s HPA 策略配置完成',
            '国际化 9 语言文案就绪',
            '培训课程 30 门就绪',
            '运营手册 4 角色就绪',
            '运维 Runbook 12 份就绪',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 bg-white/5 rounded p-2">
              <span className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                <span className="text-green-400 text-xs">✓</span>
              </span>
              <span className="text-sm">{item}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* 底部 HEARTBEAT */}
      <Heartbeat id="HEARTBEAT-72" />
    </div>
  )
}