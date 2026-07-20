'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  PageShell,
  DetailShell,
  StatusBadge,
  DescriptionList,
  Tabs,
} from '@m5/ui';
import type { DescriptionItem } from '@m5/ui';

// ---- 类型 ----

type TeamBuildingStatus = 'upcoming' | 'in_progress' | 'completed' | 'cancelled';

interface TeamBuildingDetail {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  budget: number;
  participants: number;
  maxParticipants: number;
  organizer: string;
  status: TeamBuildingStatus;
  agenda: { time: string; activity: string; lead: string }[];
  notes: string;
}

const STATUS_MAP: Record<TeamBuildingStatus, { label: string; variant: 'info' | 'warning' | 'success' | 'neutral' }> = {
  upcoming: { label: '即将开始', variant: 'info' },
  in_progress: { label: '进行中', variant: 'warning' },
  completed: { label: '已结束', variant: 'success' },
  cancelled: { label: '已取消', variant: 'neutral' },
};

// ---- Mock 数据 ----

const MOCK_TEAM_BUILDING: Record<string, TeamBuildingDetail> = {
  'tb-001': {
    id: 'tb-001',
    title: 'Q3 团队拓展训练',
    description: '第三季度团队建设活动，通过户外拓展训练增强团队凝聚力。',
    date: '2026-08-15',
    location: '深圳大鹏半岛拓展基地',
    budget: 25000,
    participants: 32,
    maxParticipants: 40,
    organizer: '人力资源部',
    status: 'upcoming',
    agenda: [
      { time: '08:00-09:00', activity: '集合出发', lead: '领队' },
      { time: '09:00-10:30', activity: '破冰分组', lead: '教练组' },
      { time: '10:30-12:00', activity: '团队挑战赛', lead: '教练组' },
      { time: '12:00-13:30', activity: '午餐休息', lead: '后勤组' },
      { time: '13:30-16:00', activity: '高空拓展项目', lead: '专业教练' },
      { time: '16:00-17:00', activity: '总结分享', lead: 'HR负责人' },
    ],
    notes: '请穿运动服和运动鞋，如有特殊情况请提前报备。',
  },
  'tb-002': {
    id: 'tb-002',
    title: '年中团建聚餐',
    description: '2026 年年中团建聚餐，庆祝上半年业绩达成。',
    date: '2026-07-25',
    location: '海景大酒店 · 宴会厅',
    budget: 15000,
    participants: 28,
    maxParticipants: 30,
    organizer: '行政部',
    status: 'upcoming',
    agenda: [
      { time: '18:00-18:30', activity: '签到入场', lead: '行政部' },
      { time: '18:30-19:00', activity: '领导致辞', lead: '总经理' },
      { time: '19:00-20:30', activity: '晚宴 & 抽奖', lead: '主持人' },
      { time: '20:30-21:00', activity: '自由交流', lead: '-' },
    ],
    notes: '如有饮食禁忌请提前告知。',
  },
  'tb-003': {
    id: 'tb-003',
    title: 'Q2 团队海滩派对',
    description: '第二季度团建海滩烧烤派对，放松身心，增进团队感情。',
    date: '2026-06-20',
    location: '大梅沙海滨公园',
    budget: 20000,
    participants: 35,
    maxParticipants: 35,
    organizer: '市场部',
    status: 'completed',
    agenda: [
      { time: '14:00-15:00', activity: '沙滩排球', lead: '体育委员' },
      { time: '15:00-17:00', activity: '自由活动', lead: '-' },
      { time: '17:00-20:00', activity: '烧烤派对', lead: '后勤组' },
      { time: '20:00-21:00', activity: '篝火晚会', lead: '主持人' },
    ],
    notes: '注意防晒，请自带泳衣和换洗衣物。',
  },
};

// ---- 组件 ----

