'use client';

/**
 * 门店导购工作台 - Store Guide Workbench
 * 角色: 🎮导玩员
 * 功能: 今日接待、游戏指导、设备巡检、客户服务、活动推荐
 */

import { useState, useMemo } from 'react';
import { PageShell, StatCard, StatusBadge, Tabs, DataTable, type DataTableColumn } from '@m5/ui';

type ServiceType = 'device_help' | 'game_instruction' | 'member_register' | 'complaint' | 'general';
type ServiceStatus = 'waiting' | 'in_progress' | 'resolved';
type DeviceCheckStatus = 'normal' | 'warning' | 'fault';

interface ServiceItem { id: string; time: string; customer: string; type: ServiceType; description: string; status: ServiceStatus; priority: 'high' | 'medium' | 'low'; }

const SERVICE_TYPE: Record<ServiceType, string> = { device_help: '设备协助', game_instruction: '游戏指导', member_register: '会员注册', complaint: '客诉处理', general: '一般咨询' };
const STATUS_V: Record<ServiceStatus, { l: string; v: 'danger'|'warning'|'success' }> = { waiting: { l: '等待中', v: 'danger' }, in_progress: { l: '处理中', v: 'warning' }, resolved: { l: '已解决', v: 'success' } };

function generateServices(): ServiceItem[] {
  const customers = ['张先生','李女士','小朋友A','王妈妈','赵同学','陈阿姨','刘哥','小美'];
  const descs = ['游戏币卡住了','不会操作赛车','要办会员卡','娃娃机爪子太松','想玩但不会规则','设备不找零','投诉噪音大','问路问价格'];
  return Array.from({length:12}, (_,i) => ({
    id: `SV-${i+1}`,
    time: `${String(8+Math.floor(Math.random()*14)).padStart(2,'0')}:${String(Math.floor(Math.random()*60)).padStart(2,'0')}`,
    customer: customers[Math.floor(Math.random()*customers.length)]!,
    type: (['device_help','game_instruction','member_register','complaint','general'] as ServiceType[])[Math.floor(Math.random()*5)]!,
    description: descs[Math.floor(Math.random()*descs.length)]!,
    status: (['waiting','in_progress','resolved'] as ServiceStatus[])[Math.floor(Math.random()*3)]!,
    priority: (['high','medium','low'] as const)[Math.floor(Math.random()*3)]!,
  }));
}

export default function GuideWorkbenchPage() {
  const services = useMemo(() => generateServices(), []);
  const waitingCount = services.filter(s=>s.status==='waiting').length;
  const resolvedCount = services.filter(s=>s.status==='resolved').length;

  const deviceChecks = [
    { name: '拳皇街机', status: 'normal' as DeviceCheckStatus, lastCheck: '10:30', note: '正常' },
    { name: '赛车模拟器', status: 'normal' as DeviceCheckStatus, lastCheck: '10:30', note: '正常' },
    { name: '娃娃机(大)', status: 'warning' as DeviceCheckStatus, lastCheck: '09:00', note: '爪子略松,已报修' },
    { name: '娃娃机(小)', status: 'normal' as DeviceCheckStatus, lastCheck: '10:30', note: '正常' },
    { name: 'VR体验', status: 'normal' as DeviceCheckStatus, lastCheck: '10:00', note: '正常' },
    { name: '投篮机', status: 'fault' as DeviceCheckStatus, lastCheck: '08:30', note: '计分故障,待维修' },
  ];

  return (
    <main style={{maxWidth:1200,margin:'0 auto',padding:24}}>
      <PageShell title="🎮 导玩员工作台" subtitle="今日客户服务·设备巡检·活动推荐">
        <div style={{display:'grid',gap:14,gridTemplateColumns:'repeat(4,1fr)',marginBottom:20}}>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>待服务</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#ef4444'}}>{waitingCount}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>已处理</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#22c55e'}}>{resolvedCount}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>设备巡检</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:deviceChecks.some(d=>d.status==='fault')?'#ef4444':'#22c55e'}}>{deviceChecks.filter(d=>d.status!=='normal').length}项异常</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>今日接待</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#3b82f6'}}>{services.length}人</div></div>
        </div>

        <div style={{display:'grid',gap:20,gridTemplateColumns:'1fr 1fr'}}>
          <section style={card}>
            <h3 style={{margin:'0 0 16px',fontSize:16,fontWeight:700}}>📋 服务队列</h3>
            <div style={{display:'grid',gap:8}}>
              {services.slice(0,8).map(s => (
                <div key={s.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:10,background:'rgba(15,23,42,0.3)',border:s.status==='waiting'?'1px solid rgba(239,68,68,0.2)':'none'}}>
                  <StatusBadge label={STATUS_V[s.status].l} variant={STATUS_V[s.status].v} size="sm" dot />
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:600}}>{s.description}</div>
                    <div style={{fontSize:12,color:'#94a3b8'}}>{s.customer} · {SERVICE_TYPE[s.type]} · {s.time}</div>
                  </div>
                  <span style={{fontSize:12,color:s.priority==='high'?'#ef4444':'#94a3b8',fontWeight:600}}>{s.priority==='high'?'优先':''}</span>
                </div>
              ))}
            </div>
          </section>

          <section style={card}>
            <h3 style={{margin:'0 0 16px',fontSize:16,fontWeight:700}}>🔍 设备巡检</h3>
            <div style={{display:'grid',gap:8}}>
              {deviceChecks.map(d => (
                <div key={d.name} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',borderRadius:10,background:'rgba(15,23,42,0.3)'}}>
                  <div><span style={{fontWeight:600,fontSize:14}}>🎮 {d.name}</span><span style={{marginLeft:8,fontSize:12,color:'#94a3b8'}}>{d.note}</span></div>
                  <StatusBadge label={d.status==='normal'?'正常':d.status==='warning'?'需关注':'故障'} variant={d.status==='normal'?'success':d.status==='warning'?'warning':'danger'} size="sm" dot />
                </div>
              ))}
            </div>
            <div style={{marginTop:12,display:'flex',gap:8}}>
              <button style={btnStyle('#3b82f6','#93c5fd')}>✅ 完成巡检</button>
              <button style={btnStyle('#eab308','#fbbf24')}>📋 报修</button>
            </div>
          </section>
        </div>
      </PageShell>
    </main>
  );
}

const card: React.CSSProperties = { borderRadius:16, padding:18, background:'rgba(15,23,42,0.38)', border:'1px solid rgba(148,163,184,0.18)' };
const btnStyle=(bg:string,color:string):React.CSSProperties=>({borderRadius:8,padding:'8px 14px',background:`${bg}22`,color,border:'none',cursor:'pointer',fontSize:13,fontWeight:600});
