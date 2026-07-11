'use client';

/**
 * 交接班管理 - Shift Handover Page
 * 角色: 💳收银员 / 👔店长
 * 功能: 交接班记录、现金盘点、差异处理、交接日志
 */

import { useState, useMemo } from 'react';
import { PageShell, StatCard, StatusBadge, Tabs } from '@m5/ui';

type ShiftStatus = 'open'|'closed'|'pending';
type HandoverType = 'cashier'|'manager'|'security'|'cleaner';

interface ShiftRecord { id:string; date:string; shift:string; employee:string; role:string; type:HandoverType; startTime:string; endTime:string; openingCash:number; closingCash:number; cardRevenue:number; onlineRevenue:number; refundAmount:number; expectedTotal:number; actualTotal:number; difference:number; transactionCount:number; note:string; status:ShiftStatus; handoverTo:string; verifiedBy:string; }
interface CashCount { id:string; denomination:number; count:number; total:number; }

const SSTATUS: Record<ShiftStatus,{l:string;v:'success'|'warning'|'danger'}>={open:{l:'营业中',v:'success'},closed:{l:'已结班',v:'danger'},pending:{l:'待审核',v:'warning'}};
const TYPES: Record<HandoverType,string>={cashier:'收银',manager:'管理',security:'安保',cleaner:'保洁'};
function fm(a:number):string{return`¥${a.toLocaleString('zh-CN',{minimumFractionDigits:2})}`;}

const shifts: ShiftRecord[] = [
  { id:'SH1', date:'2026-07-11', shift:'早班', employee:'张三', role:'收银员', type:'cashier', startTime:'08:00', endTime:'14:00', openingCash:2000, closingCash:3850, cardRevenue:2120, onlineRevenue:5680, refundAmount:360, expectedTotal:3850+2120+5680-360, actualTotal:3850+2120+5680-358, difference:2, transactionCount:86, note:'', status:'closed', handoverTo:'李四', verifiedBy:'店长' },
  { id:'SH2', date:'2026-07-11', shift:'中班', employee:'李四', role:'收银员', type:'cashier', startTime:'14:00', endTime:'20:00', openingCash:3850, closingCash:5200, cardRevenue:3800, onlineRevenue:8200, refundAmount:150, expectedTotal:5200+3800+8200-150, actualTotal:5200+3800+8200-150, difference:0, transactionCount:112, note:'', status:'open', handoverTo:'王五', verifiedBy:'' },
  { id:'SH3', date:'2026-07-10', shift:'晚班', employee:'王五', role:'收银员', type:'cashier', startTime:'20:00', endTime:'02:00', openingCash:5200, closingCash:4800, cardRevenue:2500, onlineRevenue:5600, refundAmount:80, expectedTotal:4800+2500+5600-80, actualTotal:4800+2500+5600-80, difference:0, transactionCount:68, note:'', status:'closed', handoverTo:'张三', verifiedBy:'店长' },
  { id:'SH4', date:'2026-07-10', shift:'早班', employee:'赵敏', role:'值班经理', type:'manager', startTime:'08:00', endTime:'14:00', openingCash:0, closingCash:0, cardRevenue:0, onlineRevenue:0, refundAmount:0, expectedTotal:0, actualTotal:0, difference:0, transactionCount:0, note:'设备巡检正常,卫生检查通过', status:'closed', handoverTo:'刘洋', verifiedBy:'店长' },
  { id:'SH5', date:'2026-07-09', shift:'中班', employee:'刘洋', role:'值班经理', type:'manager', startTime:'14:00', endTime:'20:00', openingCash:0, closingCash:0, cardRevenue:0, onlineRevenue:0, refundAmount:0, expectedTotal:0, actualTotal:0, difference:0, transactionCount:0, note:'处理投诉1起,已解决', status:'closed', handoverTo:'赵敏', verifiedBy:'店长' },
  { id:'SH6', date:'2026-07-09', shift:'早班', employee:'陈静', role:'保洁', type:'cleaner', startTime:'08:00', endTime:'14:00', openingCash:0, closingCash:0, cardRevenue:0, onlineRevenue:0, refundAmount:0, expectedTotal:0, actualTotal:0, difference:0, transactionCount:0, note:'卫生间已清洁,垃圾已清运', status:'closed', handoverTo:'黄丽', verifiedBy:'赵敏' },
];

const cashDenoms: CashCount[] = [
  { id:'C1', denomination:100, count:18, total:1800 },
  { id:'C2', denomination:50, count:12, total:600 },
  { id:'C3', denomination:20, count:25, total:500 },
  { id:'C4', denomination:10, count:40, total:400 },
  { id:'C5', denomination:5, count:15, total:75 },
  { id:'C6', denomination:1, count:30, total:30 },
  { id:'C7', denomination:0.5, count:20, total:10 },
  { id:'C8', denomination:0.1, count:50, total:5 },
];

