'use client';

/**
 * 收银工作台 - Cashier Workbench
 * 角色: 💳收银员
 * 功能: 快速收银、会员查询、充值、退款、交接班
 */

import { useState, useMemo } from 'react';
import { PageShell, StatCard, StatusBadge, Tabs } from '@m5/ui';

interface CashierSession { id: string; date: string; startTime: string; endTime: string; openingBalance: number; cashRevenue: number; cardRevenue: number; onlineRevenue: number; refundAmount: number; expectedTotal: number; actualTotal: number; difference: number; transactionCount: number; status: 'open' | 'closed' | 'pending_review'; }
interface RecentTransaction { id: string; time: string; type: 'sale' | 'recharge' | 'refund'; amount: number; method: string; customer: string; }

const SHIFT_STATUS: Record<string,{l:string;v:'success'|'warning'|'danger'}> = { open: { l: '营业中', v: 'success' }, closed: { l: '已结班', v: 'warning' }, pending_review: { l: '待审核', v: 'warning' } };
const TXN_TYPE = { sale: '销售', recharge: '充值', refund: '退款' };
const TXN_COLOR = { sale: '#22c55e', recharge: '#3b82f6', refund: '#ef4444' };
function fm(a:number):string{return`¥${a.toLocaleString('zh-CN',{minimumFractionDigits:2})}`;}

const session: CashierSession = { id:'CS001', date:'2026-07-11', startTime:'08:00', endTime:'—', openingBalance:2000, cashRevenue:3850, cardRevenue:2120, onlineRevenue:5680, refundAmount:360, expectedTotal:3850+2120+5680-360, actualTotal:3850+2120+5680-358, difference:2, transactionCount:86, status:'open' };

const recentTxns: RecentTransaction[] = Array.from({length:10},(_,i)=>{
  const d=new Date(Date.now()-i*1200000);
  return { id:`TXN-${i+1}`, time:`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`, type: (['sale','sale','sale','recharge','refund'] as const)[Math.floor(Math.random()*5)]!, amount: Math.round((20+Math.random()*300)*100)/100, method: ['现金','微信','支付宝','会员卡','银联'][Math.floor(Math.random()*5)]!, customer: ['散客','张明','李华','王芳','会员'][Math.floor(Math.random()*5)]! };
});

export default function CashierWorkbenchPage() {
  const [amount, setAmount] = useState('');

  return (
    <main style={{maxWidth:1200,margin:'0 auto',padding:24}}>
      <PageShell title="💳 收银工作台" subtitle={SHIFT_STATUS[session.status].l}>
        <div style={{display:'grid',gap:14,gridTemplateColumns:'repeat(4,1fr)',marginBottom:20}}>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>当班营收</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#22c55e'}}>{fm(session.expectedTotal)}</div><div style={{marginTop:4,fontSize:12,color:'#94a3b8'}}>{session.transactionCount}笔</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>现金</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#eab308'}}>{fm(session.cashRevenue)}</div><div style={{marginTop:4,fontSize:12,color:'#94a3b8'}}>开柜: {fm(session.openingBalance)}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>线上收款</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#3b82f6'}}>{fm(session.onlineRevenue)}</div><div style={{marginTop:4,fontSize:12,color:'#94a3b8'}}>微信+支付宝</div></div>
          <div style={{...card, display:'flex', alignItems:'center', justifyContent:'space-between'}}>
            <div><div style={{fontSize:13,color:'#cbd5e1'}}>差异</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:session.difference===0?'#22c55e':'#eab308'}}>{fm(session.difference)}</div></div>
            <StatusBadge label={SHIFT_STATUS[session.status].l} variant={SHIFT_STATUS[session.status].v} size="md" dot />
          </div>
        </div>

        <div style={{display:'grid',gap:20,gridTemplateColumns:'1fr 1fr'}}>
          {/* 快速收银 */}
          <section style={card}>
            <h3 style={{margin:'0 0 16px',fontSize:16,fontWeight:700}}>💵 快速收银</h3>
            <div style={{display:'grid',gap:10}}>
              <div><div style={{fontSize:12,color:'#94a3b8',marginBottom:4}}>金额</div><input value={amount} onChange={e=>setAmount(e.target.value)} placeholder="输入金额" style={input} /></div>
              <div style={{display:'grid',gap:8,gridTemplateColumns:'repeat(3,1fr)'}}>
                {['50','100','200','50会员','100会员','200会员'].map((v,i)=><button key={i} onClick={()=>setAmount(v.replace('会员',''))} style={qBtn}>{v}</button>)}
              </div>
              <div style={{display:'grid',gap:8,gridTemplateColumns:'1fr 1fr'}}>
                <button style={{...payBtn,background:'rgba(34,197,94,0.14)',color:'#86efac'}}>💵 现金</button>
                <button style={{...payBtn,background:'rgba(59,130,246,0.14)',color:'#93c5fd'}}>📱 扫码</button>
              </div>
            </div>
          </section>

          {/* 最近交易 */}
          <section style={card}>
            <h3 style={{margin:'0 0 16px',fontSize:16,fontWeight:700}}>最近交易</h3>
            <div style={{display:'grid',gap:6}}>
              {recentTxns.map(t => (
                <div key={t.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 12px',borderRadius:8,background:'rgba(15,23,42,0.3)',fontSize:13}}>
                  <span style={{color:'#94a3b8',width:40}}>{t.time}</span>
                  <span style={{color:TXN_COLOR[t.type],fontWeight:600,width:40}}>{TXN_TYPE[t.type]}</span>
                  <span style={{fontWeight:600,width:80,textAlign:'right',color:'#22c55e'}}>{fm(t.amount)}</span>
                  <span style={{color:'#cbd5e1',width:60}}>{t.method}</span>
                  <span style={{color:'#94a3b8',width:60,textAlign:'right',fontSize:12}}>{t.customer}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div style={{display:'flex',gap:10,marginTop:20}}>
          <button style={btnStyle('#3b82f6','#93c5fd')}>🔍 会员查询</button>
          <button style={btnStyle('#22c55e','#86efac')}>💰 充值</button>
          <button style={btnStyle('#eab308','#fbbf24')}>↩️ 退款</button>
          <button style={btnStyle('#ef4444','#fca5a5')}>📋 交接班</button>
        </div>
      </PageShell>
    </main>
  );
}

const card: React.CSSProperties = { borderRadius:16, padding:18, background:'rgba(15,23,42,0.38)', border:'1px solid rgba(148,163,184,0.18)' };
const input: React.CSSProperties = { width:'100%',borderRadius:10,padding:'12px 14px',border:'1px solid rgba(148,163,184,0.2)',background:'rgba(15,23,42,0.4)',color:'#f1f5f9',fontSize:24,fontWeight:700,textAlign:'right',outline:'none',boxSizing:'border-box' };
const qBtn: React.CSSProperties = { borderRadius:8,padding:'10px',background:'rgba(148,163,184,0.1)',color:'#e2e8f0',border:'1px solid rgba(148,163,184,0.15)',cursor:'pointer',fontSize:13,fontWeight:600 };
const payBtn: React.CSSProperties = { borderRadius:10,padding:'14px',border:'none',cursor:'pointer',fontSize:15,fontWeight:700,textAlign:'center' };
const btnStyle=(bg:string,color:string):React.CSSProperties=>({borderRadius:10,padding:'10px 18px',background:`${bg}22`,color,border:'none',cursor:'pointer',fontSize:14,fontWeight:600});
