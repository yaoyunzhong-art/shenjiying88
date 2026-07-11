'use client';

/**
 * 门店数据分析 - Store Data Analytics
 * 角色: 📊运营管理 / 👔店长
 * 功能: 数据看板、对比分析、趋势预测、自定义报表
 */

import { useState, useMemo } from 'react';
import { PageShell, StatCard, StatusBadge, Tabs } from '@m5/ui';

interface MetricComp { label:string; current:number; previous:number; unit:string; change:number; positive:boolean; }
interface PeriodData { period:string; revenue:number; traffic:number; conversion:number; avgSpend:number; memberRate:number; deviceUtil:number; }
interface TrendPoint { date:string; value:number; label:string; }

const metricComps: MetricComp[] = [
  { label:'日营收', current:12480, previous:10560, unit:'元', change:18.2, positive:true },
  { label:'日客流', current:368, previous:324, unit:'人', change:13.6, positive:true },
  { label:'转化率', current:68.5, previous:65.2, unit:'%', change:5.1, positive:true },
  { label:'客单价', current:52.3, previous:48.6, unit:'元', change:7.6, positive:true },
  { label:'设备利用率', current:81.2, previous:78.5, unit:'%', change:3.4, positive:true },
  { label:'会员占比', current:62.4, previous:58.8, unit:'%', change:6.1, positive:true },
  { label:'线上支付率', current:55.6, previous:52.1, unit:'%', change:6.7, positive:true },
  { label:'时段效率', current:2.8, previous:2.6, unit:'人/h', change:7.7, positive:true },
];

const weeklyData: PeriodData[] = [
  { period:'周一', revenue:8960, traffic:245, conversion:62.5, avgSpend:48.2, memberRate:55.3, deviceUtil:72.1 },
  { period:'周二', revenue:8240, traffic:218, conversion:60.8, avgSpend:47.5, memberRate:54.8, deviceUtil:70.5 },
  { period:'周三', revenue:9120, traffic:256, conversion:64.2, avgSpend:49.8, memberRate:57.2, deviceUtil:74.8 },
  { period:'周四', revenue:10850, traffic:298, conversion:65.1, avgSpend:51.3, memberRate:58.6, deviceUtil:78.3 },
  { period:'周五', revenue:14560, traffic:385, conversion:68.7, avgSpend:53.6, memberRate:61.5, deviceUtil:83.6 },
  { period:'周六', revenue:18640, traffic:482, conversion:71.2, avgSpend:56.8, memberRate:65.2, deviceUtil:88.9 },
  { period:'周日', revenue:16520, traffic:425, conversion:69.8, avgSpend:55.1, memberRate:63.8, deviceUtil:85.4 },
];

const trendData: TrendPoint[] = Array.from({length:30}, (_,i) => {
  const d = new Date(Date.now()-(29-i)*86400000);
  return { date: d.toISOString().split('T')[0].slice(5), value: Math.round(8000+Math.random()*12000+i*80), label:'营收' };
});

function fm(a:number):string{return`¥${a.toLocaleString('zh-CN',{minimumFractionDigits:2})}`;}
const maxRevenue = Math.max(...trendData.map(t=>t.value));

