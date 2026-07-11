/**
 * storefront-web - 会员等级和积分页面
 * Next.js App Router, 'use client', 暗色主题
 */

'use client';

import { useState } from 'react';
import { PageShell, StatCard, Tabs, DataTable, StatusBadge } from '@m5/ui';

const MEMBER_TIERS = [
  { name: '青铜', minPoints: 0, icon: '🟤', color: '#cd7f32', benefits: ['基础积分累计', '生日优惠'] },
  { name: '白银', minPoints: 1000, icon: '⚪', color: '#c0c0c0', benefits: ['1.2x积分加速', '生日优惠', '优先排队'] },
  { name: '黄金', minPoints: 5000, icon: '🟡', color: '#ffd700', benefits: ['1.5x积分加速', '生日礼包', '优先排队', '专属活动'] },
  { name: '钻石', minPoints: 20000, icon: '💎', color: '#b9f2ff', benefits: ['2x积分加速', '生日大礼包', 'VIP通道', '专属活动', '年度回馈'] },
];

const CURRENT_POINTS = 8750;
const NEXT_TIER = MEMBER_TIERS[2]!; // 黄金
const MAX_POINTS = NEXT_TIER.minPoints - MEMBER_TIERS[1]!.minPoints;
const CURRENT_WITHIN_TIER = CURRENT_POINTS - MEMBER_TIERS[1]!.minPoints;

const EARN_WAYS = [
  { action: '到店消费', points: '¥1=1积分', limit: '无上限' },
  { action: '签到打卡', points: '+5积分/天', limit: '每天1次' },
  { action: '评价晒单', points: '+20积分/次', limit: '每单1次' },
  { action: '推荐好友', points: '+200积分/人', limit: '每月10人' },
  { action: '生日当月', points: '+500积分', limit: '每年1次' },
  { action: '参与活动', points: '+50~500积分', limit: '按活动规则' },
];

const RECENT_TRANSACTIONS = Array.from({ length: 15 }, (_, i) => ({
  id: `TX${String(10000 + i).padStart(5, '0')}`,
  date: new Date(Date.now() - i * 86400000 * 2).toLocaleDateString('zh-CN'),
  description: (['到店消费-游艺区', '签到奖励', '评价晒单', '推荐好友奖励', '到店消费-VR区'] as const)[i % 5]!,
  change: [120, 5, 20, 200, 85, 5, 20, 120, 200, 85, 5, 20, 120, 200, 85][i]!,
  balance: CURRENT_POINTS + [0, -120, -115, -95, 105, -20, -15, 5, -115, 85, -200, -205, -225, -25, 110].slice(0, i + 1).reduce((a, b) => a + b, 0),
}));

const RECENT_REWARDS = [
  { name: '免费游戏券×1', date: '2026-07-10', status: '已领取' },
  { name: '饮品兑换券', date: '2026-07-08', status: '已使用' },
  { name: '双倍积分卡', date: '2026-07-05', status: '已领取' },
  { name: '生日礼品盒', date: '2026-06-15', status: '已领取' },
  { name: '周末畅玩券', date: '2026-06-10', status: '已过期' },
];

export default function LoyaltyPage() {
  const [activeTab, setActiveTab] = useState('tier');
  const [search, setSearch] = useState('');
  const filtered = RECENT_TRANSACTIONS.filter(t => (t.description ?? '').includes(search) || t.id.includes(search));

  return (
    <PageShell title="会员中心" subtitle="等级·积分·权益">
      <div className="grid gap-4 p-4">
        {/* 头部：当前等级 + 积分 */}
        <div className="rounded-lg bg-gray-800/70 p-6 border border-gray-700/50">
          <div className="flex items-center gap-4">
            <span className="text-5xl">{MEMBER_TIERS[1]!.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-white">{MEMBER_TIERS[1]!.name}会员</h2>
                <span className="text-sm text-gray-400">会员编号: M{String(10000 + Math.floor(Math.random() * 90000))}</span>
              </div>
              <div className="mt-2 flex gap-6 text-sm text-gray-300">
                <span>当前积分: <span className="text-xl font-bold text-yellow-400">{CURRENT_POINTS.toLocaleString()}</span></span>
                <span>已升级天数: 187天</span>
                <span>总消费: ¥12,580</span>
              </div>
              {/* 升级进度 */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>距{NEXT_TIER.name}还需 {NEXT_TIER.minPoints - CURRENT_POINTS}积分</span>
                  <span>{Math.round(CURRENT_WITHIN_TIER / MAX_POINTS * 100)}%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full" style={{ width: `${Math.min(100, CURRENT_WITHIN_TIER / MAX_POINTS * 100)}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs
          items={[
            { key: 'tier', label: '会员等级' },
            { key: 'points', label: '积分明细' },
            { key: 'rewards', label: '我的奖励' },
          ]}
          activeKey={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === 'tier' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {MEMBER_TIERS.map(tier => {
              const isCurrent = tier.name === MEMBER_TIERS[1]!.name;
              const isReached = MEMBER_TIERS.indexOf(tier) <= MEMBER_TIERS.indexOf(MEMBER_TIERS[1]!);
              return (
                <div key={tier.name} className={`rounded-lg p-4 border ${isCurrent ? 'border-yellow-500/50 bg-gray-800/90' : 'border-gray-700/50 bg-gray-800/50'}`}>
                  <div className="text-center">
                    <span className="text-4xl">{tier.icon}</span>
                    <h3 className={`text-lg font-bold mt-1 ${isCurrent ? 'text-yellow-400' : 'text-gray-300'}`}>{tier.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">≥{tier.minPoints.toLocaleString()}积分</p>
                    {isCurrent && <span className="inline-block mt-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">当前等级</span>}
                    {isReached && !isCurrent && <span className="inline-block mt-1 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">已解锁</span>}
                    {!isReached && <span className="inline-block mt-1 px-2 py-0.5 bg-gray-600/30 text-gray-500 text-xs rounded">未达成</span>}
                  </div>
                  <ul className="mt-3 space-y-1">
                    {tier.benefits.map((b, i) => (
                      <li key={i} className="text-xs text-gray-400 flex items-center gap-1">
                        <span className="text-green-400">✓</span> {b}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'points' && (
          <div>
            <div className="mb-4">
              <input
                type="text"
                placeholder="搜索积分记录..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full max-w-xs px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <DataTable
              columns={[
                { key: 'date', header: '日期' },
                { key: 'description', header: '说明' },
                { key: 'change', header: '积分变动', render: (row: typeof RECENT_TRANSACTIONS[0], _index: number) => <span className={(row.change ?? 0) > 0 ? 'text-green-400' : 'text-red-400'}>{(row.change ?? 0) > 0 ? `+${row.change}` : row.change}</span> },
                { key: 'balance', header: '余额', render: (row: typeof RECENT_TRANSACTIONS[0], _index: number) => <span className="text-yellow-400">{(row.balance ?? 0).toLocaleString()}</span> },
              ]}
              data={filtered.length > 0 ? filtered : RECENT_TRANSACTIONS}
              rowKey={(row) => row.id}
            />
          </div>
        )}

        {activeTab === 'rewards' && (
          <div className="space-y-3">
            {RECENT_REWARDS.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
                <div>
                  <p className="text-sm text-white">{r.name}</p>
                  <p className="text-xs text-gray-500">{r.date}</p>
                </div>
                <StatusBadge label={r.status} variant={r.status === '已领取' ? 'info' : r.status === '已使用' ? 'default' : 'warning'} />
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
