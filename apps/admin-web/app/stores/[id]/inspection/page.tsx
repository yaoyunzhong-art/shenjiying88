// 📋 巡检管理 · 设备/安全/卫生巡检记录
'use client'; import { useState } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col, Select } from '@m5/ui';

const INSPECT_DATA = [
  { id:'IN-001', type:'设备', item:'VR-01 头盔', result:'pass', inspector:'王工', time:'2026-07-13 14:00', note:'镜片清洁, 线缆完好' },
  { id:'IN-002', type:'设备', item:'赛车-03 方向盘', result:'pass', inspector:'王工', time:'2026-07-13 14:15', note:'螺丝紧固, 响应正常' },
  { id:'IN-003', type:'设备', item:'台球桌-02', result:'fail', inspector:'李工', time:'2026-07-13 14:30', note:'台面绒布破损, 需更换' },
  { id:'IN-004', type:'安全', item:'消防栓-A区', result:'pass', inspector:'陈安全', time:'2026-07-13 10:00', note:'压力正常, 无遮挡' },
  { id:'IN-005', type:'安全', item:'灭火器(3F)', result:'warn', inspector:'陈安全', time:'2026-07-13 10:20', note:'有效期至8月, 需更换' },
  { id:'IN-006', type:'安全', item:'应急灯', result:'pass', inspector:'陈安全', time:'2026-07-13 10:40', note:'全部工作正常' },
  { id:'IN-007', type:'卫生', item:'洗手间男', result:'pass', inspector:'张保洁', time:'2026-07-13 09:00', note:'清洁到位, 消毒记录完整' },
  { id:'IN-008', type:'卫生', item:'游戏区地面', result:'fail', inspector:'张保洁', time:'2026-07-13 09:30', note:'零食碎屑较多, 需吸尘' },
  { id:'IN-009', type:'卫生', item:'休息区沙发', result:'pass', inspector:'张保洁', time:'2026-07-13 10:00', note:'整洁无污渍' },
];

const RESULT_CFG: Record<string,{color:string,label:string}> = { pass:{color:'green',label:'通过'}, fail:{color:'red',label:'不通过'}, warn:{color:'orange',label:'需关注'} };
const TYPE_CFG: Record<string,string> = { 设备:'🔧', 安全:'🛡️', 卫生:'🧹' };
const COLUMNS = [
  { title:'类别', dataIndex:'type', render:(v:string)=><Tag>{TYPE_CFG[v]||''} {v}</Tag> },
  { title:'检查项', dataIndex:'item' },
  { title:'结果', dataIndex:'result', render:(v:string)=><Tag color={RESULT_CFG[v]?.color||'default'}>{RESULT_CFG[v]?.label||v}</Tag> },
  { title:'检查人', dataIndex:'inspector' },
  { title:'备注', dataIndex:'note', ellipsis:true },
  { title:'时间', dataIndex:'time' },
];

export default function InspectionPage() {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const filtered = typeFilter === 'all' ? INSPECT_DATA : INSPECT_DATA.filter(d => d.type === typeFilter);
  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16,alignItems:'stretch'}}>
    <h2 style={{color:'#f8fafc',margin:0}}>📋 巡检管理</h2>
    <Row gutter={16}>
      <Col span={4}><Card><Statistic title="今日巡检" value={INSPECT_DATA.length}/></Card></Col>
      <Col span={4}><Card><Statistic title="通过" value={INSPECT_DATA.filter(d=>d.result==='pass').length} valueStyle={{color:'#34d399'}}/></Card></Col>
      <Col span={4}><Card><Statistic title="需关注" value={INSPECT_DATA.filter(d=>d.result==='warn').length} valueStyle={{color:'#f59e0b'}}/></Card></Col>
      <Col span={4}><Card><Statistic title="不通过" value={INSPECT_DATA.filter(d=>d.result==='fail').length} valueStyle={{color:'#f87171'}}/></Card></Col>
    </Row>
    <Card><Space style={{marginBottom:12}}>
      <span style={{color:'#94a3b8',fontSize:13}}>巡检类别:</span>
      <Select value={typeFilter} onChange={setTypeFilter} style={{width:130}}
        options={[{value:'all',label:'全部'},{value:'设备',label:'🔧 设备'},{value:'安全',label:'🛡️ 安全'},{value:'卫生',label:'🧹 卫生'}]}/>
      <Button type="primary" style={{marginLeft:'auto'}}>新建巡检</Button>
    </Space><Table dataSource={filtered} columns={COLUMNS} rowKey="id" pagination={{pageSize:6}}/></Card>
  </Space></PageShell>);
}
