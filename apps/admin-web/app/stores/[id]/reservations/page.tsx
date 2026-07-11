'use client';

/**
 * 团建/包场管理 - Group Reservation Management
 * 角色: 🤝团建 / 👔店长
 * 功能: 包场订单、团建套餐、场地预约、活动方案管理
 */

import { useState, useMemo } from 'react';
import { PageShell, StatCard, StatusBadge, Tabs } from '@m5/ui';

type ReservationStatus = 'confirmed'|'pending'|'in_progress'|'completed'|'cancelled';
type GroupType = 'corporate'|'school'|'birthday'|'team_building'|'private';
type PackageType = 'basic'|'standard'|'premium'|'custom';

interface Reservation { id:string; customer:string; phone:string; groupType:GroupType; packageType:PackageType; date:string; time:string; guests:number; totalAmount:number; deposit:number; status:ReservationStatus; coordinator:string; specialReqs:string; duration:number; menuItems:string[]; }
interface Package { id:string; name:string; type:PackageType; price:number; minGuests:number; maxGuests:number; duration:number; includes:string[]; description:string; }

const RSTATUS: Record<ReservationStatus,{l:string;v:'success'|'warning'|'info'|'neutral'|'danger'}> = {
  confirmed:{l:'已确认',v:'success'}, pending:{l:'待确认',v:'warning'}, in_progress:{l:'进行中',v:'info'}, completed:{l:'已完成',v:'neutral'}, cancelled:{l:'已取消',v:'danger'},
};
const GT: Record<GroupType,string> = { corporate:'企业团建', school:'学校活动', birthday:'生日派对', team_building:'团队建设', private:'私人聚会' };
const PT: Record<PackageType,string> = { basic:'基础套餐', standard:'标准套餐', premium:'高级套餐', custom:'定制套餐' };
const PT_COLORS: Record<PackageType,string> = { basic:'#6b7280', standard:'#3b82f6', premium:'#8b5cf6', custom:'#eab308' };
function fm(a:number):string{return`¥${a.toLocaleString('zh-CN',{minimumFractionDigits:2})}`;}

const reservations: Reservation[] = [
  { id:'RES-001', customer:'阿里巴巴', phone:'138****0001', groupType:'corporate', packageType:'premium', date:'2026-07-15', time:'14:00-18:00', guests:30, totalAmount:15000, deposit:5000, status:'confirmed', coordinator:'李娜', specialReqs:'需要投影仪', duration:4, menuItems:['饮品畅饮','零食拼盘'] },
  { id:'RES-002', customer:'王先生', phone:'139****0002', groupType:'birthday', packageType:'standard', date:'2026-07-13', time:'10:00-14:00', guests:15, totalAmount:4500, deposit:1500, status:'confirmed', coordinator:'赵敏', specialReqs:'需要生日气球布置', duration:4, menuItems:['蛋糕','饮品','零食'] },
  { id:'RES-003', customer:'北师大附中', phone:'136****0003', groupType:'school', packageType:'basic', date:'2026-07-16', time:'09:00-12:00', guests:45, totalAmount:9000, deposit:3000, status:'pending', coordinator:'', specialReqs:'需要老师陪同', duration:3, menuItems:['饮品'] },
  { id:'RES-004', customer:'腾讯游戏', phone:'150****0004', groupType:'team_building', packageType:'premium', date:'2026-07-20', time:'13:00-20:00', guests:25, totalAmount:18750, deposit:6000, status:'pending', coordinator:'', specialReqs:'需要使用比赛模式', duration:7, menuItems:['自助晚餐','饮品畅饮'] },
  { id:'RES-005', customer:'李女士', phone:'158****0005', groupType:'private', packageType:'custom', date:'2026-07-12', time:'15:00-18:00', guests:8, totalAmount:3600, deposit:1000, status:'in_progress', coordinator:'王强', specialReqs:'', duration:3, menuItems:['饮品','小食'] },
  { id:'RES-006', customer:'字节跳动', phone:'186****0006', groupType:'corporate', packageType:'standard', date:'2026-07-22', time:'14:00-18:00', guests:20, totalAmount:8000, deposit:2000, status:'confirmed', coordinator:'陈静', specialReqs:'', duration:4, menuItems:['饮品畅饮','零食拼盘'] },
  { id:'RES-007', customer:'张妈妈', phone:'137****0007', groupType:'birthday', packageType:'premium', date:'2026-07-19', time:'10:00-13:00', guests:12, totalAmount:6000, deposit:2000, status:'confirmed', coordinator:'刘洋', specialReqs:'需要儿童座椅', duration:3, menuItems:['生日蛋糕','饮品','礼物'] },
  { id:'RES-008', customer:'美团点评', phone:'139****0008', groupType:'corporate', packageType:'custom', date:'2026-07-25', time:'13:00-17:00', guests:35, totalAmount:24500, deposit:8000, status:'pending', coordinator:'', specialReqs:'需要安排比赛', duration:4, menuItems:['自助餐','饮品畅饮','甜品'] },
];

