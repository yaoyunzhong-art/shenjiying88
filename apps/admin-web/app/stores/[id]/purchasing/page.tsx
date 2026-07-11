'use client';

/**
 * 门店采购管理 - Store Purchasing
 * 角色: 📦仓库管理 / 👔店长
 * 功能: 采购申请、审批流程、采购单、到货验收、供应商评价
 */

import { useState, useMemo } from 'react';
import { PageShell, StatCard, StatusBadge, Tabs } from '@m5/ui';

type POStatus = 'draft'|'pending'|'approved'|'ordered'|'partial'|'received'|'cancelled';
type POType = 'regular'|'urgent'|'auto'|'seasonal';
type SupplierRating = 1|2|3|4|5;

interface PurchaseOrder { id:string; date:string; type:POType; supplier:string; items:number; totalAmount:number; status:POStatus; requester:string; approver:string; eta:string; warehouse:string; priority:'high'|'medium'|'low'; note:string; }
interface SupplierEval { id:string; supplier:string; date:string; rating:SupplierRating; delivery:boolean; quality:boolean; service:boolean; price:boolean; comment:string; }

const PS: Record<POStatus,{l:string;v:'success'|'warning'|'danger'|'neutral'|'info'}> = {
  draft:{l:'草稿',v:'neutral'}, pending:{l:'待审批',v:'warning'}, approved:{l:'已审批',v:'info'},
  ordered:{l:'已下单',v:'info'}, partial:{l:'部分到货',v:'warning'}, received:{l:'已收货',v:'success'}, cancelled:{l:'已取消',v:'danger'},
};
const PT: Record<POType,string> = { regular:'常规采购', urgent:'紧急采购', auto:'自动补货', seasonal:'季节采购' };
function fm(a:number):string{return`¥${a.toLocaleString('zh-CN',{minimumFractionDigits:2})}`;}

const pos: PurchaseOrder[] = Array.from({length:25}, (_,i) => {
  const d = new Date(Date.now()-Math.floor(Math.random()*20)*86400000);
  const statuses: POStatus[] = ['received','received','received','received','received','partial','ordered','approved','pending','draft','cancelled'];
  return {
    id: `PO-${String(i+1).padStart(4,'0')}`,
    date: d.toISOString().split('T')[0] as string,
    type: (['regular','regular','regular','urgent','auto','seasonal'] as POType[])[Math.floor(Math.random()*6)]!,
    supplier: ['广州礼品总汇','上海游乐设备','深圳电子配件','北京保洁','义乌小商品','本地食品'][Math.floor(Math.random()*6)]!,
    items: 2+Math.floor(Math.random()*10),
    totalAmount: Math.round((500+Math.random()*15000)*100)/100,
    status: statuses[Math.floor(Math.random()*statuses.length)]!,
    requester: ['刘洋','陈静','杨磊'][Math.floor(Math.random()*3)]!,
    approver: Math.random()>0.3?'店长':'',
    eta: new Date(d.getTime()+Math.floor(Math.random()*7)*86400000).toISOString().split('T')[0] as string,
    warehouse: ['主仓库','备用仓'][Math.floor(Math.random()*2)]!,
    priority: (['high','medium','low'] as const)[Math.floor(Math.random()*3)]!,
    note: Math.random()>0.8?'供应商缺货调整':'',
  };
}).sort((a,b)=>(b.date ?? '').localeCompare(a.date ?? ''));

const supplierEvals: SupplierEval[] = [
  { id:'SE1', supplier:'广州礼品总汇', date:'2026-07-10', rating:4, delivery:true, quality:true, service:true, price:false, comment:'质量好但价格稍高' },
  { id:'SE2', supplier:'上海游乐设备', date:'2026-07-09', rating:5, delivery:true, quality:true, service:true, price:true, comment:'非常满意，快速响应' },
  { id:'SE3', supplier:'深圳电子配件', date:'2026-07-08', rating:3, delivery:false, quality:true, service:true, price:true, comment:'物流偏慢' },
  { id:'SE4', supplier:'北京保洁', date:'2026-07-06', rating:4, delivery:true, quality:true, service:false, price:true, comment:'沟通需要改进' },
  { id:'SE5', supplier:'义乌小商品', date:'2026-07-05', rating:4, delivery:true, quality:false, service:true, price:true, comment:'部分商品瑕疵' },
  { id:'SE6', supplier:'本地食品批发', date:'2026-07-03', rating:5, delivery:true, quality:true, service:true, price:true, comment:'性价比高' },
];

