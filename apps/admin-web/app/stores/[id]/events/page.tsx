'use client';

/**
 * 门店活动管理 - Events & Activities
 * 角色: 📢营销运营 / 🎯运行专员
 * 功能: 活动日历、活动创建、报名管理、活动回顾
 */

import { useState, useMemo } from 'react';
import { PageShell, StatCard, StatusBadge, Tabs } from '@m5/ui';

type EventStatus = 'upcoming'|'ongoing'|'ended'|'cancelled';
type EventType = 'competition'|'party'|'workshop'|'promotion'|'seasonal'|'charity';

interface StoreEvent { id:string; name:string; type:EventType; status:EventStatus; startDate:string; endDate:string; startTime:string; endTime:string; location:string; capacity:number; registered:number; budget:number; actualCost:number; revenue:number; description:string; organizer:string; contact:string; participants:string[]; highlights:string[]; rating:number; }

const ES: Record<EventStatus,{l:string;v:'success'|'warning'|'neutral'|'danger'}> = { upcoming:{l:'即将开始',v:'warning'}, ongoing:{l:'进行中',v:'success'}, ended:{l:'已结束',v:'neutral'}, cancelled:{l:'已取消',v:'danger'} };
const ET: Record<EventType,string> = { competition:'比赛', party:'派对', workshop:'工坊', promotion:'促销', seasonal:'季节性', charity:'公益' };
const ETI: Record<EventType,string> = { competition:'🏆', party:'🎉', workshop:'🔧', promotion:'🏷️', seasonal:'🎄', charity:'❤️' };
function fm(a:number):string{return`¥${a.toLocaleString('zh-CN',{minimumFractionDigits:2})}`;}

const events: StoreEvent[] = [
  { id:'E1', name:'拳皇争霸赛(七月赛)', type:'competition', status:'upcoming', startDate:'2026-07-18', endDate:'2026-07-18', startTime:'14:00', endTime:'18:00', location:'A区比赛区', capacity:32, registered:18, budget:3000, actualCost:0, revenue:0, description:'拳皇XV月赛，冠军奖金¥1000', organizer:'赵敏', contact:'赵敏', participants:['已报名18人'], highlights:[], rating:0 },
  { id:'E2', name:'亲子周末嘉年华', type:'party', status:'upcoming', startDate:'2026-07-19', endDate:'2026-07-19', startTime:'10:00', endTime:'17:00', location:'全店', capacity:100, registered:45, budget:5000, actualCost:0, revenue:0, description:'亲子游戏+手工+美食节', organizer:'陈静', contact:'陈静', participants:[], highlights:[], rating:0 },
  { id:'E3', name:'暑期特惠季', type:'promotion', status:'ongoing', startDate:'2026-07-10', endDate:'2026-08-20', startTime:'00:00', endTime:'23:59', location:'全店', capacity:0, registered:0, budget:8000, actualCost:3200, revenue:15600, description:'学生凭证8折+充值满赠', organizer:'市场部', contact:'陈静', participants:[], highlights:['首周营收超预期', '日均新增20+会员'], rating:0 },
  { id:'E4', name:'6月会员生日会', type:'party', status:'ended', startDate:'2026-06-28', endDate:'2026-06-28', startTime:'15:00', endTime:'19:00', location:'B区派对房', capacity:30, registered:26, budget:2000, actualCost:1850, revenue:4200, description:'6月出生的会员免费参加', organizer:'赵敏', contact:'赵敏', participants:['张先生','李女士','王妈妈','刘同学','陈阿姨'], highlights:['满意度4.8','3人当场续费'], rating:4.8 },
  { id:'E5', name:'端午节主题活动', type:'seasonal', status:'ended', startDate:'2026-06-10', endDate:'2026-06-12', startTime:'10:00', endTime:'22:00', location:'全店', capacity:0, registered:0, budget:3000, actualCost:2800, revenue:8500, description:'端午粽子DIY+龙舟赛游戏', organizer:'市场部', contact:'陈静', participants:[], highlights:['3天营收破纪录','好评率96%'], rating:4.6 },
  { id:'E6', name:'游戏制作工坊', type:'workshop', status:'upcoming', startDate:'2026-07-25', endDate:'2026-07-25', startTime:'14:00', endTime:'17:00', location:'培训室', capacity:15, registered:8, budget:1500, actualCost:0, revenue:0, description:'教小朋友制作简易电子游戏', organizer:'周讲师', contact:'周讲师', participants:[], highlights:[], rating:0 },
  { id:'E7', name:'慈善游戏马拉松', type:'charity', status:'upcoming', startDate:'2026-08-01', endDate:'2026-08-01', startTime:'10:00', endTime:'22:00', location:'全店', capacity:200, registered:35, budget:2000, actualCost:0, revenue:0, description:'12小时游戏马拉松·收入捐赠福利院', organizer:'店长', contact:'店长', participants:[], highlights:[], rating:0 },
];

