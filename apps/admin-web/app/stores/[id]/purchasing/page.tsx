// 🛒 采购管理 · 采购订单/供应商管理
'use client'; import { useState } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col, Select, Input } from '@m5/ui';

const DATA = [
  { id:'PO-001', item:'可乐(箱)', supplier:'统一商贸', qty:20, price:1200, date:'2026-07-10', status:'received', category:'饮品' },
  { id:'PO-002', item:'打印纸(箱)', supplier:'办公用品', qty:5, price:400, date:'2026-07-12', status:'pending', category:'办公' },
  { id:'PO-003', item:'游戏币(袋)', supplier:'游戏币厂', qty:100, price:5000, date:'2026-07-08', status:'received', category:'耗材' },
  { id:'PO-004', item:'礼品玩偶', supplier:'礼品商', qty:50, price:3000, date:'2026-07-14', status:'ordered', category:'礼品' },
  { id:'PO-005', item:'清洁剂(箱)', supplier:'清洁用品', qty:10, price:800, date:'2026-07-15', status:'ordered', category:'耗材' },
  { id:'PO-006', item:'WiFi路由器', supplier:'网络设备', qty:3, price:1500, date:'2026-07-16', status:'pending', category:'设备' },
];

const STATUS_CFG: Record<string,[string,string]> = { received:['green','已入库'], ordered:['blue','已下单'], pending:['orange','待处理'] };
const COLUMNS = [
  { title:'品名', dataIndex:'item' }, { title:'供应商', dataIndex:'supplier' },
  { title:'数量', dataIndex:'qty' }, { title:'金额', dataIndex:'price', render:(v:number)=>`¥${v.toLocaleString()}` },
  { title:'日期', dataIndex:'date' }, { title:'分类', dataIndex:'category' },
  { title:'状态', dataIndex:'status', render:(v:string)=><Tag color={STATUS_CFG[v]?.[0]||'default'}>{STATUS_CFG[v]?.[1]||v}</Tag> },
];

export default function PurchasingPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const filtered = DATA.filter(d => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (search && !d.item.includes(search) && !d.supplier.includes(search)) return false;
    return true;
  });
  const totalSpend = DATA.reduce((s, d) => s + d.price, 0);
  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16}}>
    <h2 style={{color:'#f8fafc',margin:0}}>🛒 采购管理</h2>
    <Row gutter={16}>
      <Col span={6}><Card><Statistic title="本月采购" value={DATA.length}/></Card></Col>
      <Col span={6}><Card><Statistic title="总金额" value={totalSpend} prefix="¥" valueStyle={{color:'#34d399'}}/></Card></Col>
      <Col span={6}><Card><Statistic title="待收货" value={DATA.filter(d=>d.status!=='received').length} valueStyle={{color:'#f59e0b'}}/></Card></Col>
      <Col span={6}><Card><Statistic title="已入库" value={DATA.filter(d=>d.status==='received').length} valueStyle={{color:'#34d399'}}/></Card></Col>
    </Row>
    <Card><Space style={{marginBottom:12}}>
      <Input placeholder="搜索品名/供应商" value={search} onChange={e=>setSearch(e.target.value)} style={{width:200}} />
      <span style={{color:'#94a3b8',fontSize:13}}>状态:</span>
      <Select value={statusFilter} onChange={setStatusFilter} style={{width:130}}
        options={[{value:'all',label:'全部'},{value:'received',label:'已入库'},{value:'ordered',label:'已下单'},{value:'pending',label:'待处理'}]}/>
      <Button type="primary" style={{marginLeft:'auto'}}>新建采购单</Button>
    </Space><Table dataSource={filtered} columns={COLUMNS} rowKey="id" pagination={false}/></Card>
    <Card><Space><Button>供应商管理</Button><Button>采购报表</Button></Space></Card>
  </Space></PageShell>);
}
