'use client';

/**
 * 收银对账 - Cashier Reconciliation
 * 角色: 💳收银员 / 💰财务
 * 功能: 当班对账、差异处理、交班记录、现金管理
 */

import { useState, useMemo } from 'react';
import { PageShell, StatCard, StatusBadge, Tabs } from '@m5/ui';

interface Reconciliation { id:string; date:string; shift:'早班'|'中班'|'晚班'; cashier:string; openingBalance:number; cashRevenue:number; cardRevenue:number; onlineRevenue:number; memberCardRevenue:number; refundAmount:number; expectedTotal:number; actualTotal:number; difference:number; status:'balanced'|'diff_small'|'diff_large'|'pending'; cashCount:Record<string,number>; notes:string; }
interface HandoverRecord { id:string; fromCashier:string; toCashier:string; date:string; time:string; cashBalance:number; floatBalance:number; receipts:number; notes:string; status:'completed'|'pending'|'discrepancy'; }

const RS: Record<string,{l:string;v:'success'|'warning'|'danger'|'neutral'}> = { balanced:{l:'平账',v:'success'}, diff_small:{l:'小额差异',v:'warning'}, diff_large:{l:'大额差异',v:'danger'}, pending:{l:'待审核',v:'neutral'} };
const HS: Record<string,{l:string;v:'success'|'warning'|'danger'}> = { completed:{l:'已完成',v:'success'}, pending:{l:'待交班',v:'warning'}, discrepancy:{l:'有差异',v:'danger'} };
function fm(a:number):string{return`¥${a.toLocaleString('zh-CN',{minimumFractionDigits:2})}`;}

const reconciliations: Reconciliation[] = [
  { id:'REC-001', date:'2026-07-11', shift:'早班', cashier:'张三', openingBalance:2000,
    cashRevenue:3850, cardRevenue:2120, onlineRevenue:5680, memberCardRevenue:1230, refundAmount:360,
    expectedTotal:3850+2120+5680+1230-360, actualTotal:3850+2120+5680+1230-358, difference:2,
    status:'diff_small', cashCount:{'100':12,'50':18,'20':40,'10':65,'5':80,'1':120},
    notes:'现金差异¥2，可能为找零误差' },
  { id:'REC-002', date:'2026-07-11', shift:'中班', cashier:'王强', openingBalance:5485,
    cashRevenue:4200, cardRevenue:3150, onlineRevenue:7420, memberCardRevenue:980, refundAmount:210,
    expectedTotal:4200+3150+7420+980-210, actualTotal:4200+3150+7420+980-210, difference:0,
    status:'balanced', cashCount:{'100':15,'50':20,'20':35,'10':55,'5':70,'1':100},
    notes:'' },
  { id:'REC-003', date:'2026-07-10', shift:'晚班', cashier:'李四', openingBalance:15570,
    cashRevenue:3800, cardRevenue:1950, onlineRevenue:5120, memberCardRevenue:650, refundAmount:480,
    expectedTotal:3800+1950+5120+650-480, actualTotal:3800+1950+5120+650-485, difference:-5,
    status:'diff_small', cashCount:{'100':10,'50':12,'20':28,'10':45,'5':60,'1':95},
    notes:'多退¥5' },
  { id:'REC-004', date:'2026-07-10', shift:'早班', cashier:'赵六', openingBalance:2000,
    cashRevenue:2950, cardRevenue:1800, onlineRevenue:4350, memberCardRevenue:1100, refundAmount:150,
    expectedTotal:2950+1800+4350+1100-150, actualTotal:2950+1800+4350+1100-160, difference:-10,
    status:'diff_small', cashCount:{'100':8,'50':15,'20':22,'10':38,'5':50,'1':85},
    notes:'多退¥10，已记录' },
  { id:'REC-005', date:'2026-07-09', shift:'中班', cashier:'陈七', openingBalance:10980,
    cashRevenue:5100, cardRevenue:2650, onlineRevenue:6850, memberCardRevenue:1400, refundAmount:320,
    expectedTotal:5100+2650+6850+1400-320, actualTotal:5100+2650+6850+1400-320, difference:0,
    status:'balanced', cashCount:{'100':18,'50':22,'20':40,'10':60,'5':90,'1':150},
    notes:'平账' },
];

const handovers: HandoverRecord[] = [
  { id:'HO-001', fromCashier:'张三', toCashier:'王强', date:'2026-07-11', time:'14:00', cashBalance:12500, floatBalance:5000, receipts:86, notes:'现金清点完毕', status:'completed' },
  { id:'HO-002', fromCashier:'王强', toCashier:'李四', date:'2026-07-11', time:'20:00', cashBalance:15750, floatBalance:5000, receipts:102, notes:'', status:'pending' },
  { id:'HO-003', fromCashier:'赵六', toCashier:'陈七', date:'2026-07-10', time:'14:00', cashBalance:10800, floatBalance:5000, receipts:72, notes:'现金差额-10', status:'discrepancy' },
  { id:'HO-004', fromCashier:'陈七', toCashier:'张三', date:'2026-07-09', time:'20:00', cashBalance:15570, floatBalance:5000, receipts:95, notes:'', status:'completed' },
];

