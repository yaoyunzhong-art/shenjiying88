/**
 * inspection/page.tsx — 设备巡检表单页 (表单页含验证/提交/错误处理)
 *
 * 功能: 门店选择 + 巡检类型 + 逐项评定 + 签字确认 + 提交
 */
'use client'

import React, { useCallback, useState } from 'react'
import { Alert } from '@m5/ui'
import {
  MOCK_STORES,
  DEFAULT_INSPECTION_ITEMS,
  INSPECTION_TYPE_LABELS,
  CATEGORY_LABELS,
  RESULT_LABELS,
  RESULT_COLORS,
  validateInspectionForm,
  submitInspectionForm,
  type InspectionFormData,
  type InspectionType,
  type InspectionItem,
  type InspectionResult,
  type FormValidationErrors,
} from './form-data'

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

export default function InspectionFormPage() {
  const [storeId, setStoreId] = useState('')
  const [inspectorName, setInspectorName] = useState('')
  const [inspectionType, setInspectionType] = useState<InspectionType>('daily')
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().slice(0, 10))
  const [items, setItems] = useState<InspectionItem[]>(DEFAULT_INSPECTION_ITEMS)
  const [overallRemark, setOverallRemark] = useState('')
  const [signature, setSignature] = useState('')
  const [errors, setErrors] = useState<FormValidationErrors | null>(null)
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle')
  const [submitMessage, setSubmitMessage] = useState('')

  const selectedStore = MOCK_STORES.find((s) => s.id === storeId)

  const updateItemResult = useCallback((itemId: string, result: InspectionResult) => {
    setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, result } : item)))
  }, [])

  const updateItemRemark = useCallback((itemId: string, remark: string) => {
    setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, remark } : item)))
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    const formData: InspectionFormData = {
      storeId,
      storeName: selectedStore?.name ?? '',
      inspectorName,
      inspectionType,
      inspectionDate,
      items,
      overallRemark,
      signature,
    }

    const validationErrors = validateInspectionForm(formData)
    setErrors(validationErrors)
    if (validationErrors) {
      return
    }

    setSubmitStatus('submitting')
    setSubmitMessage('')

    try {
      const result = await submitInspectionForm(formData)
      if (result.success) {
        setSubmitStatus('success')
        setSubmitMessage(result.message)
      } else {
        setSubmitStatus('error')
        setSubmitMessage(result.message)
      }
    } catch {
      setSubmitStatus('error')
      setSubmitMessage('提交异常：请检查网络后重试')
    }
  }, [storeId, selectedStore, inspectorName, inspectionType, inspectionDate, items, overallRemark, signature])

  const handleReset = useCallback(() => {
    setStoreId('')
    setInspectorName('')
    setInspectionType('daily')
    setInspectionDate(new Date().toISOString().slice(0, 10))
    setItems(DEFAULT_INSPECTION_ITEMS)
    setOverallRemark('')
    setSignature('')
    setErrors(null)
    setSubmitStatus('idle')
    setSubmitMessage('')
  }, [])

  // 按类别分组
  const groupedItems = items.reduce<Record<string, InspectionItem[]>>((acc, item) => {
    const cat = item.category
    if (!acc[cat]) acc[cat] = []
    acc[cat]!.push(item)
    return acc
  }, {})

  if (submitStatus === 'success') {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">
        <div className="max-w-md w-full bg-white/5 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">提交成功</h2>
          <p className="text-gray-400 mb-6">{submitMessage}</p>
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            继续新建巡检
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* 顶部导航 */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">设备巡检单</h1>
          <p className="text-sm text-gray-400 mt-0.5">填写巡检信息并逐项评定设备状态</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-1.5 text-sm border border-white/20 rounded-lg hover:bg-white/5 transition-colors"
          >
            重置
          </button>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="p-6 max-w-3xl mx-auto space-y-6">
        {/* 全局错误 */}
        {errors?.overall && (
          <Alert variant="danger" title="表单验证失败">{errors.overall}</Alert>
        )}

        {/* 基本信息 */}
        <section className="bg-white/5 rounded-lg p-5 border border-white/10">
          <h2 className="text-base font-semibold mb-4 text-blue-300">基本信息</h2>
          <div className="grid grid-cols-2 gap-4">
            {/* 门店 */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">门店 *</label>
              <select
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                className={`w-full bg-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors?.storeId ? 'ring-2 ring-red-500' : ''
                }`}
              >
                <option value="">请选择门店</option>
                {MOCK_STORES.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {errors?.storeId && <p className="text-red-400 text-xs mt-1">{errors.storeId}</p>}
            </div>

            {/* 巡检类型 */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">巡检类型 *</label>
              <select
                value={inspectionType}
                onChange={(e) => setInspectionType(e.target.value as InspectionType)}
                className={`w-full bg-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors?.inspectionType ? 'ring-2 ring-red-500' : ''
                }`}
              >
                {(Object.keys(INSPECTION_TYPE_LABELS) as InspectionType[]).map((t) => (
                  <option key={t} value={t}>{INSPECTION_TYPE_LABELS[t]}</option>
                ))}
              </select>
              {errors?.inspectionType && <p className="text-red-400 text-xs mt-1">{errors.inspectionType}</p>}
            </div>

            {/* 巡检人 */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">巡检人 *</label>
              <input
                value={inspectorName}
                onChange={(e) => setInspectorName(e.target.value)}
                placeholder="请输入姓名"
                className={`w-full bg-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors?.inspectorName ? 'ring-2 ring-red-500' : ''
                }`}
              />
              {errors?.inspectorName && <p className="text-red-400 text-xs mt-1">{errors.inspectorName}</p>}
            </div>

            {/* 日期 */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">巡检日期 *</label>
              <input
                type="date"
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                className={`w-full bg-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors?.inspectionDate ? 'ring-2 ring-red-500' : ''
                }`}
              />
              {errors?.inspectionDate && <p className="text-red-400 text-xs mt-1">{errors.inspectionDate}</p>}
            </div>
          </div>
        </section>

        {/* 巡检项目 */}
        <section className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-base font-semibold text-blue-300">巡检项目</h2>
            {errors?.items && <p className="text-red-400 text-xs">{errors.items}</p>}
          </div>

          {Object.entries(groupedItems).map(([category, catItems]) => (
            <div key={category} className="border-b border-white/5 last:border-b-0">
              <div className="px-5 py-2 bg-white/[0.03] text-sm text-gray-500 font-medium">
                {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category}
              </div>
              {catItems.map((item) => (
                <div key={item.id} className="px-5 py-3 border-b border-white/5 last:border-b-0">
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-sm flex-1">{item.label}</span>
                    <div className="flex gap-1.5 shrink-0">
                      {(Object.keys(RESULT_LABELS) as InspectionResult[]).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => updateItemResult(item.id, r)}
                          className={`px-2.5 py-1 text-xs rounded transition-colors ${
                            item.result === r
                              ? `bg-${RESULT_COLORS[r]}/20 text-white border border-${RESULT_COLORS[r]}/40`
                              : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                          }`}
                          style={
                            item.result === r
                              ? { backgroundColor: `${RESULT_COLORS[r]}22`, borderColor: `${RESULT_COLORS[r]}55` }
                              : undefined
                          }
                        >
                          {RESULT_LABELS[r]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    value={item.remark}
                    onChange={(e) => updateItemRemark(item.id, e.target.value)}
                    placeholder="备注（可选）"
                    className="mt-2 w-full bg-white/[0.06] rounded px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  />
                </div>
              ))}
            </div>
          ))}
        </section>

        {/* 总体备注 */}
        <section className="bg-white/5 rounded-lg p-5 border border-white/10">
          <h2 className="text-base font-semibold mb-3 text-blue-300">总体备注</h2>
          <textarea
            value={overallRemark}
            onChange={(e) => setOverallRemark(e.target.value)}
            placeholder="可填写巡检总体评价、重点问题等..."
            rows={3}
            className="w-full bg-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </section>

        {/* 签字 */}
        <section className="bg-white/5 rounded-lg p-5 border border-white/10">
          <h2 className="text-base font-semibold mb-3 text-blue-300">巡检人签字</h2>
          <input
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder="手写签名（键盘输入模拟）"
            className="w-full bg-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-[cursive]"
          />
        </section>

        {/* 错误提示 */}
        {submitStatus === 'error' && (
          <Alert variant="danger" title="提交失败">{submitMessage}</Alert>
        )}

        {/* 提交按钮 */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-6 py-2.5 border border-white/20 rounded-lg text-sm hover:bg-white/5 transition-colors"
          >
            重置表单
          </button>
          <button
            type="submit"
            disabled={submitStatus === 'submitting'}
            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            {submitStatus === 'submitting' ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                提交中...
              </>
            ) : (
              '提交巡检单'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
