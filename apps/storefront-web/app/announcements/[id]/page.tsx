'use client'

/**
 * 公告详情页 — Announcement Detail
 * 功能: 阅读公告内容+相关公告推荐+已读标记
 * 状态: SSR渲染 + 客户端增强
 */

import { useState } from 'react'

interface Announcement {
  id: string
  title: string
  content: string
  category: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  publishedAt: string
  author: string
  readCount: number
  tags: string[]
}

const MOCK_ANNOUNCEMENTS: Record<string, Announcement> = {
  '001': {
    id: '001',
    title: '暑期大促活动规则更新',
    content: '各位同事，暑期大促活动规则已更新。主要变化包括：\n1. 满减活动门槛从300元降至198元\n2. 新增亲子套餐优惠\n3. 会员日奖励翻倍\n\n请各门店在7月20日前完成培训。',
    category: '运营通知',
    priority: 'high',
    publishedAt: '2026-07-15',
    author: '运营部',
    readCount: 156,
    tags: ['促销', '规则更新', '暑期'],
  },
  '002': {
    id: '002',
    title: '系统维护通知：7月18日凌晨',
    content: '神机营系统将于7月18日凌晨2:00-5:00进行例行维护。维护期间，收银系统、会员系统将暂停服务。\n\n请各门店提前做好准备：\n- 提前结算当日营收\n- 告知夜间值班员工\n- 维护后检查系统功能',
    category: '系统通知',
    priority: 'urgent',
    publishedAt: '2026-07-14',
    author: '技术部',
    readCount: 342,
    tags: ['维护', '系统'],
  },
  '003': {
    id: '003',
    title: '新员工入职培训安排（7月第三批）',
    content: '7月第三批新员工入职培训安排如下：\n时间：7月20-22日 9:00-18:00\n地点：总部培训中心\n\n请各部门确认参训名单。',
    category: '人事通知',
    priority: 'normal',
    publishedAt: '2026-07-13',
    author: '人事部',
    readCount: 89,
    tags: ['培训', '人事'],
  },
}

const PRIORITY_STYLES: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

const PRIORITY_LABELS: Record<string, string> = {
  low: '低', normal: '普通', high: '重要', urgent: '紧急',
}

export default function AnnouncementDetailPage({ params }: { params: { id: string } }) {
  const announcement = MOCK_ANNOUNCEMENTS[params.id]
  const [marked, setMarked] = useState(false)

  if (!announcement) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="text-5xl mb-4">📢</div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">公告未找到</h2>
        <p className="text-sm text-gray-500 mb-4">ID "{params.id}" 不存在或已下架</p>
        <a href="/announcements" className="text-blue-600 text-sm hover:underline">← 返回公告列表</a>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* 返回 */}
      <a href="/announcements" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">← 返回公告列表</a>

      {/* 标题区 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-400">{announcement.category}</span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_STYLES[announcement.priority]}`}>
            {PRIORITY_LABELS[announcement.priority]}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{announcement.title}</h1>
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
          <span>{announcement.author}</span>
          <span>{announcement.publishedAt}</span>
          <span>{announcement.readCount} 人已读</span>
        </div>
      </div>

      {/* 内容 */}
      <div className="prose prose-sm max-w-none mb-8">
        {announcement.content.split('\n').map((line, i) => (
          line.startsWith('-') ? (
            <li key={i} className="text-sm text-gray-700 ml-4">{line.slice(1).trim()}</li>
          ) : line.match(/^\d+\./) ? (
            <li key={i} className="text-sm text-gray-700 ml-4">{line}</li>
          ) : (
            <p key={i} className="text-sm text-gray-700">{line || '\u00A0'}</p>
          )
        ))}
      </div>

      {/* 标签 */}
      <div className="flex flex-wrap gap-2 mb-6">
        {announcement.tags.map((tag) => (
          <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">{tag}</span>
        ))}
      </div>

      {/* 已读标记 */}
      <div className="border-t pt-4">
        <button
          onClick={() => setMarked(true)}
          disabled={marked}
          className={`px-4 py-2 rounded text-sm ${
            marked ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {marked ? '✅ 标记为已读' : '标记为已读'}
        </button>
      </div>

      {/* 加载态模拟 */}
      {!announcement && (
        <div className="space-y-4 py-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-gray-200 rounded animate-pulse w-full" />
          ))}
        </div>
      )}
    </div>
  )
}
