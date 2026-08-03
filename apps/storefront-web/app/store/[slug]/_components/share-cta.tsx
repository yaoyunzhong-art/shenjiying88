'use client'

// share-cta.tsx · TOC 门店社媒分享组件
// Phase 2B 社媒增长引擎 · 2026-07-26
//
// 5 渠道分享: 微信好友 / 朋友圈 / 抖音 / 小红书 / 微博
// 推广码排行榜: 激励全员营销/KOL推广

import { useState } from 'react'
import {
  Button, Modal, Space, Tag, EmptyState,
  Text, Heading,
} from '@m5/ui'

// ══════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════

export interface ShareChannel {
  id: string
  name: string
  icon: string
  color: string
  action: () => void
}

export interface LeaderboardItem {
  rank: number
  name: string
  scans: number
  conversions: number
}

interface ShareCTAProps {
  storeSlug: string
  storeName: string
  shareType: 'homepage' | 'booking_success' | 'package'
  shareText?: string
  referralCode?: string
  leaderboard?: LeaderboardItem[]
}

// ══════════════════════════════════════════════════════
// Share Channels
// ══════════════════════════════════════════════════════

function buildShareChannels(storeSlug: string, storeName: string, shareText: string, referralCode?: string): ShareChannel[] {
  const ref = referralCode ? `ref=${referralCode}` : ''
  const shareUrl = `https://${storeSlug}.shenjiying.com${ref ? `?${ref}` : ''}`
  const title = shareText || `🔥 ${storeName} — 超赞的电竞体验！`
  const body = `${title}\n${shareUrl}`

  return [
    {
      id: 'wechat',
      name: '微信好友',
      icon: '💬',
      color: '#07C160',
      action: () => {
        if (typeof navigator !== 'undefined' && navigator.share) {
          navigator.share({ title, url: shareUrl }).catch(() => {})
        } else {
          navigator.clipboard?.writeText(body)
        }
      },
    },
    {
      id: 'moments',
      name: '朋友圈',
      icon: '🟢',
      color: '#07C160',
      action: () => {
        navigator.clipboard?.writeText(`${title}\n${shareUrl}`)
      },
    },
    {
      id: 'douyin',
      name: '抖音',
      icon: '🎵',
      color: '#000000',
      action: () => {
        window.open(`https://www.douyin.com/share?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}`, '_blank')
      },
    },
    {
      id: 'xiaohongshu',
      name: '小红书',
      icon: '📕',
      color: '#FF2442',
      action: () => {
        navigator.clipboard?.writeText(`${title}\n#电竞体验 #${storeName} ${shareUrl}`)
      },
    },
    {
      id: 'weibo',
      name: '微博',
      icon: '🧣',
      color: '#E6162D',
      action: () => {
        window.open(`https://service.weibo.com/share/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}`, '_blank')
      },
    },
  ]
}

// ══════════════════════════════════════════════════════
// Sub-components
// ══════════════════════════════════════════════════════

function ShareButton({ storeSlug, storeName, shareType, shareText, referralCode }: ShareCTAProps) {
  const [showModal, setShowModal] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const channels = buildShareChannels(storeSlug, storeName, shareText ?? '', referralCode)

  const handleChannelClick = (ch: ShareChannel) => {
    ch.action()
    setCopiedId(ch.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // 不同场景的 CTA 文案
  const ctaText = shareType === 'booking_success'
    ? '📢 炫耀一下'
    : shareType === 'package'
      ? '分享给朋友'
      : '🔗 分享门店'

  return (
    <>
      <Button variant="ghost" onClick={() => setShowModal(true)}>
        {ctaText}
      </Button>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={`分享 · ${storeName}`}
        footer={null}
        width={420}
      >
        <div style={{ padding: '16px 0' }}>
          <Heading level={4} style={{ marginBottom: 12 }}>
            选择分享渠道
          </Heading>

          <Space direction="horizontal" size="middle" style={{ flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
            {channels.map((ch) => (
              <div
                key={ch.id}
                onClick={() => handleChannelClick(ch)}
                style={{
                  cursor: 'pointer',
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: `2px solid ${ch.color}`,
                  background: copiedId === ch.id ? ch.color + '15' : '#fff',
                  textAlign: 'center',
                  minWidth: 80,
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 4 }}>{ch.icon}</div>
                <Text color={copiedId === ch.id ? 'primary' : 'muted'}>
                  {copiedId === ch.id ? '已复制 ✅' : ch.name}
                </Text>
              </div>
            ))}
          </Space>

          {/* 推广码 */}
          {referralCode && (
            <div
              style={{
                marginTop: 12,
                padding: '10px 14px',
                background: '#f0f6ff',
                borderRadius: 8,
              }}
            >
              <Text color="muted">
                你的推广码：<Tag variant="info">{referralCode}</Tag>
              </Text>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}

// ══════════════════════════════════════════════════════
// Leaderboard
// ══════════════════════════════════════════════════════

function Leaderboard({ items }: { items: LeaderboardItem[] }) {
  if (!items || items.length === 0) {
    return <EmptyState description="暂无排行数据" />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.slice(0, 10).map((item: LeaderboardItem) => (
        <div key={item.rank} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 8, background: '#f8f8f8' }}>
          <Space direction="horizontal" size="small">
            <Tag variant={item.rank <= 3 ? 'warning' : 'default'}>
              {item.rank <= 3 ? ['🥇', '🥈', '🥉'][item.rank - 1] : `#${item.rank}`}
            </Tag>
            <Text>{item.name}</Text>
          </Space>
          <Space direction="horizontal" size="middle">
            <Text color="muted">{item.scans} 次扫码</Text>
            <Text color="muted">{item.conversions} 转化</Text>
          </Space>
        </div>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════
// Main Export
// ══════════════════════════════════════════════════════

export default function ShareCTA(props: ShareCTAProps) {
  const { leaderboard } = props

  return (
    <div>
      <ShareButton {...props} />
      {leaderboard && leaderboard.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <Heading level={5} style={{ marginBottom: 8 }}>
            🏆 推广排行榜
          </Heading>
          <Leaderboard items={leaderboard} />
        </div>
      )}
    </div>
  )
}
