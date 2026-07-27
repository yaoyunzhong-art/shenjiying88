'use client'

import Link from 'next/link'
import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { CategoryDetailSnapshot } from './category-detail-data'

export default function CategoryDetailClient({
  snapshot,
}: {
  snapshot: CategoryDetailSnapshot
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [message, setMessage] = useState('')
  const [name, setName] = useState(snapshot.item?.name ?? '')
  const [sortOrder, setSortOrder] = useState(snapshot.item?.sortOrder ?? 0)
  const [status, setStatus] = useState(snapshot.item?.status ?? 'active')

  useEffect(() => {
    setName(snapshot.item?.name ?? '')
    setSortOrder(snapshot.item?.sortOrder ?? 0)
    setStatus(snapshot.item?.status ?? 'active')
    setMessage('')
  }, [snapshot])

  if (!snapshot.item) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <div className="text-lg font-medium text-slate-900">分类未找到</div>
        <p className="mt-2 text-sm text-slate-500">该分类不存在或已被删除。</p>
        <Link href="/categories" className="mt-4 inline-flex rounded border border-slate-300 px-4 py-2 text-sm text-slate-700">
          返回分类列表
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{snapshot.item.name}</h1>
          <p className="mt-1 text-sm text-slate-500">客户端负责本地编辑草稿、状态切换与返回动作。</p>
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

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-600">
              分类名称
              <input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
            </label>
            <label className="text-sm text-slate-600">
              排序权重
              <input type="number" value={sortOrder} onChange={(event) => setSortOrder(Number(event.target.value))} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
            </label>
            <label className="text-sm text-slate-600">
              分类状态
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-2">
                <option value="active">active</option>
                <option value="inactive">inactive</option>
                <option value="pending">pending</option>
              </select>
            </label>
            <div className="text-sm text-slate-600">
              上级分类
              <div className="mt-1 rounded border border-slate-200 bg-slate-50 px-3 py-2">{snapshot.item.parentName ?? '—'}</div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => setMessage('分类草稿已保存')} className="rounded bg-slate-900 px-4 py-2 text-sm text-white">
              保存修改
            </button>
            <button type="button" onClick={() => setStatus(status === 'active' ? 'inactive' : 'active')} className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700">
              切换状态
            </button>
            <button type="button" onClick={() => router.push('/categories')} className="rounded border border-rose-300 px-4 py-2 text-sm text-rose-700">
              删除并返回
            </button>
          </div>
          {message ? <div className="mt-3 text-sm text-emerald-600">{message}</div> : null}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-base font-semibold text-slate-900">子分类</h2>
          <div className="mt-4 space-y-3">
            {snapshot.children.length === 0 ? (
              <div className="text-sm text-slate-500">暂无子分类</div>
            ) : (
              snapshot.children.map((child) => (
                <div key={child.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="font-medium text-slate-900">{child.name}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {child.code} · 商品数 {child.productCount}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
