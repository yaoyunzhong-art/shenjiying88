// 🛡️ 安全管理 · 安防/消防/应急管理
'use client'; import { useState } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col } from '@m5/ui';
const CHECKS = [
  { id:'SC01', item:'消防栓检查', last:'2026-07-12', result:'pass', next:'2026-08-12', inspector:'张三' },
  { id:'SC02', item:'灭火器压力', last:'2026-07-12', result:'pass', next:'2026-08-12', inspector:'张三' },
  { id:'SC03', item:'监控设备运行', last:'2026-07-11', result:'pass', next:'2026-07-18', inspector:'李四' },
  { id:'SC04', item:'应急灯测试', last:'2026-07-10', result:'fail', next:'2026-07-13', inspector:'王五' },
];
const COLUMNS = [
  { title:'检查项目', dataIndex:'item' }, { title:'上次检查', dataIndex:'last' },
  { title:'结果', dataIndex:'result', render:(v:string)=><Tag color={v==='pass'?'green':'red'}>{v==='pass'?'通过':'不合格'}</Tag> },
  { title:'下次检查', dataIndex:'next' }, { title:'检查人', dataIndex:'inspector' },
];
export default function SecurityPage() {
  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16}}>
    <h2 style={{color:'#f8fafc',margin:0}}>🛡️ 安全管理</h2>
    <Row gutter={16}>
      <Col span={6}><Card><Statistic title="安全检查项" value={12}/></Card></Col>
      <Col span={6}><Card><Statistic title="通过" value={11} valueStyle={{color:'#34d399'}}/></Card></Col>
      <Col span={6}><Card><Statistic title="不合格" value={1} valueStyle={{color:'#f87171'}}/></Card></Col>
      <Col span={6}><Card><Statistic title="连续安全天数" value={45} valueStyle={{color:'#34d399'}}/></Card></Col>
    </Row>
    <Card><Table dataSource={CHECKS} columns={COLUMNS} rowKey="id" pagination={false}/></Card>
    <Card><Space><Button type="primary">安全检查</Button><Button>报告模板</Button></Space></Card>
  </Space></PageShell>);
}