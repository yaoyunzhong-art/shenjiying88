// @ts-nocheck
'use client';

/**
 * 门店安全监控 - Store Security Dashboard
 * 角色: 🔧安监管理 / 👔店长
 * 功能: 安全监控、消防检查、应急预案、隐患排查
 */

import { useState, useMemo } from 'react';
import { PageShell, StatCard, StatusBadge, Tabs } from '@m5/ui';

interface SecurityEvent { id: string; time: string; type: 'fire'|'theft'|'injury'|'equipment'|'other'; severity: 'critical'|'high'|'medium'|'low'; location: string; description: string; status: 'resolved'|'in_progress'|'reported'; handler: string; }
interface FireCheck { id: string; date: string; item: string; status: 'pass'|'fail'|'expired'; nextDate: string; note: string; }

const SEVERITY_LABELS: Record<string,{l:string;v:'danger'|'warning'|'neutral'}> = { critical:{l:'严重',v:'danger'}, high:{l:'高',v:'warning'}, medium:{l:'中',v:'neutral'}, low:{l:'低',v:'neutral'} };
const EVENT_STATUS: Record<string,{l:string;v:'success'|'warning'|'neutral'}> = { resolved:{l:'已处理',v:'success'}, in_progress:{l:'处理中',v:'warning'}, reported:{l:'已上报',v:'neutral'} };
const FIRE_STATUS: Record<string,{l:string;v:'success'|'danger'|'warning'}> = { pass:{l:'正常',v:'success'}, fail:{l:'不合格',v:'danger'}, expired:{l:'已过期',v:'warning'} };

const events: SecurityEvent[] = [
  { id:'SE1', time:'14:23', type:'equipment', severity:'high', location:'C区娃娃机', description:'娃娃机电源线裸露', status:'in_progress', handler:'杨磊' },
  { id:'SE2', time:'11:05', type:'injury', severity:'medium', location:'A区', description:'顾客擦伤', status:'resolved', handler:'李娜' },
  { id:'SE3', time:'09:30', type:'fire', severity:'critical', location:'仓库', description:'烟雾报警器误报', status:'resolved', handler:'赵敏' },
  { id:'SE4', time:'昨日', type:'other', severity:'low', location:'入口', description:'地面湿滑注意', status:'resolved', handler:'保洁' },
  { id:'SE5', time:'昨日', type:'theft', severity:'high', location:'收银台', description:'可疑人员徘徊', status:'reported', handler:'安保' },
];

const fireChecks: FireCheck[] = [
  { id:'FC1', date:'2026-07-10', item:'灭火器(大厅)', status:'pass', nextDate:'2026-10-10', note:'' },
  { id:'FC2', date:'2026-07-10', item:'灭火器(仓库)', status:'expired', nextDate:'2026-06-10', note:'已过期需更换' },
  { id:'FC3', date:'2026-07-10', item:'烟雾探测器', status:'pass', nextDate:'2026-10-10', note:'' },
  { id:'FC4', date:'2026-07-08', item:'消防栓', status:'pass', nextDate:'2026-10-08', note:'' },
  { id:'FC5', date:'2026-07-05', item:'应急灯', status:'fail', nextDate:'—', note:'不亮需维修' },
  { id:'FC6', date:'2026-07-03', item:'安全出口标识', status:'pass', nextDate:'2026-10-03', note:'' },
  { id:'FC7', date:'2026-07-01', item:'消防通道', status:'pass', nextDate:'2026-10-01', note:'' },
];

