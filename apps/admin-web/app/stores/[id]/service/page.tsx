// 🔧 服务管理 · 客户服务/投诉处理
'use client'; import { useState } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col, Select } from '@m5/ui';

const DATA = [
  { id:'SV-01', customer:'张明', type:'投诉', desc:'排队时间太长', time:'2026-07-12 14:30', handler:'李四', status:'processing', priority:'high', phone:'138****1111' },
  { id:'SV-02', customer:'李芳', type:'咨询', desc:'会员卡使用规则', time:'2026-07-12 13:00', handler:'张三', status:'resolved', priority:'low', phone:'139****2222' },
  { id:'SV-03', customer:'王强', type:'报修', desc:'VR-2设备故障', time:'2026-07-12 10:15', handler:'', status:'pending', priority:'high', phone:'136****3333' },
  { id:'SV-04', customer:'赵丽', type:'建议', desc:'增加扫码点单', time:'2026-07-11 16:00', handler:'张三', status:'resolved', priority:'low', phone:'135****4444' },
  { id:'SV-05', customer:'高伟', type:'投诉', desc:'卫生间不干净', time:'2026-07-13 09:30', handler:'', status:'pending', priority:'high', phone:'137****5555' },
  { id:'SV-06', customer:'陈丽', type:'咨询', desc:'团建套餐报价', time:'2026-07-13 10:00', handler:'李四', status:'processing', priority:'medium', phone:'188****6666' },
];

const STATUS_CFG: Record<string,[string,string]> = { resolved:['green','已解决'], processing:['blue','处理中'], pending:['orange','待处理'] };
const PRIORITY_CFG: Record<string,string> = { high:'red', medium:'orange', low:'default' };
const COLUMNS = [
  { title:'客户', dataIndex:'customer' }, { title:'类型', dataIndex:'type', render:(v:string)=><Tag>{v}</Tag> },
  { title:'内容', dataIndex:'desc', ellipsis:true }, { title:'时间', dataIndex:'time' },
  { title:'处理人', dataIndex:'handler', render:(v:string)=><span style={{color:v?'#e2e8f0':'#94a3b8'}}>{v||'未分配'}</span> },
  { title:'状态', dataIndex:'status', render:(v:string)=><Tag color={STATUS_CFG[v]?.[0]||'default'}>{STATUS_CFG[v]?.[1]||v}</Tag> },
  { title:'优先级', dataIndex:'priority', render:(v:string)=><Tag color={PRIORITY_CFG[v]||'default'}>{v==='high'?'高':v==='medium'?'中':'低'}</Tag> },
];

export default function ServicePage() {
  const [typeFilter, setTypeFilter] = useState('all');
  const filtered = typeFilter === 'all' ? DATA : DATA.filter(d => d.type === typeFilter);
  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16}}>
    <h2 style={{color:'#f8fafc',margin:0}}>🔧 服务管理</h2>
    <Row gutter={16}>
      <Col span={4}><Card><Statistic title="工单总数" value={DATA.length}/></Card></Col>
      <Col span={4}><Card><Statistic title="待处理" value={DATA.filter(d=>d.status==='pending').length} valueStyle={{color:'#f87171'}}/></Card></Col>
      <Col span={4}><Card><Statistic title="处理中" value={DATA.filter(d=>d.status==='processing').length} valueStyle={{color:'#f59e0b'}}/></Card></Col>
      <Col span={4}><Card><Statistic title="已解决" value={DATA.filter(d=>d.status==='resolved').length} valueStyle={{color:'#34d399'}}/></Card></Col>
    </Row>
    <Card><Space style={{marginBottom:12}}>
      <span style={{color:'#94a3b8',fontSize:13}}>类型:</span>
      <Select value={typeFilter} onChange={setTypeFilter} style={{width:110}}
        options={[{value:'all',label:'全部'},{value:'投诉',label:'投诉'},{value:'咨询',label:'咨询'},{value:'报修',label:'报修'},{value:'建议',label:'建议'}]}/>
      <Button type="primary" style={{marginLeft:'auto'}}>新建工单</Button>
    </Space><Table dataSource={filtered} columns={COLUMNS} rowKey="id" pagination={false}/></Card>
    <Card><Space><Button>报表</Button><Button>知识库</Button></Space></Card>
  </Space></PageShell>);
}
