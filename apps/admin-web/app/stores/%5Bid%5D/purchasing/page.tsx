// 📦 P-37 库存采购 · 供应商/采购单/到货
'use client';
import { useState } from 'react';
import { PageShell, Card, Statistic, Table, Tag, Button, Space, Input, Modal } from '@m5/ui';

interface Supplier { id:string; name:string; contact:string; phone:string; category:string; status:string; totalOrders:number; lastOrder:string; [key:string]:unknown; }

const SUPPLIERS: Supplier[] = [
  { id:'S-01',name:'世嘉',contact:'张经理',phone:'138****1100',category:'游戏设备',status:'active',totalOrders:12,lastOrder:'2026-07-10' },
  { id:'S-02',name:'义乌礼品',contact:'李经理',phone:'138****2200',category:'礼品/周边',status:'active',totalOrders:8,lastOrder:'2026-07-08' },
  { id:'S-03',name:'农夫山泉',contact:'王经理',phone:'138****3300',category:'饮品',status:'active',totalOrders:24,lastOrder:'2026-07-12' },
  { id:'S-04',name:'任天堂',contact:'赵经理',phone:'138****4400',category:'游戏卡带',status:'pending',totalOrders:3,lastOrder:'2026-06-20' },
];

export default function InventoryPage() {
  const [showAdd, setShowAdd] = useState(false);
  return (
    <PageShell title="库存采购">
      <Space style={{width:'100%',flexDirection:'column',gap:16}}>
        <div style={{display:'flex',justifyContent:'space-between'}}>
          <h2 style={{color:'#f8fafc',margin:0}}>📦 库存采购</h2>
          <Space><Button>采购单</Button><Button variant="primary" onClick={()=>setShowAdd(true)}>+ 添加供应商</Button></Space>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:16}}>
          <Card><Statistic label="供应商" value={SUPPLIERS.length} /></Card>
          <Card><Statistic label="活跃" value={SUPPLIERS.filter(s=>s.status==='active').length} variant="success" /></Card>
          <Card><Statistic label="总订单" value={SUPPLIERS.reduce((s,i)=>s+i.totalOrders,0)} /></Card>
          <Card><Statistic label="待审核" value={SUPPLIERS.filter(s=>s.status==='pending').length} variant="warning" /></Card>
          <Card><Statistic label="品类数" value={new Set(SUPPLIERS.map(s=>s.category)).size} /></Card>
        </div>
        <Card>
          <Table
            rows={SUPPLIERS}
            rowKey={(r: Supplier) => r.id}
            columns={[
              {key:'name', header:'名称', render:(r: Supplier)=>r.name},
              {key:'contact', header:'联系人', render:(r: Supplier)=>r.contact},
              {key:'phone', header:'电话', render:(r: Supplier)=>r.phone},
              {key:'category', header:'分类', render:(r: Supplier)=><Tag>{r.category}</Tag>},
              {key:'status', header:'状态', render:(r: Supplier)=><Tag variant={r.status==='active'?'success':'warning'}>{r.status==='active'?'活跃':'待审'}</Tag>},
              {key:'totalOrders', header:'订单数', render:(r: Supplier)=>String(r.totalOrders)},
              {key:'lastOrder', header:'上次采购', render:(r: Supplier)=>r.lastOrder},
              {key:'a', header:'操作', render:()=><Space><Button size="sm">采购</Button><Button size="sm">详情</Button></Space>},
            ]}
          />
        </Card>
        <Modal title="添加供应商" open={showAdd} onClose={()=>setShowAdd(false)}>
          <Space style={{width:'100%',flexDirection:'column'}}>
            <Input placeholder="供应商名称" /><Input placeholder="联系人" /><Input placeholder="联系电话" />
          </Space>
        </Modal>
      </Space>
    </PageShell>
  );
}