export default function StoreAnalyticsPage() {
  const [tab,setTab]=useState<'overview'|'compare'|'weekly'|'trend'>('overview');

  return (
    <main style={{maxWidth:1200,margin:'0 auto',padding:32}}>
      <PageShell title="📊 数据分析" subtitle="指标对比·趋势预测·自定义报表">
        <div style={{display:'grid',gap:14,gridTemplateColumns:'repeat(4,1fr)',marginBottom:20}}>
          {metricComps.slice(0,4).map(m => (
            <div key={m.label} style={card}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div style={{fontSize:13,color:'#cbd5e1'}}>{m.label}</div>
                <StatusBadge label={m.positive?`↑${m.change}%`:`↓${Math.abs(m.change)}%`} variant={m.positive?'success':'danger'} size="sm" />
              </div>
              <div style={{marginTop:4,fontSize:28,fontWeight:700}}>{m.current}<span style={{fontSize:14,color:'#94a3b8',fontWeight:400}}> {m.unit}</span></div>
              <div style={{marginTop:2,fontSize:11,color:'#94a3b8'}}>vs {m.previous} (上周同期)</div>
            </div>
          ))}
        </div>

        <div style={{marginBottom:16}}><Tabs items={[
          {key:'overview',label:'📊 概览'},{key:'compare',label:'📈 对比'},{key:'weekly',label:'📅 周趋势'},{key:'trend',label:'📉 30天'},
        ]} activeKey={tab} onChange={t=>setTab(t as typeof tab)} variant="pills" /></div>

        {tab==='overview' && <div style={{display:'grid',gap:14,gridTemplateColumns:'repeat(4,1fr)'}}>
          {metricComps.slice(4).map(m => (
            <div key={m.label} style={card}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div style={{fontSize:13,color:'#cbd5e1'}}>{m.label}</div>
                <StatusBadge label={m.positive?`↑${m.change}%`:`↓${Math.abs(m.change)}%`} variant={m.positive?'success':'danger'} size="sm" />
              </div>
              <div style={{marginTop:4,fontSize:28,fontWeight:700}}>{m.current}<span style={{fontSize:14,color:'#94a3b8',fontWeight:400}}> {m.unit}</span></div>
              <div style={{marginTop:2,fontSize:11,color:'#94a3b8'}}>vs 上周同期</div>
            </div>
          ))}
        </div>}

        {tab==='compare' && <div style={card}>
          <div style={{display:'grid',gap:12,gridTemplateColumns:'1fr 1fr'}}>
            {metricComps.slice(0,6).map(m => (
              <div key={m.label} style={{padding:'12px 16px',borderRadius:10,background:'rgba(15,23,42,0.3)'}}>
                <div style={{fontSize:13,color:'#94a3b8',marginBottom:8}}>{m.label}</div>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                  <span style={{color:'#22c55e',fontWeight:700,fontSize:18}}>{m.current}</span>
                  <span style={{color:'#94a3b8',fontSize:14}}>上周: {m.previous}</span>
                </div>
                <div style={{height:8,borderRadius:4,background:'rgba(148,163,184,0.12)',overflow:'hidden'}}>
                  <div style={{display:'flex',height:'100%'}}>
                    <div style={{width:`${(m.previous/Math.max(m.current,m.previous))*50}%`,background:'#94a3b8',borderRadius:'4px 0 0 4px'}} />
                    <div style={{width:`${(m.current/Math.max(m.current,m.previous))*50}%`,background:'#22c55e',borderRadius:'0 4px 4px 0'}} />
                  </div>
                </div>
                <div style={{fontSize:11,color:m.positive?'#22c55e':'#ef4444',marginTop:4}}>{m.positive?'↑':'↓'} {m.change}%</div>
              </div>
            ))}
          </div>
        </div>}

        {tab==='weekly' && <>
          <div style={{display:'grid',gap:14,gridTemplateColumns:'repeat(3,1fr)',marginBottom:16}}>
            <StatCard label="周总营收" value={fm(weeklyData.reduce((s,d)=>s+d.revenue,0))} />
            <StatCard label="周总客流" value={`${weeklyData.reduce((s,d)=>s+d.traffic,0)}人`} />
            <StatCard label="日均会员占比" value={`${(weeklyData.reduce((s,d)=>s+d.memberRate,0)/weeklyData.length).toFixed(1)}%`} />
          </div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              <th style={th}>日期</th><th style={th}>营收</th><th style={th}>客流</th><th style={th}>转化率</th>
              <th style={th}>客单价</th><th style={th}>会员占比</th><th style={th}>设备利用率</th>
            </tr></thead>
            <tbody>{weeklyData.map(d => (
              <tr key={d.period}>
                <td style={{...td,fontWeight:600,color:d.period==='周六'||d.period==='周日'?'#eab308':'#e2e8f0'}}>{d.period}</td>
                <td style={{...td,color:'#22c55e',fontWeight:600}}>{fm(d.revenue)}</td>
                <td style={td}>{d.traffic}</td>
                <td style={td}>{d.conversion}%</td>
                <td style={td}>{fm(d.avgSpend)}</td>
                <td style={td}>{d.memberRate}%</td>
                <td style={td}><StatusBadge label={`${d.deviceUtil}%`} variant={d.deviceUtil>80?'success':d.deviceUtil>70?'warning':'danger'} size="sm" /></td>
              </tr>
            ))}</tbody>
          </table>
        </>}

        {tab==='trend' && <section style={card}>
          <h3 style={{margin:'0 0 16px',fontSize:16,fontWeight:700}}>30天营收趋势</h3>
          <div style={{display:'grid',gap:3}}>
            {trendData.map(t => (
              <div key={t.date} style={{display:'flex',alignItems:'center',gap:8,padding:'2px 0'}}>
                <div style={{width:40,fontSize:10,color:'#6b7280',flexShrink:0}}>{t.date}</div>
                <div style={{flex:1,height:12,borderRadius:6,background:'rgba(148,163,184,0.1)',overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${(t.value/maxRevenue)*100}%`,borderRadius:6,background:'linear-gradient(90deg,#3b82f6,#8b5cf6)'}} />
                </div>
                <div style={{width:60,textAlign:'right',fontSize:10,color:'#cbd5e1',flexShrink:0}}>{fm(t.value)}</div>
              </div>
            ))}
          </div>
        </section>}

        <div style={{display:'flex',gap:10,marginTop:20}}>
          <button style={btnStyle('#3b82f6','#93c5fd')}>📥 导出报表</button>
          <button style={btnStyle('#8b5cf6','#c4b5fd')}>📊 自定义看板</button>
          <button style={btnStyle('#22c55e','#86efac')}>🤖 AI洞察</button>
        </div>
      </PageShell>
    </main>
  );
}

const card: React.CSSProperties={borderRadius:16,padding:18,background:'rgba(15,23,42,0.38)',border:'1px solid rgba(148,163,184,0.18)'};
const th: React.CSSProperties={textAlign:'left',padding:'10px 14px',color:'#94a3b8',fontSize:12,borderBottom:'1px solid rgba(148,163,184,0.18)'};
const td: React.CSSProperties={padding:'10px 14px',color:'#e2e8f0',fontSize:13,borderBottom:'1px solid rgba(148,163,184,0.1)'};
const btnStyle=(bg:string,color:string):React.CSSProperties=>({borderRadius:10,padding:'10px 18px',background:`${bg}22`,color,border:'none',cursor:'pointer',fontSize:14,fontWeight:600});
