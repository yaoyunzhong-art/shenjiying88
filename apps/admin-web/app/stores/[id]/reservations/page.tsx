// 📅 预约管理 · 场地/设备预约处理
'use client'; import { useState } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col, Select, Input } from '@m5/ui';

const DATA = [
  { id:'R001', customer:'张明', type:'生日派对', date:'2026-07-15', time:'14:00-17:00', people:15, status:'confirmed', phone:'138****8888', source:'小程序' },
  { id:'R002', customer:'公司团建（TechCo）', type:'团建活动', date:'2026-07-16', time:'10:00-16:00', people:28, status:'confirmed', phone:'139****0000', source:'电话' },
  { id:'R003', customer:'李芳', type:'VR体验', date:'2026-07-13', time:'10:00-12:00', people:3, status:'pending', phone:'136****6666', source:'小程序' },
  { id:'R004', customer:'王明', type:'台球', date:'2026-07-14', time:'15:00-18:00', people:4, status:'confirmed', phone:'137****2222', source:'到店' },
  { id:'R005', customer:'赵华', type:'电竞包间', date:'2026-07-17', time:'19:00-23:00', people:10, status:'pending', phone:'135****1111', source:'电话' },
  { id:'R006', customer:'少儿培训', type:'体验', date:'2026-07-18', time:'09:00-12:00', people:20, status:'cancelled', phone:'133****3333', source:'小程序' },
];

const STATUS_CFG: Record<string,[string,string]> = { confirmed:['green','已确认'], pending:['blue','待确认'], cancelled:['default','已取消'] };
const COLUMNS = [
  { title:'客户', dataIndex:'customer' },
  { title:'类型', dataIndex:'type', render:(v:string)=><Tag>{v}</Tag> },
  { title:'日期', dataIndex:'date' }, { title:'时间', dataIndex:'time' },
  { title:'人数', dataIndex:'people' },
  { title:'来源', dataIndex:'source' },
  { title:'状态', dataIndex:'status', render:(v:string)=><Tag color={STATUS_CFG[v]?.[0]||'default'}>{STATUS_CFG[v]?.[1]||v}</Tag> },
  { title:'联系方式', dataIndex:'phone' },
];

export default function ReservationsPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const filtered = DATA.filter(d => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (search && !d.customer.includes(search) && !d.phone.includes(search)) return false;
    return true;
  });
  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16}}>
    <h2 style={{color:'#f8fafc',margin:0}}>📅 预约管理</h2>
    <Row gutter={16}>
      <Col span={4}><Card><Statistic title="预约总数" value={DATA.length}/></Card></Col>
      <Col span={4}><Card><Statistic title="已确认" value={DATA.filter(d=>d.status==='confirmed').length} valueStyle={{color:'#34d399'}}/></Card></Col>
      <Col span={4}><Card><Statistic title="待确认" value={DATA.filter(d=>d.status==='pending').length} valueStyle={{color:'#f59e0b'}}/></Card></Col>
      <Col span={4}><Card><Statistic title="总人数" value={DATA.reduce((s,d)=>s+d.people,0)} valueStyle={{color:'#34d399'}}/></Card></Col>
    </Row>
    <Card><Space style={{marginBottom:12}}>
      <Input placeholder="搜索客户/电话" value={search} onChange={e=>setSearch(e.target.value)} style={{width:200}} />
      <span style={{color:'#94a3b8',fontSize:13}}>状态:</span>
      <Select value={statusFilter} onChange={setStatusFilter} style={{width:120}}
        options={[{value:'all',label:'全部'},{value:'confirmed',label:'已确认'},{value:'pending',label:'待确认'},{value:'cancelled',label:'已取消'}]}/>
      <Button type="primary" style={{marginLeft:'auto'}}>创建预约</Button>
    </Space><Table dataSource={filtered} columns={COLUMNS} rowKey="id" pagination={false}/></Card>
    <Card><Space><Button>排程表</Button><Button>日历视图</Button><Button>模板</Button></Space></Card>
  </Space></PageShell>);
}