export default function StorePurchasingPage() {
  const [tab,setTab]=useState<'orders'|'suppliers'>('orders');
  const stats = useMemo(()=>({
    total:pos.length, pending:pos.filter(p=>p.status==='pending').length,
    approved:pos.filter(p=>p.status==='approved'||p.status==='ordered').length,
    received:pos.filter(p=>p.status==='received').length,
    totalAmount:pos.reduce((s,p)=>s+p.totalAmount,0),
    avgEval:Math.round(supplierEvals.reduce((s,e)=>s+e.rating,0)/supplierEvals.length*10)/10,
  }),[pos]);

  return (
    <main style={{maxWidth:1200,margin:'0 auto',padding:32}}>
      <PageShell title="📦 采购管理" subtitle="采购单·到货验收·供应商评价">
        <div style={{display:'grid',gap:14,gridTemplateColumns:'repeat(3,1fr)',marginBottom:20}}>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>采购单总数</div><div style={{marginTop:6,fontSize:28,fontWeight:700}}>{stats.total}</div><div style={{marginTop:4,fontSize:12,color:'#22c55e'}}>已收货: {stats.received}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>待处理</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#eab308'}}>{stats.pending}</div><div style={{marginTop:4,fontSize:12,color:'#94a3b8'}}>已审批: {stats.approved}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>采购总额</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#22c55e'}}>{fm(stats.totalAmount)}</div><div style={{marginTop:4,fontSize:12,color:'#94a3b8'}}>平均供应商评分: {stats.avgEval}/5</div></div>
        </div>

        <div style={{marginBottom:16}}><Tabs items={[
          {key:'orders',label:`📋 采购单 (${pos.length})`},
          {key:'suppliers',label:`🏭 供应商评价 (${supplierEvals.length})`},
        ]} activeKey={tab} onChange={t=>setTab(t as typeof tab)} variant="pills" /></div>

        {tab==='orders' && <div style={{display:'grid',gap:10}}>
          {pos.map(p => (
            <div key={p.id} style={{padding:'14px 18px',borderRadius:12,background:'rgba(15,23,42,0.3)',border:p.status==='pending'?'1px solid rgba(245,158,11,0.2)':'1px solid rgba(148,163,184,0.1)'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                <div><span style={{fontWeight:700,fontSize:14}}>{p.id}</span><span style={{color:'#94a3b8',marginLeft:8}}>{p.date}</span><span style={{color:'#94a3b8',marginLeft:8}}>{PT[p.type]}</span></div>
                <StatusBadge label={PS[p.status].l} variant={PS[p.status].v} size="sm" dot />
              </div>
              <div style={{fontSize:13,color:'#cbd5e1',display:'flex',gap:16,marginBottom:6}}>
                <span>供应商: {p.supplier}</span><span>{p.items}品项</span>
                <span style={{color:'#22c55e',fontWeight:600}}>{fm(p.totalAmount)}</span>
                <span>申请人: {p.requester}</span><span>预计: {p.eta}</span>
                <span style={{color:p.priority==='high'?'#ef4444':p.priority==='medium'?'#eab308':'#94a3b8',fontWeight:600}}>
                  {p.priority==='high'?'🔴紧急':p.priority==='medium'?'🟡普通':'🟢一般'}
                </span>
              </div>
              {p.note && <div style={{fontSize:12,color:'#fca5a5'}}>📝 {p.note}</div>}
            </div>
          ))}
        </div>}

        {tab==='suppliers' && <div style={{display:'grid',gap:10}}>
          {supplierEvals.map(e => (
            <div key={e.id} style={{padding:'12px 16px',borderRadius:10,background:'rgba(15,23,42,0.3)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div><span style={{fontWeight:600,fontSize:14}}>{e.supplier}</span><span style={{color:'#94a3b8',marginLeft:8,fontSize:12}}>{e.date}</span></div>
                <div style={{fontSize:14}}>
                  {Array.from({length:5},(_,i)=><span key={i} style={{color:i<e.rating?'#eab308':'#374151'}}>★</span>)}
                </div>
              </div>
              <div style={{display:'flex',gap:12,marginTop:6,fontSize:12}}>
                <span style={{color:e.delivery?'#22c55e':'#ef4444'}}>🚚送达{e.delivery?'✅':'❌'}</span>
                <span style={{color:e.quality?'#22c55e':'#ef4444'}}>🏆质量{e.quality?'✅':'❌'}</span>
                <span style={{color:e.service?'#22c55e':'#ef4444'}}>💁服务{e.service?'✅':'❌'}</span>
                <span style={{color:e.price?'#22c55e':'#ef4444'}}>💰价格{e.price?'✅':'❌'}</span>
              </div>
              <div style={{fontSize:12,color:'#94a3b8',marginTop:4}}>💬 {e.comment}</div>
            </div>
          ))}
        </div>}
      </PageShell>
    </main>
  );
}

const card: React.CSSProperties={borderRadius:16,padding:18,background:'rgba(15,23,42,0.38)',border:'1px solid rgba(148,163,184,0.18)'};
