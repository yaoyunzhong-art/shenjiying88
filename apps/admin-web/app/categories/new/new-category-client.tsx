'use client'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

import { useState } from 'react'
import type { NewCategorySnapshot } from './new-category-data'

import { useRouter } from 'next/navigation'

export default function NewCategoryClient({
  snapshot
}: {
  snapshot: NewCategorySnapshot
}) {
  const router = useRouter()
  const { isRefreshing, handleRefresh } = useSnapshotRefresh()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [parentName, setParentName] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = () => {
    if (!name.trim() || !/^[A-Z_]+$/.test(code.trim())) {
      setMessage('请填写分类名称，并使用大写字母加下划线作为编码。')
      return
    }
    setMessage('分类草稿已创建，当前为本地演示提交。')
    router.push('/categories')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">新建分类</h1>
          <p className="mt-1 text-sm text-slate-500">客户端负责表单校验与本地提交反馈。</p>
        </div>
        <button
          type="button"
          onClick={() => handleRefresh()}
          disabled={isRefreshing}
          className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRefreshing ? '刷新中...' : '刷新快照'}
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-600">
            分类名称
            <input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm text-slate-600">
            分类编码
            <input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" placeholder="FACE_CARE" />
          </label>
          <label className="text-sm text-slate-600">
            上级分类
            <select value={parentName} onChange={(event) => setParentName(event.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-2">
              <option value="">无上级分类</option>
              {snapshot.parentOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={handleSubmit} className="rounded bg-slate-900 px-4 py-2 text-sm text-white">
            创建分类
          </button>
          <button type="button" onClick={() => router.push('/categories')} className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700">
            取消
          </button>
        </div>
        {message ? <div className="mt-3 text-sm text-slate-600">{message}</div> : null}
      </div>
    </div>
  )
}
