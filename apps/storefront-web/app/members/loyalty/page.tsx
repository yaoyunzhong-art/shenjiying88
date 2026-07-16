/**
 * 会员等级积分 — Loyalty (storefront-web)
 * 角色视角: 👤会员 / 👔店长
 * 功能: 等级展示、积分明细、积分获取攻略、奖励中心、升级进度、空/错状态、统计面板
 */
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { PageShell, StatusBadge } from '@m5/ui';

/* ── 等级定义 ── */
const MEMBER_TIERS = [
  { name: '青铜', minPoints: 0, icon: '🟤', color: '#cd7f32', benefits: ['基础积分累计', '生日优惠', '免费WiFi'] },
  { name: '白银', minPoints: 1000, icon: '⚪', color: '#c0c0c0', benefits: ['1.2x积分加速', '生日优惠', '优先排队', '每月1张游戏券'] },
  { name: '黄金', minPoints: 5000, icon: '🟡', color: '#ffd700', benefits: ['1.5x积分加速', '生日礼包', '优先排队', '专属活动', '每月3张游戏券'] },
  { name: '钻石', minPoints: 20000, icon: '💎', color: '#b9f2ff', benefits: ['2x积分加速', '生日大礼包', 'VIP通道', '专属活动', '年度回馈', '1v1客服'] },
];

const CURRENT_POINTS = 8750;
const CURRENT_TIER_INDEX = 1; // 白银
const CURRENT_TIER = MEMBER_TIERS[CURRENT_TIER_INDEX]!;
const NEXT_TIER = MEMBER_TIERS[Math.min(CURRENT_TIER_INDEX + 1, MEMBER_TIERS.length - 1)]!;
const TIER_RANGE = NEXT_TIER ? NEXT_TIER.minPoints - CURRENT_TIER.minPoints : 0;
const TIER_PROGRESS = NEXT_TIER ? (CURRENT_POINTS - CURRENT_TIER.minPoints) / TIER_RANGE : 1;

/* ── Mock 数据 ── */
const EARN_WAYS = [
  { action: '到店消费', points: '¥1 = 1积分', limit: '无上限', bonus: '' },
  { action: '签到打卡', points: '+5积分/天', limit: '每天1次', bonus: '连续7天额外+20' },
  { action: '评价晒单', points: '+20积分/次', limit: '每单1次', bonus: '带图评价额外+10' },
  { action: '推荐好友', points: '+200积分/人', limit: '每月10人', bonus: '好友首消额外+50' },
  { action: '生日当月', points: '+500积分', limit: '每年1次', bonus: '当日消费3倍积分' },
  { action: '参与活动', points: '+50~500积分', limit: '按活动规则', bonus: '' },
];

interface TxRecord { id: string; date: string; description: string; change: number; balance: number; type: 'earn' | 'spend'; }
const RECENT_TRANSACTIONS: TxRecord[] = Array.from({ length: 20 }, (_, i) => ({
  id: `TX${String(10000 + i).padStart(5, '0')}`,
  date: new Date(Date.now() - i * 86400000 * 2).toLocaleDateString('zh-CN'),
  description: (['到店消费-游艺区', '签到奖励', '评价晒单', '推荐好友奖励', '到店消费-VR区', '生日双倍积分', '活动奖励', '兑换优惠券'] as const)[i % 8]!,
  change: [120, 5, 20, 200, 85, 200, 100, -100, 120, 5, 20, 200, 85, 200, 100, -100, 120, 5, 20, 200][i]!,
  balance: 8750 + [0, -120, -115, -95, 105, -20, 180, 280, 180, 300, 295, 315, 515, 600, 800, 900, 800, 920, 915, 935].slice(0, i + 1).reduce((a, b) => a + b, 0),
  type: (['earn', 'earn', 'earn', 'earn', 'earn', 'earn', 'earn', 'spend', 'earn', 'earn', 'earn', 'earn', 'earn', 'earn', 'earn', 'spend', 'earn', 'earn', 'earn', 'earn'] as const)[i]!,
}));

