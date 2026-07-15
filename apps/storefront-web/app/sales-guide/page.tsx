/**
 * 导购员工作台页 — Sales Guide Dashboard (Next.js App Router Page)
 * 角色: 导购员视角，展示个人接待数据、待跟进客户、推荐话术、快速查询会员、排名
 */
'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { PageShell, StatusBadge, SalesClerkTool } from '@m5/ui';
import type {
  DailyReceptionStats,
  FollowUpClient,
  SalesScript,
  MemberQuickLookup,
} from '@m5/ui';

// ============================================================
// Mock data
// ============================================================

const MOCK_STATS: DailyReceptionStats = {
  totalReceptions: 28,
  newLeads: 12,
  conversions: 8,
  conversionRate: 66.7,
  avgResponseMin: 2.3,
};

const MOCK_FOLLOW_UPS: FollowUpClient[] = [
  {
    id: 'fu-1',
    name: '王芳',
    phone: '138****5678',
    tier: 'VIP',
    lastVisit: '2026-06-26',
    reason: '有意向办理年度会员套餐，需跟进报价',
    priority: 'high',
  },
  {
    id: 'fu-2',
    name: '李明',
    phone: '159****2341',
    tier: 'GOLD',
    lastVisit: '2026-06-25',
    reason: '对进口红酒感兴趣，待发送产品目录',
    priority: 'medium',
  },
  {
    id: 'fu-3',
    name: '赵雪',
    phone: '176****9087',
    tier: 'SILVER',
    lastVisit: '2026-06-20',
    reason: '上次购物积分未到账，需跟进解决',
    priority: 'high',
  },
  {
    id: 'fu-4',
    name: '陈伟',
    phone: '182****4532',
    tier: 'REGULAR',
    lastVisit: '2026-06-18',
    reason: '咨询团购优惠方案',
    priority: 'low',
  },
  {
    id: 'fu-5',
    name: '刘洋',
    phone: '136****7890',
    tier: 'VIP',
    lastVisit: '2026-06-15',
    reason: '生日月专属折扣未使用，提醒到店',
    priority: 'medium',
  },
];

const MOCK_SCRIPTS: SalesScript[] = [
  {
    id: 'sc-1',
    scenario: '新客欢迎',
    text: '您好！欢迎光临【朝阳旗舰店】，我是导购员小张。今天店里新到了几款热销商品，我为您介绍一下吧？',
    tags: ['新客', '欢迎', '推荐'],
  },
  {
    id: 'sc-2',
    scenario: '会员推荐',
    text: '先生/女士，您目前的消费记录已经达到银卡会员标准，升级金卡后可以享受全场9折优惠和生日双倍积分，今天开通还有额外赠品哦！',
    tags: ['会员', '升级', '权益'],
  },
  {
    id: 'sc-3',
    scenario: '客诉安抚',
    text: '非常抱歉给您带来不便！我马上为您核实情况，同时为您申请一张专属优惠券以表歉意，请您稍等片刻。',
    tags: ['客诉', '安抚', '优惠券'],
  },
  {
    id: 'sc-4',
    scenario: '离店回访',
    text: '王先生您好，我是朝阳旗舰店的导购员小张。您上次购买的有机蔬菜拼盘口感如何？我们本周新到了一批云南空运的时令蔬菜，给您留一些吗？',
    tags: ['回访', '复购', '关怀'],
  },
  {
    id: 'sc-5',
    scenario: '活动邀约',
    text: '您好！我们【朝阳旗舰店】本周六下午2点举办"夏日品鉴会"，有红酒品鉴、糕点试吃，到场还有伴手礼，诚邀您参加！需要为您预留座位吗？',
    tags: ['活动', '邀约', '线下'],
  },
];

const MOCK_MEMBERS: MemberQuickLookup[] = [
  { id: 'm-1', name: '王芳', phone: '13812345678', tier: 'VIP', points: 5860, totalSpent: 28500, visitCount: 68, tags: ['高消费', '常客'] },
  { id: 'm-2', name: '李明', phone: '15911223411', tier: 'GOLD', points: 3200, totalSpent: 15600, visitCount: 34, tags: ['红酒爱好者'] },
  { id: 'm-3', name: '赵雪', phone: '17611229087', tier: 'SILVER', points: 1200, totalSpent: 5800, visitCount: 18, tags: ['生鲜常购'] },
];

// ============================================================
// 子组件：统计指标卡片
// ============================================================

