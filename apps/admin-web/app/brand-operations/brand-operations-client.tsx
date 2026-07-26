'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type {
  BrandAssetItem,
  BrandCampaignItem,
  BrandCollaborationItem,
  BrandOperationsSnapshotDelivery,
} from './brand-operations-data'

type BrandTab = 'campaigns' | 'assets' | 'collaborations'

function assetTypeLabel(type: BrandAssetItem['type']): string {
  const map: Record<BrandAssetItem['type'], string> = {
    logo: 'Logo',
    banner: 'Banner',
    video: '视频',
    copy: '文案',
  }
  return map[type]
}

function campaignStatusLabel(status: BrandCampaignItem['status']): string {
  const map: Record<BrandCampaignItem['status'], string> = {
    draft: '草稿',
    pending_review: '待审批',
    approved: '已审批',
    active: '进行中',
    ended: '已结束',
    cancelled: '已取消',
  }
  return map[status]
}

function collaborationStatusLabel(status: BrandCollaborationItem['status']): string {
  const map: Record<BrandCollaborationItem['status'], string> = {
    draft: '草稿',
    negotiating: '洽谈中',
    active: '合作中',
    ended: '已到期',
    terminated: '已终止',
  }
  return map[status]
}

function partnerGradeLabel(grade: BrandCollaborationItem['partner']['grade']): string {
  const map: Record<BrandCollaborationItem['partner']['grade'], string> = {
    platinum: '铂金',
    gold: '黄金',
    silver: '白银',
    bronze: '青铜',
  }
  return map[grade]
}

export default function BrandOperationsClient({
  snapshot,
}: {
  snapshot: BrandOperationsSnapshotDelivery
}) {
  const router = useRouter()
  const [tab, setTab] = useState<BrandTab>('campaigns')
  const [keyword, setKeyword] = useState('')
  const [isRefreshing, startRefresh] = useTransition()

  const summary = useMemo(
    () => ({
      assets: snapshot.assets.length,
      activeAssets: snapshot.assets.filter((item) => item.active).length,
      campaigns: snapshot.campaigns.length,
      activeCampaigns: snapshot.campaigns.filter((item) => item.status === 'active').length,
      collaborations: snapshot.collaborations.length,
      activeCollaborations: snapshot.collaborations.filter((item) => item.status === 'active').length,
    }),
    [snapshot]
  )

  const loweredKeyword = keyword.trim().toLowerCase()

  const filteredAssets = useMemo(
    () =>
      snapshot.assets.filter((item) =>
        !loweredKeyword ||
        item.name.toLowerCase().includes(loweredKeyword) ||
        item.type.toLowerCase().includes(loweredKeyword)
      ),
    [snapshot.assets, loweredKeyword]
  )

  const filteredCampaigns = useMemo(
    () =>
      snapshot.campaigns.filter((item) =>
        !loweredKeyword ||
        item.title.toLowerCase().includes(loweredKeyword) ||
        item.description.toLowerCase().includes(loweredKeyword)
      ),
    [snapshot.campaigns, loweredKeyword]
  )

  const filteredCollaborations = useMemo(
    () =>
      snapshot.collaborations.filter((item) =>
        !loweredKeyword ||
        item.title.toLowerCase().includes(loweredKeyword) ||
        item.partner.name.toLowerCase().includes(loweredKeyword)
      ),
    [snapshot.collaborations, loweredKeyword]
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">品牌运营管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            素材治理 · 活动流转 · 联名合作 · Delivery {snapshot.deliveryMode}
          </p>
        </div>
        <button
          type="button"
          onClick={() => startRefresh(() => router.refresh())}
          disabled={isRefreshing}
          className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRefreshing ? '刷新中...' : '刷新'}
        </button>
      </div>

      {snapshot.error && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <p className="text-sm text-yellow-800">{snapshot.error}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">品牌素材</p>
          <p className="mt-1 text-2xl font-bold">{summary.assets}</p>
          <p className="text-xs text-gray-400">启用 {summary.activeAssets}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">品牌活动</p>
          <p className="mt-1 text-2xl font-bold">{summary.campaigns}</p>
          <p className="text-xs text-gray-400">进行中 {summary.activeCampaigns}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">联名合作</p>
          <p className="mt-1 text-2xl font-bold">{summary.collaborations}</p>
          <p className="text-xs text-gray-400">合作中 {summary.activeCollaborations}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {(['campaigns', 'assets', 'collaborations'] as BrandTab[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`rounded-full border px-4 py-2 text-sm ${
              tab === item ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'
            }`}
          >
            {{ campaigns: '品牌活动', assets: '品牌素材', collaborations: '联名合作' }[item]}
          </button>
        ))}
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="搜索名称、说明或合作方"
          className="ml-auto min-w-[240px] rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
      </div>

      {tab === 'campaigns' && (
        <div className="space-y-3">
          {filteredCampaigns.length === 0 ? (
            <div className="rounded-lg border bg-white p-12 text-center text-sm text-gray-400">
              当前筛选条件下没有品牌活动
            </div>
          ) : (
            filteredCampaigns.map((campaign) => (
              <div key={campaign.id} className="rounded-lg border bg-white p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-medium text-gray-900">{campaign.title}</h2>
                    <p className="mt-1 text-sm text-gray-500">{campaign.description}</p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">
                    {campaignStatusLabel(campaign.status)}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-400">
                  <span>门店 {campaign.storeIds.length} 家</span>
                  <span>{campaign.startDate} ~ {campaign.endDate}</span>
                  <span>创建人 {campaign.createdBy}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'assets' && (
        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3">素材名称</th>
                <th className="px-4 py-3">类型</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">创建时间</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">
                    当前筛选条件下没有品牌素材
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className="border-t">
                    <td className="px-4 py-3 font-medium text-gray-900">{asset.name}</td>
                    <td className="px-4 py-3 text-gray-600">{assetTypeLabel(asset.type)}</td>
                    <td className="px-4 py-3 text-gray-600">{asset.active ? '启用' : '停用'}</td>
                    <td className="px-4 py-3 text-gray-600">{asset.createdAt}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'collaborations' && (
        <div className="space-y-3">
          {filteredCollaborations.length === 0 ? (
            <div className="rounded-lg border bg-white p-12 text-center text-sm text-gray-400">
              当前筛选条件下没有联名合作
            </div>
          ) : (
            filteredCollaborations.map((item) => (
              <div key={item.id} className="rounded-lg border bg-white p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-medium text-gray-900">{item.title}</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      合作方 {item.partner.name} · 联系人 {item.partner.contactName}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700">
                    {collaborationStatusLabel(item.status)}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-400">
                  <span>等级 {partnerGradeLabel(item.partner.grade)}</span>
                  <span>类型 {item.type}</span>
                  <span>{item.startDate} ~ {item.endDate}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
