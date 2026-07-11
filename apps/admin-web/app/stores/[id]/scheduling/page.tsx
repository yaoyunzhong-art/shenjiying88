'use client';

/**
 * 排班管理 - Scheduling Management
 * 角色: 👥HR管理 / 👔店长
 * 功能: 排班表、班次模板、调班申请、考勤统计
 */

import { useState, useMemo } from 'react';
import { PageShell, StatCard, StatusBadge, Tabs } from '@m5/ui';

interface ShiftTemplate { id:string; name:string; start:string; end:string; staffRequired:number; restDays:number; color:string; }
interface ScheduleSlot { id:string; date:string; staffName:string; role:string; shiftName:string; start:string; end:string; status:'confirmed'|'pending'|'swap_requested'|'absent'; }
interface AttendanceStat { staffName:string; totalShifts:number; late:number; early:number; absent:number; overtime:number; score:number; }

const templates: ShiftTemplate[] = [
  { id:'T1', name:'早班', start:'08:00', end:'14:00', staffRequired:3, restDays:2, color:'#3b82f6' },
  { id:'T2', name:'中班', start:'14:00', end:'20:00', staffRequired:2, restDays:2, color:'#eab308' },
  { id:'T3', name:'晚班', start:'20:00', end:'02:00', staffRequired:2, restDays:3, color:'#8b5cf6' },
  { id:'T4', name:'全天班', start:'08:00', end:'20:00', staffRequired:1, restDays:3, color:'#22c55e' },
];

const staff = ['张伟','李娜','王强','赵敏','刘洋','陈静','杨磊','黄丽','周杰','吴芳','徐明','孙燕'];
const roles = ['店长','值班经理','收银员','导玩员','技术员','保洁员','保安'];
const shiftNames = ['早班','中班','晚班','全天班','休息'];
const statuses: ScheduleSlot['status'][] = ['confirmed','confirmed','confirmed','confirmed','pending','swap_requested'];

const schedule: ScheduleSlot[] = staff.flatMap((name,si) => {
  const slots: ScheduleSlot[] = [];
  for (let day = 0; day < 7; day++) {
    const d = new Date(2026, 6, 11 + day);
    const sn = shiftNames[(si + day) % shiftNames.length]!;
    const t = templates.find(t => t.name === sn);
    if (t) {
      slots.push({
        id: `SCH-${si}-${day}`, date: d.toISOString().split('T')[0],
        staffName: name, role: roles[si % roles.length]!,
        shiftName: sn, start: t.start, end: t.end,
        status: statuses[Math.floor(Math.random()*statuses.length)]!,
      });
    }
  }
  return slots;
});

const attendance: AttendanceStat[] = staff.map((name, i) => ({
  staffName: name, totalShifts: 20+Math.floor(Math.random()*5),
  late: Math.floor(Math.random()*4), early: Math.floor(Math.random()*3),
  absent: Math.floor(Math.random()*2), overtime: Math.floor(Math.random()*10),
  score: 70+Math.floor(Math.random()*30),
}));

const today = new Date().toISOString().split('T')[0];
const todaySchedule = schedule.filter(s => s.date === today);

