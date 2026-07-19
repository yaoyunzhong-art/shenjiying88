'use client'

import { useState, useCallback } from 'react'

interface ChoiceOption {
  id: string; label: string; description: string; pros: string[]
  cons: string[]; estimatedEffect: string
}

interface AdviceQuestion {
  id: string; question: string; category: string
  aiSuggestion: string; options: ChoiceOption[]
}

const CATEGORY_LABELS: Record<string, string> = {
  pricing: '💰 定价策略', activity: '🎯 活动方案',
  equipment: '🛠️ 设备更新', promotion: '🏷️ 促销应对',
}

const MOCK_QUESTIONS: AdviceQuestion[] = [
  {
    id: 'pricing-1', category: 'pricing',
    question: '周末高峰时段如何定价？',
    aiSuggestion: '建议分时段定价策略，周末18:00-21:00黄金时段溢价20%',
    options: [
      { id: 'p-a', label: '统一价格', description: '全天统一价¥88/人', pros: ['简单易执行','客户体验好'], cons: ['高峰期收入少'], estimatedEffect: '月收入+8%' },
      { id: 'p-b', label: '分时段定价', description: '高峰¥108·平峰¥68', pros: ['收入最大化','引导错峰'], cons: ['需系统支持'], estimatedEffect: '月收入+22%' },
      { id: 'p-c', label: '动态定价', description: 'AI实时调整', pros: ['最优定价'], cons: ['技术门槛高'], estimatedEffect: '月收入+30%' },
    ],
  },
  {
    id: 'activity-1', category: 'activity',
    question: '本月主推什么活动？',
    aiSuggestion: '推荐抖音团购套餐+周末主题比赛',
    options: [
      { id: 'a-a', label: '抖音团购', description: '¥69双人畅玩2小时', pros: ['曝光量大','引流快'], cons: ['利润薄'], estimatedEffect: '客流+40%' },
      { id: 'a-b', label: '周末主题赛', description: '投篮/跳舞机PK赛', pros: ['话题性强','复购率高'], cons: ['筹备周期长'], estimatedEffect: '客流+25%' },
      { id: 'a-c', label: '会员日半价', description: '每月15号半价', pros: ['会员粘性'], cons: ['短期损失'], estimatedEffect: '客流+15%' },
    ],
  },
  {
    id: 'equipment-1', category: 'equipment',
    question: '下季度设备更新方向？',
    aiSuggestion: '优先VR设备和新增运动竞技类',
    options: [
      { id: 'e-a', label: '升级VR区', description: '4台最新VR设备', pros: ['技术优势'], cons: ['投入大'], estimatedEffect: '收入+15%' },
      { id: 'e-b', label: '新增保龄球/射箭', description: '运动竞技类', pros: ['差异化'], cons: ['占地大'], estimatedEffect: '收入+25%' },
      { id: 'e-c', label: '翻新夹娃娃机', description: '10台新款', pros: ['低成本'], cons: ['短期效果'], estimatedEffect: '收入+10%' },
    ],
  },
  {
    id: 'promotion-1', category: 'promotion',
    question: '竞品推¥49团购如何应对？',
    aiSuggestion: '不建议打价格战，差异化套餐回应',
    options: [
      { id: 'r-a', label: '跟进降价', description: '同步¥49', pros: ['维持客流'], cons: ['利润降','品牌掉价'], estimatedEffect: '保客流·利润-20%' },
      { id: 'r-b', label: '增值不加价', description: '原价¥69+赠品', pros: ['价值感知'], cons: ['增加成本'], estimatedEffect: '保持客流' },
      { id: 'r-c', label: '场景升级', description: '¥99畅玩+饮品', pros: ['客单价提升'], cons: ['需配套'], estimatedEffect: '月收入+18%' },
    ],
  },
]

export default function OperationsPage() {
  const [questions] = useState(MOCK_QUESTIONS)
  const [selected, setSelected] = useState<Record<string, string>>({})
  const [aiAdvice, setAiAdvice] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('ALL')

  const filtered = activeCategory === 'ALL' ? questions : questions.filter(q => q.category === activeCategory)
  const categories = [...new Set(questions.map(q => q.category))]

  const handleSelect = useCallback((qId: string, optId: string) => {
    setSelected(prev => ({ ...prev, [qId]: optId }))
    const q = questions.find(q => q.id === qId)
    if (q) setAiAdvice(`🤖 AI建议: ${q.aiSuggestion}\n\n你的选择: ${q.options.find(o => o.id === optId)?.label}`)
  }, [questions])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">💡 运营参谋</h1>
      <p className="text-gray-500 mb-6">AI为你提供多个可行方案，你来做选择题，不做填空题。</p>

      {/* 分类筛选 */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setActiveCategory('ALL')}
          className={`px-3 py-1 rounded text-sm ${activeCategory === 'ALL' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>全部</button>
        {categories.map(c => (
          <button key={c} onClick={() => setActiveCategory(c)}
            className={`px-3 py-1 rounded text-sm ${activeCategory === c ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
            {CATEGORY_LABELS[c] || c}
          </button>
        ))}
      </div>

      {/* AI建议面板 */}
      {aiAdvice && (
        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6 whitespace-pre-line text-sm text-blue-800">
          {aiAdvice}
        </div>
      )}

      {/* 问题列表 */}
      <div className="space-y-6">
        {filtered.map(q => (
          <div key={q.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-gray-400">{CATEGORY_LABELS[q.category]}</span>
            </div>
            <h3 className="font-bold text-lg mb-1">{q.question}</h3>
            <p className="text-xs text-blue-600 mb-4">💡 {q.aiSuggestion}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {q.options.map(opt => {
                const isSelected = selected[q.id] === opt.id
                return (
                  <button key={opt.id} onClick={() => handleSelect(q.id, opt.id)}
                    className={`text-left border-2 rounded-lg p-4 transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm">{opt.label}</span>
                      {isSelected && <span className="text-blue-600 text-xs">✓ 已选</span>}
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{opt.description}</p>
                    <div className="flex gap-1 flex-wrap mb-2">
                      {opt.pros.map(p => <span key={p} className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">+{p}</span>)}
                      {opt.cons.map(c => <span key={c} className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded">-{c}</span>)}
                    </div>
                    <p className="text-xs text-gray-400">📊 {opt.estimatedEffect}</p>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
