// share-cta.tsx · TOC 分享裂变组件
// Phase 2B 社媒增长引擎 · 2026-07-26
//
// 宪法§15.3: 分享克制 — 每日最多1次
// 宪法§13.8: 推广归因透明 — 扫码无感，不骚扰
//
// 使用已有组件:
//  - PerformanceRanking (来自 @m5/ui) — 推广排行榜
//  - 其他自定义分享 UI

'use client'

import { useState, useCallback } from 'react'
import { Button, Text, Space, Heading, Card, Tag, useToast, ToastContainer, PerformanceRanking } from '@m5/ui'
import { track } from './analytics'

interface ShareProps {
  storeSlug: string
  storeName: string
  referralCode?: string
}

const SHARE_CHANNELS = [
  { id: 'wechat', name: '微信', icon: '💬' },
  { id: 'moments', name: '朋友圈', icon: '🟢' },
  { id: 'douyin', name: '抖音', icon: '🎵' },
  { id: 'xiaohongshu', name: '小红书', icon: '📕' },
  { id: 'copy_link', name: '复制链接', icon: '🔗' },
]

const POSTER_TEMPLATES = [
  { id: 'store_entrance', name: '门店入口' },
  { id: 'service_hot', name: '热门项目' },
  { id: 'event_invite', name: '活动邀请' },
]

export function ShareCTA({ storeSlug, storeName, referralCode }: ShareProps) {
  const { toast, toasts, dismiss } = useToast()
  const [showPanel, setShowPanel] = useState(false)
  const [lastShareDate, setLastShareDate] = useState('')
  const [showPosterMaker, setShowPosterMaker] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const canShareToday = lastShareDate !== today
  const shareUrl = `https://${storeSlug}.shenjiying.com${referralCode ? `?ref=${referralCode}` : ''}`
  const shareTitle = `我在${storeName}玩了超赞的电竞体验！🔥`
  const shareDesc = `${storeName} — 数字运动潮玩空间，电竞/VR/亲子/团建一站搞定！`

  const handleShare = useCallback(async (channel: string) => {
    if (!canShareToday && channel !== 'copy_link') {
      toast('今日分享已达上限（每日1次）', { variant: 'warning' }); return
    }
    track('share_start', { storeSlug })
    try {
      if (channel === 'copy_link') {
        await navigator.clipboard.writeText(shareUrl)
        toast('链接已复制！', { variant: 'success' })
      } else if (navigator.share) {
        await navigator.share({ title: shareTitle, text: shareDesc, url: shareUrl })
      } else {
        await navigator.clipboard.writeText(`${shareTitle}\n\n${shareDesc}\n\n${shareUrl}`)
        toast('文案已复制，打开App粘贴即可', { variant: 'success' })
      }
      track('share_complete')
      setLastShareDate(today)
    } catch {
      // 用户取消分享
    }
  }, [canShareToday, shareUrl, shareTitle, shareDesc, storeSlug, today, toast])

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      {/* Floating share button */}
      <div style={{ position: 'fixed', bottom: 100, right: 20, zIndex: 99 }}>
        {!showPanel && (
          <Button variant="primary" onClick={() => setShowPanel(true)}
            style={{ width: 56, height: 56, borderRadius: '50%', fontSize: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
            📤
          </Button>
        )}
      </div>

      {/* Share panel */}
      {showPanel && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderRadius: '16px 16px 0 0', boxShadow: '0 -4px 20px rgba(0,0,0,0.1)', zIndex: 100, padding: '24px 24px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Heading level={3}>分享给好友</Heading>
            <Button variant="ghost" onClick={() => setShowPanel(false)}>✕</Button>
          </div>

          {!canShareToday && (
            <div style={{ background: '#fff3e0', padding: 8, borderRadius: 8, marginBottom: 12, textAlign: 'center' }}>
              <Text color="primary">今日分享已用完（每日1次），明天再来！</Text>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 20 }}>
            {SHARE_CHANNELS.map(ch => (
              <div key={ch.id} onClick={() => handleShare(ch.id)} style={{ textAlign: 'center', cursor: 'pointer' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 4 }}>
                  {ch.icon}
                </div>
                <Text>{ch.name}</Text>
              </div>
            ))}
          </div>

          <Card style={{ marginBottom: 12 }}>
            <div style={{ padding: 16, cursor: 'pointer' }} onClick={() => setShowPosterMaker(!showPosterMaker)}>
              <Space direction="horizontal" size="small" style={{ justifyContent: 'space-between' }}>
                <div>
                  <Text weight="bold">🎨 生成专属海报</Text>
                  <br /><Text color="muted">定制推广海报</Text>
                </div>
                <Text>{showPosterMaker ? '▲' : '▼'}</Text>
              </Space>
            </div>
            {showPosterMaker && (
              <div style={{ padding: '0 16px 16px', display: 'flex', gap: 8 }}>
                {POSTER_TEMPLATES.map(t => (
                  <div key={t.id} style={{ width: 100, padding: 8, border: '1px solid #eee', borderRadius: 8, textAlign: 'center', cursor: 'pointer' }}>
                    <div style={{ width: 80, height: 100, background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 4, margin: '0 auto 8px' }} />
                    <Text>{t.name}</Text>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div style={{ background: '#e8f5e9', padding: 12, borderRadius: 8 }}>
            <Text>🎁 分享后自动获得优惠券 · 好友消费你也可获得成长值</Text>
          </div>
        </div>
      )}

      {showPanel && <div onClick={() => setShowPanel(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', zIndex: 99 }} />}
    </>
  )
}

// ── 推广排行榜 — 使用已有的 PerformanceRanking 组件 ───────────

interface InviteRankingProps {
  storeSlug: string
}

const MOCK_RANKING = [
  { rank: 1, id: 'EMP001', name: '小陈·朝阳店长', value: 23, unit: '单', tag: '员工', tagColor: '#1677ff' },
  { rank: 2, id: 'KOL001', name: '@电竞阿杰', value: 18, unit: '单', tag: 'KOL', tagColor: '#ff4d4f' },
  { rank: 3, id: 'KOL002', name: '@亲子玩乐日记', value: 12, unit: '单', tag: 'KOL', tagColor: '#ff4d4f' },
  { rank: 4, id: 'CUST001', name: '运动达人小王', value: 7, unit: '单', tag: '客户', tagColor: '#52c41a' },
  { rank: 5, id: 'EMP003', name: '小李·朝阳店', value: 5, unit: '单', tag: '员工', tagColor: '#1677ff' },
]

export function InviteRanking({ storeSlug }: InviteRankingProps) {
  return (
    <PerformanceRanking
      title="推广排行榜（本月）"
      data={MOCK_RANKING}
      valueLabel="推广单数"
      limit={5}
      emptyText="暂无推广数据"
    />
  )
}
