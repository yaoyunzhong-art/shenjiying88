'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { OrderReviewsSnapshot, ReviewStatus } from './order-reviews-data'

const STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: '待回复',
  replied: '已回复',
  hidden: '已隐藏',
}

export default function OrderReviewsClient({
  snapshot,
}: {
  snapshot: OrderReviewsSnapshot
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('all')
  const [reviews, setReviews] = useState(snapshot.reviews)

  const filteredReviews = useMemo(() => {
    if (statusFilter === 'all') return reviews
    return reviews.filter((item) => item.status === statusFilter)
  }, [reviews, statusFilter])

  const handleReply = (id: string) => {
    setReviews((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status: 'replied', reply: '已收到反馈，我们会继续优化服务。' } : item
      )
    )
  }

  const handleHide = (id: string) => {
    setReviews((current) =>
      current.map((item) => (item.id === id ? { ...item, status: 'hidden' } : item))
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">订单评价管理</h1>
          <p className="mt-1 text-sm text-slate-500">客户端负责状态筛选、回复与隐藏交互。</p>
        </div>
        <button
          type="button"
          onClick={() => startRefresh(() => router.refresh())}
          disabled={isRefreshing}
          className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRefreshing ? '刷新中...' : '刷新快照'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="评价总数" value={reviews.length.toString()} />
        <MetricCard label="待回复" value={reviews.filter((item) => item.status === 'pending').length.toString()} />
        <MetricCard label="低分评价" value={reviews.filter((item) => item.rating <= 2).length.toString()} />
        <MetricCard label="已隐藏" value={reviews.filter((item) => item.status === 'hidden').length.toString()} />
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'replied', 'hidden'] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setStatusFilter(item)}
            className={`rounded-full border px-3 py-1 text-xs ${
              statusFilter === item
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-300 bg-white text-slate-600'
            }`}
          >
            {item === 'all' ? '全部评价' : STATUS_LABELS[item]}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredReviews.map((item) => (
          <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-slate-900">
                  {item.memberName} · {item.productName}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  评分 {item.rating} / 5 · {item.createdAt}
                </div>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
                {STATUS_LABELS[item.status]}
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-700">{item.content}</p>
            <p className="mt-2 text-xs text-slate-500">商家回复: {item.reply ?? '待回复'}</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => handleReply(item.id)}
                className="rounded border border-slate-300 px-3 py-1 text-xs text-slate-600"
              >
                快速回复
              </button>
              <button
                type="button"
                onClick={() => handleHide(item.id)}
                className="rounded border border-slate-300 px-3 py-1 text-xs text-slate-600"
              >
                隐藏评价
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  )
}
