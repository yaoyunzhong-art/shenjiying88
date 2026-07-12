/**
 * 运营管理 — Operations (storefront-web)
 * 角色视角: 👔店长 / 运营主管
 * 功能: 运营日报、目标管理、检查清单、数据洞察（模拟数据 + 搜索过滤 + 卡片网格 + 空/错状态）
 */
'use client';

import React, { useState, useMemo } from 'react';

/* ── 类型定义 ── */
type OperationModule = {
  category: string;
  icon: string;
  label: string;
  desc: string;
  metric: string;
  trend: 'up' | 'down' | 'stable';
  enabled: boolean;
};

type Alert = {
  level: 'info' | 'warning' | 'error';
  message: string;
  time: string;
};

/* ── Mock 数据 (20+ 模块) ── */
const ALL_MODULES: OperationModule[] = [
  { category: '日常运营', icon: '📊', label: '运营日报', desc: '查看今日运营数据', metric: '今日 98.6%', trend: 'up', enabled: true },
  { category: '日常运营', icon: '📋', label: '检查清单', desc: '每日巡检事项', metric: '7/10 项完成', trend: 'stable', enabled: true },
  { category: '日常运营', icon: '📈', label: '数据洞察', desc: '趋势分析', metric: '环比 +12%', trend: 'up', enabled: true },
  { category: '日常运营', icon: '⏰', label: '排班表', desc: '员工排班管理', metric: '今日 6人值班', trend: 'stable', enabled: true },
  { category: '目标管理', icon: '🎯', label: '月度KPI', desc: '门店KPI追踪', metric: '达成率 87%', trend: 'up', enabled: true },
  { category: '目标管理', icon: '🏆', label: '销售目标', desc: '月度销售目标', metric: '¥258k / ¥300k', trend: 'up', enabled: true },
  { category: '目标管理', icon: '👥', label: '会员发展', desc: '新会员目标', metric: '168 / 200 人', trend: 'down', enabled: false },
  { category: '检查与审计', icon: '🔍', label: '卫生检查', desc: '门店卫生评分', metric: '97 分', trend: 'up', enabled: true },
  { category: '检查与审计', icon: '🧾', label: '库存抽检', desc: '抽检差异报告', metric: '3 项差异', trend: 'down', enabled: true },
  { category: '检查与审计', icon: '📸', label: '巡店记录', desc: '区域巡店报告', metric: '今日已巡', trend: 'stable', enabled: true },
  { category: '财务数据', icon: '💰', label: '日营收', desc: '今日收入', metric: '¥12,680', trend: 'up', enabled: true },
  { category: '财务数据', icon: '💳', label: '支付渠道', desc: '各渠道占比', metric: '微信 58%', trend: 'stable', enabled: true },
  { category: '财务数据', icon: '📉', label: '成本分析', desc: '损耗与成本', metric: '成本率 32%', trend: 'up', enabled: false },
  { category: '设备管理', icon: '🕹️', label: '设备状态', desc: '游戏设备健康度', metric: '24/24 在线', trend: 'stable', enabled: true },
  { category: '设备管理', icon: '🔧', label: '维修工单', desc: '待维修设备', metric: '2 项待处理', trend: 'down', enabled: true },
  { category: '设备管理', icon: '🔄', label: '设备轮换', desc: '设备位置调整', metric: '本月轮换 6台', trend: 'stable', enabled: false },
  { category: '营销活动', icon: '🎉', label: '进行中活动', desc: '当前营销活动', metric: '3 个进行中', trend: 'up', enabled: true },
  { category: '营销活动', icon: '📱', label: '推送记录', desc: '近7天推送', metric: '打开率 42%', trend: 'stable', enabled: true },
  { category: '营销活动', icon: '🎫', label: '优惠券核销', desc: '今日核销', metric: '核销 86 张', trend: 'up', enabled: true },
  { category: '人员管理', icon: '👤', label: '员工考核', desc: '本月绩效', metric: '均分 4.2', trend: 'up', enabled: false },
  { category: '人员管理', icon: '📅', label: '休假审批', desc: '待审批休假', metric: '3 人申请', trend: 'stable', enabled: true },
];

const ALERTS: Alert[] = [
  { level: 'warning', message: '冷柜温度异常，请及时检查', time: '15 分钟前' },
  { level: 'info', message: '今日设备巡检已完成 70%', time: '1 小时前' },
  { level: 'error', message: '3 号彩票机打印纸已空，请补货', time: '2 小时前' },
  { level: 'info', message: '次日饮品配送订单已确认', time: '3 小时前' },
];

const CATEGORIES = ['全部', '日常运营', '目标管理', '检查与审计', '财务数据', '设备管理', '营销活动', '人员管理'];