export default function SecurityDashboardPage() {
  const [tab, setTab] = useState<'events'|'fire'>('events');
  const unresolved = events.filter(e=>e.status!=='resolved').length;
  const fireFailed = fireChecks.filter(f=>f.status==='fail'||f.status==='expired').length;

  return (
    <main style={{maxWidth:1200,margin:'0 auto',padding:32}}>
      <PageShell title="🔒 安全监控" subtitle="安全事件·消防检查·隐患管理">
        <div style={{display:'grid',gap:14,gridTemplateColumns:'repeat(4,1fr)',marginBottom:20}}>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>安全事件</div><div style={{marginTop:6,fontSize:28,fontWeight:700}}>{events.length}</div><div style={{marginTop:4,fontSize:12,color:'#ef4444'}}>未解决: {unresolved}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>严重事件</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#ef4444'}}>{events.filter(e=>e.severity==='critical').length}</div><div style={{marginTop:4,fontSize:12,color:'#fca5a5'}}>需立即处理</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>消防项目</div><div style={{marginTop:6,fontSize:28,fontWeight:700}}>{fireChecks.length}</div><div style={{marginTop:4,fontSize:12,color:'#22c55e'}}>{fireChecks.filter(f=>f.status==='pass').length}项正常</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>消防问题</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#ef4444'}}>{fireFailed}</div><div style={{marginTop:4,fontSize:12,color:'#fca5a5'}}>需整改</div></div>
        </div>

        <div style={{marginBottom:16}}><Tabs items={[{key:'events',label:'🚨 安全事件'},{key:'fire',label:'🔥 消防检查'}]} activeKey={tab} onChange={t=>setTab(t as typeof tab)} variant="pills" /></div>

        {tab==='events' && (
          <div style={{display:'grid',gap:10}}>
            {events.map(e => (
              <div key={e.id} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 18px',borderRadius:12,background:'rgba(15,23,42,0.3)',border:e.severity==='critical'?'1px solid rgba(239,68,68,0.3)':'1px solid rgba(148,163,184,0.1)'}}>
                <StatusBadge label={SEVERITY_LABELS[e.severity].l} variant={SEVERITY_LABELS[e.severity].v} size="sm" />
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:14}}>{e.description}</div>
                  <div style={{fontSize:12,color:'#94a3b8',marginTop:2}}>{e.location} · {e.time} · {e.type==='fire'?'消防':e.type==='theft'?'安防':e.type==='injury'?'受伤':e.type==='equipment'?'设备':'其他'}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <StatusBadge label={EVENT_STATUS[e.status].l} variant={EVENT_STATUS[e.status].v} size="sm" dot />
                  <div style={{fontSize:11,color:'#94a3b8',marginTop:2}}>{e.handler}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab==='fire' && (
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr><th style={th}>检查日期</th><th style={th}>项目</th><th style={th}>状态</th><th style={th}>下次检查</th><th style={th}>备注</th></tr></thead>
            <tbody>{fireChecks.map(f => (
              <tr key={f.id}>
                <td style={td}>{f.date}</td>
                <td style={td}>{f.item}</td>
                <td style={td}><StatusBadge label={FIRE_STATUS[f.status].l} variant={FIRE_STATUS[f.status].v} size="sm" /></td>
                <td style={td}>{f.nextDate}</td>
                <td style={{...td,color:f.note?'#fca5a5':'#94a3b8'}}>{f.note||'—'}</td>
              </tr>
            ))}</tbody>
          </table>
        )}

        <div style={{display:'flex',gap:10,marginTop:20}}>
          <button style={btnStyle('#ef4444','#fca5a5')}>🚨 上报事件</button>
          <button style={btnStyle('#eab308','#fbbf24')}>📋 消防检查</button>
          <button style={btnStyle('#22c55e','#86efac')}>📋 应急预案</button>
        </div>
      </PageShell>
    </main>
  );
}

const card: React.CSSProperties={borderRadius:16,padding:18,background:'rgba(15,23,42,0.38)',border:'1px solid rgba(148,163,184,0.18)'};
const th: React.CSSProperties={textAlign:'left',padding:'10px 14px',color:'#94a3b8',fontSize:12,borderBottom:'1px solid rgba(148,163,184,0.18)'};
const td: React.CSSProperties={padding:'10px 14px',color:'#e2e8f0',fontSize:13,borderBottom:'1px solid rgba(148,163,184,0.1)'};
const btnStyle=(bg:string,color:string):React.CSSProperties=>({borderRadius:10,padding:'10px 18px',background:`${bg}22`,color,border:'none',cursor:'pointer',fontSize:14,fontWeight:600});