export default function TeamBuildingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<TeamBuildingDetail | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const timer = setTimeout(() => {
      const found = MOCK_TEAM_BUILDING[id] ?? null;
      if (!found) {
        setError('团建活动不存在');
      } else {
        setDetail(found);
      }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [id]);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>数据获取失败: {error}</div>;
  if (!detail) return <div>暂无数据</div>;

  const statusInfo = STATUS_MAP[detail.status];

  const detailItems: DescriptionItem[] = [
    { label: '团建主题', value: detail.title },
    { label: '日期', value: detail.date },
    { label: '地点', value: detail.location },
    { label: '预算', value: `¥${detail.budget.toLocaleString()}` },
    { label: '参与人数', value: `${detail.participants} / ${detail.maxParticipants} 人` },
    { label: '组织者', value: detail.organizer },
    { label: '备注', value: detail.notes },
  ];

  return (
    <PageShell title={detail.title} subtitle={detail.status === 'completed' ? '已结束' : detail.status === 'upcoming' ? '即将开始' : '进行中'}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <DetailShell
          title={detail.title}
          actions={[
            {
              key: 'back',
              label: '← 返回列表',
              variant: 'primary',
              onClick: () => router.push('/team-building'),
            },
          ]}
        >
          {/* 状态与基本信息 */}
          <div
            style={{
              borderRadius: 12,
              border: '1px solid rgba(148,163,184,0.12)',
              overflow: 'hidden',
              marginBottom: 16,
            }}
          >
            <div
              style={{
                padding: '10px 16px',
                fontSize: 12,
                color: '#94a3b8',
                borderBottom: '1px solid rgba(148,163,184,0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>基本信息</span>
              <StatusBadge label={statusInfo.label} variant={statusInfo.variant} />
            </div>
            <div style={{ padding: 16 }}>
              <DescriptionList items={detailItems} columns={2} />
            </div>
          </div>

          {/* 活动描述 */}
          <div
            style={{
              borderRadius: 12,
              border: '1px solid rgba(148,163,184,0.12)',
              overflow: 'hidden',
              marginBottom: 16,
            }}
          >
            <div
              style={{
                padding: '10px 16px',
                fontSize: 12,
                color: '#94a3b8',
                borderBottom: '1px solid rgba(148,163,184,0.08)',
              }}
            >
              活动描述
            </div>
            <div style={{ padding: '12px 16px', fontSize: 13, color: '#e2e8f0', lineHeight: 1.6 }}>
              {detail.description}
            </div>
          </div>

          {/* 议程 Tabs */}
          <Tabs
            items={[
              { key: 'agenda', label: '日程安排' },
              { key: 'notes', label: '注意事项' },
            ]}
            activeKey={activeTab}
            onChange={setActiveTab}
          />

          {activeTab === 'agenda' && (
            <div
              style={{
                borderRadius: 12,
                border: '1px solid rgba(148,163,184,0.12)',
                overflow: 'hidden',
                marginTop: 12,
              }}
            >
              <div
                style={{
                  padding: '10px 16px',
                  fontSize: 12,
                  color: '#94a3b8',
                  borderBottom: '1px solid rgba(148,163,184,0.08)',
                }}
              >
                详细日程
              </div>
              {detail.agenda.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    padding: '10px 16px',
                    borderBottom: '1px solid rgba(148,163,184,0.08)',
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      minWidth: 110,
                      fontSize: 13,
                      color: '#3b82f6',
                      fontVariantNumeric: 'tabular-nums',
                      fontWeight: 500,
                    }}
                  >
                    {item.time}
                  </div>
                  <div style={{ flex: 1, fontSize: 13, color: '#e2e8f0' }}>{item.activity}</div>
                  <div style={{ minWidth: 80, fontSize: 12, color: '#64748b', textAlign: 'right' }}>
                    {item.lead}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'notes' && (
            <div
              style={{
                borderRadius: 12,
                border: '1px solid rgba(148,163,184,0.12)',
                overflow: 'hidden',
                marginTop: 12,
                padding: 16,
              }}
            >
              <p style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.6, margin: 0 }}>
                {detail.notes}
              </p>
            </div>
          )}
        </DetailShell>
      </div>
    </PageShell>
  );
}