const RECENT_REWARDS = [
  { name: '免费游戏券×1', date: '2026-07-10', status: '已领取', points: -200 },
  { name: '饮品兑换券', date: '2026-07-08', status: '已使用', points: -150 },
  { name: '双倍积分卡', date: '2026-07-05', status: '已领取', points: -500 },
  { name: '生日礼品盒', date: '2026-06-15', status: '已领取', points: 0 },
  { name: '周末畅玩券', date: '2026-06-10', status: '已过期', points: -300 },
  { name: '游戏币加赠包', date: '2026-06-05', status: '已使用', points: -400 },
  { name: '会员专属折扣卡', date: '2026-05-28', status: '已领取', points: -100 },
  { name: '亲子套餐券', date: '2026-05-20', status: '已过期', points: -250 },
];

const TYPE_LABELS: Record<string, string> = { earn: '获得', spend: '支出' };
const TYPE_COLORS: Record<string, string> = { earn: '#22c55e', spend: '#ef4444' };
const STATUS_LABELS: Record<string, string> = { '已领取': '领取', '已使用': '使用', '已过期': '过期' };

/* ── 子组件: 等级卡片列表 ── */
function TierCards() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
      {MEMBER_TIERS.map((tier, idx) => {
        const isCurrent = idx === CURRENT_TIER_INDEX;
        const isReached = idx <= CURRENT_TIER_INDEX;
        return (
          <div key={tier.name} style={{
            padding: 16, borderRadius: 12,
            background: isCurrent ? '#fefce8' : '#f9fafb',
            border: isCurrent ? '2px solid #f59e0b' : '1px solid #e5e7eb',
            position: 'relative',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36 }}>{tier.icon}</div>
              <h3 style={{ margin: '6px 0 2px', fontSize: 16, fontWeight: 700, color: isCurrent ? '#d97706' : '#374151' }}>
                {tier.name}
              </h3>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>
                ≥{tier.minPoints.toLocaleString()}积分
              </div>
              {isCurrent && (
                <span style={{ padding: '1px 8px', borderRadius: 8, background: '#fef3c7', color: '#d97706', fontSize: 10, fontWeight: 600 }}>
                  当前等级
                </span>
              )}
              {isReached && !isCurrent && (
                <span style={{ padding: '1px 8px', borderRadius: 8, background: '#dcfce7', color: '#16a34a', fontSize: 10, fontWeight: 600 }}>
                  已解锁 ✓
                </span>
              )}
              {!isReached && (
                <span style={{ padding: '1px 8px', borderRadius: 8, background: '#f3f4f6', color: '#9ca3af', fontSize: 10, fontWeight: 600 }}>
                  未达成
                </span>
              )}
            </div>
            <ul style={{ margin: '10px 0 0', padding: 0, listStyle: 'none', fontSize: 12, color: '#6b7280' }}>
              {tier.benefits.map((b, i) => (
                <li key={i} style={{ padding: '2px 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: '#22c55e' }}>✓</span> {b}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

/* ── 子组件: 积分获取攻略 ── */
function EarnGuide() {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ marginTop: 12, padding: 14, borderRadius: 12, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1d4ed8' }}>📋 积分获取攻略</h3>
        <button onClick={() => setExpanded(!expanded)}
          style={{ padding: '3px 10px', borderRadius: 6, border: '1px solid #93c5fd', background: '#fff', color: '#2563eb', cursor: 'pointer', fontSize: 11 }}>
          {expanded ? '收起' : '展开详情'}
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
        {EARN_WAYS.map((way, i) => (
          <div key={i} style={{
            padding: 10, borderRadius: 8, background: '#fff',
            border: '1px solid #e5e7eb', fontSize: 12,
          }}>
            <div style={{ fontWeight: 600, color: '#374151', marginBottom: 2 }}>{way.action}</div>
            <div style={{ color: '#059669', fontWeight: 500 }}>{way.points}</div>
            <div style={{ color: '#6b7280', fontSize: 11 }}>限制: {way.limit}</div>
            {expanded && way.bonus && (
              <div style={{ color: '#d97706', fontSize: 11, marginTop: 2 }}>🎁 {way.bonus}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 子组件: 升级进度预测 ── */
function ProgressPredictor() {
  const dailyEarn = [5, 5, 120, 5, 5, 120, 5]; // 周签到+消费模式
  const avgDaily = dailyEarn.reduce((a, b) => a + b, 0) / dailyEarn.length;
  const remaining = NEXT_TIER ? NEXT_TIER.minPoints - CURRENT_POINTS : 0;
  const estimatedDays = Math.ceil(remaining / avgDaily);

  return (
    <div style={{
      marginTop: 12, padding: 14, borderRadius: 12,
      background: '#f0fdf4', border: '1px solid #bbf7d0',
    }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: '#16a34a' }}>📈 升级预测</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
        <div style={{ padding: 8, background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#6b7280' }}>距{NEXT_TIER?.name}</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#16a34a' }}>{remaining.toLocaleString()}</div>
          <div style={{ fontSize: 10, color: '#6b7280' }}>积分</div>
        </div>
        <div style={{ padding: 8, background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#6b7280' }}>日均获取</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#2563eb' }}>~{Math.round(avgDaily)}</div>
          <div style={{ fontSize: 10, color: '#6b7280' }}>积分/天</div>
        </div>
        <div style={{ padding: 8, background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#6b7280' }}>预计升级</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#d97706' }}>~{estimatedDays}</div>
          <div style={{ fontSize: 10, color: '#6b7280' }}>天后</div>
        </div>
        <div style={{ padding: 8, background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#6b7280' }}>进度</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#6366f1' }}>{Math.round(TIER_PROGRESS * 100)}%</div>
          <div style={{ fontSize: 10, color: '#6b7280' }}>完成度</div>
        </div>
      </div>
    </div>
  );
}

/* ── 子组件: 奖励卡片 ── */
function RewardCard({ reward, index }: { reward: typeof RECENT_REWARDS[0]; index: number }) {
  const statusColor = reward.status === '已领取' ? '#2563eb' : reward.status === '已使用' ? '#6b7280' : '#f59e0b';
  const statusBg = reward.status === '已领取' ? '#eff6ff' : reward.status === '已使用' ? '#f3f4f6' : '#fef3c7';

  return (
    <div key={index} style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 14px', borderRadius: 10,
      background: '#fff', border: '1px solid #f3f4f6', marginBottom: 6,
    }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>{reward.name}</div>
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
          {reward.date} {reward.points !== 0 && `· ${reward.points > 0 ? '+' : ''}${reward.points}积分`}
        </div>
      </div>
      <span style={{
        padding: '2px 8px', borderRadius: 8,
        background: statusBg, color: statusColor,
        fontSize: 11, fontWeight: 600,
      }}>
        {reward.status}
      </span>
    </div>
  );
}

/* ── 主组件 ── */
export default function LoyaltyPage() {
  const [activeTab, setActiveTab] = useState('tier');
  const [search, setSearch] = useState('');
  const [showError, setShowError] = useState(false);
  const [showPredictor, setShowPredictor] = useState(false);
  const [rewardFilter, setRewardFilter] = useState('全部');

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return RECENT_TRANSACTIONS.filter(t => {
      if (kw && !t.description.toLowerCase().includes(kw) && !t.id.toLowerCase().includes(kw)) return false;
      return true;
    });
  }, [search]);

  const filteredRewards = useMemo(() => {
    if (rewardFilter === '全部') return RECENT_REWARDS;
    return RECENT_REWARDS.filter(r => r.status === rewardFilter);
  }, [rewardFilter]);

  // 统计
  const stats = useMemo(() => {
    const totalEarn = RECENT_TRANSACTIONS.filter(t => t.type === 'earn').reduce((s, t) => s + t.change, 0);
    const totalSpend = RECENT_TRANSACTIONS.filter(t => t.type === 'spend').reduce((s, t) => s + Math.abs(t.change), 0);
    return { totalEarn, totalSpend, net: totalEarn - Math.abs(totalSpend), count: RECENT_TRANSACTIONS.length };
  }, []);

  const TABS = [
    { key: 'tier', label: '会员等级' },
    { key: 'points', label: '积分明细' },
    { key: 'rewards', label: '我的奖励' },
  ];

  return (
    <PageShell title="会员中心" description="会员等级·积分·权益">
      <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
        {/* 错误状态 */}
        {showError && (
          <div style={{ padding: 16, marginBottom: 16, borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca' }}>
            <div style={{ color: '#dc2626', fontWeight: 600, marginBottom: 4 }}>⚠️ 加载失败</div>
            <div style={{ color: '#fca5a5', fontSize: 13 }}>会员数据加载异常，请稍后刷新重试</div>
            <button onClick={() => setShowError(false)}
              style={{ marginTop: 8, padding: '4px 12px', borderRadius: 6, border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontSize: 12 }}>
              重试
            </button>
          </div>
        )}

        {/* 头部: 当前等级 + 积分 */}
        <div style={{
          marginBottom: 16, padding: 18, borderRadius: 14,
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          border: '1px solid #475569',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 48 }}>{CURRENT_TIER.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#fff' }}>{CURRENT_TIER.name}会员</h2>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                  编号: M{String(10000 + Math.floor(Math.random() * 90000))}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 13, color: '#cbd5e1', flexWrap: 'wrap' }}>
                <span>当前积分: <span style={{ fontSize: 18, fontWeight: 700, color: '#fbbf24' }}>{CURRENT_POINTS.toLocaleString()}</span></span>
                <span>已升级: 187天</span>
                <span>总消费: ¥12,580</span>
              </div>
              {/* 升级进度条 */}
              <div style={{ marginTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
                  <span>距{NEXT_TIER?.name}: 还需{(NEXT_TIER?.minPoints || 0) - CURRENT_POINTS}积分</span>
                  <span>{Math.round(TIER_PROGRESS * 100)}%</span>
                </div>
                <div style={{ height: 6, background: '#475569', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3,
                    background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                    width: `${Math.min(100, TIER_PROGRESS * 100)}%`,
                  }} />
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowPredictor(!showPredictor)}
              style={{
                padding: '6px 12px', borderRadius: 8, border: '1px solid #64748b',
                background: 'transparent', color: '#cbd5e1', cursor: 'pointer', fontSize: 11,
              }}>
              {showPredictor ? '收起' : '📈 预测'}
            </button>
          </div>
          {showPredictor && <ProgressPredictor />}
        </div>

        {/* 错误状态模拟 */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          <button onClick={() => setShowError(!showError)}
            style={{
              padding: '4px 12px', borderRadius: 6,
              background: '#fef2f2', border: '1px solid #fecaca',
              color: '#dc2626', fontSize: 11, cursor: 'pointer',
            }}>
            {showError ? '恢复数据' : '模拟错误'}
          </button>
        </div>

        {/* Tab 切换 */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 14, borderBottom: '2px solid #e5e7eb', paddingBottom: 4 }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '8px 18px', borderRadius: '8px 8px 0 0',
                border: 'none', background: activeTab === tab.key ? '#2563eb' : 'transparent',
                color: activeTab === tab.key ? '#fff' : '#6b7280',
                cursor: 'pointer', fontSize: 13, fontWeight: activeTab === tab.key ? 600 : 400,
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: 会员等级 */}
        {activeTab === 'tier' && (
          <>
            <TierCards />
            <EarnGuide />
          </>
        )}

        {/* Tab: 积分明细 */}
        {activeTab === 'points' && (
          <>
            {/* 统计摘要 */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
              marginBottom: 12,
            }}>
              <div style={{ padding: 10, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#16a34a' }}>累计获得</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#15803d' }}>+{stats.totalEarn.toLocaleString()}</div>
              </div>
              <div style={{ padding: 10, background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#dc2626' }}>累计支出</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#b91c1c' }}>-{stats.totalSpend.toLocaleString()}</div>
              </div>
              <div style={{ padding: 10, background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#2563eb' }}>净积分</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1d4ed8' }}>{stats.net.toLocaleString()}</div>
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <input
                placeholder="🔍 搜索积分记录..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: 10,
                  border: '1px solid #d1d5db', color: '#374151', fontSize: 13, outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {filtered.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '40px 20px',
                borderRadius: 12, border: '1px dashed #d1d5db', background: '#f9fafb',
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                <div style={{ color: '#6b7280', fontSize: 14 }}>暂无匹配记录</div>
              </div>
            ) : (
              <div>
                {filtered.map(tx => (
                  <div key={tx.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', borderRadius: 10,
                    background: '#fff', border: '1px solid #f3f4f6', marginBottom: 4,
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          padding: '1px 5px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                          background: `${TYPE_COLORS[tx.type]}18`, color: TYPE_COLORS[tx.type],
                        }}>{TYPE_LABELS[tx.type]}</span>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{tx.description}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{tx.date} · {tx.id}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: tx.change > 0 ? '#059669' : '#dc2626' }}>
                        {tx.change > 0 ? '+' : ''}{tx.change}
                      </div>
                      <div style={{ fontSize: 10, color: '#9ca3af' }}>余额 {tx.balance.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 8, fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>
              共 {RECENT_TRANSACTIONS.length} 条记录
            </div>
          </>
        )}

        {/* Tab: 我的奖励 */}
        {activeTab === 'rewards' && (
          <>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              {['全部', '已领取', '已使用', '已过期'].map(s => (
                <button key={s} onClick={() => setRewardFilter(s)}
                  style={{
                    padding: '5px 12px', borderRadius: 8,
                    border: '1px solid', borderColor: rewardFilter === s ? '#2563eb' : '#d1d5db',
                    background: rewardFilter === s ? '#eff6ff' : '#fff',
                    color: rewardFilter === s ? '#2563eb' : '#374151',
                    cursor: 'pointer', fontSize: 12, fontWeight: rewardFilter === s ? 600 : 400,
                  }}>
                  {s}
                </button>
              ))}
            </div>

            {filteredRewards.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '40px 20px',
                borderRadius: 12, border: '1px dashed #d1d5db', background: '#f9fafb',
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎁</div>
                <div style={{ color: '#6b7280', fontSize: 14 }}>暂无奖励记录</div>
              </div>
            ) : (
              filteredRewards.map((r, i) => <RewardCard key={i} reward={r} index={i} />)
            )}

            {/* 可兑换奖励 */}
            <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#fffbeb', border: '1px solid #fde68a' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#92400e' }}>🎯 可兑换奖励</h4>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                您有 {CURRENT_POINTS.toLocaleString()} 积分可兑换以下奖励:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8, marginTop: 8 }}>
                {[
                  { name: '免费游戏券', cost: 200 },
                  { name: '饮品兑换券', cost: 150 },
                  { name: '双倍积分卡', cost: 500 },
                  { name: '游戏币加赠包', cost: 400 },
                  { name: 'VIP体验券', cost: 800 },
                ].map((item, i) => {
                  const affordable = CURRENT_POINTS >= item.cost;
                  return (
                    <div key={i} style={{
                      padding: 10, borderRadius: 8,
                      background: affordable ? '#fff' : '#f3f4f6',
                      border: `1px solid ${affordable ? '#d1d5db' : '#e5e7eb'}`,
                      opacity: affordable ? 1 : 0.6,
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: affordable ? '#374151' : '#9ca3af' }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: affordable ? '#059669' : '#9ca3af', marginTop: 2 }}>
                        {item.cost}积分 {!affordable && '(积分不足)'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 可兑换商品分类 */}
            <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#166534' }}>🏷️ 可兑换商品分类</h4>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { name: '游戏时长', icon: '🎮', minPoints: 500, count: 12 },
                  { name: '零食饮品', icon: '🍿', minPoints: 200, count: 18 },
                  { name: '周边礼品', icon: '🎁', minPoints: 1000, count: 8 },
                  { name: '优惠券', icon: '🎟️', minPoints: 100, count: 25 },
                  { name: 'VIP体验', icon: '👑', minPoints: 5000, count: 3 },
                  { name: '生日礼包', icon: '🎂', minPoints: 300, count: 6 },
                ].map((cat, i) => (
                  <div key={i} style={{ flex: '1 1 100px', padding: 10, borderRadius: 8, background: '#fff', border: '1px solid #dcfce7', textAlign: 'center' }}>
                    <div style={{ fontSize: 18 }}>{cat.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#166534', marginTop: 2 }}>{cat.name}</div>
                    <div style={{ fontSize: 12, color: '#059669' }}>{cat.count}种</div>
                    <div style={{ fontSize: 10, color: '#9ca3af' }}>{cat.minPoints}分起</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 会员消费偏好 */}
            <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#ecfeff', border: '1px solid #a5f3fc' }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#0e7490' }}>📊 本月会员消费偏好</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
                {[
                  { label: '兑换次数', value: '345次', trend: '+12%' },
                  { label: '使用会员', value: '128人', trend: '+8%' },
                  { label: '平均消费', value: '¥85/次', trend: '+5%' },
                  { label: '最受欢迎', value: '游戏时长', trend: '42%占比' },
                ].map((s, i) => (
                  <div key={i} style={{ padding: 10, borderRadius: 8, background: '#fff', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{s.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#0e7490' }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: '#059669' }}>{s.trend}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 会员升级提醒 */}
            <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#fff7ed', border: '1px solid #fed7aa' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#9a3412' }}>🎯 离升级还差一步</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[
                  { name: '张小美', current: '银卡', next: '金卡', need: 380, progress: 62, color: '#f59e0b' },
                  { name: '王大伟', current: '金卡', next: '钻石', need: 1250, progress: 75, color: '#06b6d4' },
                  { name: 'Lisa', current: '钻石', next: '至尊', need: 4800, progress: 76, color: '#a855f7' },
                ].map((u, i) => (
                  <div key={i} style={{ padding: '8px 12px', borderRadius: 8, background: '#fff', border: '1px solid #fed7aa', fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                      <span style={{ color: u.color }}>{u.current} → {u.next}</span>
                    </div>
                    <div style={{ marginBottom: 2, fontSize: 11, color: '#6b7280' }}>还需 {u.need} 积分</div>
                    <div style={{ height: 6, borderRadius: 3, background: '#e5e7eb', overflow: 'hidden' }}>
                      <div style={{ width: `${u.progress}%`, height: '100%', borderRadius: 3, background: u.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 积分排行榜 */}
            <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#fff7ed', border: '1px solid #fed7aa' }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#9a3412' }}>🏅 积分排行榜</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { rank: 1, name: '张伟', points: 48500, tier: '至尊' },
                  { rank: 2, name: '李芳', points: 32200, tier: '至尊' },
                  { rank: 3, name: '王强', points: 21500, tier: '钻石' },
                  { rank: 4, name: '赵敏', points: 18900, tier: '钻石' },
                  { rank: 5, name: '陈浩', points: 14200, tier: '钻石' },
                ].map((u, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, color: u.rank <= 3 ? '#d97706' : '#6b7280', minWidth: 20 }}>#{u.rank}</span>
                      <span style={{ fontWeight: 500 }}>{u.name}</span>
                      <span style={{ fontSize: 11, color: '#6366f1' }}>{u.tier}</span>
                    </div>
                    <span style={{ fontWeight: 700, color: '#d97706' }}>{u.points.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    

            {/* 积分获取渠道分析 */}
            <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#fefce8', border: '1px solid #fde047' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#713f12' }}>⚡ 积分获取渠道分析 (本月)</h4>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { channel: '游戏消费', icon: '🎮', points: 125000, pct: 45, color: '#eab308' },
                  { channel: '签到奖励', icon: '📅', points: 42000, pct: 15, color: '#3b82f6' },
                  { channel: '活动赠送', icon: '🎪', points: 56000, pct: 20, color: '#22c55e' },
                  { channel: '推荐好友', icon: '👥', points: 28000, pct: 10, color: '#a855f7' },
                  { channel: '其他', icon: '📌', points: 28000, pct: 10, color: '#f97316' },
                ].map(function(ch, i) {
                  return (
                    <div key={i} style={{ flex: '1 1 100px', padding: 10, borderRadius: 8, background: '#fff', border: '1px solid #fef08a', textAlign: 'center' }}>
                      <div style={{ fontSize: 16 }}>{ch.icon}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#713f12', marginTop: 2 }}>{ch.channel}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#854d0e' }}>{(ch.points / 10000).toFixed(1)}<span style={{ fontSize: 9, fontWeight: 400 }}>w</span></div>
                      <div style={{ marginTop: 2, height: 4, borderRadius: 2, background: '#e5e7eb', overflow: 'hidden' }}>
                        <div style={{ width: ch.pct.toString() + '%', height: '100%', borderRadius: 2, background: ch.color }} />
                      </div>
                      <div style={{ fontSize: 9, color: '#9ca3af' }}>{ch.pct}%</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 潜在流失会员预警 */}
            <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#991b1b' }}>⚠️ 潜在流失会员预警（近30天未活跃）</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[
                  { name: '刘萍', level: '银卡', days: 28, lastActivity: '兑换积分', points: 1200, risk: '高', score: 85 },
                  { name: '周华', level: '金卡', days: 25, lastActivity: '游戏消费', points: 3800, risk: '中', score: 62 },
                  { name: '吴静', level: '普通', days: 30, lastActivity: '注册', points: 50, risk: '高', score: 90 },
                  { name: '郑明', level: '银卡', days: 22, lastActivity: '签到', points: 800, risk: '中', score: 58 },
                  { name: '孙丽', level: '钻石', days: 20, lastActivity: '领取生日礼包', points: 12000, risk: '低', score: 35 },
                ].map(function(m, i) {
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderRadius: 6, background: '#fff', border: '1px solid #fecaca' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 600, color: '#374151' }}>{m.name}</span>
                        <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: m.level === '钻石' ? '#fffbeb' : m.level === '金卡' ? '#fef9c3' : '#f3f4f6', color: m.level === '钻石' ? '#b45309' : m.level === '金卡' ? '#854d0e' : '#6b7280' }}>{m.level}</span>
                        <span style={{ color: '#6b7280' }}>未活跃 {m.days}天</span>
                        <span style={{ color: '#9ca3af' }}>{m.lastActivity}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 10, color: '#9ca3af' }}>{m.points}分</span>
                        <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: m.risk === '高' ? '#fef2f2' : m.risk === '中' ? '#fff7ed' : '#f0fdf4', color: m.risk === '高' ? '#dc2626' : m.risk === '中' ? '#d97706' : '#16a34a' }}>{m.risk} ({m.score})</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

        {/* 会员等级分布图 */}
        <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#5b21b6' }}>🏅 会员等级分布</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[
              { tier: '钻石', icon: '💎', count: 125, pct: 5, color: '#b9f2ff', textColor: '#1e3a5f' },
              { tier: '金卡', icon: '🟡', count: 375, pct: 15, color: '#ffd700', textColor: '#92400e' },
              { tier: '银卡', icon: '⚪', count: 875, pct: 35, color: '#c0c0c0', textColor: '#374151' },
              { tier: '普通', icon: '🟤', count: 1125, pct: 45, color: '#cd7f32', textColor: '#6b7280' },
            ].map(function(t, i) {
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 6, background: '#fff', border: '1px solid #e5e7eb' }}>
                  <span style={{ fontSize: 16 }}>{t.icon}</span>
                  <span style={{ fontWeight: 600, width: 40, fontSize: 12, color: t.textColor }}>{t.tier}</span>
                  <div style={{ flex: 1, height: 8, borderRadius: 4, background: '#e5e7eb', overflow: 'hidden' }}>
                    <div style={{ width: t.pct + '%', height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, ' + t.color + ', ' + t.textColor + ')' }} />
                  </div>
                  <span style={{ fontWeight: 600, fontSize: 12, color: '#5b21b6' }}>{t.pct}%</span>
                  <span style={{ fontSize: 10, color: '#9ca3af' }}>{t.count}人</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 会员生命周期阶段分析 */}
        <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#f0f9ff', border: '1px solid #bae6fd' }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#0369a1' }}>🌱 会员生命周期阶段</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {[
              { stage: '新客', icon: '🌟', count: 320, pct: 13, color: '#22c55e', desc: '注册30天内' },
              { stage: '活跃', icon: '🔥', count: 1020, pct: 42, color: '#3b82f6', desc: '近30天有消费' },
              { stage: '沉默', icon: '💤', count: 680, pct: 28, color: '#f59e0b', desc: '30-90天未消费' },
              { stage: '流失', icon: '💔', count: 415, pct: 17, color: '#ef4444', desc: '超90天未消费' },
            ].map(function(s, i) {
              return (
                <div key={i} style={{ padding: 12, borderRadius: 8, background: '#fff', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 18 }}>{s.icon}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{s.stage}</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.pct}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: '#e5e7eb', overflow: 'hidden', marginBottom: 2 }}>
                    <div style={{ width: s.pct + '%', height: '100%', borderRadius: 3, background: s.color }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9ca3af' }}>
                    <span>{s.count}人</span>
                    <span>{s.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 权益使用排名 */}
        <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#fff7ed', border: '1px solid #fed7aa' }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#9a3412' }}>🎫 权益使用排名</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[
              { rank: 1, name: '免费停车', icon: '🚗', used: 685, total: 2500, rate: 27.4, trend: '+5.2%' },
              { rank: 2, name: '双倍积分', icon: '⚡', used: 520, total: 2500, rate: 20.8, trend: '+3.1%' },
              { rank: 3, name: '优先预约', icon: '📅', used: 380, total: 2500, rate: 15.2, trend: '+8.7%' },
              { rank: 4, name: '生日礼包', icon: '🎂', used: 215, total: 2500, rate: 8.6, trend: '+1.4%' },
            ].map(function(b, i) {
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 6, background: '#fff', border: '1px solid #fed7aa' }}>
                  <span style={{ fontWeight: 700, color: i < 3 ? '#d97706' : '#6b7280', minWidth: 20 }}>#{b.rank}</span>
                  <span style={{ fontSize: 14 }}>{b.icon}</span>
                  <span style={{ fontWeight: 600, fontSize: 12, color: '#374151', width: 60 }}>{b.name}</span>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#e5e7eb', overflow: 'hidden' }}>
                    <div style={{ width: b.rate + '%', height: '100%', borderRadius: 3, background: b.rate >= 20 ? '#22c55e' : b.rate >= 10 ? '#f59e0b' : '#ef4444' }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#9a3412', minWidth: 36 }}>{b.rate}%</span>
                  <span style={{ fontSize: 10, color: '#16a34a' }}>{b.used}次</span>
                  <span style={{ fontSize: 10, color: '#059669' }}>{b.trend}</span>
                </div>
              );
            })}
          </div>
        </div>

    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', fontSize: 10, color: '#9ca3af', marginTop: 8 }}>
      <span>🏪 本月兑换: 345次</span>
      <span>👥 使用会员: 128人</span>
      <span>📈 活跃率: 72%</span>
    </div>
    </PageShell>
  );
}
