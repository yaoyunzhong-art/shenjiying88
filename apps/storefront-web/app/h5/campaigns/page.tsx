/**
 * H5活动列表页面 - Campaigns Page (H5端)
 * Phase-FP T-FP-029 · 2026-07-03
 * 角色视角: 👤 会员
 * 功能: 查看营销活动列表
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { campaignService, type Campaign, type CampaignStatus, TYPE_CONFIG, STATUS_CONFIG } from '../../../lib/campaign-service';
import {
  getMainContainerStyle,
  getToggleChipStyle,
  getCardStyle,
  getEmptyStateStyle,
  getEmptyStateEmojiStyle,
  H5Header,
  H5NavBar,
  COLOR_TEXT_PRIMARY,
  COLOR_TEXT_SECONDARY,
  COLOR_TEXT_MUTED,
} from '../h5-style';

export default function H5CampaignsPage() {
  const [filter, setFilter] = useState<'ALL' | CampaignStatus>('ALL');
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    setLoading(true);
    const result = await campaignService.getCampaigns();
    if (result.success && result.data) {
      setCampaigns(result.data.campaigns);
    }
    setLoading(false);
  }

  const filtered = campaigns.filter((c) => {
    if (filter === 'ALL') return true;
    return c.status === filter;
  });

  return (
    <main style={getMainContainerStyle()}>
      {/* 头部 */}
      <H5Header title="活动中心" marginBottom={12}>
        {/* 筛选 */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          {[
            { key: 'ALL', label: '全部' },
            { key: 'ongoing', label: '进行中' },
            { key: 'upcoming', label: '即将开始' },
            { key: 'ended', label: '已结束' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key as typeof filter)}
              style={getToggleChipStyle(filter === item.key, { whiteSpace: 'nowrap' })}
            >
              {item.label}
            </button>
          ))}
        </div>
      </H5Header>

      {/* 活动列表 */}
      <section style={{ padding: 16 }}>
        {filtered.length === 0 ? (
          <div style={getEmptyStateStyle()}>
            <div style={getEmptyStateEmojiStyle()}>🎁</div>
            <div>暂无活动</div>
          </div>
        ) : (
          filtered.map((campaign) => {
            const status = STATUS_CONFIG[campaign.status];
            const type = TYPE_CONFIG[campaign.type];

            return (
              <Link
                key={campaign.id}
                href={`/h5/campaigns/${campaign.id}`}
                style={{ textDecoration: 'none', marginBottom: 12, display: 'block' }}
              >
                <article
                  style={{
                    ...getCardStyle({ overflow: 'hidden' }),
                    opacity: campaign.status === 'ended' ? 0.6 : 1,
                  }}
                >
                  {/* Banner区 */}
                  <div
                    style={{
                      height: 120,
                      background: `linear-gradient(135deg, ${type.color}30 0%, ${type.color}10 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ fontSize: 48 }}>🎁</span>
                  </div>

                  {/* 内容区 */}
                  <div style={{ padding: 16 }}>
                    {/* 标签 */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: `${type.color}20`,
                        color: type.color,
                        fontSize: 11,
                        fontWeight: 500,
                      }}>
                        {type.label}
                      </span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: status.bg,
                        color: status.color,
                        fontSize: 11,
                      }}>
                        {status.label}
                      </span>
                    </div>

                    {/* 标题 */}
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: COLOR_TEXT_PRIMARY, marginBottom: 4 }}>
                      {campaign.title}
                    </h3>
                    <p style={{ fontSize: 13, color: COLOR_TEXT_SECONDARY, marginBottom: 8 }}>
                      {campaign.subtitle}
                    </p>

                    {/* 时间 */}
                    <div style={{ fontSize: 12, color: COLOR_TEXT_MUTED }}>
                      {campaign.startDate} - {campaign.endDate}
                    </div>

                    {/* 标签 */}
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      {campaign.tags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            padding: '2px 8px',
                            borderRadius: 4,
                            background: 'rgba(148,163,184,0.1)',
                            color: COLOR_TEXT_SECONDARY,
                            fontSize: 11,
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              </Link>
            );
          })
        )}
      </section>

      <H5NavBar activeKey="home" />
    </main>
  );
}