/* ── 子组件: 告警横幅 ── */
function AlertBanner({ alerts }: { alerts: Alert[] }) {
  const levelColor = { info: '#3b82f6', warning: '#f59e0b', error: '#ef4444' };
  if (alerts.length === 0) return null;
  return (
    <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {alerts.map((a, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', borderRadius: 10,
          background: `${levelColor[a.level]}15`,
          border: `1px solid ${levelColor[a.level]}30`,
        }}>
          <span style={{ fontSize: 14 }}>{a.level === 'error' ? '🔴' : a.level === 'warning' ? '🟡' : '🔵'}</span>
          <span style={{ color: '#e2e8f0', fontSize: 13, flex: 1 }}>{a.message}</span>
          <span style={{ color: '#64748b', fontSize: 11 }}>{a.time}</span>
        </div>
      ))}
    </div>
  );
}

/* ── 主组件 ── */
export default function OperationsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('全部');
  const [showDisabled, setShowDisabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDismissed, setErrorDismissed] = useState(false);

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return ALL_MODULES.filter(m => {
      if (!showDisabled && !m.enabled) return false;
      if (category !== '全部' && m.category !== category) return false;
      if (kw && !m.label.toLowerCase().includes(kw) && !m.desc.toLowerCase().includes(kw)) return false;
      return true;
    });
  }, [search, category, showDisabled]);

  const metricSummary = useMemo(() => {
    const enabled = ALL_MODULES.filter(m => m.enabled);
    const up = enabled.filter(m => m.trend === 'up').length;
    return { total: enabled.length, up, down: enabled.filter(m => m.trend === 'down').length };
  }, []);

  return (
    <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* ── 标题区 ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>运营管理</h1>
            <div style={{ fontSize: 13, color: '#64748b' }}>
              {metricSummary.total} 个模块 · {metricSummary.up} 项向好 · {metricSummary.down} 项需关注
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#22c55e20', color: '#22c55e' }}>今日</span>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>2026-07-13</span>
          </div>
        </div>

        {/* ── 告警横幅 ── */}
        <AlertBanner alerts={ALERTS} />

        {/* ── 搜索与筛选 ── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            placeholder="🔍 搜索运营模块..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: 180, padding: '10px 14px', borderRadius: 10,
              background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.15)',
              color: '#e2e8f0', fontSize: 14, outline: 'none',
            }}
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            style={{
              padding: '10px 12px', borderRadius: 10,
              background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.15)',
              color: '#e2e8f0', fontSize: 13, outline: 'none',
            }}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 12, cursor: 'pointer' }}>
            <input type="checkbox" checked={showDisabled} onChange={e => setShowDisabled(e.target.checked)} />
            显示未启用
          </label>
        </div>

        {/* ── 错误状态模拟 ── */}
        {error && !errorDismissed && (
          <div style={{
            padding: '14px 16px', marginBottom: 16, borderRadius: 10,
            background: '#ef444415', border: '1px solid #ef444430',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <span style={{ color: '#fca5a5', fontSize: 13, flex: 1 }}>{error}</span>
            <button
              onClick={() => setErrorDismissed(true)}
              style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: 16, cursor: 'pointer' }}
            >✕</button>
          </div>
        )}

        {/* ── 模块卡片网格 ── */}
        {filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            borderRadius: 14, background: 'rgba(30,41,59,0.4)',
            border: '1px dashed rgba(148,163,184,0.15)',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ color: '#94a3b8', fontSize: 15, marginBottom: 4 }}>未找到匹配的运营模块</div>
            <div style={{ color: '#64748b', fontSize: 13 }}>尝试修改搜索条件或筛选分类</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {filtered.map((m, i) => (
              <div key={i} style={{
                padding: '16px 16px', borderRadius: 14,
                background: 'rgba(30,41,59,0.8)',
                border: `1px solid ${m.enabled ? 'rgba(148,163,184,0.12)' : 'rgba(148,163,184,0.05)'}`,
                textAlign: 'center', cursor: 'pointer',
                opacity: m.enabled ? 1 : 0.5,
                transition: 'all 0.15s',
              }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{m.icon}</div>
                <div style={{ color: '#f8fafc', fontWeight: 600, fontSize: 14 }}>{m.label}</div>
                <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>{m.desc}</div>
                <div style={{
                  marginTop: 8, fontSize: 12, fontWeight: 600,
                  color: m.trend === 'up' ? '#34d399' : m.trend === 'down' ? '#f87171' : '#94a3b8',
                }}>
                  {m.metric} {m.trend === 'up' ? '↑' : m.trend === 'down' ? '↓' : '→'}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── 底部统计 ── */}
        <div style={{
          marginTop: 16, padding: '12px 16px', borderRadius: 10,
          background: 'rgba(30,41,59,0.4)', border: '1px solid rgba(148,163,184,0.08)',
          display: 'flex', justifyContent: 'space-between',
          color: '#64748b', fontSize: 12,
        }}>
          <span>共 {filtered.length} 个模块</span>
          <span>已启用 {filtered.filter(m => m.enabled).length} · 未启用 {filtered.filter(m => !m.enabled).length}</span>
        </div>
      </div>
    </main>
  );
}