const packages: Package[] = [
  { id:'PKG-001', name:'基础团建套餐', type:'basic', price:200, minGuests:10, maxGuests:50, duration:3, includes:['入场门票','游戏币*50/人','饮品*1'], description:'入门级团建方案' },
  { id:'PKG-002', name:'标准团建套餐', type:'standard', price:350, minGuests:8, maxGuests:30, duration:4, includes:['入场门票','游戏币*100/人','饮品畅饮','零食拼盘','专人导玩'], description:'最受欢迎团建方案' },
  { id:'PKG-003', name:'高级团建套餐', type:'premium', price:500, minGuests:10, maxGuests:40, duration:4, includes:['入场门票','游戏币无限','饮品畅饮','自助餐','专人导玩','私人包场','纪念品'], description:'高端团建体验' },
  { id:'PKG-004', name:'生日派对套餐', type:'standard', price:300, minGuests:5, maxGuests:20, duration:3, includes:['入场门票','游戏币*80/人','生日蛋糕','饮品','气球布置'], description:'生日专属派对方案' },
  { id:'PKG-005', name:'儿童派对套餐', type:'basic', price:250, minGuests:5, maxGuests:15, duration:2, includes:['儿童区门票','游戏币*50','小食','饮品','导玩员陪同'], description:'儿童派对专属' },
];

export default function GroupReservationPage() {
  const [tab,setTab]=useState<'reservations'|'packages'>('reservations');
  const stats = useMemo(()=>({
    total:reservations.length, confirmed:reservations.filter(r=>r.status==='confirmed'||r.status==='in_progress').length,
    pending:reservations.filter(r=>r.status==='pending').length, completed:reservations.filter(r=>r.status==='completed').length,
    totalRevenue:reservations.reduce((s,r)=>s+r.totalAmount,0), totalGuests:reservations.reduce((s,r)=>s+r.guests,0),
    upcoming:reservations.filter(r=>r.status==='confirmed'||r.status==='pending').length,
  }),[reservations]);

  return (
    <main style={{maxWidth:1200,margin:'0 auto',padding:32}}>
      <PageShell title="🤝 团建/包场管理" subtitle={`${stats.upcoming}个待处理包场 · ${stats.totalGuests}位宾客`}>
        <div style={{display:'grid',gap:14,gridTemplateColumns:'repeat(4,1fr)',marginBottom:20}}>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>订单总数</div><div style={{marginTop:6,fontSize:28,fontWeight:700}}>{stats.total}</div><div style={{marginTop:4,fontSize:12,color:'#22c55e'}}>已完成: {stats.completed}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>待处理</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#eab308'}}>{stats.pending}</div><div style={{marginTop:4,fontSize:12,color:'#94a3b8'}}>确认中: {stats.confirmed}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>包场营收</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#22c55e'}}>{fm(stats.totalRevenue)}</div><div style={{marginTop:4,fontSize:12,color:'#94a3b8'}}>总宾客: {stats.totalGuests}人</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>可用套餐</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#3b82f6'}}>{packages.length}</div></div>
        </div>

        <div style={{marginBottom:16}}><Tabs items={[
          {key:'reservations',label:'📋 包场订单'},{key:'packages',label:'🎁 团建套餐'},
        ]} activeKey={tab} onChange={t=>setTab(t as typeof tab)} variant="pills" /></div>

        {tab==='reservations' && <div style={{display:'grid',gap:10}}>
          {reservations.map(r => (
            <div key={r.id} style={{padding:'14px 18px',borderRadius:12,background:'rgba(15,23,42,0.3)',border:r.status==='pending'?'1px solid rgba(245,158,11,0.2)':'1px solid rgba(148,163,184,0.1)'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                <div><span style={{fontWeight:700,fontSize:14}}>{r.customer}</span><span style={{color:'#94a3b8',marginLeft:8,fontSize:12}}>{GT[r.groupType]} · {r.guests}人</span></div>
                <StatusBadge label={RSTATUS[r.status].l} variant={RSTATUS[r.status].v} size="sm" dot />
              </div>
              <div style={{fontSize:12,color:'#cbd5e1',display:'flex',gap:16}}>
                <span>📅 {r.date}</span><span>⏰ {r.time}</span>
                <span style={{color:PT_COLORS[r.packageType],fontWeight:600}}>{PT[r.packageType]}</span>
                <span style={{color:'#22c55e',fontWeight:700}}>{fm(r.totalAmount)}</span>
                <span>订金: {fm(r.deposit)}</span>
                {r.coordinator && <span>协调: {r.coordinator}</span>}
              </div>
              {r.specialReqs && <div style={{marginTop:4,fontSize:12,color:'#fca5a5'}}>📝 {r.specialReqs}</div>}
            </div>
          ))}
        </div>}

        {tab==='packages' && <div style={{display:'grid',gap:10,gridTemplateColumns:'repeat(2,1fr)'}}>
          {packages.map(p => (
            <div key={p.id} style={{padding:'16px',borderRadius:12,background:'rgba(15,23,42,0.3)',border:'1px solid rgba(148,163,184,0.1)'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                <div><span style={{fontWeight:700,fontSize:16}}>{p.name}</span><span style={{color:PT_COLORS[p.type],marginLeft:6,fontSize:12}}>[{PT[p.type]}]</span></div>
                <div style={{fontSize:20,fontWeight:700,color:'#22c55e'}}>{fm(p.price)}<span style={{fontSize:12,color:'#94a3b8'}}>/人</span></div>
              </div>
              <div style={{fontSize:12,color:'#94a3b8',marginBottom:8}}>{p.minGuests}-{p.maxGuests}人 · {p.duration}h · {p.description}</div>
              <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                {p.includes.map((item,i)=><span key={i} style={{padding:'3px 8px',borderRadius:4,background:'rgba(34,197,94,0.1)',color:'#86efac',fontSize:11}}>{item}</span>)}
              </div>
            </div>
          ))}
        </div>}
      </PageShell>
    </main>
  );
}

const card: React.CSSProperties={borderRadius:16,padding:18,background:'rgba(15,23,42,0.38)',border:'1px solid rgba(148,163,184,0.18)'};
