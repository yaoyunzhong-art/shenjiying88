'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ContractsSnapshotDelivery, ContractTabKey } from './contracts-data'
import {
  CONTRACT_STATUS_LABEL,
  CONTRACT_TYPE_LABEL,
  filterContracts,
  formatContractAmount,
  formatContractDate,
  isContractExpiringSoon,
  mockCommentContract,
  mockSignContract,
  summarizeContracts,
} from './contracts-data'

export default function ContractsClient({
  snapshot,
}: {
  snapshot: ContractsSnapshotDelivery
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [tabKey, setTabKey] = useState<ContractTabKey>('all')
  const [contracts, setContracts] = useState(snapshot.contracts)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [submittingId, setSubmittingId] = useState<string | null>(null)

  const filteredContracts = useMemo(() => filterContracts(contracts, tabKey), [contracts, tabKey])
  const stats = useMemo(() => summarizeContracts(contracts), [contracts])

  async function handleSign(id: string) {
    setSubmittingId(id)
    const result = await mockSignContract(id)
    if (result.ok) {
      setContracts((current) =>
        current.map((contract) =>
          contract.id === id
            ? { ...contract, status: 'in_progress', signedAt: result.signedAt }
            : contract,
        ),
      )
    }
    setSubmittingId(null)
  }

  async function handleComment(id: string) {
    const draft = drafts[id]?.trim()
    if (!draft) return
    setSubmittingId(id)
    const result = await mockCommentContract(id, draft)
    if (result.ok) {
      setContracts((current) =>
        current.map((contract) =>
          contract.id === id ? { ...contract, comment: result.comment } : contract,
        ),
      )
      setDrafts((current) => ({ ...current, [id]: '' }))
    }
    setSubmittingId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">合同管理</h1>
          <p className="mt-1 text-sm text-slate-500">首屏读取服务端快照，签署与备注仍是客户端假写链路。</p>
        </div>
        <button
          type="button"
          onClick={() => startRefresh(() => router.refresh())}
          disabled={isRefreshing}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRefreshing ? '刷新中...' : '刷新'}
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-slate-500">总合同数</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{stats.total}</div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-xs text-amber-700">待签</div>
          <div className="mt-2 text-2xl font-semibold text-amber-900">{stats.pendingSign}</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-xs text-emerald-700">执行中</div>
          <div className="mt-2 text-2xl font-semibold text-emerald-900">{stats.inProgress}</div>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <div className="text-xs text-rose-700">已到期</div>
          <div className="mt-2 text-2xl font-semibold text-rose-900">{stats.expired}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all' as const, label: '全部' },
          { key: 'pending_sign' as const, label: '待签' },
          { key: 'in_progress' as const, label: '执行中' },
          { key: 'expired' as const, label: '已到期' },
        ].map((tab) => {
          const active = tabKey === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setTabKey(tab.key)}
              className={active ? 'rounded-full bg-slate-900 px-4 py-2 text-sm text-white' : 'rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700'}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="grid gap-4">
        {filteredContracts.map((contract) => (
          <div key={contract.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-lg font-semibold text-slate-900">{contract.title}</div>
                <div className="mt-1 text-sm text-slate-500">{contract.id} · {CONTRACT_TYPE_LABEL[contract.type]}</div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{CONTRACT_STATUS_LABEL[contract.status]}</span>
                {isContractExpiringSoon(contract.expiresAt) && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">即将到期</span>
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4 text-sm">
              <div className="text-slate-600">甲方: {contract.partyA}</div>
              <div className="text-slate-600">乙方: {contract.partyB}</div>
              <div className="text-slate-600">金额: {formatContractAmount(contract.amount)}</div>
              <div className="text-slate-600">签署日期: {formatContractDate(contract.signedAt)}</div>
              <div className="text-slate-600">到期日期: {formatContractDate(contract.expiresAt)}</div>
              <div className="text-slate-600">最近更新: {formatContractDate(contract.updatedAt)}</div>
              <div className="md:col-span-2 text-slate-600">描述: {contract.description}</div>
            </div>

            {contract.comment && (
              <div className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                备注: {contract.comment}
              </div>
            )}

            <div className="mt-4 grid gap-3 lg:grid-cols-[auto,1fr,auto]">
              {contract.status === 'pending_sign' ? (
                <button
                  type="button"
                  onClick={() => handleSign(contract.id)}
                  disabled={submittingId === contract.id}
                  className="rounded-md bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-60"
                >
                  {submittingId === contract.id ? '签署中...' : '签署'}
                </button>
              ) : (
                <div className="text-sm text-slate-400">当前状态不可再次签署</div>
              )}
              <textarea
                value={drafts[contract.id] ?? ''}
                onChange={(event) =>
                  setDrafts((current) => ({ ...current, [contract.id]: event.target.value }))
                }
                placeholder="补充合同备注..."
                className="min-h-20 rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => handleComment(contract.id)}
                disabled={submittingId === contract.id || !(drafts[contract.id] ?? '').trim()}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 disabled:opacity-60"
              >
                提交备注
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
