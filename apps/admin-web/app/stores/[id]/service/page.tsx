'use client';

/**
 * 门店客服中心 - Store Service Center
 * 角色: 🛒前台 / 👥HR
 * 功能: 投诉管理、建议收集、服务评价、客服记录
 */

import { useState, useMemo } from 'react';
import { PageShell, StatCard, StatusBadge, Tabs } from '@m5/ui';

type ComplaintStatus = 'open'|'processing'|'resolved'|'closed';
type ComplaintSource = 'in_store'|'phone'|'app'|'wechat'|'review_platform';
type ComplaintCategory = 'service'|'device'|'charge'|'environment'|'staff'|'other';
type SatisfactionLevel = 1|2|3|4|5;

interface Complaint { id:string; date:string; time:string; customer:string; phone:string; category:ComplaintCategory; source:ComplaintSource; description:string; status:ComplaintStatus; handler:string; resolution:string; resolvedAt:string; satisfaction:SatisfactionLevel; followUp:string; }
interface Feedback { id:string; date:string; customer:string; content:string; category:string; rating:SatisfactionLevel; reply:string; replied:boolean; }
interface ServiceRating { id:string; date:string; staff:string; score:SatisfactionLevel; dimension:string; comment:string; }

const CS: Record<ComplaintStatus,{l:string;v:'danger'|'warning'|'success'|'neutral'}> = { open:{l:'待处理',v:'danger'}, processing:{l:'处理中',v:'warning'}, resolved:{l:'已解决',v:'success'}, closed:{l:'已关闭',v:'neutral'} };
const CC: Record<ComplaintCategory,string> = { service:'服务态度', device:'设备故障', charge:'收费争议', environment:'环境卫生', staff:'人员管理', other:'其他' };
const CSRC: Record<ComplaintSource,string> = { in_store:'门店', phone:'电话', app:'APP', wechat:'微信', review_platform:'评价平台' };
function star(n:SatisfactionLevel):string{return '⭐'.repeat(n)+'☆'.repeat(5-n);}

const complaints: Complaint[] = [
  { id:'C1', date:'2026-07-11', time:'14:30', customer:'张先生', phone:'138****5678', category:'device', source:'in_store', description:'娃娃机爪子太松夹不到娃娃', status:'processing', handler:'杨磊', resolution:'已安排技术员检查爪力', resolvedAt:'', satisfaction:3, followUp:'' },
  { id:'C2', date:'2026-07-11', time:'11:20', customer:'李女士', phone:'139****1234', category:'charge', source:'in_store', description:'游戏币投了没出币', status:'resolved', handler:'王强', resolution:'已退款并补偿30枚游戏币', resolvedAt:'2026-07-11 11:45', satisfaction:4, followUp:'' },
  { id:'C3', date:'2026-07-10', time:'19:00', customer:'王先生', phone:'136****9012', category:'service', source:'app', description:'收银员态度不好', status:'resolved', handler:'店长', resolution:'已向收银员了解情况并进行培训', resolvedAt:'2026-07-10 21:00', satisfaction:3, followUp:'3天后回访' },
  { id:'C4', date:'2026-07-10', time:'15:00', customer:'赵女士', phone:'137****3456', category:'environment', source:'review_platform', description:'卫生间不够干净', status:'open', handler:'', resolution:'', resolvedAt:'', satisfaction:2, followUp:'' },
  { id:'C5', date:'2026-07-09', time:'20:30', customer:'刘先生', phone:'150****7890', category:'device', source:'phone', description:'赛车模拟器方向盘不灵敏', status:'processing', handler:'杨磊', resolution:'已联系厂商更换配件', resolvedAt:'', satisfaction:3, followUp:'' },
  { id:'C6', date:'2026-07-09', time:'10:00', customer:'陈小姐', phone:'158****2345', category:'charge', source:'in_store', description:'会员卡扣费异常', status:'resolved', handler:'李娜', resolution:'核实后补回扣错积分', resolvedAt:'2026-07-09 11:30', satisfaction:5, followUp:'' },
  { id:'C7', date:'2026-07-08', time:'17:45', customer:'小朋友家长', phone:'139****6789', category:'staff', source:'wechat', description:'导玩员未及时帮助', status:'closed', handler:'赵敏', resolution:'已与导玩员沟通加强服务意识', resolvedAt:'2026-07-08 19:00', satisfaction:4, followUp:'' },
  { id:'C8', date:'2026-07-08', time:'12:00', customer:'周先生', phone:'186****0123', category:'other', source:'in_store', description:'停车场票券无法使用', status:'resolved', handler:'前台', resolution:'已兑换为游戏币', resolvedAt:'2026-07-08 12:30', satisfaction:4, followUp:'' },
];

