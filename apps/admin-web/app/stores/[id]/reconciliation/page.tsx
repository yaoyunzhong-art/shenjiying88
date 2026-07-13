// 🧾 对账管理 · 支付对账/差异处理 (45→80)
'use client'; import { useState, useMemo } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col, Select, Input, Modal, message } from '@m5/ui';

interface Record { id:string; date:string; income:number; system:number; diff:number; method:string; status:'match'|'diff'; operator:string; note:string; }
const DATA: Record[] = [
  { id:'REC-01',date:'2026-07-12',income:12800,system:12850,diff:-50,method:'微信',status:'diff',operator:'张三',note:'微信通道手续费差异' },
  { id:'REC-02',date:'2026-07-12',income:3200,system:3200,diff:0,method:'支付宝',status:'match',operator:'张三',note:'' },
  { id:'REC-03',date:'2026-07-12',income:1500,system:1500,diff:0,method:'现金',status:'match',operator:'李四',note:'' },
  { id:'REC-04',date:'2026-07-11',income:14200,system:14200,diff:0,method:'微信',status:'match',operator:'王五',note:'' },
  { id:'REC-05',date:'2026-07-11',income:4500,system:4520,diff:-20,method:'现金',status:'diff',operator:'张三',note:'疑似短款' },
  { id:'REC-06',date:'2026-07-10',income:9800,system:9800,diff:0,method:'微信',status:'match',operator:'赵六',note:'' },
  { id:'REC-07',date:'2026-07-10',income:6200,system:6150,diff:50,method:'支付宝',status:'diff',operator:'李四',note:'系统差异待核实' },
  { id:'REC-08',date:'2026-07-09',income:10500,system:10500,diff:0,method:'微信',status:'match',operator:'张三',note:'' },
  { id:'REC-09',date:'2026-07-08',income:7800,system:7800,diff:0,method:'现金',status:'match',operator:'王五',note:'' },
  { id:'REC-10',date:'2026-07-07',income:9500,system:9300,diff:200,method:'微信',status:'diff',operator:'赵六',note:'大额差异待查' },
];

export default function ReconciliationPage() {
  const [filter,setFilter]=useState('all'); const [showPerform,setShowPerform]=useState(false);
  const filtered = filter==='all'?DATA:DATA.filter(d=>d.status===filter);
  const totalDiff = DATA.reduce((s,d)=>s+Math.abs(d.diff),0); const diffCount = DATA.filter(d=>d.status==='diff').length;
  const cols = [
    {title:'日期',dataIndex:'date'},{title:'实收',dataIndex:'income',render:(v:number)=>`¥${v.toLocaleString()}`},{title:'系统',dataIndex:'system',render:(v:number)=>`¥${v.toLocaleString()}`},
    {title:'差额',dataIndex:'diff',render:(v:number)=><span style={{color:v!==0?'#f87171':'#34d399',fontWeight:600}}>{v===0?'✓':v>0?`+${v}`:v}</span>},
    {title:'支付方式',dataIndex:'method',render:(v:string)=><Tag>{v}</Tag>},{title:'操作人',dataIndex:'operator'},
    {title:'备注',dataIndex:'note',ellipsis:true},{title:'状态',dataIndex:'status',render:(v:string)=><Tag color={v==='match'?'green':'orange'}>{v==='match'?'一致':'差异'}</Tag>},
  ];
  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16}}>
    <div style={{display:'flex',justifyContent:'space-between'}}><h2 style={{color:'#f8fafc',margin:0}}>🧾 对账管理</h2><Button type="primary" onClick={()=>setShowPerform(true)}>执行对账</Button></div>
    <Row gutter={16}><Col span={4}><Card size="small"><Statistic title="对账单数" value={DATA.length}/></Card></Col><Col span={4}><Card size="small"><Statistic title="一致" value={DATA.length-diffCount} valueStyle={{color:'#34d399'}}/></Card></Col><Col span={4}><Card size="small"><Statistic title="差异" value={diffCount} valueStyle={{color:'#f87171'}}/></Card></Col><Col span={4}><Card size="small"><Statistic title="差异总额" value={totalDiff} prefix="¥" valueStyle={{color:'#f87171'}}/></Card></Col></Row>
    <Card><Space style={{marginBottom:12}}><span style={{color:'#94a3b8'}}>状态:</span><Select value={filter} onChange={setFilter} style={{width:110}} options={[{value:'all',label:'全部'},{value:'match',label:'一致'},{value:'diff',label:'差异'}]}/></Space><Table dataSource={filtered} columns={cols} rowKey="id" pagination={{pageSize:8}}/></Card>
    <Card><Space><Button>生成差异报告</Button><Button>历史对账</Button><Button onReset={undefined}>导出</Button></Space></Card>
    <Modal title="执行对账" open={showPerform} onCancel={()=>setShowPerform(false)} onOk={()=>{message.success('对账执行完成，5条记录已同步');setShowPerform(false)}} okText="开始对账" width={400}>
      <Space direction="vertical" style={{width:'100%'}}><div style={{color:'#94a3b8'}}>将拉取昨日订单数据与银行流水进行逐一比对</div><Select placeholder="支付通道" style={{width:'100%'}}><Select.Option value="wechat">微信支付</Select.Option><Select.Option value="alipay">支付宝</Select.Option><Select.Option value="cash">现金</Select.Option><Select.Option value="all">全部通道</Select.Option></Select></Space>
    </Modal>
  </Space></PageShell>);
}
