// 💳 P-38 财务对账 · 营收/对账/报表
'use client';
import { useState } from 'react';
import { PageShell, Card, Statistic, Table, Tag, Button, Space } from '@m5/ui';

interface ReconRow { date:string; transaction:number; matched:number; unmatched:number; diff:string; status:string; [key:string]:unknown; }

const RECONCILIATION: ReconRow[] = [
  { date:'07/13', transaction:1520, matched:1512, unmatched:8, diff:'¥120.00', status:'partial' },
  { date:'07/12', transaction:1410, matched:1408, unmatched:2, diff:'¥18.50', status:'matched' },
  { date:'07/11', transaction:1380, matched:1375, unmatched:5, diff:'¥65.00', status:'partial' },
  { date:'07/10', transaction:1490, matched:1490, unmatched:0, diff:'¥0.00', status:'matched' },
  { date:'07/09', transaction:1350, matched:1340, unmatched:10, diff:'¥230.00', status:'alert' },
];

export default function FinancePage() {
  const totalTx = RECONCILIATION.reduce((s,r)=>s+r.transaction,0);
  const totalMatch = RECONCILIATION.reduce((s,r)=>s+r.matched,0);
  const matchRate = Math.round(totalMatch/totalTx*100);

  return (
    <PageShell title="财务对账">
      <Space style={{width:'100%',flexDirection:'column',gap:16}}>
        <div style={{display:'flex',justifyContent:'space-between'}}>
          <h2 style={{color:'#f8fafc',margin:0}}>💳 财务对账</h2>
          <Button variant="primary">手动对账</Button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:16}}>
          <Card><Statistic label="总交易" value={totalTx.toLocaleString()} /></Card>
          <Card><Statistic label="已匹配" value={totalMatch.toLocaleString()} variant="success" /></Card>
          <Card><Statistic label="匹配率" value={`${matchRate}%`} variant="success" /></Card>
          <Card><Statistic label="待处理差异" value={RECONCILIATION.filter(r=>r.unmatched>0).length} variant="warning" /></Card>
          <Card><Statistic label="告警天数" value={RECONCILIATION.filter(r=>r.status==='alert').length} variant="danger" /></Card>
        </div>
        <Card>
          <Table
            rows={RECONCILIATION}
            rowKey={(r: ReconRow) => r.date}
            columns={[
              {key:'date', header:'日期', render:(r: ReconRow)=>r.date},
              {key:'transaction', header:'交易数', render:(r: ReconRow)=>String(r.transaction)},
              {key:'matched', header:'匹配', render:(r: ReconRow)=>String(r.matched)},
              {key:'unmatched', header:'未匹配', render:(r: ReconRow)=><span style={{color:r.unmatched>0?'#f59e0b':'#34d399',fontWeight:r.unmatched>0?700:400}}>{r.unmatched}</span>},
              {key:'diff', header:'差异', render:(r: ReconRow)=><span style={{color:r.diff!=='¥0.00'?'#f87171':'#34d399'}}>{r.diff}</span>},
              {key:'status', header:'状态', render:(r: ReconRow)=>{
                const v: Record<string,string> = {matched:'已对平,success',partial:'部分匹配,primary',alert:'异常,error'};
                const [l,va] = (v[r.status]||'未知,default').split(',');
                return <Tag variant={va as any}>{l}</Tag>;
              }},
              {key:'a', header:'操作', render:(r: ReconRow)=><Button size="sm" disabled={r.status==='matched'}>处理</Button>},
            ]}
          />
        </Card>
      </Space>
    </PageShell>
  );
}
