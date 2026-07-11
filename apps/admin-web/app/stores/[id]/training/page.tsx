'use client';

/**
 * 门店培训管理 - Store Training Management
 * 角色: 📚培训师 / 👥HR
 * 功能: 培训计划、培训记录、考核成绩、证书管理
 */

import { useState, useMemo } from 'react';
import { PageShell, StatCard, StatusBadge, Tabs } from '@m5/ui';

type TrainingStatus = 'planned'|'in_progress'|'completed'|'cancelled';
type TrainingCategory = 'onboarding'|'safety'|'service'|'operation'|'device'|'sales';
type ExamResult = 'pass'|'fail'|'excellent'|'pending';

interface TrainingPlan { id:string; name:string; category:TrainingCategory; trainer:string; date:string; duration:number; participants:number; completedCount:number; status:TrainingStatus; location:string; materials:string[]; description:string; }
interface TrainingRecord { id:string; staffName:string; courseName:string; category:TrainingCategory; trainer:string; date:string; score:number; result:ExamResult; certificateIssued:boolean; duration:number; }

const TC: Record<TrainingCategory, string> = { onboarding:'入职培训', safety:'安全培训', service:'服务培训', operation:'运营培训', device:'设备培训', sales:'销售培训' };
const TS: Record<TrainingStatus, {l:string;v:'success'|'warning'|'neutral'|'danger'}> = { planned:{l:'已计划',v:'neutral'}, in_progress:{l:'进行中',v:'warning'}, completed:{l:'已完成',v:'success'}, cancelled:{l:'已取消',v:'danger'} };
const ER: Record<ExamResult, {l:string;v:'success'|'danger'|'info'|'neutral'}> = { pass:{l:'通过',v:'success'}, fail:{l:'未通过',v:'danger'}, excellent:{l:'优秀',v:'info'}, pending:{l:'待考核',v:'neutral'} };

const plans: TrainingPlan[] = [
  { id:'TP-001', name:'新员工入职培训(7月)', category:'onboarding', trainer:'周杰', date:'2026-07-05', duration:4, participants:8, completedCount:8, status:'completed', location:'培训室A', materials:['员工手册','系统操作指南'], description:'新员工入职基础培训' },
  { id:'TP-002', name:'消防安全培训(夏季)', category:'safety', trainer:'赵敏', date:'2026-07-12', duration:2, participants:12, completedCount:5, status:'in_progress', location:'大厅', materials:['消防手册'], description:'夏季消防安全专项培训' },
  { id:'TP-003', name:'客户服务提升课程', category:'service', trainer:'周杰', date:'2026-07-15', duration:3, participants:10, completedCount:0, status:'planned', location:'培训室A', materials:['服务标准手册'], description:'提升服务意识和沟通技巧' },
  { id:'TP-004', name:'新游戏设备操作培训', category:'device', trainer:'厂商代表', date:'2026-07-08', duration:2, participants:6, completedCount:6, status:'completed', location:'B区', materials:['设备说明书'], description:'VR设备操作培训' },
  { id:'TP-005', name:'收银系统操作培训', category:'operation', trainer:'李娜', date:'2026-07-10', duration:3, participants:5, completedCount:5, status:'completed', location:'收银台', materials:['操作手册'], description:'新收银系统操作' },
  { id:'TP-006', name:'会员营销技巧培训', category:'sales', trainer:'市场部', date:'2026-07-20', duration:2, participants:15, completedCount:0, status:'planned', location:'培训室A', materials:['营销资料'], description:'会员推荐和积分销售技巧' },
  { id:'TP-007', name:'设备日常维护培训', category:'device', trainer:'杨磊', date:'2026-07-18', duration:1, participants:8, completedCount:0, status:'planned', location:'设备区', materials:['维护手册'], description:'日常巡检和维护要点' },
];

const records: TrainingRecord[] = [
  { id:'TR-001', staffName:'张伟', courseName:'新员工入职培训(7月)', category:'onboarding', trainer:'周杰', date:'2026-07-05', score:88, result:'excellent', certificateIssued:true, duration:4 },
  { id:'TR-002', staffName:'李娜', courseName:'收银系统操作培训', category:'operation', trainer:'李娜', date:'2026-07-10', score:95, result:'excellent', certificateIssued:true, duration:3 },
  { id:'TR-003', staffName:'王强', courseName:'消防安全培训(夏季)', category:'safety', trainer:'赵敏', date:'2026-07-12', score:75, result:'pass', certificateIssued:true, duration:2 },
  { id:'TR-004', staffName:'赵敏', courseName:'新游戏设备操作培训', category:'device', trainer:'厂商代表', date:'2026-07-08', score:92, result:'excellent', certificateIssued:true, duration:2 },
  { id:'TR-005', staffName:'刘洋', courseName:'新员工入职培训(7月)', category:'onboarding', trainer:'周杰', date:'2026-07-05', score:62, result:'pass', certificateIssued:true, duration:4 },
  { id:'TR-006', staffName:'陈静', courseName:'新员工入职培训(7月)', category:'onboarding', trainer:'周杰', date:'2026-07-05', score:45, result:'fail', certificateIssued:false, duration:4 },
  { id:'TR-007', staffName:'杨磊', courseName:'新游戏设备操作培训', category:'device', trainer:'厂商代表', date:'2026-07-08', score:85, result:'excellent', certificateIssued:true, duration:2 },
  { id:'TR-008', staffName:'黄丽', courseName:'消防安全培训(夏季)', category:'safety', trainer:'赵敏', date:'2026-07-12', score:70, result:'pass', certificateIssued:false, duration:2 },
  { id:'TR-009', staffName:'周杰', courseName:'客户服务提升课程', category:'service', trainer:'周杰', date:'2026-07-05', score:0, result:'pending', certificateIssued:false, duration:3 },
  { id:'TR-010', staffName:'吴芳', courseName:'新员工入职培训(7月)', category:'onboarding', trainer:'周杰', date:'2026-07-05', score:78, result:'pass', certificateIssued:true, duration:4 },
];

