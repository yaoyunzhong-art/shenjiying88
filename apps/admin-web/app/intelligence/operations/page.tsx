'use client'

import { useState, useCallback } from 'react'

interface ChoiceOption {
  id: string; label: string; description: string; pros: string[]
  cons: string[]; estimatedEffect: string
  /** P-50 V2: 同城竞品数据佐证 */
  dataEvidence?: string
}

interface AdviceQuestion {
  id: string; question: string; category: string
  aiSuggestion: string; options: ChoiceOption[]
}

/** 历史案例数据 */
interface HistoricalCase {
  year: number; month: number; activityName: string
  storeCount: number; avgTrafficIncrease: string
  avgRevenueIncrease: string; note: string
}

const CATEGORY_LABELS: Record<string, string> = {
  pricing: '💰 定价策略', activity: '🎯 活动方案',
  equipment: '🛠️ 设备更新', promotion: '🏷️ 促销应对',
  // P-50 V2: 新增3类
  recruit: '🤝 联名活动/IP跨界',
  seasonal: '🏖️ 暑假/寒假限定',
  blindbox: '🎁 盲盒/抽奖促销合规版',
}

const MOCK_QUESTIONS: AdviceQuestion[] = [
  // ── 原有4类 ──
  {
    id: 'pricing-1', category: 'pricing',
    question: '周末高峰时段如何定价？',
    aiSuggestion: '建议分时段定价策略，周末18:00-21:00黄金时段溢价20%',
    options: [
      { id: 'p-a', label: '统一价格', description: '全天统一价¥88/人', pros: ['简单易执行','客户体验好'], cons: ['高峰期收入少'], estimatedEffect: '月收入+8%', dataEvidence: '同城8家竞品采用此方案，平均月收入+9%' },
      { id: 'p-b', label: '分时段定价', description: '高峰¥108·平峰¥68', pros: ['收入最大化','引导错峰'], cons: ['需系统支持'], estimatedEffect: '月收入+22%', dataEvidence: '同城5家竞品采用此方案，平均月收入+24%' },
      { id: 'p-c', label: '动态定价', description: 'AI实时调整', pros: ['最优定价'], cons: ['技术门槛高'], estimatedEffect: '月收入+30%', dataEvidence: '同城2家竞品采用此方案，平均月收入+32%' },
    ],
  },
  {
    id: 'activity-1', category: 'activity',
    question: '本月主推什么活动？',
    aiSuggestion: '推荐抖音团购套餐+周末主题比赛',
    options: [
      { id: 'a-a', label: '抖音团购', description: '¥69双人畅玩2小时', pros: ['曝光量大','引流快'], cons: ['利润薄'], estimatedEffect: '客流+40%', dataEvidence: '同城12家竞品采用此方案，平均客流+42%' },
      { id: 'a-b', label: '周末主题赛', description: '投篮/跳舞机PK赛', pros: ['话题性强','复购率高'], cons: ['筹备周期长'], estimatedEffect: '客流+25%', dataEvidence: '同城8家竞品采用此方案，平均客流+28%' },
      { id: 'a-c', label: '会员日半价', description: '每月15号半价', pros: ['会员粘性'], cons: ['短期损失'], estimatedEffect: '客流+15%', dataEvidence: '同城6家竞品采用此方案，平均客流+16%' },
    ],
  },
  {
    id: 'equipment-1', category: 'equipment',
    question: '下季度设备更新方向？',
    aiSuggestion: '优先VR设备和新增运动竞技类',
    options: [
      { id: 'e-a', label: '升级VR区', description: '4台最新VR设备', pros: ['技术优势'], cons: ['投入大'], estimatedEffect: '收入+15%', dataEvidence: '同城4家竞品升级VR后，平均收入+17%' },
      { id: 'e-b', label: '新增保龄球/射箭', description: '运动竞技类', pros: ['差异化'], cons: ['占地大'], estimatedEffect: '收入+25%', dataEvidence: '同城3家竞品新增运动区，平均收入+27%' },
      { id: 'e-c', label: '翻新夹娃娃机', description: '10台新款', pros: ['低成本'], cons: ['短期效果'], estimatedEffect: '收入+10%', dataEvidence: '同城10家竞品翻新娃娃机，平均收入+11%' },
    ],
  },
  {
    id: 'promotion-1', category: 'promotion',
    question: '竞品推¥49团购如何应对？',
    aiSuggestion: '不建议打价格战，差异化套餐回应',
    options: [
      { id: 'r-a', label: '跟进降价', description: '同步¥49', pros: ['维持客流'], cons: ['利润降','品牌掉价'], estimatedEffect: '保客流·利润-20%', dataEvidence: '同城7家跟进降价的竞品，利润平均-22%' },
      { id: 'r-b', label: '增值不加价', description: '原价¥69+赠品', pros: ['价值感知'], cons: ['增加成本'], estimatedEffect: '保持客流', dataEvidence: '同城5家采用增资策略的竞品，客流保持+5%' },
      { id: 'r-c', label: '场景升级', description: '¥99畅玩+饮品', pros: ['客单价提升'], cons: ['需配套'], estimatedEffect: '月收入+18%', dataEvidence: '同城4家场景升级竞品，平均收入+20%' },
    ],
  },
  // ── P-50 V2: 联名活动/IP跨界 ──
  {
    id: 'recruit-1', category: 'recruit',
    question: '是否需要引入联名或IP跨界活动？',
    aiSuggestion: '结合门店定位和客流画像，建议选择与客群匹配的轻IP进行短期联名',
    options: [
      { id: 'rc-a', label: '大型IP联名', description: '合作知名IP打造主题快闪', pros: ['引爆流量','媒体曝光高','客单价提升'], cons: ['版权费高昂','谈判周期长','档期受限'], estimatedEffect: '客流+55%', dataEvidence: '同城5家竞品IP联名后，客流平均+65%' },
      { id: 'rc-b', label: '游戏/品牌跨界', description: '与奶茶/潮玩等品牌联合促销', pros: ['成本分摊','双向导流','灵活性高'], cons: ['需双方配合','品牌调性需匹配'], estimatedEffect: '客流+30%', dataEvidence: '同城6家竞品跨界合作，客流平均+32%' },
      { id: 'rc-c', label: '自有IP孵化', description: '设计门店专属IP形象并推向社交平台', pros: ['长期资产','低成本迭代'], cons: ['见效慢','运营投入高'], estimatedEffect: '客流+15%', dataEvidence: '同城3家竞品尝试自有IP，平均+18%' },
    ],
  },
  // ── P-50 V2: 暑假/寒假限定 ──
  {
    id: 'seasonal-1', category: 'seasonal',
    question: '暑假/寒假假期推出什么限定活动？',
    aiSuggestion: '重点针对学生和亲子客群，推出假期专属套餐+时段优惠',
    options: [
      { id: 'ss-a', label: '假期畅玩卡', description: '暑假/寒假期间¥199不限次畅玩', pros: ['锁定高频消费','资金快速回笼'], cons: ['单次利润低','过度占用设备'], estimatedEffect: '客流+35%', dataEvidence: '同城20家竞品推假期畅玩卡，客流平均+35%' },
      { id: 'ss-b', label: '亲子套餐', description: '一大一小¥128含饮品', pros: ['客单价高','亲子粘性强'], cons: ['覆盖人群有限','需增加安全措施'], estimatedEffect: '客流+25%', dataEvidence: '同城15家竞品推亲子套餐，客流平均+25%' },
      { id: 'ss-c', label: '学生专场', description: '凭学生证工作日5折', pros: ['精准靶向','提升非高峰利用率'], cons: ['身份验证难','学生消费力有限'], estimatedEffect: '客流+20%', dataEvidence: '同城10家竞品设学生专场，非高峰使用率+20%' },
    ],
  },
  // ── P-50 V2: 盲盒/抽奖促销合规版 ──
  {
    id: 'blindbox-1', category: 'blindbox',
    question: '盲盒/抽奖促销如何设计？',
    aiSuggestion: '参考同城合规案例，建议设计透明度高的抽奖机制（保底+公示概率）',
    options: [
      { id: 'bb-a', label: '消费抽盲盒', description: '每消费¥88抽1次，奖品含手机/周边/免单券', pros: ['刺激复购','社交传播强'], cons: ['奖品成本高','需公示概率合规'], estimatedEffect: '客流+50%', dataEvidence: '同城8家竞品推消费抽奖，客流平均+55%' },
      { id: 'bb-b', label: '积分翻牌', description: '100积分翻1次牌，中奖率≥50%', pros: ['积分消耗快','成本可控'], cons: ['吸引力一般','需足够积分池'], estimatedEffect: '积分消耗+40%', dataEvidence: '同城6家竞品设积分翻牌，积分活动率+45%' },
      { id: 'bb-c', label: '满额赠盲盒', description: '满¥128赠送限定盲盒一个（明盒/暗盒可选）', pros: ['提升客单价','合规风险低'], cons: ['盲盒成本','赠品管理'], estimatedEffect: '客单价+18%', dataEvidence: '同城10家竞品用满赠盲盒，客单价平均+20%' },
    ],
  },
]