const feedbacks: Feedback[] = [
  { id:'F1', date:'2026-07-11', customer:'资深玩家', content:'希望增加更多街机游戏', category:'设备建议', rating:4, reply:'已收到建议，正在采购新游戏', replied:true },
  { id:'F2', date:'2026-07-10', customer:'妈妈会员', content:'儿童区可以再大一点吗', category:'空间建议', rating:5, reply:'', replied:false },
  { id:'F3', date:'2026-07-09', customer:'学生党', content:'晚上人太多需要排队', category:'运营建议', rating:3, reply:'高峰时段已增加人员安排', replied:true },
  { id:'F4', date:'2026-07-08', customer:'团建客户', content:'团建套餐很满意', category:'表扬', rating:5, reply:'', replied:false },
  { id:'F5', date:'2026-07-07', customer:'老会员', content:'积分兑换礼品可以更多样', category:'会员建议', rating:4, reply:'月底将上新一批礼品', replied:true },
  { id:'F6', date:'2026-07-06', customer:'游客', content:'空调太冷了', category:'环境建议', rating:3, reply:'已调整空调温度', replied:true },
];

const ratings: ServiceRating[] = [
  { id:'R1', date:'2026-07-11', staff:'王强', score:5, dimension:'收银速度', comment:'很快' },
  { id:'R2', date:'2026-07-11', staff:'赵敏', score:4, dimension:'服务态度', comment:'耐心' },
  { id:'R3', date:'2026-07-10', staff:'刘洋', score:3, dimension:'游戏指导', comment:'一般' },
  { id:'R4', date:'2026-07-10', staff:'陈静', score:5, dimension:'问题解决', comment:'非常满意' },
  { id:'R5', date:'2026-07-09', staff:'杨磊', score:4, dimension:'技术维修', comment:'及时' },
];