export default function SchedulingPage() {
  const [tab,setTab]=useState<'schedule'|'attendance'>('schedule');
  const [weekOffset,setWeekOffset]=useState(0);

  const weekStart = useMemo(() => {
    const d = new Date(2026, 6, 11);
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      days.push({ date: d.toISOString().split('T')[0], label: ['日','一','二','三','四','五','六'][d.getDay()]! });
    }
    return days;
  }, [weekStart]);

  const weekSchedule = schedule.filter(s => s.date >= weekDays[0]!.date && s.date <= weekDays[6]!.date);

  const statSum = useMemo(() => ({
    totalShifts: attendance.reduce((s,a)=>s+a.totalShifts,0),
    totalLate: attendance.reduce((s,a)=>s+a.late,0),
    totalAbsent: attendance.reduce((s,a)=>s+a.absent,0),
    avgScore: Math.round(attendance.reduce((s,a)=>s+a.score,0)/attendance.length),
  }),[attendance]);

  return (
    <main style={{maxWidth:1200,margin:'0 auto',padding:32}}>
      <PageShell title="📅 排班管理" subtitle={`${staff.length}人 · 本周排班 · 今日在岗${todaySchedule.length}人`}>
        <div style={{display:'grid',gap:14,gridTemplateColumns:'repeat(4,1fr)',marginBottom:20}}>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>员工总数</div><div style={{marginTop:6,fontSize:28,fontWeight:700}}>{staff.length}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>今日在岗</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#22c55e'}}>{todaySchedule.length}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>班次模板</div><div style={{marginTop:6,fontSize:28,fontWeight:700}}>{templates.length}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>总排班数</div><div style={{marginTop:6,fontSize:28,fontWeight:700}}>{schedule.length}</div></div>
        </div>

        <div style={{marginBottom:16}}><Tabs items={[
          {key:'schedule',label:'📋 排班表'},{key:'attendance',label:'📊 考勤统计'},
        ]} activeKey={tab} onChange={t=>setTab(t as typeof tab)} variant="pills" /></div>

        {tab==='schedule' && <>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <button onClick={()=>setWeekOffset(w=>w-1)} style={btnStyle}>◀ 上周</button>
            <span style={{fontSize:16,fontWeight:600}}>{weekDays[0]!.date} ~ {weekDays[6]!.date}</span>
            <button onClick={()=>setWeekOffset(w=>w+1)} style={btnStyle}>下周 ▶</button>
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',minWidth:700}}>
              <thead>
                <tr>
                  <th style={{...th,position:'sticky',left:0,background:'#0f172a',zIndex:1}}>员工</th>
                  {weekDays.map(d => <th key={d.date} style={{...th,textAlign:'center'}}>{d.label}<br/><span style={{fontSize:11,color:'#6b7280'}}>{d.date.slice(5)}</span></th>)}
                </tr>
              </thead>
              <tbody>
                {staff.map(name => (
                  <tr key={name}>
                    <td style={{...td,position:'sticky',left:0,background:'#0f172a',fontWeight:600}}>{name}</td>
                    {weekDays.map(d => {
                      const slot = weekSchedule.find(s => s.staffName === name && s.date === d.date);
                      return (
                        <td key={`${name}-${d.date}`} style={{...td,textAlign:'center',padding:'8px 6px',
                          background:slot ? (slot.status==='absent'?'rgba(239,68,68,0.1)':slot.status==='swap_requested'?'rgba(245,158,11,0.1)':'transparent'):'rgba(107,114,128,0.05)'}}>
                          {slot ? <>
                            <span style={{color:slot.shiftName==='休息'?'#6b7280':templates.find(t=>t.name===slot.shiftName)?.color??'#94a3b8',fontWeight:600,fontSize:13}}>
                              {slot.shiftName}
                            </span>
                            <div style={{fontSize:10,color:'#6b7280',marginTop:2}}>
                              {slot.start}-{slot.end}
                            </div>
                          </> : <span style={{color:'#6b7280'}}>—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{display:'flex',gap:8,marginTop:16,flexWrap:'wrap'}}>
            {templates.map(t=><div key={t.id} style={{display:'flex',alignItems:'center',gap:6,padding:'4px 10px',borderRadius:6,background:'rgba(15,23,42,0.3)',fontSize:12}}>
              <span style={{width:10,height:10,borderRadius:3,background:t.color}} />
              <span>{t.name} ({t.start}-{t.end})</span>
            </div>)}
            <div style={{display:'flex',alignItems:'center',gap:6,padding:'4px 10px',borderRadius:6,background:'rgba(107,114,128,0.15)',fontSize:12}}>
              <span style={{width:10,height:10,borderRadius:3,background:'#6b7280'}} />
              <span>休息</span>
            </div>
          </div>
        </>}

        {tab==='attendance' && <>
          <div style={{display:'grid',gap:14,gridTemplateColumns:'repeat(4,1fr)',marginBottom:16}}>
            <div style={card}><div style={{fontSize:12,color:'#94a3b8'}}>总排班</div><div style={{fontSize:24,fontWeight:700}}>{statSum.totalShifts}</div></div>
            <div style={card}><div style={{fontSize:12,color:'#94a3b8'}}>迟到</div><div style={{fontSize:24,fontWeight:700,color:'#eab308'}}>{statSum.totalLate}</div></div>
            <div style={card}><div style={{fontSize:12,color:'#94a3b8'}}>缺勤</div><div style={{fontSize:24,fontWeight:700,color:'#ef4444'}}>{statSum.totalAbsent}</div></div>
            <div style={card}><div style={{fontSize:12,color:'#94a3b8'}}>平均绩效</div><div style={{fontSize:24,fontWeight:700,color:statSum.avgScore>=85?'#22c55e':'#eab308'}}>{statSum.avgScore}</div></div>
          </div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              <th style={th}>员工</th><th style={th}>排班</th><th style={th}>迟到</th><th style={th}>早退</th>
              <th style={th}>缺勤</th><th style={th}>加班</th><th style={th}>绩效</th>
            </tr></thead>
            <tbody>{attendance.map(a => (
              <tr key={a.staffName}>
                <td style={td}>{a.staffName}</td>
                <td style={td}>{a.totalShifts}</td>
                <td style={{...td,color:a.late>2?'#ef4444':'#eab308'}}>{a.late}</td>
                <td style={td}>{a.early}</td>
                <td style={{...td,color:a.absent>0?'#ef4444':'#22c55e',fontWeight:a.absent>0?600:400}}>{a.absent}</td>
                <td style={{...td,color:'#8b5cf6'}}>{a.overtime}h</td>
                <td style={{...td,color:a.score>=85?'#22c55e':a.score>=70?'#eab308':'#ef4444',fontWeight:600}}>{a.score}</td>
              </tr>
            ))}</tbody>
          </table>
        </>}
      </PageShell>
    </main>
  );
}

const card: React.CSSProperties={borderRadius:16,padding:18,background:'rgba(15,23,42,0.38)',border:'1px solid rgba(148,163,184,0.18)'};
const th: React.CSSProperties={textAlign:'left',padding:'10px 14px',color:'#94a3b8',fontSize:12,borderBottom:'1px solid rgba(148,163,184,0.18)',whiteSpace:'nowrap'};
const td: React.CSSProperties={padding:'8px 14px',color:'#e2e8f0',fontSize:13,borderBottom:'1px solid rgba(148,163,184,0.1)',whiteSpace:'nowrap'};
const btnStyle: React.CSSProperties={borderRadius:8,padding:'8px 16px',background:'rgba(148,163,184,0.1)',color:'#e2e8f0',border:'1px solid rgba(148,163,184,0.15)',cursor:'pointer',fontSize:13,fontWeight:600};
