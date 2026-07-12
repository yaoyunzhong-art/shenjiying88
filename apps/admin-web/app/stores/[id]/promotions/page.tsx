'use client';

/**
 * 促销管理 - Promotions Page
 * 角色: 📢营销运营
 * 功能: 促销活动列表、创建、效果分析
 */

import { useState, useMemo } from 'react';
import { PageShell, StatCard, StatusBadge, Tabs } from '@m5/ui';

type PromoStatus = 'active'|'scheduled'|'ended'|'draft'|'cancelled';
type PromoType = 'discount'|'bundle'|'gift'|'points'|'flash';

interface Promotion { id: string; name: string; type: PromoType; status: PromoStatus; start: string; end: string; budget: number; spent: number; revenue: number; roi: number; participants: number; description: string; channels: string[]; }

const PS: Record<PromoStatus,{l:string;v:'success'|'warning'|'neutral'|'danger'|'info'}> = {
  active:{l:'进行中',v:'success'}, scheduled:{l:'已计划',v:'info'}, ended:{l:'已结束',v:'neutral'}, draft:{l:'草稿',v:'warning'}, cancelled:{l:'已取消',v:'danger'} };
const PT: Record<PromoType,string> = { discount:'折扣', bundle:'套餐', gift:'赠品', points:'积分', flash:'秒杀' };
const PTI: Record<PromoType,string> = { discount:'🏷️', bundle:'📦', gift:'🎁', points:'⭐', flash:'⚡' };
function fm(a:number):string{return`¥${a.toLocaleString('zh-CN',{minimumFractionDigits:2})}`;}

const promos: Promotion[] = [
  { id:'P1', name:'618年中大促', type:'discount', status:'ended', start:'2026-06-01', end:'2026-06-20', budget:5000, spent:4800, revenue:28500, roi:494, participants:1240, description:'全场8折优惠', channels:['APP','短信','公众号'] },
  { id:'P2', name:'夏日冰饮套餐', type:'bundle', status:'active', start:'2026-07-01', end:'2026-08-31', budget:3000, spent:1500, revenue:8200, roi:447, participants:560, description:'游戏币+饮品套餐', channels:['门店','APP'] },
  { id:'P3', name:'积分翻倍周末', type:'points', status:'active', start:'2026-07-05', end:'2026-07-31', budget:2000, spent:800, revenue:6500, roi:713, participants:890, description:'周末消费积分翻倍', channels:['APP','短信'] },
  { id:'P4', name:'新会员大礼包', type:'gift', status:'active', start:'2026-06-15', end:'2026-09-15', budget:1000, spent:450, revenue:3500, roi:678, participants:320, description:'注册即送游戏币', channels:['门店','APP','公众号'] },
  { id:'P5', name:'暑期特惠季', type:'discount', status:'active', start:'2026-07-10', end:'2026-08-20', budget:8000, spent:3000, revenue:15600, roi:420, participants:780, description:'学生凭证8折', channels:['门店','公众号'] },
  { id:'P6', name:'限时秒杀-娃娃机', type:'flash', status:'scheduled', start:'2026-07-20', end:'2026-07-21', budget:1500, spent:0, revenue:0, roi:0, participants:0, description:'娃娃机10次仅需30元', channels:['APP'] },
  { id:'P7', name:'会员生日月', type:'points', status:'draft', start:'2026-08-01', end:'2026-08-31', budget:2000, spent:0, revenue:0, roi:0, participants:0, description:'生日当月积分3倍', channels:['APP','短信'] },
  { id:'P8', name:'国庆嘉年华', type:'bundle', status:'draft', start:'2026-10-01', end:'2026-10-07', budget:10000, spent:0, revenue:0, roi:0, participants:0, description:'家庭套票+满减', channels:['门店','APP','公众号','短信'] },
];

