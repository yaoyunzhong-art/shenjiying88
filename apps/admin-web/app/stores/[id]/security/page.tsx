// 🛡️ 安全管理 · 安防/消防/应急管理
'use client'; import { useState } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col, Select, Progress } from '@m5/ui';

const CHECKS = [
  { id:'SC01', item:'消防栓检查', location:'A区', last:'2026-07-12', result:'pass', next:'2026-08-12', inspector:'张三', type:'消防' },
  { id:'SC02', item:'灭火器压力', location:'全楼', last:'2026-07-12', result:'pass', next:'2026-08-12', inspector:'张三', type:'消防' },
  { id:'SC03', item:'监控设备运行', location:'监控室', last:'2026-07-11', result:'pass', next:'2026-07-18', inspector:'李四', type:'安防' },
  { id:'SC04', item:'应急灯测试', location:'B区走廊', last:'2026-07-10', result:'fail', next:'2026-07-13', inspector:'王五', type:'安防' },
  { id:'SC05', item:'门禁系统', location:'入口', last:'2026-07-12', result:'pass', next:'2026-08-12', inspector:'李四', type:'安防' },
  { id:'SC06', item:'排烟系统', location:'机房', last:'2026-07-09', result:'pass', next:'2026-08-09', inspector:'王五', type:'消防' },
  { id:'SC07', item:'安全出口指示', location:'全楼', last:'2026-07-11', result:'pass', next:'2026-07-25', inspector:'张三', type:'安防' },
  { id:'SC08', item:'燃气报警器', location:'厨房', last:'2026-07-08', result:'pass', next:'2026-08-08', inspector:'王五', type:'消防' },
];

const COLUMNS = [
  { title:'检查项目', dataIndex:'item' },
  { title:'位置', dataIndex:'location' },
  { title:'类型', dataIndex:'type', render:(v:string)=><Tag color={v==='消防'?'red':'blue'}>{v}</Tag> },
  { title:'上次检查', dataIndex:'last' },
  { title:'结果', dataIndex:'result', render:(v:string)=><Tag color={v==='pass'?'green':'red'}>{v==='pass'?'通过':'不合格'}</Tag> },
  { title:'下次检查', dataIndex:'next' },
  { title:'检查人', dataIndex:'inspector' },
];

export default function SecurityPage() {
  const [typeFilter, setTypeFilter] = useState('all');
  const filtered = typeFilter === 'all' ? CHECKS : CHECKS.filter(c => c.type === typeFilter);
  const passRate = Math.round((CHECKS.filter(c => c.result === 'pass').length / CHECKS.length) * 100);
  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16}}>
    <h2 style={{color:'#f8fafc',margin:0}}>🛡️ 安全管理</h2>
    <Row gutter={16}>
      <Col span={4}><Card><Statistic title="检查项" value={CHECKS.length}/></Card></Col>
      <Col span={4}><Card><Statistic title="通过率" value={`${passRate}%`} valueStyle={{color:'#34d399'}}>
        <Progress percent={passRate} size="small" style={{marginTop:4}}/>
      </Statistic></Card></Col>
      <Col span={4}><Card><Statistic title="通过" value={CHECKS.filter(c=>c.result==='pass').length} valueStyle={{color:'#34d399'}}/></Card></Col>
      <Col span={4}><Card><Statistic title="不合格" value={CHECKS.filter(c=>c.result==='fail').length} valueStyle={{color:'#f87171'}}/></Card></Col>
      <Col span={4}><Card><Statistic title="连续安全天数" value={45} valueStyle={{color:'#34d399'}}/></Card></Col>
    </Row>
    <Card><Space style={{marginBottom:12}}>
      <span style={{color:'#94a3b8',fontSize:13}}>类型:</span>
      <Select value={typeFilter} onChange={setTypeFilter} style={{width:110}}
        options={[{value:'all',label:'全部'},{value:'消防',label:'🔥 消防'},{value:'安防',label:'🛡️ 安防'}]}/>
      <Button type="primary" style={{marginLeft:'auto'}}>安全检查</Button>
    </Space><Table dataSource={filtered} columns={COLUMNS} rowKey="id" pagination={false}/></Card>
    <Card><Space><Button>报告模板</Button><Button>应急演练</Button></Space></Card>
  </Space></PageShell>);
}