export default function CashierReconciliationPage() {
  const [tab,setTab]=useState<'rec'|'handover'>('rec');
  const stats = useMemo(()=>({
    total:reconciliations.length, balanced:reconciliations.filter(r=>r.status==='balanced').length,
    diffSmall:reconciliations.filter(r=>r.status==='diff_small').length,
    diffTotal:reconciliations.reduce((s,r)=>s+Math.abs(r.difference),0),
    totalRevenue:reconciliations.reduce((s,r)=>s+r.expectedTotal,0),
  }),[reconciliations]);

  return (
    <main style={{maxWidth:1200,margin:'0 auto',padding:32}}>
      <PageShell title="💰 收银对账" subtitle="交班对账·差异处理·现金管理">
        <div style={{display:'grid',gap:14,gridTemplateColumns:'repeat(4,1fr)',marginBottom:20}}>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>对账单数</div><div style={{marginTop:6,fontSize:28,fontWeight:700}}>{stats.total}</div><div style={{marginTop:4,fontSize:12,color:'#22c55e'}}>平账: {stats.balanced}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>有差异</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#eab308'}}>{stats.diffSmall}</div><div style={{marginTop:4,fontSize:12,color:'#94a3b8'}}>差异共{fm(stats.diffTotal)}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>总营收</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#22c55e'}}>{fm(stats.totalRevenue)}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>交班记录</div><div style={{marginTop:6,fontSize:28,fontWeight:700}}>{handovers.length}</div></div>
        </div>

        <div style={{marginBottom:16}}><Tabs items={[
          {key:'rec',label:'📋 对账单'},{key:'handover',label:'🔄 交班记录'},
        ]} activeKey={tab} onChange={t=>setTab(t as typeof tab)} variant="pills" /></div>

        {tab==='rec' && <div style={{display:'grid',gap:12}}>
          {reconciliations.map(r => (
            <div key={r.id} style={{padding:'14px 18px',borderRadius:12,background:'rgba(15,23,42,0.3)',border:r.difference!==0?'1px solid rgba(245,158,11,0.2)':'1px solid rgba(148,163,184,0.1)'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
                <div><span style={{fontWeight:700,fontSize:15}}>{r.date} {r.shift}</span><span style={{color:'#94a3b8',marginLeft:8}}>{r.cashier}</span></div>
                <StatusBadge label={RS[r.status].l} variant={RS[r.status].v} size="sm" dot />
              </div>
              <div style={{display:'grid',gap:10,gridTemplateColumns:'repeat(4,1fr)',marginBottom:8}}>
                <StatCard label="现金" value={fm(r.cashRevenue)} />
                <StatCard label="刷卡" value={fm(r.cardRevenue)} />
                <StatCard label="线上" value={fm(r.onlineRevenue)} />
                <StatCard label="会员卡" value={fm(r.memberCardRevenue)} />
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}>
                <span style={{color:'#94a3b8'}}>开柜: {fm(r.openingBalance)}</span>
                <span style={{color:'#22c55e',fontWeight:600}}>应收: {fm(r.expectedTotal)}</span>
                <span style={{color:'#3b82f6',fontWeight:600}}>实收: {fm(r.actualTotal)}</span>
                <span style={{color:r.difference===0?'#22c55e':r.difference>0?'#ef4444':'#eab308',fontWeight:700}}>
                  差异: {r.difference>0?'+':''}{fm(r.difference)}
                </span>
                <span style={{color:'#94a3b8'}}>退款: {fm(r.refundAmount)}</span>
              </div>
              {r.notes && <div style={{marginTop:6,fontSize:12,color:'#94a3b8'}}>📝 {r.notes}</div>}
            </div>
          ))}
        </div>}

        {tab==='handover' && <div style={{display:'grid',gap:10}}>
          {handovers.map(h => (
            <div key={h.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 18px',borderRadius:12,background:'rgba(15,23,42,0.3)',border:h.status==='discrepancy'?'1px solid rgba(239,68,68,0.2)':'1px solid rgba(148,163,184,0.1)'}}>
              <div>
                <div style={{fontWeight:600,fontSize:14}}>{h.fromCashier} → {h.toCashier}</div>
                <div style={{fontSize:12,color:'#94a3b8'}}>{h.date} {h.time} · 交易{h.receipts}笔 · 现金{fm(h.cashBalance)}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <StatusBadge label={HS[h.status].l} variant={HS[h.status].v} size="sm" dot />
                {h.notes && <div style={{fontSize:11,color:'#fca5a5',marginTop:2}}>{h.notes}</div>}
              </div>
            </div>
          ))}
        </div>}
      </PageShell>
    </main>
  );
}

const card: React.CSSProperties={borderRadius:16,padding:18,background:'rgba(15,23,42,0.38)',border:'1px solid rgba(148,163,184,0.18)'};
