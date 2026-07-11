// @ts-nocheck
'use client';

/**
 * 会员详情页 - Member Detail
 * 角色: 👥客服 / 👔店长
 * 功能: 会员档案、消费记录、充值记录、积分变动、等级历史
 */

import { useState, useMemo, use } from 'react';
import {
  PageShell, StatCard, StatusBadge, DetailActionBar, DetailClosureBar,
  InfoRow, CopyToClipboard, WorkspaceBreadcrumb, Tabs
} from '@m5/ui';
import { buildStandardBreadcrumb, buildStandardClosureLinks } from '../../components/detail-workspace-registry';

type MemberStatus = 'active' | 'inactive' | 'frozen' | 'expired';
type Gender = 'male' | 'female' | 'other';
type MemberTier = 'normal' | 'silver' | 'gold' | 'diamond' | 'platinum';

interface MemberDetail {
  id: string; name: string; phone: string; gender: Gender; birthday: string;
  email: string; wechat: string; memberNo: string; tier: MemberTier;
  status: MemberStatus; joinDate: string; lastActive: string;
  totalPoints: number; availablePoints: number; totalRecharge: number;
  balance: number; totalSpent: number; visitCount: number; avgSpend: number;
  referrer: string; tags: string[]; notes: string;
}

interface PointRecord { id: string; date: string; type: 'earn' | 'redeem' | 'expire' | 'adjust'; amount: number; balance: number; source: string; orderNo: string; }
interface RechargeRecord { id: string; date: string; amount: number; giftAmount: number; paymentMethod: string; paymentNo: string; operator: string; status: 'completed' | 'pending' | 'refunded'; }

const STATUS_MAP: Record<MemberStatus, { label: string; variant: 'success' | 'neutral' | 'warning' | 'danger' }> = {
  active: { label: '活跃', variant: 'success' }, inactive: { label: '沉默', variant: 'neutral' },
  frozen: { label: '冻结', variant: 'danger' }, expired: { label: '已过期', variant: 'warning' },
};
const TIER_LABELS: Record<MemberTier, string> = { normal: '普通会员', silver: '银卡', gold: '金卡', diamond: '钻石', platinum: '至尊' };
const TIER_COLORS: Record<MemberTier, string> = { normal: '#6b7280', silver: '#94a3b8', gold: '#eab308', diamond: '#3b82f6', platinum: '#8b5cf6' };
function fm(a: number): string { return `¥${a.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`; }

function mockMember(id: string): MemberDetail {
  return { id, name: '张明', phone: '13812345678', gender: 'male', birthday: '1995-06-15', email: 'zhangming@example.com', wechat: 'zm_wechat', memberNo: `M5-${id}`, tier: 'diamond', status: 'active', joinDate: '2024-03-10', lastActive: '2026-07-11', totalPoints: 24850, availablePoints: 12350, totalRecharge: 18600, balance: 3520, totalSpent: 15820, visitCount: 86, avgSpend: 184, referrer: '李娜', tags: ['高消费', '周末活跃', '生日会员'], notes: '喜欢夹娃娃机和赛车' };
}

function mockPoints(): PointRecord[] {
  return Array.from({ length: 30 }, (_, i) => { const isEarn = Math.random() > 0.35; const d = new Date(Date.now() - i * 3 * 86400000); return { id: `PT-${i}`, date: d.toISOString().split('T')[0] as string, type: isEarn ? 'earn' as const : (['redeem', 'expire', 'adjust'] as const)[Math.floor(Math.random() * 3)], amount: isEarn ? 50 + Math.floor(Math.random() * 500) : -(30 + Math.floor(Math.random() * 200)), balance: 12000 + (isEarn ? 1 : -1) * Math.floor(Math.random() * 300), source: isEarn ? '消费' : '积分兑换', orderNo: isEarn ? `ORD-${d.toISOString().split('T')[0].replace(/-/g, '')}` : '', }; });
}

function mockRecharges(): RechargeRecord[] {
  return Array.from({ length: 15 }, (_, i) => { const d = new Date(Date.now() - i * 6 * 86400000); return { id: `RCH-${i}`, date: d.toISOString().split('T')[0] as string, amount: 100 + Math.floor(Math.random() * 900), giftAmount: Math.random() > 0.5 ? Math.floor(Math.random() * 200) : 0, paymentMethod: ['微信支付','支付宝','银行卡','现金'][Math.floor(Math.random() * 4)]!, paymentNo: `PAY${String(100000+i)}`, operator: '张三', status: Math.random() > 0.05 ? 'completed' as const : 'pending' as const }; });
}