export default function StoreServiceCenterPage() {
  const [tab,setTab]=useState<'complaints'|'feedback'|'ratings'>('complaints');
  const stats = useMemo(()=>({
    total:complaints.length,open:complaints.filter(c=>c.status==='open').length,
    processing:complaints.filter(c=>c.status==='processing').length,
    resolved:complaints.filter(c=>c.status==='resolved').length,
    resolutionRate: complaints.length>0 ? Math.round((complaints.filter(c=>c.status==='resolved'||c.status==='closed').length/complaints.length)*100) : 0,
    avgSatisfaction: complaints.filter(c=>c.satisfaction).length>0 ? (complaints.filter(c=>c.satisfaction).reduce((s,c)=>s+c.satisfaction,0)/complaints.filter(c=>c.satisfaction).length).toFixed(1) : '—',
  }),[complaints]);

  return (
    <main style={{maxWidth:1200,margin:'0 auto',padding:32}}>
      <PageShell title="🏪 客服中心" subtitle="投诉管理·建议收集·服务评价">
        <div style={{display:'grid',gap:14,gridTemplateColumns:'repeat(4,1fr)',marginBottom:20}}>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>投诉总数</div><div style={{marginTop:6,fontSize:28,fontWeight:700}}>{stats.total}</div><div style={{marginTop:4,fontSize:12,color:'#ef4444'}}>待处理: {stats.open}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>解决率</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:stats.resolutionRate>90?'#22c55e':'#eab308'}}>{stats.resolutionRate}%</div><div style={{marginTop:4,fontSize:12,color:'#94a3b8'}}>处理中: {stats.processing}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>满意度</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:Number(stats.avgSatisfaction)>=4?'#22c55e':'#eab308'}}>{stats.avgSatisfaction}/5.0</div><div style={{marginTop:4,fontSize:12,color:'#94a3b8'}}>客户评价</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>未回复建议</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#eab308'}}>{feedbacks.filter(f=>!f.replied).length}</div><div style={{marginTop:4,fontSize:12,color:'#94a3b8'}}>需及时回复</div></div>
        </div>

        <div style={{marginBottom:16}}><Tabs items={[
          {key:'complaints',label:`📋 投诉 (${complaints.length})`},
          {key:'feedback',label:`💡 建议 (${feedbacks.length})`},
          {key:'ratings',label:`⭐ 评价 (${ratings.length})`},
        ]} activeKey={tab} onChange={t=>setTab(t as typeof tab)} variant="pills" /></div>

        {tab==='complaints' && <div style={{display:'grid',gap:10}}>
          {complaints.map(c => (
            <div key={c.id} style={{padding:'14px 18px',borderRadius:12,background:'rgba(15,23,42,0.3)',border:c.status==='open'?'1px solid rgba(239,68,68,0.2)':'1px solid rgba(148,163,184,0.1)'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                <div style={{fontWeight:600,fontSize:14}}>{c.description}</div>
                <StatusBadge label={CS[c.status].l} variant={CS[c.status].v} size="sm" dot />
              </div>
              <div style={{fontSize:12,color:'#94a3b8',display:'flex',gap:12}}>
                <span>{c.customer}·{c.phone}</span>
                <span>{CSRC[c.source]}</span>
                <span>{CC[c.category]}</span>
                <span>{c.date} {c.time}</span>
                {c.handler && <span>处理: {c.handler}</span>}
                {c.satisfaction>0 && <span>{star(c.satisfaction)}</span>}
              </div>
              {c.resolution && <div style={{marginTop:6,fontSize:12,color:'#86efac',padding:'6px 10px',borderRadius:6,background:'rgba(34,197,94,0.08)'}}>✅ {c.resolution}</div>}
            </div>
          ))}
        </div>}

        {tab==='feedback' && <div style={{display:'grid',gap:10}}>
          {feedbacks.map(f => (
            <div key={f.id} style={{padding:'14px 18px',borderRadius:12,background:'rgba(15,23,42,0.3)'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                <div style={{fontWeight:600,fontSize:14}}>{f.content}</div>
                <span style={{fontSize:12}}>{star(f.rating)}</span>
              </div>
              <div style={{fontSize:12,color:'#94a3b8',display:'flex',gap:12}}>
                <span>{f.customer}</span><span>{f.category}</span><span>{f.date}</span>
                {f.replied ? <span style={{color:'#22c55e'}}>✅已回复</span> : <span style={{color:'#eab308'}}>⏳待回复</span>}
              </div>
              {f.reply && <div style={{marginTop:6,fontSize:12,color:'#93c5fd'}}>📝 {f.reply}</div>}
            </div>
          ))}
        </div>}

        {tab==='ratings' && <div style={{display:'grid',gap:10}}>
          {ratings.map(r => (
            <div key={r.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px',borderRadius:10,background:'rgba(15,23,42,0.3)'}}>
              <div><span style={{fontWeight:600,fontSize:14}}>{r.staff}</span><span style={{color:'#94a3b8',marginLeft:8,fontSize:12}}>{r.dimension}</span></div>
              <div style={{display:'flex',gap:12,alignItems:'center'}}>
                <span>{star(r.score)}</span>
                <span style={{fontSize:12,color:'#cbd5e1'}}>{r.comment}</span>
                <span style={{fontSize:11,color:'#94a3b8'}}>{r.date}</span>
              </div>
            </div>
          ))}
        </div>}
      </PageShell>
    </main>
  );
}

const card: React.CSSProperties={borderRadius:16,padding:18,background:'rgba(15,23,42,0.38)',border:'1px solid rgba(148,163,184,0.18)'};
