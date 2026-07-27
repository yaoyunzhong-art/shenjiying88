'use client'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

import { useMemo, useState, useTransition } from 'react'
import type { OperationsSnapshot } from './operations-data'

export default function OperationsClient({
  snapshot,
}: {
  snapshot: OperationsSnapshot
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [selected, setSelected] = useState<Record<string, string>>({})
  const [aiAdvice, setAiAdvice] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('ALL')
  const [showHistorical, setShowHistorical] = useState(false)

  const questions =
    activeCategory === 'ALL'
      ? snapshot.questions
      : snapshot.questions.filter((question) => question.category === activeCategory)
  const categories = useMemo(
    () => [...new Set(snapshot.questions.map((question) => question.category))],
    [snapshot.questions]
  )
  const districts = city ? snapshot.cityDistricts[city] ?? ['中心区'] : []

  function handleSelect(questionId: string, optionId: string) {
    const question = snapshot.questions.find((item) => item.id === questionId)
    const option = question?.options.find((item) => item.id === optionId)

    setSelected((previous) => ({ ...previous, [questionId]: optionId }))
    if (question && option) {
      setAiAdvice(`AI建议: ${question.aiSuggestion}\n\n你的选择: ${option.label}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">运营参谋</h1>
          <p className="mt-1 text-sm text-slate-500">AI 为你提供多个可行方案，你来做选择题，不做填空题。</p>
        </div>
        <button
          type="button"
          onClick={() => handleRefresh()}
          disabled={isRefreshing}
          className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRefreshing ? '刷新中...' : '刷新'}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded border border-blue-100 bg-blue-50 p-4">
        <span className="text-sm font-medium text-blue-700">同城数据参考</span>
        <select
          value={city}
          onChange={(event) => {
            setCity(event.target.value)
            setDistrict('')
          }}
          className="rounded border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">选择城市</option>
          {snapshot.cityOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          value={district}
          onChange={(event) => setDistrict(event.target.value)}
          disabled={!city}
          className="rounded border border-slate-300 bg-white px-3 py-2 text-sm disabled:bg-slate-100"
        >
          <option value="">选择区域</option>
          {districts.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        {city && district ? (
          <span className="text-xs text-green-600">正在使用 {city}{district} 的竞品数据</span>
        ) : (
          <span className="text-xs text-blue-500">选择城市 + 区域后可获取同城竞品参考</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveCategory('ALL')}
          className={`rounded px-3 py-1 text-sm ${activeCategory === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}
        >
          全部
        </button>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={`rounded px-3 py-1 text-sm ${activeCategory === category ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            {snapshot.categoryLabels[category] ?? category}
          </button>
        ))}
      </div>

      {activeCategory === 'activity' ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHistorical(false)}
            className={`rounded px-3 py-1 text-sm ${!showHistorical ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            选择题模式
          </button>
          <button
            type="button"
            onClick={() => setShowHistorical(true)}
            className={`rounded px-3 py-1 text-sm ${showHistorical ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            历史案例模式
          </button>
        </div>
      ) : null}

      {showHistorical && activeCategory === 'activity' ? (
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-slate-900">同城活动历史案例</h2>
          <p className="mb-4 text-xs text-slate-500">基于同城竞品历史活动效果样本生成。</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="py-2 pr-4">时间</th>
                  <th className="py-2 pr-4">活动类型</th>
                  <th className="py-2 pr-4">竞品采用</th>
                  <th className="py-2 pr-4">客流增长</th>
                  <th className="py-2 pr-4">收入增长</th>
                  <th className="py-2 pr-4">备注</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.historicalCases.map((item) => (
                  <tr key={`${item.year}-${item.month}-${item.activityName}`} className="border-b last:border-b-0">
                    <td className="py-2 pr-4 text-slate-600">
                      {item.year}.{String(item.month).padStart(2, '0')}
                    </td>
                    <td className="py-2 pr-4 font-medium text-slate-900">{item.activityName}</td>
                    <td className="py-2 pr-4">{item.storeCount}家</td>
                    <td className="py-2 pr-4 text-green-600">{item.avgTrafficIncrease}</td>
                    <td className="py-2 pr-4 text-blue-600">{item.avgRevenueIncrease}</td>
                    <td className="py-2 pr-4 text-xs text-slate-500">{item.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {aiAdvice && !showHistorical ? (
        <div className="whitespace-pre-line rounded border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          {aiAdvice}
        </div>
      ) : null}

      {!showHistorical ? (
        <div className="space-y-6">
          {questions.map((question) => (
            <section key={question.id} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-2 text-xs text-slate-400">{snapshot.categoryLabels[question.category] ?? question.category}</div>
              <h2 className="mb-1 text-lg font-semibold text-slate-900">{question.question}</h2>
              <p className="mb-4 text-xs text-blue-600">AI建议: {question.aiSuggestion}</p>
              <div className="grid gap-3 md:grid-cols-3">
                {question.options.map((option) => {
                  const isSelected = selected[question.id] === option.id

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSelect(question.id, option.id)}
                      className={`rounded-lg border-2 p-4 text-left transition ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="font-semibold text-slate-900">{option.label}</span>
                        {isSelected ? <span className="text-xs text-blue-600">已选</span> : null}
                      </div>
                      <p className="mb-2 text-xs text-slate-600">{option.description}</p>
                      {option.dataEvidence ? (
                        <p className="mb-2 text-xs text-orange-600">来源态证据: {option.dataEvidence}</p>
                      ) : null}
                      <div className="mb-2 flex flex-wrap gap-1">
                        {option.pros.map((item) => (
                          <span key={item} className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700">
                            +{item}
                          </span>
                        ))}
                        {option.cons.map((item) => (
                          <span key={item} className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">
                            -{item}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-slate-400">预估效果: {option.estimatedEffect}</p>
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  )
}