function MetricCard({
  label,
  value,
  icon,
  color,
  sublabel,
}: {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  sublabel?: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 130,
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span style={{ fontSize: 24 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{label}</div>
        {sublabel && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{sublabel}</div>}
      </div>
    </div>
  );
}

// ============================================================
// 子组件：优先级徽章
// ============================================================

const PRIORITY_LABEL: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
};
const PRIORITY_VARIANT: Record<string, string> = {
  high: 'danger',
  medium: 'warning',
  low: 'info',
};

// ============================================================
// 子组件：待跟进客户表格
// ============================================================

function FollowUpTable({
  clients,
  onFollowUp,
}: {
  clients: FollowUpClient[];
  onFollowUp: (id: string) => void;
}) {
  if (clients.length === 0) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af', background: '#fff', borderRadius: 10, border: '1px dashed #d1d5db' }}>
        暂无待跟进客户
      </div>
    );
  }
  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: 20 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
            <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>客户</th>
            <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>等级</th>
            <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>上次到店</th>
            <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>原因</th>
            <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>优先级</th>
            <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: '10px 14px' }}>
                <div style={{ fontWeight: 600 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>{c.phone}</div>
              </td>
              <td style={{ padding: '10px 14px' }}>
                <StatusBadge
                  variant={c.tier === 'VIP' ? 'success' : c.tier === 'GOLD' ? 'warning' : 'info'}
                  label={c.tier}
                />
              </td>
              <td style={{ padding: '10px 14px', color: '#6b7280' }}>{c.lastVisit}</td>
              <td style={{ padding: '10px 14px', color: '#374151', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.reason}
              </td>
              <td style={{ padding: '10px 14px' }}>
                <StatusBadge
                  variant={PRIORITY_VARIANT[c.priority] as 'danger' | 'warning' | 'info'}
                  label={PRIORITY_LABEL[c.priority] || c.priority}
                />
              </td>
              <td style={{ padding: '10px 14px' }}>
                <button
                  onClick={() => onFollowUp(c.id)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#2563eb',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  跟进
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// 子组件：话术收藏卡
// ============================================================

function ScriptCard({
  script,
  onCopy,
}: {
  script: SalesScript;
  onCopy: (id: string) => void;
}) {
  return (
    <div
      style={{
        padding: '14px 16px',
        background: '#fff',
        borderRadius: 10,
        border: '1px solid #e5e7eb',
        flex: '1 1 240px',
        minWidth: 220,
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{script.scenario}</div>
      <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6, marginBottom: 10 }}>
        {script.text.length > 100 ? `${script.text.slice(0, 100)}…` : script.text}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {script.tags.map((tag) => (
            <span
              key={tag}
              style={{
                padding: '2px 6px',
                borderRadius: 4,
                background: '#eff6ff',
                color: '#2563eb',
                fontSize: 10,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
        <button
          onClick={() => onCopy(script.id)}
          style={{
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px solid #d1d5db',
            background: '#fff',
            cursor: 'pointer',
            fontSize: 11,
          }}
        >
          📋 复制
        </button>
      </div>
    </div>
  );
}

// ============================================================
// 导购员工作台页
// ============================================================

export default function SalesGuidePage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [followUpFilter, setFollowUpFilter] = useState<string>('ALL');

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const handleMemberSearch = useCallback(
    async (query: string): Promise<MemberQuickLookup[]> => {
      await new Promise((r) => setTimeout(r, 500));
      const q = query.toLowerCase();
      return MOCK_MEMBERS.filter(
        (m) =>
          m.name.toLowerCase().includes(q) || m.phone.includes(query),
      );
    },
    [],
  );

  const handleFollowUp = useCallback((clientId: string) => {
    const client = MOCK_FOLLOW_UPS.find((c) => c.id === clientId);
    showToast(`已标记跟进：${client?.name ?? clientId}`);
  }, [showToast]);

  const handleScriptCopy = useCallback((scriptId: string) => {
    const script = MOCK_SCRIPTS.find((s) => s.id === scriptId);
    if (script) {
      navigator.clipboard?.writeText(script.text);
      showToast(`话术已复制：${script.scenario}`);
    }
  }, [showToast]);

  /** 筛选后的跟进客户 */
  const filteredFollowUps = useMemo(() => {
    if (followUpFilter === 'ALL') return MOCK_FOLLOW_UPS;
    return MOCK_FOLLOW_UPS.filter((c) => c.priority === followUpFilter);
  }, [followUpFilter]);

  return (
    <PageShell title="导购员工具" description="导购员专属工作台 · 朝阳旗舰店">
      <div style={{ padding: 24, position: 'relative' }}>
        {/* Toast 通知 */}
        {toastMessage && (
          <div
            style={{
              position: 'fixed',
              top: 24,
              right: 24,
              zIndex: 9999,
              padding: '12px 24px',
              borderRadius: 12,
              background: '#22c55e',
              color: '#fff',
              fontWeight: 600,
              fontSize: 14,
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            {toastMessage}
          </div>
        )}

        {/* 头部信息 */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>🛍️ 导购员工作台</h1>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
            张明 · 朝阳旗舰店 · 今日第 {MOCK_STATS.totalReceptions} 位接待 · 转化率 {MOCK_STATS.conversionRate}%
          </p>
        </div>

        {/* 指标卡片 */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <MetricCard label="今日接待" value={MOCK_STATS.totalReceptions} icon="👥" color="#2563eb" sublabel="累计接待" />
          <MetricCard label="新线索" value={MOCK_STATS.newLeads} icon="🆕" color="#059669" sublabel="今日新增" />
          <MetricCard label="转化数" value={MOCK_STATS.conversions} icon="✅" color="#d97706" sublabel={`转化率 ${MOCK_STATS.conversionRate}%`} />
          <MetricCard label="平均响应" value={`${MOCK_STATS.avgResponseMin}min`} icon="⏱️" color="#7c3aed" sublabel="客户响应时长" />
          <MetricCard label="待跟进" value={MOCK_FOLLOW_UPS.length} icon="📞" color="#dc2626" sublabel={`${MOCK_FOLLOW_UPS.filter(c => c.priority === 'high').length} 条高优`} />
        </div>

        {/* 快速入口 */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
          <button
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              border: 'none',
              background: '#2563eb',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            📝 新建客户
          </button>
          <button
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              border: '1px solid #d1d5db',
              background: '#fff',
              cursor: 'pointer',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            📋 今日回访计划
          </button>
          <button
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              border: '1px solid #d1d5db',
              background: '#fff',
              cursor: 'pointer',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            📊 业绩排行榜
          </button>
        </div>

        {/* SalesClerkTool 核心面板 */}
        <div style={{ marginBottom: 24 }}>
          <SalesClerkTool
            stats={MOCK_STATS}
            followUpClients={MOCK_FOLLOW_UPS}
            scripts={MOCK_SCRIPTS}
            clerkName="张明"
            storeName="朝阳旗舰店"
            onMemberSearch={handleMemberSearch}
            onFollowUp={handleFollowUp}
            onScriptCopy={handleScriptCopy}
          />
        </div>

        {/* 待跟进客户表格 (扩展面板) */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
              📋 待跟进客户列表
              <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 400, marginLeft: 8 }}>{filteredFollowUps.length} 条</span>
            </h3>
            <select
              value={followUpFilter}
              onChange={(e) => setFollowUpFilter(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 12 }}
            >
              <option value="ALL">全部优先级</option>
              <option value="high">高优先</option>
              <option value="medium">中优先</option>
              <option value="low">低优先</option>
            </select>
          </div>
          <FollowUpTable clients={filteredFollowUps} onFollowUp={handleFollowUp} />
        </div>

        {/* 推荐话术 (扩展面板) */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>
            💬 推荐话术
            <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 400, marginLeft: 8 }}>{MOCK_SCRIPTS.length} 条话术</span>
          </h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {MOCK_SCRIPTS.map((script) => (
              <ScriptCard key={script.id} script={script} onCopy={handleScriptCopy} />
            ))}
          </div>
        </div>

        {/* 今日工作摘要 */}
        <div
          style={{
            padding: '12px 18px',
            background: '#f0fdf4',
            borderRadius: 10,
            border: '1px solid #bbf7d0',
            fontSize: 13,
            color: '#166534',
            display: 'flex',
            gap: 20,
            flexWrap: 'wrap',
          }}
        >
          <span>🏆 今日排名: 第 3 名 / 共 12 名</span>
          <span>🎯 目标完成: {MOCK_STATS.conversions}/{MOCK_STATS.newLeads} 转化</span>
          <span>⏰ 在岗时长: 6h 32min</span>
          <span>📱 在线状态:
            <StatusBadge variant="success" label="在线" />
          </span>
        </div>
      </div>
    </PageShell>
  );
}