function mockVisits() {
  return Array.from({ length: 20 }, (_, i) => { const d = new Date(Date.now() - i*3*86400000); return { date: d.toISOString().split('T')[0], duration: `${30+Math.floor(Math.random()*120)}min`, spend: Math.round((50+Math.random()*300)*100)/100, devices: ['拳皇','赛车','娃娃机','篮球机','跳舞机'][Math.floor(Math.random()*5)]!, staff: '收银员A' }; });
}

export default function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const member = useMemo(() => mockMember(id), [id]);
  const points = useMemo(() => mockPoints(), []);
  const recharges = useMemo(() => mockRecharges(), []);
  const visits = useMemo(() => mockVisits(), []);
  const [tab, setTab] = useState<'overview'|'points'|'recharge'|'visits'>('overview');

  return (
    <main style={{ maxWidth: 1020, margin: '24px auto', padding: '0 16px' }}>
      <WorkspaceBreadcrumb {...buildStandardBreadcrumb({ workspace: 'members', detailLabel: member.name })} />
      <PageShell title={member.name} subtitle={`${member.memberNo} · ${TIER_LABELS[member.tier]}`}>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 20 }}>
          <StatCard label="余额" value={fm(member.balance)} />
          <StatCard label="充值" value={fm(member.totalRecharge)} />
          <StatCard label="积分" value={member.availablePoints.toLocaleString()} helper={`累计: ${member.totalPoints.toLocaleString()}`} />
          <StatCard label="消费" value={fm(member.totalSpent)} helper={`${member.visitCount}次`} />
        </div>

        <section style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>基本信息</h3>
            <StatusBadge label={STATUS_MAP[member.status].label} variant={STATUS_MAP[member.status].variant} size="md" dot />
          </div>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(4,1fr)' }}>
            <InfoRow label="手机" value={<span>{member.phone}<CopyToClipboard text={member.phone} size="sm" iconOnly /></span>} />
            <InfoRow label="生日" value={member.birthday} />
            <InfoRow label="性别" value={member.gender === 'male' ? '男' : member.gender === 'female' ? '女' : '其他'} />
            <InfoRow label="邮箱" value={member.email} />
            <InfoRow label="微信" value={member.wechat} />
            <InfoRow label="等级" value={<span style={{ color: TIER_COLORS[member.tier], fontWeight: 700 }}>{TIER_LABELS[member.tier]}</span>} />
            <InfoRow label="加入" value={member.joinDate} />
            <InfoRow label="最近活跃" value={member.lastActive} />
            <InfoRow label="推荐人" value={member.referrer} />
            <InfoRow label="客单价" value={fm(member.avgSpend)} />
            <InfoRow label="到店" value={`${member.visitCount}次`} />
            <InfoRow label="会员号" value={member.memberNo} />
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {member.tags.map(t => <span key={t} style={tag}>{t}</span>)}
          </div>
        </section>

        <div style={{ marginBottom: 16 }}>
          <Tabs items={[
            { key: 'overview', label: '📊 概览' }, { key: 'points', label: '⭐ 积分' },
            { key: 'recharge', label: '💰 充值' }, { key: 'visits', label: '🛒 到店' },
          ]} activeKey={tab} onChange={t => setTab(t as typeof tab)} variant="pills" />
        </div>

        {tab === 'overview' && (
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
            <section style={card}><h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>最近交易</h4>
              {recharges.slice(0,5).map(r => <div key={r.id} style={row}>{r.date}<span style={{ fontWeight: 600, color:'#22c55e' }}>{fm(r.amount)}</span><span style={{ color:'#cbd5e1', fontSize:12 }}>{r.paymentMethod}</span></div>)}
            </section>
            <section style={card}><h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>最近积分</h4>
              {points.slice(0,5).map(p => <div key={p.id} style={row}>{p.date}<span style={{ fontWeight: 600, color:p.amount>0?'#22c55e':'#ef4444' }}>{p.amount>0?'+':''}{p.amount.toLocaleString()}</span><span style={{ color:'#cbd5e1', fontSize:12 }}>{p.source}</span></div>)}
            </section>
          </div>
        )}

        {tab === 'points' && (
          <><div style={{ display:'grid', gap:14, gridTemplateColumns:'repeat(3,1fr)', marginBottom:16 }}>
            <StatCard label="总积分" value={member.totalPoints.toLocaleString()} />
            <StatCard label="可用" value={member.availablePoints.toLocaleString()} />
            <StatCard label="已消耗" value={(member.totalPoints-member.availablePoints).toLocaleString()} />
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr><th style={th}>日期</th><th style={th}>类型</th><th style={th}>变动</th><th style={th}>余额</th><th style={th}>来源</th><th style={th}>订单号</th></tr></thead>
            <tbody>{points.map(p => (
              <tr key={p.id}>
                <td style={td}>{p.date}</td>
                <td style={td}>{p.type==='earn'?'获得':p.type==='redeem'?'兑换':p.type==='expire'?'过期':'调整'}</td>
                <td style={{...td, color:p.amount>0?'#22c55e':'#ef4444', fontWeight:600}}>{p.amount>0?'+':''}{p.amount.toLocaleString()}</td>
                <td style={td}>{p.balance.toLocaleString()}</td>
                <td style={td}>{p.source}</td>
                <td style={{...td, fontSize:11}}>{p.orderNo}</td>
              </tr>
            ))}</tbody>
          </table></>
        )}

        {tab === 'recharge' && (
          <><div style={{ display:'grid', gap:14, gridTemplateColumns:'repeat(3,1fr)', marginBottom:16 }}>
            <StatCard label="充值次数" value={recharges.length.toString()} />
            <StatCard label="充值总额" value={fm(recharges.reduce((s,r)=>s+r.amount,0))} />
            <StatCard label="赠金" value={fm(recharges.reduce((s,r)=>s+r.giftAmount,0))} />
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr><th style={th}>日期</th><th style={th}>金额</th><th style={th}>赠金</th><th style={th}>支付方式</th><th style={th}>单号</th><th style={th}>操作员</th><th style={th}>状态</th></tr></thead>
            <tbody>{recharges.map(r => (
              <tr key={r.id}>
                <td style={td}>{r.date}</td>
                <td style={{...td, fontWeight:600, color:'#22c55e'}}>{fm(r.amount)}</td>
                <td style={{...td, color:'#eab308'}}>{r.giftAmount>0?fm(r.giftAmount):'—'}</td>
                <td style={td}>{r.paymentMethod}</td>
                <td style={{...td, fontSize:11}}>{r.paymentNo}</td>
                <td style={td}>{r.operator}</td>
                <td style={td}><StatusBadge label={r.status==='completed'?'已完成':'待处理'} variant={r.status==='completed'?'success':'warning'} size="sm" /></td>
              </tr>
            ))}</tbody>
          </table></>
        )}

        {tab === 'visits' && (
          <><div style={{ display:'grid', gap:14, gridTemplateColumns:'repeat(3,1fr)', marginBottom:16 }}>
            <StatCard label="到店" value={member.visitCount.toString()} />
            <StatCard label="平均消费" value={fm(member.avgSpend)} />
            <StatCard label="总消费" value={fm(member.totalSpent)} />
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr><th style={th}>日期</th><th style={th}>时长</th><th style={th}>消费</th><th style={th}>设备</th><th style={th}>服务</th></tr></thead>
            <tbody>{visits.map((v,i) => (
              <tr key={i}>
                <td style={td}>{v.date}</td>
                <td style={td}>{v.duration}</td>
                <td style={{...td, fontWeight:600, color:'#22c55e'}}>{fm(v.spend)}</td>
                <td style={td}>{v.devices}</td>
                <td style={td}>{v.staff}</td>
              </tr>
            ))}</tbody>
          </table></>
        )}
        <DetailActionBar actions={[]} heading="操作" caption="详情收口" />
        <DetailClosureBar links={buildStandardClosureLinks({ workspace: 'members', detailId: id })} />
      </PageShell>
    </main>
  );
}

const card: React.CSSProperties = { borderRadius:16, padding:24, background:'rgba(15,23,42,0.35)', border:'1px solid rgba(148,163,184,0.18)', marginBottom:24 };
const tag: React.CSSProperties = { padding:'3px 10px', borderRadius:6, background:'rgba(59,130,246,0.12)', color:'#93c5fd', fontSize:11, fontWeight:600 };
const row: React.CSSProperties = { display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(148,163,184,0.08)', fontSize:13 };
const th: React.CSSProperties = { textAlign:'left', padding:'10px 14px', color:'#94a3b8', fontSize:12, borderBottom:'1px solid rgba(148,163,184,0.18)' };
const td: React.CSSProperties = { padding:'10px 14px', color:'#e2e8f0', fontSize:13, borderBottom:'1px solid rgba(148,163,184,0.1)' };