export default function TrainingPage() {
  const [tab,setTab]=useState<'plans'|'records'>('plans');
  const stats = useMemo(()=>({
    total:plans.length, completed:plans.filter(p=>p.status==='completed').length,
    planned:plans.filter(p=>p.status==='planned').length, inProgress:plans.filter(p=>p.status==='in_progress').length,
    totalParticipants:plans.reduce((s,p)=>s+p.participants,0),
    avgScore:Math.round(records.filter(r=>r.score>0).reduce((s,r)=>s+r.score,0)/Math.max(records.filter(r=>r.score>0).length,1)),
    certificated:records.filter(r=>r.certificateIssued).length,
  }),[plans,records]);

  return (
    <main style={{maxWidth:1200,margin:'0 auto',padding:32}}>
      <PageShell title="📚 培训管理" subtitle="培训计划·考核记录·证书管理">
        <div style={{display:'grid',gap:14,gridTemplateColumns:'repeat(4,1fr)',marginBottom:20}}>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>培训计划</div><div style={{marginTop:6,fontSize:28,fontWeight:700}}>{stats.total}</div><div style={{marginTop:4,fontSize:12,color:'#22c55e'}}>已完: {stats.completed}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>待进行</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#eab308'}}>{stats.planned}</div><div style={{marginTop:4,fontSize:12,color:'#94a3b8'}}>进行中: {stats.inProgress}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>受训人次</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#3b82f6'}}>{stats.totalParticipants}</div><div style={{marginTop:4,fontSize:12,color:'#94a3b8'}}>平均分: {stats.avgScore}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>已发证书</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#22c55e'}}>{stats.certificated}</div></div>
        </div>

        <div style={{marginBottom:16}}><Tabs items={[
          {key:'plans',label:`📋 培训计划 (${plans.length})`},{key:'records',label:`📊 培训记录 (${records.length})`},
        ]} activeKey={tab} onChange={t=>setTab(t as typeof tab)} variant="pills" /></div>

        {tab==='plans' && <div style={{display:'grid',gap:10}}>
          {plans.map(p => (
            <div key={p.id} style={{padding:'14px 18px',borderRadius:12,background:'rgba(15,23,42,0.3)',border:p.status==='planned'?'1px solid rgba(148,163,184,0.1)':'1px solid rgba(148,163,184,0.1)'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                <div><span style={{fontWeight:700,fontSize:14}}>{p.name}</span><span style={{color:'#94a3b8',marginLeft:8,fontSize:12}}>{TC[p.category]} · {p.trainer}</span></div>
                <StatusBadge label={TS[p.status].l} variant={TS[p.status].v} size="sm" dot />
              </div>
              <div style={{fontSize:12,color:'#cbd5e1',display:'flex',gap:16}}>
                <span>📅 {p.date}</span><span>⏱ {p.duration}天</span>
                <span>👥 {p.completedCount}/{p.participants}人</span><span>📍 {p.location}</span>
              </div>
            </div>
          ))}
        </div>}

        {tab==='records' && <>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              <th style={th}>员工</th><th style={th}>课程</th><th style={th}>讲师</th><th style={th}>日期</th>
              <th style={th}>成绩</th><th style={th}>结果</th><th style={th}>证书</th>
            </tr></thead>
            <tbody>{records.map(r => (
              <tr key={r.id}>
                <td style={td}>{r.staffName}</td>
                <td style={td}>{r.courseName}</td>
                <td style={td}>{r.trainer}</td>
                <td style={td}>{r.date}</td>
                <td style={{...td,fontWeight:600,color:r.score>=80?'#22c55e':r.score>=60?'#eab308':r.score===0?'#6b7280':'#ef4444'}}>{r.score||'—'}</td>
                <td style={td}><StatusBadge label={ER[r.result].l} variant={ER[r.result].v} size="sm" /></td>
                <td style={td}>{r.certificateIssued?'✅':'—'}</td>
              </tr>
            ))}</tbody>
          </table>
        </>}
      </PageShell>
    </main>
  );
}

const card: React.CSSProperties={borderRadius:16,padding:18,background:'rgba(15,23,42,0.38)',border:'1px solid rgba(148,163,184,0.18)'};
const th: React.CSSProperties={textAlign:'left',padding:'10px 14px',color:'#94a3b8',fontSize:12,borderBottom:'1px solid rgba(148,163,184,0.18)'};
const td: React.CSSProperties={padding:'10px 14px',color:'#e2e8f0',fontSize:13,borderBottom:'1px solid rgba(148,163,184,0.1)'};