export default function ShiftHandoverPage() {
  const [tab,setTab]=useState<'shifts'|'cash'>('shifts');
  const activeShift = shifts.find(s=>s.status==='open');
  const cashTotal = cashDenoms.reduce((s,c)=>s+c.total,0);

  return (
    <main style={{maxWidth:1200,margin:'0 auto',padding:32}}>
      <PageShell title="📋 交接班管理" subtitle="班次管理·现金盘点·差异处理">
        {activeShift && <div style={{display:'grid',gap:14,gridTemplateColumns:'repeat(4,1fr)',marginBottom:20}}>
          <div style={{...statCard,border:'1px solid rgba(34,197,94,0.3)',background:'rgba(34,197,94,0.06)'}}><div style={{fontSize:13,color:'#86efac'}}>当前班次</div><div style={{marginTop:4,fontSize:24,fontWeight:700}}>{activeShift.shift}</div><div style={{marginTop:2,fontSize:12,color:'#94a3b8'}}>{activeShift.employee} · {activeShift.role}</div></div>
          <div style={statCard}><div style={{fontSize:13,color:'#cbd5e1'}}>当班营收</div><div style={{marginTop:6,fontSize:24,fontWeight:700,color:'#22c55e'}}>{fm(activeShift.expectedTotal)}</div><div style={{marginTop:2,fontSize:12,color:'#94a3b8'}}>{activeShift.transactionCount}笔</div></div>
          <div style={statCard}><div style={{fontSize:13,color:'#cbd5e1'}}>时长</div><div style={{marginTop:6,fontSize:24,fontWeight:700,color:'#3b82f6'}}>{activeShift.startTime}-{activeShift.endTime}</div></div>
          <div style={statCard}><div style={{fontSize:13,color:'#cbd5e1'}}>接班</div><div style={{marginTop:6,fontSize:24,fontWeight:700}}>{activeShift.handoverTo||'—'}</div></div>
        </div>}

        <div style={{marginBottom:16}}><Tabs items={[{key:'shifts',label:'📋 交接班记录'},{key:'cash',label:'💰 现金盘点'}]} activeKey={tab} onChange={t=>setTab(t as typeof tab)} variant="pills" /></div>

        {tab==='shifts' && <div style={{display:'grid',gap:10}}>
          {shifts.map(s => (
            <div key={s.id} style={{padding:'14px 18px',borderRadius:12,background:'rgba(15,23,42,0.3)',border:s.status==='open'?'1px solid rgba(34,197,94,0.2)':'1px solid rgba(148,163,184,0.1)'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                <div><span style={{fontWeight:700,fontSize:15}}>{s.employee}</span><span style={{color:'#94a3b8',marginLeft:8,fontSize:13}}>{s.role} · {s.shift} {s.date}</span></div>
                <StatusBadge label={SSTATUS[s.status].l} variant={SSTATUS[s.status].v} size="sm" dot />
              </div>
              <div style={{display:'grid',gap:8,gridTemplateColumns:'repeat(4,1fr)',marginBottom:6}}>
                <StatCard label="班次" value={`${s.startTime}-${s.endTime}`} />
                <StatCard label="预计营收" value={fm(s.expectedTotal)} helper={`现金:${fm(s.closingCash)}`} />
                <StatCard label="实际营收" value={fm(s.actualTotal)} />
                <StatCard label="差异" value={fm(s.difference)} helper={s.difference===0?'准确':''} />
              </div>
              <div style={{fontSize:12,color:'#94a3b8',display:'flex',gap:16}}>
                <span>票据: {s.transactionCount}</span>
                <span>线上: {fm(s.onlineRevenue)}</span>
                <span>退款: {fm(s.refundAmount)}</span>
                {s.verifiedBy && <span>核验: {s.verifiedBy}</span>}
              </div>
              {s.note && <div style={{marginTop:6,fontSize:12,color:'#93c5fd',padding:'6px 10px',borderRadius:6,background:'rgba(59,130,246,0.08)'}}>📝 {s.note}</div>}
            </div>
          ))}
        </div>}

        {tab==='cash' && <section style={{borderRadius:16,padding:24,background:'rgba(15,23,42,0.35)',border:'1px solid rgba(148,163,184,0.18)'}}>
          <h3 style={{margin:'0 0 6px',fontSize:18,fontWeight:700}}>现金盘点</h3>
          <div style={{color:'#94a3b8',fontSize:14,marginBottom:16}}>当前收银柜现金: {fm(cashTotal)}</div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr><th style={th}>面额</th><th style={th}>数量</th><th style={th}>小计</th></tr></thead>
            <tbody>{cashDenoms.map(c => (
              <tr key={c.id}>
                <td style={{...td,fontWeight:600}}>¥{c.denomination}</td>
                <td style={td}>{c.count}</td>
                <td style={{...td,color:'#22c55e',fontWeight:600}}>{fm(c.total)}</td>
              </tr>
            ))}
            <tr><td style={{...td,fontWeight:700,borderTop:'2px solid rgba(148,163,184,0.2)'}}>合计</td><td style={{...td,fontWeight:700,borderTop:'2px solid rgba(148,163,184,0.2)'}}>{cashDenoms.reduce((s,c)=>s+c.count,0)}</td><td style={{...td,fontWeight:700,borderTop:'2px solid rgba(148,163,184,0.2)',color:'#22c55e'}}>{fm(cashTotal)}</td></tr>
          </tbody></table>
          <div style={{marginTop:16,display:'flex',gap:10}}>
            <button style={btnStyle('#22c55e','#86efac')}>✅ 确认盘点</button>
            <button style={btnStyle('#3b82f6','#93c5fd')}>📋 打印盘点表</button>
          </div>
        </section>}
      </PageShell>
    </main>
  );
}

const statCard: React.CSSProperties={borderRadius:16,padding:18,background:'rgba(15,23,42,0.38)',border:'1px solid rgba(148,163,184,0.18)'};
const th: React.CSSProperties={textAlign:'left',padding:'10px 14px',color:'#94a3b8',fontSize:12,borderBottom:'1px solid rgba(148,163,184,0.18)'};
const td: React.CSSProperties={padding:'10px 14px',color:'#e2e8f0',fontSize:13,borderBottom:'1px solid rgba(148,163,184,0.1)'};
const btnStyle=(bg:string,color:string):React.CSSProperties=>({borderRadius:10,padding:'10px 18px',background:`${bg}22`,color,border:'none',cursor:'pointer',fontSize:14,fontWeight:600});
