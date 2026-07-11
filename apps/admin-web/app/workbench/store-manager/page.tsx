'use client';

/**
 * 店长工作台 - Store Manager Workbench (增强版)
 * 角色: 👔门店店长
 * 功能: 今日运营仪表盘、待办任务、设备状态、热门商品、人员排班、营收看板
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageShell, StatCard, StatusBadge, DataTable, Pagination, Tabs, DetailActionBar, usePagination, type DataTableColumn } from '@m5/ui';

// ---- 类型 ----
type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
type TaskStatus = 'todo' | 'in_progress' | 'done';
type DeviceStatusType = 'online' | 'offline' | 'error' | 'maintenance';

interface KpiCard { label: string; value: string; trend: { value: string; positive: boolean }; helper?: string; }
interface TaskItem { id: string; title: string; priority: TaskPriority; status: TaskStatus; deadline: string; assignee: string; category: string; }
interface StoreItem { id: string; name: string; category: string; sales: number; stock: number; margin: number; }
interface StaffOnDuty { id: string; name: string; role: string; shift: string; startTime: string; endTime: string; status: string; }
interface RevenueHour { hour: string; amount: number; visitors: number; }

const PRIORITY_MAP: Record<TaskPriority, { label: string; variant: 'danger' | 'warning' | 'neutral' }> = {
  urgent: { label: '紧急', variant: 'danger' }, high: { label: '高', variant: 'warning' },
  medium: { label: '中', variant: 'neutral' }, low: { label: '低', variant: 'neutral' },
};

const STATUS_LABELS: Record<TaskStatus, string> = { todo: '待办', in_progress: '进行中', done: '已完成' };
const DEVICE_ICONS: Record<string, string> = { arcade: '🕹️', pos: '💳', screen: '🖥️', printer: '🖨️', router: '📡', camera: '📷', sensor: '🔍', server: '🖥️' };

function formatMoney(a: number): string { return `¥${a.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`; }

function mockKpi(): KpiCard[] {
  return [
    { label: '今日营收', value: formatMoney(12680 + Math.floor(Math.random()*2000)), trend: { value: '+18.5%', positive: true }, helper: '较昨日' },
    { label: '今日客流', value: `${320 + Math.floor(Math.random()*80)}人`, trend: { value: '+12.3%', positive: true }, helper: '较昨日' },
    { label: '设备在线率', value: `${88 + Math.floor(Math.random()*10)}%`, trend: { value: `${-2+Math.floor(Math.random()*5)}%`, positive: Math.random()>0.3 }, helper: `${18+Math.floor(Math.random()*8)}台在线` },
    { label: '会员消费占比', value: `${55 + Math.floor(Math.random()*15)}%`, trend: { value: '+8.2%', positive: true }, helper: '较上周' },
  ];
}

function mockTasks(): TaskItem[] {
  return [
    { id: 'T1', title: '检查娃娃机维护工单', priority: 'urgent', status: 'todo', deadline: '今日 18:00', assignee: '王强', category: '设备' },
    { id: 'T2', title: '审批排班变更申请', priority: 'high', status: 'todo', deadline: '今日 16:00', assignee: '店长', category: '人事' },
    { id: 'T3', title: '核对昨日营收数据', priority: 'high', status: 'in_progress', deadline: '今日 14:00', assignee: '李娜', category: '财务' },
    { id: 'T4', title: '处理库存补货申请', priority: 'medium', status: 'todo', deadline: '今日 20:00', assignee: '刘洋', category: '库存' },
    { id: 'T5', title: '整理促销活动物料', priority: 'medium', status: 'todo', deadline: '明日 10:00', assignee: '陈静', category: '营销' },
    { id: 'T6', title: '检查消防设备状态', priority: 'urgent', status: 'done', deadline: '今日 12:00', assignee: '赵敏', category: '安全' },
    { id: 'T7', title: '新员工入职培训安排', priority: 'low', status: 'todo', deadline: '明日 14:00', assignee: '周杰', category: '人事' },
    { id: 'T8', title: '更新会员积分活动规则', priority: 'medium', status: 'todo', deadline: '明日 18:00', assignee: '吴芳', category: '会员' },
    { id: 'T9', title: '空调维修跟进', priority: 'urgent', status: 'in_progress', deadline: '今日 15:00', assignee: '杨磊', category: '后勤' },
    { id: 'T10', title: '准备周报数据', priority: 'low', status: 'todo', deadline: '周五 17:00', assignee: '店长', category: '报表' },
  ];
}

function mockHotProducts(): StoreItem[] {
  return [
    { id: 'P1', name: '经典游戏币兑换', category: '游戏币', sales: 156, stock: 5000, margin: 85 },
    { id: 'P2', name: '大号娃娃-熊', category: '礼品', sales: 32, stock: 45, margin: 72 },
    { id: 'P3', name: 'VR体验套餐', category: '体验', sales: 28, stock: Infinity, margin: 68 },
    { id: 'P4', name: '会员充值200赠50', category: '会员', sales: 45, stock: Infinity, margin: 90 },
    { id: 'P5', name: '盲盒-动漫系列', category: '礼品', sales: 38, stock: 120, margin: 65 },
    { id: 'P6', name: '可乐(罐装)', category: '餐饮', sales: 89, stock: 240, margin: 55 },
  ];
}

function mockStaffOnDuty(): StaffOnDuty[] {
  return [
    { id: 'S1', name: '李娜', role: '值班经理', shift: '早班', startTime: '08:00', endTime: '14:00', status: '在岗' },
    { id: 'S2', name: '王强', role: '收银员', shift: '早班', startTime: '08:00', endTime: '14:00', status: '在岗' },
    { id: 'S3', name: '赵敏', role: '导玩员', shift: '早班', startTime: '08:00', endTime: '14:00', status: '在岗' },
    { id: 'S4', name: '刘洋', role: '导玩员', shift: '中班', startTime: '14:00', endTime: '20:00', status: '未到岗' },
    { id: 'S5', name: '陈静', role: '收银员', shift: '中班', startTime: '14:00', endTime: '20:00', status: '休息' },
    { id: 'S6', name: '黄丽', role: '保洁', shift: '早班', startTime: '08:00', endTime: '14:00', status: '在岗' },
    { id: 'S7', name: '杨磊', role: '技术员', shift: '全天', startTime: '10:00', endTime: '22:00', status: '在岗' },
    { id: 'S8', name: '周杰', role: '培训师', shift: '中班', startTime: '14:00', endTime: '20:00', status: '未到岗' },
  ];
}

function mockRevenueHours(): RevenueHour[] {
  const hours: RevenueHour[] = [];
  for (let h = 8; h <= 23; h++) {
    const base = h >= 11 && h <= 14 ? 800 : h >= 18 && h <= 21 ? 1200 : 200;
    const visitors = h >= 18 && h <= 21 ? 40 + Math.floor(Math.random()*20) : 10 + Math.floor(Math.random()*20);
    hours.push({ hour: `${String(h).padStart(2,'0')}:00`, amount: Math.round((base + Math.random()*300)*100)/100, visitors });
  }
  return hours;
}

export default function StoreManagerWorkbenchPage() {
  const router = useRouter();
  const kpi = useMemo(() => mockKpi(), []);
  const tasks = useMemo(() => mockTasks(), []);
  const products = useMemo(() => mockHotProducts(), []);
  const staff = useMemo(() => mockStaffOnDuty(), []);
  const revenueHours = useMemo(() => mockRevenueHours(), []);
  const [tab, setTab] = useState<'kpi'|'tasks'|'staff'|'revenue'>('kpi');

  const todoCount = tasks.filter(t => t.status === 'todo').length;
  const urgentCount = tasks.filter(t => t.priority === 'urgent' || t.priority === 'high').length;
  const onDutyCount = staff.filter(s => s.status === '在岗').length;
  const deviceOnline = 18;

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <PageShell title="👔 店长工作台" subtitle="一键掌握门店运营全貌">
        {/* KPI 卡片 */}
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 20 }}>
          {kpi.map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 13, color: '#cbd5e1' }}>{k.label}</div>
              <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: '#f8fafc' }}>{k.value}</div>
              <div style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
                <span style={{ color: k.trend.positive ? '#22c55e' : '#ef4444' }}>
                  {k.trend.positive ? '↑' : '↓'} {k.trend.value}
                </span>
                <span style={{ color: '#94a3b8' }}>{k.helper}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 快速状态条 */}
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 20 }}>
          <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div><div style={{ fontSize: 13, color: '#cbd5e1' }}>待办任务</div><div style={{ fontSize: 24, fontWeight: 700, color: '#eab308' }}>{todoCount}</div></div>
            <div style={{ fontSize: 36 }}>📋</div>
          </div>
          <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div><div style={{ fontSize: 13, color: '#cbd5e1' }}>紧急事项</div><div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }}>{urgentCount}</div></div>
            <div style={{ fontSize: 36 }}>🚨</div>
          </div>
          <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div><div style={{ fontSize: 13, color: '#cbd5e1' }}>当班员工</div><div style={{ fontSize: 24, fontWeight: 700, color: '#22c55e' }}>{onDutyCount}/{staff.length}</div></div>
            <div style={{ fontSize: 36 }}>👥</div>
          </div>
          <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div><div style={{ fontSize: 13, color: '#cbd5e1' }}>设备在线</div><div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>{deviceOnline}/22</div></div>
            <div style={{ fontSize: 36 }}>🖥️</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ marginBottom: 16 }}>
          <Tabs items={[
            { key: 'kpi', label: '📊 运营概览' }, { key: 'tasks', label: `📋 待办 (${todoCount})` },
            { key: 'staff', label: '👥 排班' }, { key: 'revenue', label: '💰 时营收' },
          ]} activeKey={tab} onChange={t => setTab(t as typeof tab)} variant="pills" />
        </div>

        {tab === 'kpi' && (
          <>
            {/* 热门商品 */}
            <section style={{ ...card, marginBottom: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>🔥 今日热门商品</h3>
              <div style={{ display: 'grid', gap: 10 }}>
                {products.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: 'rgba(15,23,42,0.3)' }}>
                    <div><span style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</span><span style={{ color: '#94a3b8', fontSize: 12, marginLeft: 8 }}>{p.category}</span></div>
                    <div style={{ display: 'flex', gap: 20, fontSize: 13 }}>
                      <span style={{ color: '#22c55e', fontWeight: 600 }}>{p.sales}单</span>
                      <span style={{ color: '#94a3b8' }}>库存: {Number.isFinite(p.stock) ? p.stock : '∞'}</span>
                      <span style={{ color: p.margin > 70 ? '#22c55e' : '#eab308' }}>毛利{p.margin}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 营收时分布 */}
            <section style={card}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>📈 今日营收时分布</h3>
              <div style={{ display: 'grid', gap: 4 }}>
                {revenueHours.map(r => {
                  const maxRev = Math.max(...revenueHours.map(x => x.amount));
                  const pct = (r.amount / maxRev) * 100;
                  return (
                    <div key={r.hour} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
                      <div style={{ width: 48, fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>{r.hour}</div>
                      <div style={{ flex: 1, height: 10, borderRadius: 5, background: 'rgba(148,163,184,0.12)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 5, background: pct > 60 ? '#22c55e' : pct > 30 ? '#3b82f6' : '#6b7280' }} />
                      </div>
                      <div style={{ width: 80, textAlign: 'right', fontSize: 11, color: '#cbd5e1' }}>{formatMoney(r.amount)}</div>
                      <div style={{ width: 40, textAlign: 'right', fontSize: 11, color: '#94a3b8' }}>{r.visitors}人</div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {tab === 'tasks' && (
          <section style={card}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>待办任务</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {tasks.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, background: 'rgba(15,23,42,0.3)', border: t.priority === 'urgent' ? '1px solid rgba(239,68,68,0.2)' : 'none' }}>
                  <StatusBadge label={PRIORITY_MAP[t.priority].label} variant={PRIORITY_MAP[t.priority].variant} size="sm" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, textDecoration: t.status === 'done' ? 'line-through' : 'none', color: t.status === 'done' ? '#6b7280' : '#e2e8f0' }}>{t.title}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{t.category} · {t.assignee} · 截止: {t.deadline}</div>
                  </div>
                  <span style={{ fontSize: 12, color: t.status === 'todo' ? '#eab308' : t.status === 'in_progress' ? '#3b82f6' : '#22c55e', fontWeight: 600 }}>{STATUS_LABELS[t.status]}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === 'staff' && (
          <section style={card}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>当班员工</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              {staff.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', borderRadius: 10, background: 'rgba(15,23,42,0.3)' }}>
                  <span style={{ fontSize: 24 }}>👤</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{s.role} · {s.shift} ({s.startTime}-{s.endTime})</div>
                  </div>
                  <StatusBadge label={s.status} variant={s.status === '在岗' ? 'success' : s.status === '休息' ? 'neutral' : 'warning'} size="sm" dot />
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === 'revenue' && (
          <><div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
            <StatCard label="累计营收" value={formatMoney(revenueHours.reduce((s,r)=>s+r.amount,0))} helper={`${revenueHours.reduce((s,r)=>s+r.visitors,0)}人`} />
            <StatCard label="峰值时段" value={revenueHours.reduce((a,b)=>a.amount>b.amount?a:b).hour} helper="最高营收小时" />
            <StatCard label="时均营收" value={formatMoney(revenueHours.reduce((s,r)=>s+r.amount,0)/revenueHours.length)} />
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr><th style={th}>时段</th><th style={th}>营收</th><th style={th}>客流</th><th style={th}>占比</th></tr></thead>
            <tbody>{revenueHours.map(r => {
              const total = revenueHours.reduce((s,x)=>s+x.amount,0);
              return (<tr key={r.hour}>
                <td style={td}>{r.hour}</td>
                <td style={{...td, fontWeight:600, color:'#22c55e'}}>{formatMoney(r.amount)}</td>
                <td style={td}>{r.visitors}人</td>
                <td style={td}>{((r.amount/total)*100).toFixed(1)}%</td>
              </tr>);
            })}</tbody>
          </table></>
        )}
      </PageShell>
    </main>
  );
}

const card: React.CSSProperties = { borderRadius:16, padding:18, background:'rgba(15,23,42,0.38)', border:'1px solid rgba(148,163,184,0.18)' };
const th: React.CSSProperties = { textAlign:'left', padding:'10px 14px', color:'#94a3b8', fontSize:12, borderBottom:'1px solid rgba(148,163,184,0.18)' };
const td: React.CSSProperties = { padding:'10px 14px', color:'#e2e8f0', fontSize:13, borderBottom:'1px solid rgba(148,163,184,0.1)' };
