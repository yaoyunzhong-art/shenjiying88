/**
 * H5活动详情页面 - Campaign Detail Page (H5端)
 * Phase-FP T-FP-029 · 2026-07-03
 * 角色视角: 👤 会员
 * 功能: 查看活动详情、参与活动
 */

'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { campaignService, type Campaign, TYPE_CONFIG, STATUS_CONFIG } from '../../../../lib/campaign-service';
import {
  getMainContainerStyle,
  getCardStyle,
  H5NavBar,
  COLOR_TEXT_PRIMARY,
  COLOR_TEXT_SECONDARY,
  COLOR_TEXT_MUTED,
  COLOR_ACCENT,
} from '../../h5-style';

export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [campaign, setCampaign] = React.useState<Campaign | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      const result = await campaignService.getCampaignDetail(id);
      if (result.success && result.data) {
        setCampaign(result.data);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <main style={getMainContainerStyle()}>
        <div style={{ textAlign: 'center', padding: 48, color: COLOR_TEXT_MUTED }}>
          加载中...
        </div>
        <H5NavBar activeKey="home" />
      </main>
    );
  }

  if (!campaign) {
    return (
      <main style={getMainContainerStyle()}>
        <div style={{ textAlign: 'center', padding: 48, color: COLOR_TEXT_MUTED }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 16, marginBottom: 16 }}>活动不存在或已下架</div>
          <Link
            href="/h5/campaigns"
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              background: 'rgba(99,102,241,0.2)',
              color: COLOR_ACCENT,
              textDecoration: 'none',
              fontSize: 14,
            }}
          >
            返回活动列表
          </Link>
        </div>
        <H5NavBar activeKey="home" />
      </main>
    );
  }

  const status = STATUS_CONFIG[campaign.status];
  const type = TYPE_CONFIG[campaign.type];

  return (
    <main style={{ ...getMainContainerStyle(), paddingBottom: 100 }}>
      {/* Banner */}
      <div
        style={{
          height: 200,
          background: `linear-gradient(135deg, ${status.color}30 0%, ${status.color}10 100%)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <span style={{ fontSize: 64, marginBottom: 12 }}>🎁</span>
        <span
          style={{
            padding: '4px 12px',
            borderRadius: 12,
            background: `${status.color}20`,
            color: status.color,
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          {status.label}
        </span>
      </div>

      {/* 内容 */}
      <div style={{ padding: 20, marginTop: -20 }}>
        {/* 卡片 */}
        <div style={{ ...getCardStyle({ padding: 20 }), marginBottom: 16 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: COLOR_TEXT_PRIMARY, marginBottom: 8 }}>{campaign.title}</h1>
          <p style={{ fontSize: 14, color: COLOR_TEXT_SECONDARY, marginBottom: 12 }}>{campaign.subtitle}</p>
          <div style={{ fontSize: 13, color: COLOR_TEXT_MUTED }}>
            📅 {campaign.startDate} - {campaign.endDate}
          </div>
        </div>

        {/* 活动简介 */}
        <div style={{ ...getCardStyle({ padding: 20 }), marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: COLOR_TEXT_PRIMARY, marginBottom: 12 }}>活动简介</h2>
          <p style={{ fontSize: 14, color: COLOR_TEXT_SECONDARY, lineHeight: 1.8 }}>{campaign.description}</p>
        </div>

        {/* 活动标签 */}
        <div style={{ ...getCardStyle({ padding: 20 }), marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: COLOR_TEXT_PRIMARY, marginBottom: 12 }}>活动标签</h2>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {campaign.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  padding: '4px 10px',
                  borderRadius: 4,
                  background: `${type.color}20`,
                  color: type.color,
                  fontSize: 12,
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 底部操作 */}
      {campaign.status !== 'ended' && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '12px 16px',
            background: 'rgba(15,23,42,0.95)',
            borderTop: '1px solid rgba(148,163,184,0.1)',
            display: 'flex',
            gap: 12,
          }}
        >
          <button
            onClick={() => router.push('/h5/campaigns')}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 8,
              background: 'rgba(148,163,184,0.1)',
              border: '1px solid rgba(148,163,184,0.2)',
              color: COLOR_TEXT_SECONDARY,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            返回
          </button>
          <button
            style={{
              flex: 2,
              padding: 12,
              borderRadius: 8,
              background: 'rgba(99,102,241,0.2)',
              border: '1px solid rgba(99,102,241,0.4)',
              color: COLOR_ACCENT,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {campaign.status === 'upcoming' ? '活动即将开始' : '立即参与'}
          </button>
        </div>
      )}

      <H5NavBar activeKey="home" />
    </main>
  );
}