/** P-50 V2: 历史案例数据（模拟） */
const MOCK_HISTORICAL_CASES: HistoricalCase[] = [
  { year: 2025, month: 7, activityName: '抖音团购', storeCount: 12, avgTrafficIncrease: '+42%', avgRevenueIncrease: '+18%', note: '暑假档期转化率较高' },
  { year: 2025, month: 8, activityName: '周末主题赛', storeCount: 8, avgTrafficIncrease: '+28%', avgRevenueIncrease: '+22%', note: '比赛类活动连带销售突出' },
  { year: 2025, month: 9, activityName: '会员日半价', storeCount: 6, avgTrafficIncrease: '+16%', avgRevenueIncrease: '+8%', note: '开学季效果略低于暑期' },
  { year: 2026, month: 3, activityName: '抖音团购', storeCount: 15, avgTrafficIncrease: '+38%', avgRevenueIncrease: '+15%', note: '平台流量扶持力度加大' },
  { year: 2026, month: 4, activityName: '周末主题赛', storeCount: 10, avgTrafficIncrease: '+30%', avgRevenueIncrease: '+24%', note: '春季活动参与率提升' },
]

export default function OperationsPage() {
  const [questions] = useState(MOCK_QUESTIONS)
  const [selected, setSelected] = useState<Record<string, string>>({})
  const [aiAdvice, setAiAdvice] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('ALL')
  /** P-50 V2: 活动类型是否显示历史案例视图 */
  const [showHistorical, setShowHistorical] = useState(false)

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

      {/* P-50 V2: 活动方案视图切换 */}
      {activeCategory === 'activity' && (
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setShowHistorical(false)}
            className={`px-3 py-1 rounded text-sm ${!showHistorical ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
            📝 选择题模式
          </button>
          <button
            onClick={() => setShowHistorical(true)}
            className={`px-3 py-1 rounded text-sm ${showHistorical ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
            📊 历史案例模式
          </button>
        </div>
      )}

      {/* P-50 V2: 历史案例视图 */}
      {showHistorical && activeCategory === 'activity' && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="font-bold text-lg mb-4">📊 同城活动历史案例</h3>
          <p className="text-xs text-gray-500 mb-4">基于同城竞品的历史活动效果数据</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="historical-cases-table">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4">时间</th>
                  <th className="py-2 pr-4">活动类型</th>
                  <th className="py-2 pr-4">竞品采用数</th>
                  <th className="py-2 pr-4">平均客流增长</th>
                  <th className="py-2 pr-4">平均收入增长</th>
                  <th className="py-2 pr-4">备注</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_HISTORICAL_CASES.map((h, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50" data-testid={`historical-case-row-${idx}`}>
                    <td className="py-2 pr-4 text-gray-600">{h.year}.{String(h.month).padStart(2, '0')}</td>
                    <td className="py-2 pr-4 font-medium">{h.activityName}</td>
                    <td className="py-2 pr-4">{h.storeCount}家</td>
                    <td className="py-2 pr-4 text-green-600">{h.avgTrafficIncrease}</td>
                    <td className="py-2 pr-4 text-blue-600">{h.avgRevenueIncrease}</td>
                    <td className="py-2 pr-4 text-gray-500 text-xs">{h.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI建议面板 */}
      {aiAdvice && !showHistorical && (
        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6 whitespace-pre-line text-sm text-blue-800">
          {aiAdvice}
        </div>
      )}

      {/* 问题列表（选择题模式） */}
      {!showHistorical && (
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
                      {/* P-50 V2: 显示 dataEvidence */}
                      {opt.dataEvidence && (
                        <p className="text-xs text-orange-600 mb-2" data-testid={`data-evidence-${opt.id}`}>
                          📋 {opt.dataEvidence}
                        </p>
                      )}
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
      )}
    </div>
  )
}