export default function EventsPage() {
  const [tab,setTab]=useState<'upcoming'|'past'>('upcoming');
  const now = new Date().toISOString().split('T')[0];
  const upcoming = events.filter(e=>e.endDate>=now&&e.status!=='cancelled');
  const past = events.filter(e=>e.endDate<now||e.status==='cancelled');
  const display = tab==='upcoming'?upcoming:past;
  const totalRevenue = events.reduce((s,e)=>s+e.revenue,0);
  const totalCost = events.reduce((s,e)=>s+e.actualCost,0);

  return (
    <main style={{maxWidth:1200,margin:'0 auto',padding:32}}>
      <PageShell title="🎪 活动管理" subtitle={`${events.length}个活动 · 总营收${fm(totalRevenue)}`}>
        <div style={{display:'grid',gap:14,gridTemplateColumns:'repeat(4,1fr)',marginBottom:20}}>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>活动总数</div><div style={{marginTop:6,fontSize:28,fontWeight:700}}>{events.length}</div><div style={{marginTop:4,fontSize:12,color:'#22c55e'}}>进行中: {events.filter(e=>e.status==='ongoing').length}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>即将开始</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#eab308'}}>{upcoming.filter(e=>e.status==='upcoming').length}</div><div style={{marginTop:4,fontSize:12,color:'#94a3b8'}}>已报名: {upcoming.reduce((s,e)=>s+e.registered,0)}人</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>活动营收</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#22c55e'}}>{fm(totalRevenue)}</div><div style={{marginTop:4,fontSize:12,color:'#94a3b8'}}>成本: {fm(totalCost)}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>ROI</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:totalCost>0?'#22c55e':'#94a3b8'}}>{totalCost>0?`${Math.round((totalRevenue-totalCost)/totalCost*100)}%`:'—'}</div></div>
        </div>

        <div style={{marginBottom:16}}><Tabs items={[{key:'upcoming',label:'📅 即将/进行中'},{key:'past',label:'📋 已结束'}]} activeKey={tab} onChange={t=>setTab(t as typeof tab)} variant="pills" /></div>

        <div style={{display:'grid',gap:12}}>
          {display.map(e => (
            <div key={e.id} style={{padding:'16px 20px',borderRadius:12,background:'rgba(15,23,42,0.3)',border:e.status==='ongoing'?'1px solid rgba(34,197,94,0.2)':'1px solid rgba(148,163,184,0.1)'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
                <div style={{display:'flex',gap:10,alignItems:'center'}}>
                  <span style={{fontSize:28}}>{ETI[e.type]}</span>
                  <div><div style={{fontWeight:700,fontSize:16}}>{e.name}</div><div style={{fontSize:12,color:'#94a3b8'}}>{ET[e.type]} · {e.location} · {e.startDate}~{e.endDate}</div></div>
                </div>
                <StatusBadge label={ES[e.status].l} variant={ES[e.status].v} size="sm" dot />
              </div>
              <div style={{display:'grid',gap:10,gridTemplateColumns:'repeat(4,1fr)',marginBottom:8}}>
                <StatCard label="时间" value={`${e.startTime}-${e.endTime}`} />
                <StatCard label="报名/容量" value={e.capacity>0?`${e.registered}/${e.capacity}`:'不限制'} helper={`${e.organizer}主办`} />
                <StatCard label="预算/成本" value={`${fm(e.budget)}/${e.actualCost>0?fm(e.actualCost):'待统计'}`} />
                <StatCard label="营收" value={e.revenue>0?fm(e.revenue):'待统计'} />
              </div>
              <div style={{fontSize:13,color:'#cbd5e1'}}>{e.description}</div>
              {e.highlights.length>0 && <div style={{marginTop:6,display:'flex',gap:6,flexWrap:'wrap'}}>{e.highlights.map(h=><span key={h} style={tagStyle}>{h}</span>)}</div>}
              {e.rating>0 && <div style={{marginTop:4,fontSize:12,color:'#eab308'}}>{'⭐'.repeat(Math.round(e.rating))} {e.rating}</div>}
            </div>
          ))}
        </div>

        <div style={{display:'flex',gap:10,marginTop:20}}>
          <button style={btnStyle('#3b82f6','#93c5fd')}>➕ 创建活动</button>
          <button style={btnStyle('#22c55e','#86efac')}>📋 活动日历</button>
        </div>
      </PageShell>
    </main>
  );
}

const card: React.CSSProperties={borderRadius:16,padding:18,background:'rgba(15,23,42,0.38)',border:'1px solid rgba(148,163,184,0.18)'};
const tagStyle: React.CSSProperties={padding:'2px 8px',borderRadius:4,background:'rgba(34,197,94,0.1)',color:'#86efac',fontSize:11};
const btnStyle=(bg:string,color:string):React.CSSProperties=>({borderRadius:10,padding:'10px 18px',background:`${bg}22`,color,border:'none',cursor:'pointer',fontSize:14,fontWeight:600});