export default function PromotionsPage() {
  const [tab,setTab]=useState<'list'|'analytics'>('list');
  const totalRevenue = promos.reduce((s,p)=>s+p.revenue,0);
  const totalSpent = promos.reduce((s,p)=>s+p.spent,0);
  const activeCount = promos.filter(p=>p.status==='active').length;
  const avgRoi = promos.filter(p=>p.roi>0).length>0 ? Math.round(promos.filter(p=>p.roi>0).reduce((s,p)=>s+p.roi,0)/promos.filter(p=>p.roi>0).length) : 0;

  return (
    <main style={{maxWidth:1200,margin:'0 auto',padding:32}}>
      <PageShell title="促销管理" subtitle="活动策划·效果分析·预算管控">
        <div style={{display:'grid',gap:14,gridTemplateColumns:'repeat(4,1fr)',marginBottom:20}}>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>活动总数</div><div style={{marginTop:6,fontSize:28,fontWeight:700}}>{promos.length}</div><div style={{marginTop:4,fontSize:12,color:'#22c55e'}}>进行中: {activeCount}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>总营收</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#22c55e'}}>{fm(totalRevenue)}</div><div style={{marginTop:4,fontSize:12,color:'#94a3b8'}}>总花费: {fm(totalSpent)}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>平均ROI</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:avgRoi>200?'#22c55e':avgRoi>100?'#eab308':'#ef4444'}}>{avgRoi}%</div><div style={{marginTop:4,fontSize:12,color:'#94a3b8'}}>投资回报率</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>参与人次</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#3b82f6'}}>{promos.reduce((s,p)=>s+p.participants,0).toLocaleString()}</div></div>
        </div>

        <div style={{marginBottom:16}}><Tabs items={[{key:'list',label:'📋 活动列表'},{key:'analytics',label:'📊 效果分析'}]} activeKey={tab} onChange={t=>setTab(t as typeof tab)} variant="pills" /></div>

        {tab==='list' && <div style={{display:'grid',gap:12}}>
          {promos.map(p => (
            <div key={p.id} style={{padding:'16px 20px',borderRadius:12,background:'rgba(15,23,42,0.3)',border:'1px solid rgba(148,163,184,0.1)'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}>
                <div style={{display:'flex',gap:10,alignItems:'center'}}>
                  <span style={{fontSize:24}}>{PTI[p.type]}</span>
                  <div><div style={{fontWeight:700,fontSize:16}}>{p.name}</div><div style={{fontSize:12,color:'#94a3b8'}}>{PT[p.type]} · {p.start}~{p.end}</div></div>
                </div>
                <StatusBadge label={PS[p.status].l} variant={PS[p.status].v} size="sm" dot />
              </div>
              <div style={{display:'grid',gap:10,gridTemplateColumns:'repeat(4,1fr)',marginBottom:8}}>
                <StatCard label="预算" value={fm(p.budget)} />
                <StatCard label="花费" value={fm(p.spent)} />
                <StatCard label="营收" value={fm(p.revenue)} />
                <StatCard label="ROI" value={`${p.roi}%`} helper={p.roi>300?'优秀':p.roi>100?'良好':'—'} />
              </div>
              <div style={{fontSize:12,color:'#94a3b8',display:'flex',gap:8,alignItems:'center'}}>
                <span>{p.description}</span>
                <span>·</span>
                <span>{p.participants}人参与</span>
                <span>·</span>
                <span>{p.channels.map(c=>`📱${c}`).join(' ')}</span>
              </div>
            </div>
          ))}
        </div>}

        {tab==='analytics' && (
          <><div style={{display:'grid',gap:14,gridTemplateColumns:'repeat(3,1fr)',marginBottom:20}}>
            <StatCard label="总营收" value={fm(totalRevenue)} />
            <StatCard label="总ROI" value={`${avgRoi}%`} helper={avgRoi>200?'优秀':''} />
            <StatCard label="转化率" value={`${((totalRevenue/(totalSpent||1))*100).toFixed(0)}%`} helper="每1元投入产出" />
          </div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr><th style={th}>活动</th><th style={th}>类型</th><th style={th}>预算</th><th style={th}>花费</th><th style={th}>营收</th><th style={th}>ROI</th><th style={th}>参与</th><th style={th}>状态</th></tr></thead>
            <tbody>{promos.map(p => (
              <tr key={p.id}>
                <td style={td}>{p.name}</td>
                <td style={td}>{PT[p.type]}</td>
                <td style={td}>{fm(p.budget)}</td>
                <td style={td}>{fm(p.spent)}</td>
                <td style={{...td,color:'#22c55e',fontWeight:600}}>{fm(p.revenue)}</td>
                <td style={{...td,color:p.roi>200?'#22c55e':p.roi>100?'#eab308':'#ef4444',fontWeight:600}}>{p.roi}%</td>
                <td style={td}>{p.participants}</td>
                <td style={td}><StatusBadge label={PS[p.status].l} variant={PS[p.status].v} size="sm" /></td>
              </tr>
            ))}</tbody>
          </table></>
        )}

        <div style={{display:'flex',gap:10,marginTop:16}}>
          <button style={btnStyle('#3b82f6','#93c5fd')}>➕ 创建活动</button>
          <button style={btnStyle('#22c55e','#86efac')}>📥 导出报告</button>
        </div>
      </PageShell>
    </main>
  );
}

const card: React.CSSProperties={borderRadius:16,padding:18,background:'rgba(15,23,42,0.38)',border:'1px solid rgba(148,163,184,0.18)'};
const th: React.CSSProperties={textAlign:'left',padding:'10px 14px',color:'#94a3b8',fontSize:12,borderBottom:'1px solid rgba(148,163,184,0.18)'};
const td: React.CSSProperties={padding:'10px 14px',color:'#e2e8f0',fontSize:13,borderBottom:'1px solid rgba(148,163,184,0.1)'};
const btnStyle=(bg:string,color:string):React.CSSProperties=>({borderRadius:10,padding:'10px 18px',background:`${bg}22`,color,border:'none',cursor:'pointer',fontSize:14,fontWeight:600});
